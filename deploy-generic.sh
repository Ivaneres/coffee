#!/bin/bash
#
# Generic VPS deploy for Python (Flask/FastAPI) + React apps.
# Requires a project directory containing deploy.conf.
#
# Usage:
#   ./deploy-generic.sh /path/to/project
#   ./deploy-generic.sh /path/to/project --redeploy
#   ./deploy-generic.sh /path/to/project --yes --skip-ssl
#   DOMAIN=app.example.com ./deploy-generic.sh /path/to/project
#
# Requires: sudo, deploy.conf in the project directory

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Always log to stderr so command substitutions (e.g. resolve_database_url)
# cannot capture [INFO] lines into DATABASE_URL / other returned values.
print_info()  { echo -e "${GREEN}[INFO]${NC} $1" >&2; }
print_warn()  { echo -e "${YELLOW}[WARN]${NC} $1" >&2; }
print_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

PROJECT_DIR=""
REDEPLOY=false
ASSUME_YES=false
SKIP_SSL=false
SKIP_DB=false

usage() {
    cat <<EOF
Usage: $0 <project-dir> [options]

Arguments:
  project-dir       Path to the app root (must contain deploy.conf)

Options:
  --redeploy        Redeploy code only (skip packages, DB provisioning, certbot)
  --yes             Skip confirmation prompts
  --skip-ssl        Do not run certbot
  --skip-db         Do not provision/resolve database (keep existing .env)
  -h, --help        Show this help

Environment overrides (optional):
  DOMAIN, DATABASE_URL, APP_DIR, PORT

deploy.conf required keys:
  APP_NAME, DOMAIN, BACKEND_DIR, FRONTEND_DIR, ENTRYPOINT, BACKEND_TYPE
EOF
    exit 0
}

while [ $# -gt 0 ]; do
    case "$1" in
        --redeploy)
            REDEPLOY=true
            shift
            ;;
        --yes|-y)
            ASSUME_YES=true
            shift
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        -*)
            print_error "Unknown option: $1"
            usage
            ;;
        *)
            if [ -n "$PROJECT_DIR" ]; then
                print_error "Unexpected argument: $1 (project-dir already set to $PROJECT_DIR)"
                exit 1
            fi
            PROJECT_DIR="$1"
            shift
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Resolve project dir + deploy.conf
# ---------------------------------------------------------------------------

if [ -z "$PROJECT_DIR" ]; then
    print_error "Missing project directory."
    print_error "Usage: $0 <project-dir> [options]"
    exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory does not exist: $PROJECT_DIR"
    exit 1
fi

PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
CONFIG_FILE="${PROJECT_DIR}/deploy.conf"

if [ ! -f "$CONFIG_FILE" ]; then
    print_error "No deploy.conf found in $PROJECT_DIR"
    print_error "Add a deploy.conf to the project root, then retry."
    exit 1
fi

# Preserve env overrides so deploy.conf does not clobber DOMAIN=... ./deploy-generic.sh
_OVERRIDE_DOMAIN="${DOMAIN-}"
_OVERRIDE_APP_DIR="${APP_DIR-}"
_OVERRIDE_PORT="${PORT-}"
_OVERRIDE_DATABASE_URL="${DATABASE_URL-}"

# shellcheck disable=SC1090
source "$CONFIG_FILE"

[ -n "$_OVERRIDE_DOMAIN" ] && DOMAIN="$_OVERRIDE_DOMAIN"
[ -n "$_OVERRIDE_APP_DIR" ] && APP_DIR="$_OVERRIDE_APP_DIR"
[ -n "$_OVERRIDE_PORT" ] && PORT="$_OVERRIDE_PORT"
[ -n "$_OVERRIDE_DATABASE_URL" ] && DATABASE_URL="$_OVERRIDE_DATABASE_URL"
unset _OVERRIDE_DOMAIN _OVERRIDE_APP_DIR _OVERRIDE_PORT _OVERRIDE_DATABASE_URL

# Allow remaining defaults after merge
: "${APP_NAME:?APP_NAME is required in deploy.conf}"
: "${BACKEND_DIR:?BACKEND_DIR is required in deploy.conf}"
: "${FRONTEND_DIR:?FRONTEND_DIR is required in deploy.conf}"
: "${ENTRYPOINT:?ENTRYPOINT is required in deploy.conf}"
: "${BACKEND_TYPE:?BACKEND_TYPE is required in deploy.conf}"

