#!/bin/bash

# VPS Deployment Script - Full setup including systemd and Nginx
# Usage: ./deploy-vps.sh <domain> <api-domain> [app-dir]
# This script assumes you have sudo access and are deploying to a fresh VPS
# Supports both Debian/Ubuntu (apt) and Fedora/RHEL/CentOS (dnf)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect package manager
detect_package_manager() {
    if command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
        PKG_INSTALL="sudo dnf install -y"
        PKG_UPDATE="sudo dnf update -y"
        CERTBOT_PKG="python3-certbot-nginx"
        IS_FEDORA=true
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
        PKG_INSTALL="sudo yum install -y"
        PKG_UPDATE="sudo yum update -y"
        CERTBOT_PKG="python3-certbot-nginx"
        IS_FEDORA=true
    elif command -v apt &> /dev/null; then
        PKG_MANAGER="apt"
        PKG_INSTALL="sudo apt install -y"
        PKG_UPDATE="sudo apt update"
        CERTBOT_PKG="python3-certbot-nginx"
        IS_FEDORA=false
    else
        print_error "Could not detect package manager. Please install dependencies manually."
        exit 1
    fi
    print_info "Detected package manager: $PKG_MANAGER"
}

usage() {
    echo "Usage: $0 <domain> <api-domain> [app-dir]"
    echo
    echo "Arguments:"
    echo "  domain       Frontend domain (e.g. coffee.example.com)"
    echo "  api-domain   API domain (e.g. api.coffee.example.com)"
    echo "  app-dir      Install path (default: /var/www/espresso-tracker)"
    echo
    echo "Database (PostgreSQL, resolved in this order):"
    echo "  1. DATABASE_URL environment variable"
    echo "  2. Existing backend/.env DATABASE_URL (if not a placeholder)"
    echo "  3. POSTGRES_*/PG* env vars against a running PostgreSQL"
    echo "  4. Auto-create espresso_user + espresso_tracker via sudo -u postgres"
    echo
    echo "Example:"
    echo "  DATABASE_URL=postgresql://espresso_user:secret@localhost/espresso_tracker \\"
    echo "    $0 coffee.example.com api.coffee.example.com"
    exit 1
}

urlencode() {
    python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$1"
}

postgres_is_running() {
    local host="${1:-localhost}"
    local port="${2:-5432}"

    if command -v pg_isready >/dev/null 2>&1; then
        if pg_isready -h "$host" -p "$port" >/dev/null 2>&1; then
            return 0
        fi
    fi

    if systemctl is-active --quiet postgresql 2>/dev/null; then
        return 0
    fi
    if systemctl is-active --quiet postgresql.service 2>/dev/null; then
        return 0
    fi
    # Fedora/RHEL versioned units (postgresql-15, etc.)
    if systemctl list-units --type=service --state=running --no-legend 'postgresql*' 2>/dev/null | grep -q .; then
        return 0
    fi

    if python3 -c "import socket; s=socket.socket(); s.settimeout(1); s.connect(('${host/localhost/127.0.0.1}', $port)); s.close()" 2>/dev/null; then
        return 0
    fi
    return 1
}

can_sudo_postgres() {
    sudo -u postgres psql -tAc "SELECT 1" >/dev/null 2>&1
}

is_placeholder_database_url() {
    local url="$1"
    case "$url" in
        *://user:password@*|*://*:*your_password*@*|*://CHANGEME*|*sqlite:*)
            return 0
            ;;
        "")
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

read_env_database_url() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        grep -E '^DATABASE_URL=' "$env_file" | head -1 | cut -d= -f2-
    fi
}

