#!/bin/bash

# Espresso Tracker Production Deployment Script
# Usage: ./deploy.sh [backend|frontend|all] [vps|railway|render]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_TARGET="${2:-vps}"  # vps, railway, render
COMPONENT="${1:-all}"      # backend, frontend, all
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    print_info "Checking requirements..."
    
    if [ "$COMPONENT" = "backend" ] || [ "$COMPONENT" = "all" ]; then
        if ! command -v python3 &> /dev/null; then
            print_error "python3 is not installed"
            exit 1
        fi
    fi
    
    if [ "$COMPONENT" = "frontend" ] || [ "$COMPONENT" = "all" ]; then
        if ! command -v npm &> /dev/null; then
            print_error "npm is not installed"
            exit 1
        fi
    fi
    
    print_info "All requirements met ✓"
}

setup_backend_env() {
    print_info "Setting up backend environment..."
    
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        print_warn ".env file not found in backend. Creating from example..."
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            print_warn "Please edit backend/.env and set your production values!"
            print_warn "Especially: SECRET_KEY, DATABASE_URL, ALLOWED_ORIGINS"
        else
            print_error ".env.example not found. Please create backend/.env manually"
            exit 1
        fi
    else
        print_info "Backend .env file exists ✓"
    fi
}

setup_frontend_env() {
    print_info "Setting up frontend environment..."
    
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        print_warn ".env file not found in frontend. Creating from example..."
        if [ -f "$FRONTEND_DIR/.env.example" ]; then
            cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
            print_warn "Please edit frontend/.env and set REACT_APP_API_URL!"
        else
            print_error ".env.example not found. Please create frontend/.env manually"
            exit 1
        fi
    else
        print_info "Frontend .env file exists ✓"
    fi
}

deploy_backend_vps() {
    print_info "Deploying backend to VPS..."
    
    cd "$BACKEND_DIR"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_info "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate and install dependencies
    source venv/bin/activate
    print_info "Installing/updating dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Check if systemd service exists
    if systemctl list-unit-files | grep -q espresso-api.service; then
        print_info "Restarting espresso-api service..."
        sudo systemctl restart espresso-api
        sudo systemctl status espresso-api --no-pager
    else
        print_warn "Systemd service not found. Please set it up manually."
        print_info "See DEPLOYMENT.md for systemd service configuration"
    fi
    
    cd ..
    print_info "Backend deployment complete ✓"
}

deploy_backend_railway() {
    print_info "Deploying backend to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not installed. Install with: npm i -g @railway/cli"
        exit 1
    fi
    
    cd "$BACKEND_DIR"
    railway up
    cd ..
    
    print_info "Backend deployment to Railway complete ✓"
}

deploy_backend_render() {
    print_info "Deploying backend to Render..."
    print_warn "Render deployment should be done via Git push or Render dashboard"
    print_info "Make sure your Render service is connected to your Git repository"
    print_info "Push your changes: git push origin main"
}

deploy_backend() {
    print_info "=== Deploying Backend ==="
    
    setup_backend_env
    
    case "$DEPLOY_TARGET" in
        vps)
            deploy_backend_vps
            ;;
        railway)
            deploy_backend_railway
            ;;
        render)
            deploy_backend_render
            ;;
        *)
            print_error "Unknown deployment target: $DEPLOY_TARGET"
            exit 1
            ;;
    esac
}

deploy_frontend_vps() {
    print_info "Deploying frontend to VPS..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    print_info "Installing dependencies..."
    npm install
    
    # Build for production
    print_info "Building React app for production..."
    npm run build
    
    # Check if build was successful
    if [ ! -d "build" ]; then
        print_error "Build failed - build directory not found"
        exit 1
    fi
    
    print_info "Build complete. Build directory: $FRONTEND_DIR/build"
    print_info "Configure your web server (Nginx/Apache) to serve from: $(pwd)/build"
    
    cd ..
    print_info "Frontend build complete ✓"
}

deploy_frontend_railway() {
    print_info "Deploying frontend to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not installed. Install with: npm i -g @railway/cli"
        exit 1
    fi
    
    cd "$FRONTEND_DIR"
    railway up
    cd ..
    
    print_info "Frontend deployment to Railway complete ✓"
}

deploy_frontend_netlify() {
    print_info "Deploying frontend to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        print_error "Netlify CLI not installed. Install with: npm i -g netlify-cli"
        exit 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # Build
    print_info "Building React app..."
    npm install
    npm run build
    
    # Deploy
    print_info "Deploying to Netlify..."
    netlify deploy --prod --dir=build
    
    cd ..
    print_info "Frontend deployment to Netlify complete ✓"
}

deploy_frontend_vercel() {
    print_info "Deploying frontend to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not installed. Install with: npm i -g vercel"
        exit 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # Build
    print_info "Building React app..."
    npm install
    npm run build
    
    # Deploy
    print_info "Deploying to Vercel..."
    vercel --prod
    
    cd ..
    print_info "Frontend deployment to Vercel complete ✓"
}

deploy_frontend_render() {
    print_info "Deploying frontend to Render..."
    print_warn "Render deployment should be done via Git push or Render dashboard"
    print_info "Make sure your Render static site is connected to your Git repository"
    print_info "Push your changes: git push origin main"
}

deploy_frontend() {
    print_info "=== Deploying Frontend ==="
    
    setup_frontend_env
    
    case "$DEPLOY_TARGET" in
        vps)
            deploy_frontend_vps
            ;;
        railway)
            deploy_frontend_railway
            ;;
        netlify)
            deploy_frontend_netlify
            ;;
        vercel)
            deploy_frontend_vercel
            ;;
        render)
            deploy_frontend_render
            ;;
        *)
            print_error "Unknown deployment target: $DEPLOY_TARGET"
            exit 1
            ;;
    esac
}

# Main execution
main() {
    print_info "========================================="
    print_info "Espresso Tracker Deployment Script"
    print_info "========================================="
    print_info "Component: $COMPONENT"
    print_info "Target: $DEPLOY_TARGET"
    print_info "========================================="
    echo ""
    
    check_requirements
    
    case "$COMPONENT" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        all)
            deploy_backend
            echo ""
            deploy_frontend
            ;;
        *)
            print_error "Unknown component: $COMPONENT"
            print_info "Usage: ./deploy.sh [backend|frontend|all] [vps|railway|render|netlify|vercel]"
            exit 1
            ;;
    esac
    
    echo ""
    print_info "========================================="
    print_info "Deployment complete! ✓"
    print_info "========================================="
}

# Run main function
main