DOMAIN="$(echo -n "${DOMAIN:-}" | tr -d '[:space:]')"
if [ -z "$DOMAIN" ]; then
    print_error "DOMAIN is required (set in deploy.conf or export DOMAIN=...)"
    exit 1
fi

case "$BACKEND_TYPE" in
    asgi|wsgi) ;;
    *)
        print_error "BACKEND_TYPE must be 'asgi' or 'wsgi' (got: $BACKEND_TYPE)"
        exit 1
        ;;
esac

APP_DIR="${APP_DIR:-/var/www/${APP_NAME}}"
PORT="${PORT:-8000}"
API_PREFIX="${API_PREFIX:-/api}"
API_STRIP_PREFIX="${API_STRIP_PREFIX:-false}"
WORKERS="${WORKERS:-4}"
SERVICE_DESCRIPTION="${SERVICE_DESCRIPTION:-${APP_NAME} API}"
FRONTEND_BUILD_DIR="${FRONTEND_BUILD_DIR:-build}"
FRONTEND_BUILD_CMD="${FRONTEND_BUILD_CMD:-npm run build}"
FRONTEND_API_ENV_VAR="${FRONTEND_API_ENV_VAR:-REACT_APP_API_URL}"
FRONTEND_API_URL="${FRONTEND_API_URL:-https://${DOMAIN}}"
REQUIREMENTS_FILE="${REQUIREMENTS_FILE:-requirements.txt}"
SETUP_DATABASE="${SETUP_DATABASE:-postgres}"
DB_NAME="${DB_NAME:-${APP_NAME}}"
DB_USER="${DB_USER:-${APP_NAME}_user}"

# Normalize API_PREFIX to start with / and not end with / (except root)
API_PREFIX="/${API_PREFIX#/}"
API_PREFIX="${API_PREFIX%/}"
[ -z "$API_PREFIX" ] && API_PREFIX="/"

SERVICE_NAME="${APP_NAME}-api"
SRC_BACKEND="$(cd "$PROJECT_DIR" && cd "$BACKEND_DIR" && pwd)"
SRC_FRONTEND="$(cd "$PROJECT_DIR" && cd "$FRONTEND_DIR" && pwd)"
DEST_BACKEND="${APP_DIR}/backend"
DEST_FRONTEND="${APP_DIR}/frontend"

if [ "$BACKEND_TYPE" = "asgi" ]; then
    GUNICORN_WORKER="uvicorn.workers.UvicornWorker"
else
    GUNICORN_WORKER="sync"
fi

# ---------------------------------------------------------------------------
# Helpers (DB / OS)
# ---------------------------------------------------------------------------

detect_package_manager() {
    if command -v dnf &>/dev/null; then
        PKG_MANAGER="dnf"
        PKG_INSTALL="sudo dnf install -y"
        PKG_UPDATE="sudo dnf update -y"
        CERTBOT_PKG="python3-certbot-nginx"
        IS_FEDORA=true
    elif command -v yum &>/dev/null; then
        PKG_MANAGER="yum"
        PKG_INSTALL="sudo yum install -y"
        PKG_UPDATE="sudo yum update -y"
        CERTBOT_PKG="python3-certbot-nginx"
        IS_FEDORA=true
    elif command -v apt &>/dev/null; then
        PKG_MANAGER="apt"
        PKG_INSTALL="sudo apt install -y"
        PKG_UPDATE="sudo apt update"
        CERTBOT_PKG="python3-certbot-nginx"
        IS_FEDORA=false
    else
        print_error "Could not detect package manager (dnf/yum/apt)."
        exit 1
    fi
    print_info "Package manager: $PKG_MANAGER"
}

urlencode() {
    python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$1"
}

postgres_is_running() {
    local host="${1:-localhost}" port="${2:-5432}"
    if command -v pg_isready >/dev/null 2>&1; then
        pg_isready -h "$host" -p "$port" >/dev/null 2>&1 && return 0
    fi
    systemctl is-active --quiet postgresql 2>/dev/null && return 0
    systemctl is-active --quiet postgresql.service 2>/dev/null && return 0
    if systemctl list-units --type=service --state=running --no-legend 'postgresql*' 2>/dev/null | grep -q .; then
        return 0
    fi
    python3 -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('${host/localhost/127.0.0.1}', $port)); s.close()" 2>/dev/null && return 0
    return 1
}

can_sudo_postgres() {
    sudo -u postgres psql -tAc "SELECT 1" >/dev/null 2>&1
}