pgpass_lookup() {
    # Format: hostname:port:database:username:password
    local host="$1" port="$2" db="$3" user="$4"
    local pgpass="${PGPASSFILE:-$HOME/.pgpass}"
    [ -f "$pgpass" ] || return 1

    local line h p d u pw
    while IFS=: read -r h p d u pw || [ -n "$h" ]; do
        [[ "$h" == \#* ]] && continue
        [ -z "$h" ] && continue
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
    local db_user="$1"
    local db_pass="$2"
    local db_name="$3"
    local db_pass_sql="${db_pass//\'/\'\'}"

    if [[ ! "$db_user" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || [[ ! "$db_name" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
        print_error "Invalid database user or name (use alphanumeric/underscore only)."
        exit 1
    fi

    print_info "Ensuring PostgreSQL role '$db_user' and database '$db_name' exist..."
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

    # PostgreSQL 15+ defaults to restricting public schema
    sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db_name" <<EOF
GRANT ALL ON SCHEMA public TO ${db_user};
ALTER SCHEMA public OWNER TO ${db_user};
EOF
}

resolve_database_url() {
    local env_file="$BACKEND_DIR/.env"
    local existing=""
    local db_host db_port db_name db_user db_pass

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

    db_host="${PGHOST:-${POSTGRES_HOST:-localhost}}"
    db_port="${PGPORT:-${POSTGRES_PORT:-5432}}"
    db_name="${POSTGRES_DB:-${PGDATABASE:-espresso_tracker}}"
    db_user="${POSTGRES_USER:-${PGUSER:-espresso_user}}"
    db_pass="${POSTGRES_PASSWORD:-${PGPASSWORD:-}}"

    if ! postgres_is_running "$db_host" "$db_port"; then
        print_error "PostgreSQL does not appear to be running on ${db_host}:${db_port}."
        print_error "Start PostgreSQL, or set DATABASE_URL before running this script."
        print_error "  export DATABASE_URL='postgresql://espresso_user:SECRET@localhost/espresso_tracker'"
        exit 1
    fi
    print_info "Detected PostgreSQL on ${db_host}:${db_port}"

    if [ -z "$db_pass" ]; then
        db_pass="$(pgpass_lookup "$db_host" "$db_port" "$db_name" "$db_user" || true)"
        if [ -n "$db_pass" ]; then
            print_info "Loaded password from .pgpass for $db_user"
        fi
    fi

    if [ -z "$db_pass" ]; then
        if can_sudo_postgres; then
            db_pass="$(openssl rand -hex 16)"
            ensure_postgres_role_and_db "$db_user" "$db_pass" "$db_name"
            print_warn "Generated password for $db_user (stored in $env_file)"
        else
            print_error "PostgreSQL is running but credentials could not be inferred."
            print_error "Set one of:"
            print_error "  DATABASE_URL"
            print_error "  POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB"
            print_error "  Or create ~/.pgpass and retry"
            exit 1
        fi
    fi

    echo "postgresql://${db_user}:$(urlencode "$db_pass")@${db_host}:${db_port}/${db_name}"
}

write_backend_env() {
    local database_url="$1"
    local secret_key

    if [ -f .env ] && grep -q '^SECRET_KEY=' .env; then
        secret_key="$(grep -E '^SECRET_KEY=' .env | head -1 | cut -d= -f2-)"
    else
        secret_key="$(openssl rand -hex 32)"
    fi

    cat > .env << EOF
SECRET_KEY=$secret_key
DATABASE_URL=$database_url
ALLOWED_ORIGINS=https://$DOMAIN
EOF
    print_info "Wrote $BACKEND_DIR/.env (ALLOWED_ORIGINS=https://$DOMAIN)"
}

if [ $# -lt 2 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
fi

DOMAIN="$1"
API_DOMAIN="$2"
APP_DIR="${3:-/var/www/espresso-tracker}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

print_info "========================================="
print_info "VPS Full Deployment Setup"
print_info "========================================="
print_info "Domain:     $DOMAIN"
print_info "API domain: $API_DOMAIN"
print_info "App dir:    $APP_DIR"
print_info "APP_USER will be auto-detected based on OS"
print_info "========================================="
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Detect and install system dependencies
detect_package_manager

# Set appropriate user based on OS
if [ "$IS_FEDORA" = true ]; then
    APP_USER="nginx"  # Fedora/RHEL uses nginx user
else
    APP_USER="www-data"  # Debian/Ubuntu uses www-data
fi

print_info "Using user: $APP_USER"
print_info "Installing system dependencies..."
$PKG_UPDATE
# python3-venv is Debian/Ubuntu only; Fedora/RHEL ship venv with python3
if [ "$IS_FEDORA" = true ]; then
    $PKG_INSTALL python3 python3-pip nginx certbot $CERTBOT_PKG
else
    $PKG_INSTALL python3 python3-pip python3-venv nginx certbot $CERTBOT_PKG
fi

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Create application directory
print_info "Creating application directory..."
sudo mkdir -p "$APP_DIR"
sudo chown -R $USER:$APP_USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

# Copy application files (assuming we're running from project root)
print_info "Copying application files..."
cp -r backend "$APP_DIR/"
cp -r frontend "$APP_DIR/"

# Setup backend
print_info "Setting up backend..."
cd "$BACKEND_DIR"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Resolve PostgreSQL and write backend .env
print_info "Resolving PostgreSQL connection..."
DATABASE_URL="$(resolve_database_url)"
write_backend_env "$DATABASE_URL"

# Keep deploy user as owner; service user needs read access to app code + .env
sudo chown -R "$USER:$APP_USER" "$BACKEND_DIR"
sudo chmod -R u+rwX,g+rX,o= "$BACKEND_DIR"
sudo chmod 640 "$BACKEND_DIR/.env"
sudo chgrp "$APP_USER" "$BACKEND_DIR/.env"

# Create systemd service
print_info "Creating systemd service..."
sudo tee /etc/systemd/system/espresso-api.service > /dev/null << EOF
[Unit]
Description=Espresso Tracker API
After=network.target postgresql.service

[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$BACKEND_DIR/venv/bin"
ExecStart=$BACKEND_DIR/venv/bin/gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8002
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable espresso-api
sudo systemctl start espresso-api

# Setup frontend
print_info "Setting up frontend..."
cd "$FRONTEND_DIR"

# Setup frontend .env BEFORE building (React env vars are embedded at build time)
print_info "Setting up frontend environment..."
echo "REACT_APP_API_URL=https://$API_DOMAIN" > .env
print_info "Frontend API URL set to: https://$API_DOMAIN"

npm install
npm run build

# Setup Nginx
print_info "Configuring Nginx..."

if [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
    # Fedora/RHEL/CentOS - use conf.d directory
    # Backend API
    sudo tee /etc/nginx/conf.d/espresso-api.conf > /dev/null << EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Frontend
    sudo tee /etc/nginx/conf.d/espresso-frontend.conf > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $FRONTEND_DIR/build;
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

    # Remove default server block if it exists
    sudo rm -f /etc/nginx/conf.d/default.conf
else
    # Debian/Ubuntu - use sites-available/sites-enabled
    # Backend API
    sudo tee /etc/nginx/sites-available/espresso-api > /dev/null << EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Frontend
    sudo tee /etc/nginx/sites-available/espresso-frontend > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $FRONTEND_DIR/build;
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

    # Enable sites
    sudo ln -sf /etc/nginx/sites-available/espresso-api /etc/nginx/sites-enabled/
    sudo ln -sf /etc/nginx/sites-available/espresso-frontend /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL
print_info "Setting up SSL certificates..."
read -p "Do you want to set up SSL certificates now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot --nginx -d $DOMAIN -d $API_DOMAIN
fi

print_info "========================================="
print_info "Deployment complete!"
print_info "========================================="
print_info "Backend API: https://$API_DOMAIN"
print_info "Frontend: https://$DOMAIN"
print_info ""
print_info "Next steps:"
print_info "1. Restart backend if needed: sudo systemctl restart espresso-api"
print_info "2. Check logs: sudo journalctl -u espresso-api -f"
