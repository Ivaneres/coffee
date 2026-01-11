#!/bin/bash

# VPS Deployment Script - Full setup including systemd and Nginx
# This script assumes you have sudo access and are deploying to a fresh VPS

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

# Configuration - EDIT THESE
DOMAIN="yourdomain.com"
API_DOMAIN="api.yourdomain.com"
APP_USER="www-data"
APP_DIR="/var/www/espresso-tracker"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

print_info "========================================="
print_info "VPS Full Deployment Setup"
print_info "========================================="
print_warn "Make sure to edit this script and set:"
print_warn "  - DOMAIN"
print_warn "  - API_DOMAIN"
print_warn "  - APP_USER"
print_warn "  - APP_DIR"
print_info "========================================="
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Install system dependencies
print_info "Installing system dependencies..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx

# Create application directory
print_info "Creating application directory..."
sudo mkdir -p "$APP_DIR"
sudo chown -R $USER:$APP_USER "$APP_DIR"

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

# Setup backend .env
if [ ! -f .env ]; then
    print_warn "Creating backend .env file..."
    cat > .env << EOF
SECRET_KEY=$(openssl rand -hex 32)
DATABASE_URL=postgresql://user:password@localhost/espresso_tracker
ALLOWED_ORIGINS=https://$DOMAIN
EOF
    print_warn "Please edit $BACKEND_DIR/.env with your database credentials!"
fi

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
ExecStart=$BACKEND_DIR/venv/bin/gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
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
npm install
npm run build

# Setup frontend .env
if [ ! -f .env ]; then
    print_warn "Creating frontend .env file..."
    echo "REACT_APP_API_URL=https://$API_DOMAIN" > .env
fi

# Setup Nginx
print_info "Configuring Nginx..."

# Backend API
sudo tee /etc/nginx/sites-available/espresso-api > /dev/null << EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8000;
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
print_info "1. Set up PostgreSQL database"
print_info "2. Update DATABASE_URL in $BACKEND_DIR/.env"
print_info "3. Restart backend: sudo systemctl restart espresso-api"
print_info "4. Check logs: sudo journalctl -u espresso-api -f"