is_placeholder_database_url() {
    local url="$1"
    case "$url" in
        *://user:password@*|*://*:*your_password*@*|*://CHANGEME*|*sqlite:*) return 0 ;;
        "") return 0 ;;
        *) return 1 ;;
    esac
}

read_env_database_url() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        grep -E '^DATABASE_URL=' "$env_file" | head -1 | cut -d= -f2-
    fi
}

pgpass_lookup() {
    local host="$1" port="$2" db="$3" user="$4"
    local pgpass="${PGPASSFILE:-$HOME/.pgpass}"
    [ -f "$pgpass" ] || return 1
    local h p d u pw
    while IFS=: read -r h p d u pw || [ -n "${h:-}" ]; do
        [[ "${h:-}" == \#* ]] && continue
        [ -z "${h:-}" ] && continue
        if { [ "$h" = "*" ] || [ "$h" = "$host" ] || { [ "$h" = "localhost" ] && [ "$host" = "127.0.0.1" ]; }; } \
            && { [ "$p" = "*" ] || [ "$p" = "$port" ]; } \
            && { [ "$d" = "*" ] || [ "$d" = "$db" ]; } \
            && { [ "$u" = "*" ] || [ "$u" = "$user" ]; }; then
            echo "$pw"
            return 0
        fi
    done < "$pgpass"
    return 1
}

ensure_postgres_role_and_db() {
    local db_user="$1" db_pass="$2" db_name="$3"
    local db_pass_sql="${db_pass//\'/\'\'}"

    if [[ ! "$db_user" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || [[ ! "$db_name" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
        print_error "Invalid database user or name (alphanumeric/underscore only)."
        exit 1
    fi

    print_info "Ensuring PostgreSQL role '$db_user' and database '$db_name'..."
    sudo -u postgres psql -v ON_ERROR_STOP=1 <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${db_user}') THEN
    CREATE ROLE ${db_user} LOGIN PASSWORD '${db_pass_sql}';
  ELSE
    ALTER ROLE ${db_user} WITH LOGIN PASSWORD '${db_pass_sql}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${db_name} OWNER ${db_user}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db_name}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${db_name} TO ${db_user};
EOF
    sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db_name" <<EOF
GRANT ALL ON SCHEMA public TO ${db_user};
ALTER SCHEMA public OWNER TO ${db_user};
EOF
}

resolve_database_url() {
    local env_file="$DEST_BACKEND/.env"
    local existing="" db_host db_port db_name db_user db_pass

    if [ -n "${DATABASE_URL:-}" ]; then
        print_info "Using DATABASE_URL from environment"
        echo "$DATABASE_URL"
        return 0
    fi

    existing="$(read_env_database_url "$env_file")"
    if [ -n "$existing" ] && ! is_placeholder_database_url "$existing"; then
        print_info "Using DATABASE_URL from existing $env_file"
        echo "$existing"
        return 0
    fi

    # Also check source tree .env before first copy
    existing="$(read_env_database_url "$SRC_BACKEND/.env")"
    if [ -n "$existing" ] && ! is_placeholder_database_url "$existing"; then
        print_info "Using DATABASE_URL from $SRC_BACKEND/.env"
        echo "$existing"
        return 0
    fi

    db_host="${PGHOST:-${POSTGRES_HOST:-localhost}}"
    db_port="${PGPORT:-${POSTGRES_PORT:-5432}}"
    db_name="${POSTGRES_DB:-${PGDATABASE:-$DB_NAME}}"
    db_user="${POSTGRES_USER:-${PGUSER:-$DB_USER}}"
    db_pass="${POSTGRES_PASSWORD:-${PGPASSWORD:-}}"

    if ! postgres_is_running "$db_host" "$db_port"; then
        print_error "PostgreSQL does not appear to be running on ${db_host}:${db_port}."
        print_error "Start PostgreSQL, set DATABASE_URL, or use SETUP_DATABASE=none / --skip-db."
        exit 1
    fi
    print_info "Detected PostgreSQL on ${db_host}:${db_port}"

    if [ -z "$db_pass" ]; then
        db_pass="$(pgpass_lookup "$db_host" "$db_port" "$db_name" "$db_user" || true)"
        [ -n "$db_pass" ] && print_info "Loaded password from .pgpass for $db_user"
    fi

    if [ -z "$db_pass" ]; then
        if can_sudo_postgres; then
            db_pass="$(openssl rand -hex 16)"
            ensure_postgres_role_and_db "$db_user" "$db_pass" "$db_name"
            print_warn "Generated password for $db_user (will be stored in backend .env)"
        else
            print_error "PostgreSQL is running but credentials could not be inferred."
            print_error "Set DATABASE_URL or POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB"
            exit 1
        fi
    fi

    echo "postgresql://${db_user}:$(urlencode "$db_pass")@${db_host}:${db_port}/${db_name}"
}

write_backend_env() {
    local database_url="$1"
    local env_file="$DEST_BACKEND/.env"
    local secret_key existing_db=""

    if [ -f "$env_file" ] && grep -q '^SECRET_KEY=' "$env_file"; then
        secret_key="$(grep -E '^SECRET_KEY=' "$env_file" | head -1 | cut -d= -f2-)"
    else
        secret_key="$(openssl rand -hex 32)"
    fi

    if [ -z "$database_url" ] && [ -f "$env_file" ]; then
        existing_db="$(read_env_database_url "$env_file")"
        database_url="$existing_db"
    fi

    {
        echo "SECRET_KEY=$secret_key"
        [ -n "$database_url" ] && echo "DATABASE_URL=$database_url"
        echo "ALLOWED_ORIGINS=https://$DOMAIN"
    } > "$env_file"

    print_info "Wrote $env_file (ALLOWED_ORIGINS=https://$DOMAIN)"
}

write_nginx_server() {
    local conf_body
    local proxy_pass

    if [ "$API_STRIP_PREFIX" = "true" ] && [ "$API_PREFIX" != "/" ]; then
        # Trailing URI on proxy_pass strips the matched location prefix
        proxy_pass="http://127.0.0.1:${PORT}/"
    else
        proxy_pass="http://127.0.0.1:${PORT}"
    fi

    if [ "$API_PREFIX" = "/" ]; then
        conf_body=$(cat <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass ${proxy_pass};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
)
        print_warn "API_PREFIX=/ — nginx will only proxy to the API (no static frontend)."
    else
        conf_body=$(cat <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location ${API_PREFIX}/ {
        proxy_pass ${proxy_pass};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = ${API_PREFIX} {
        return 301 ${API_PREFIX}/;
    }

    root ${DEST_FRONTEND}/${FRONTEND_BUILD_DIR};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
)
    fi

    if [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
        sudo tee "/etc/nginx/conf.d/${APP_NAME}.conf" >/dev/null <<<"$conf_body"
        sudo rm -f /etc/nginx/conf.d/default.conf
    else
        sudo tee "/etc/nginx/sites-available/${APP_NAME}" >/dev/null <<<"$conf_body"
        sudo ln -sf "/etc/nginx/sites-available/${APP_NAME}" /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
    fi
}

write_systemd_unit() {
    local worker_args
    if [ "$BACKEND_TYPE" = "asgi" ]; then
        worker_args="--worker-class ${GUNICORN_WORKER}"
    else
        worker_args=""
    fi

    sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null <<EOF
[Unit]
Description=${SERVICE_DESCRIPTION}
After=network.target postgresql.service

[Service]
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${DEST_BACKEND}
Environment="PATH=${DEST_BACKEND}/venv/bin"
ExecStart=${DEST_BACKEND}/venv/bin/gunicorn ${ENTRYPOINT} --workers ${WORKERS} ${worker_args} --bind 127.0.0.1:${PORT}
Restart=always

[Install]
WantedBy=multi-user.target
EOF
}

sync_app_files() {
    print_info "Syncing application files to $APP_DIR..."
    sudo mkdir -p "$APP_DIR"
    sudo chown -R "$USER:$APP_USER" "$APP_DIR"
    sudo chmod -R 755 "$APP_DIR"

    rsync -a --delete \
        --exclude 'venv' \
        --exclude '__pycache__' \
        --exclude '*.pyc' \
        --exclude '.env' \
        "$SRC_BACKEND/" "$DEST_BACKEND/"

    rsync -a --delete \
        --exclude 'node_modules' \
        --exclude 'build' \
        --exclude 'dist' \
        --exclude '.env' \
        "$SRC_FRONTEND/" "$DEST_FRONTEND/"
}

setup_backend_venv() {
    print_info "Setting up Python venv..."
    cd "$DEST_BACKEND"
    if [ ! -d venv ]; then
        python3 -m venv venv
    fi
    # shellcheck disable=SC1091
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r "$REQUIREMENTS_FILE"
    deactivate
}

fix_frontend() {
    print_info "Building frontend..."
    cd "$DEST_FRONTEND"
    echo "${FRONTEND_API_ENV_VAR}=${FRONTEND_API_URL}" > .env
    print_info "Frontend ${FRONTEND_API_ENV_VAR}=${FRONTEND_API_URL}"
    npm install
    # shellcheck disable=SC2086
    eval "$FRONTEND_BUILD_CMD"
}

fix_permissions() {
    sudo chown -R "$USER:$APP_USER" "$DEST_BACKEND" "$DEST_FRONTEND"
    sudo chmod -R u+rwX,g+rX,o= "$DEST_BACKEND"
    if [ -f "$DEST_BACKEND/.env" ]; then
        sudo chmod 640 "$DEST_BACKEND/.env"
        sudo chgrp "$APP_USER" "$DEST_BACKEND/.env"
    fi
    # Frontend build must be readable by nginx
    sudo chmod -R u+rwX,g+rX,o+rX "$DEST_FRONTEND/${FRONTEND_BUILD_DIR}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

print_info "========================================="
print_info "Generic VPS deploy"
print_info "========================================="
print_info "Project:    $PROJECT_DIR"
print_info "Config:     $CONFIG_FILE"
print_info "App:        $APP_NAME"
print_info "Domain:     $DOMAIN"
print_info "App dir:    $APP_DIR"
print_info "Backend:    $SRC_BACKEND -> $DEST_BACKEND"
print_info "Frontend:   $SRC_FRONTEND -> $DEST_FRONTEND"
print_info "Entrypoint: $ENTRYPOINT ($BACKEND_TYPE) :$PORT"
print_info "API prefix: $API_PREFIX (strip=$API_STRIP_PREFIX)"
print_info "Mode:       $([ "$REDEPLOY" = true ] && echo redeploy || echo full install)"
print_info "========================================="

if [ "$ASSUME_YES" != true ]; then
    read -r -p "Continue? (y/n) " -n 1 REPLY
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

detect_package_manager

if [ "$IS_FEDORA" = true ]; then
    APP_USER="nginx"
else
    APP_USER="www-data"
fi
print_info "Service user: $APP_USER"

if [ "$REDEPLOY" != true ]; then
    print_info "Installing system dependencies..."
    $PKG_UPDATE
    if [ "$IS_FEDORA" = true ]; then
        $PKG_INSTALL python3 python3-pip nginx certbot "$CERTBOT_PKG" rsync
    else
        $PKG_INSTALL python3 python3-pip python3-venv nginx certbot "$CERTBOT_PKG" rsync
    fi
    if ! command -v npm &>/dev/null; then
        print_warn "npm not found — installing Node.js..."
        $PKG_INSTALL nodejs npm
    fi
    sudo systemctl enable nginx
    sudo systemctl start nginx
fi

sync_app_files
setup_backend_venv

if [ "$SKIP_DB" = true ]; then
    print_info "Skipping database setup (--skip-db)"
    write_backend_env ""
elif [ "$SETUP_DATABASE" = "postgres" ]; then
    print_info "Resolving PostgreSQL connection..."
    DB_URL="$(resolve_database_url)"
    write_backend_env "$DB_URL"
elif [ "$SETUP_DATABASE" = "none" ]; then
    print_info "SETUP_DATABASE=none — writing .env without DATABASE_URL provisioning"
    write_backend_env ""
else
    print_error "Unknown SETUP_DATABASE=$SETUP_DATABASE (use postgres|none)"
    exit 1
fi

fix_permissions
write_systemd_unit
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

build_frontend
fix_permissions

print_info "Configuring Nginx..."
write_nginx_server
sudo nginx -t
sudo systemctl reload nginx

if [ "$REDEPLOY" != true ] && [ "$SKIP_SSL" != true ]; then
    if [ "$ASSUME_YES" = true ]; then
        print_info "Setting up SSL certificates..."
        sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email || \
            print_warn "certbot failed — run manually: sudo certbot --nginx -d $DOMAIN"
    else
        read -r -p "Set up SSL certificates now? (y/n) " -n 1 REPLY
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo certbot --nginx -d "$DOMAIN"
        fi
    fi
fi

print_info "========================================="
print_info "Deployment complete"
print_info "========================================="
print_info "App URL:  https://$DOMAIN"
print_info "API:      https://${DOMAIN}${API_PREFIX}/"
print_info "Service:  sudo systemctl status $SERVICE_NAME"
print_info "Logs:     sudo journalctl -u $SERVICE_NAME -f"
