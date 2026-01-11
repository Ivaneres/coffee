# Deployment Guide

This guide covers deploying the Espresso Tracker app to production.

## Quick Start with Deployment Scripts

We provide automated deployment scripts to make deployment easier:

### General Deployment Script

```bash
# Deploy everything to VPS
./deploy.sh all vps

# Deploy only backend to Railway
./deploy.sh backend railway

# Deploy only frontend to Netlify
./deploy.sh frontend netlify
```

**Usage:**
```bash
./deploy.sh [backend|frontend|all] [vps|railway|render|netlify|vercel]
```

### Full VPS Setup Script

For a complete VPS setup including systemd and Nginx configuration:

```bash
# Edit deploy-vps.sh first to set your domain and paths
./deploy-vps.sh
```

This script will:
- Install system dependencies
- Set up Python virtual environment
- Create systemd service
- Configure Nginx
- Set up SSL certificates
- Build and deploy frontend

**Note:** Edit the script first to configure your domain names and paths.

## Overview

The app consists of:
- **Backend**: FastAPI (Python) - API server
- **Frontend**: React - Static files served by a web server
- **Database**: SQLite (can be upgraded to PostgreSQL)

## Pre-Deployment Checklist

### 1. Security Updates

- [ ] Change JWT secret key in `backend/auth.py`
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS/SSL
- [ ] Update CORS origins to production domain
- [ ] Use a production database (PostgreSQL recommended)

### 2. Environment Variables

Create a `.env` file or set environment variables:

```bash
# Backend
SECRET_KEY=your-very-secure-secret-key-here
DATABASE_URL=postgresql://user:password@localhost/espresso_tracker
ALLOWED_ORIGINS=https://yourdomain.com

# Frontend (build-time)
REACT_APP_API_URL=https://api.yourdomain.com
```

## Deployment Options

### Option 1: VPS/Server (Recommended for Full Control)

#### Backend Deployment

1. **Install dependencies:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn  # Production WSGI server
```

2. **Create systemd service** (`/etc/systemd/system/espresso-api.service`):
```ini
[Unit]
Description=Espresso Tracker API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/espresso-tracker/backend
Environment="PATH=/path/to/espresso-tracker/backend/venv/bin"
ExecStart=/path/to/espresso-tracker/backend/venv/bin/gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

3. **Start service:**
```bash
sudo systemctl enable espresso-api
sudo systemctl start espresso-api
```

4. **Setup Nginx reverse proxy** (`/etc/nginx/sites-available/espresso-api`):
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Frontend Deployment

1. **Build the React app:**
```bash
cd frontend
npm install
npm run build
```

2. **Serve with Nginx** (`/etc/nginx/sites-available/espresso-frontend`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/espresso-tracker/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **Enable SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Option 2: Railway (Easy Deployment)

1. **Backend:**
   - Create new project on Railway
   - Connect GitHub repo
   - Set root directory to `backend`
   - Add environment variables
   - Railway auto-detects FastAPI and deploys

2. **Frontend:**
   - Create new project on Railway
   - Set root directory to `frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npx serve -s build`
   - Add environment variable: `REACT_APP_API_URL`

### Option 3: Render

1. **Backend:**
   - Create new Web Service
   - Environment: Python 3
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - Add PostgreSQL database

2. **Frontend:**
   - Create new Static Site
   - Build: `npm install && npm run build`
   - Publish directory: `build`

### Option 4: Heroku

1. **Backend:**
   - Create `Procfile` in backend:
   ```
   web: gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
   ```
   - Deploy via Git or CLI

2. **Frontend:**
   - Use Heroku Buildpack for static sites
   - Or deploy to Netlify/Vercel (see below)

### Option 5: Netlify/Vercel (Frontend) + Backend on VPS

**Frontend on Netlify:**
1. Connect GitHub repo
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/build`
4. Environment variable: `REACT_APP_API_URL`

**Frontend on Vercel:**
1. Import project from GitHub
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `build`
5. Environment variable: `REACT_APP_API_URL`

## Database Migration

### SQLite to PostgreSQL

1. **Install PostgreSQL:**
```bash
sudo apt install postgresql postgresql-contrib
```

2. **Create database:**
```sql
CREATE DATABASE espresso_tracker;
CREATE USER espresso_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE espresso_tracker TO espresso_user;
```

3. **Update backend/database.py:**
```python
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://espresso_user:your_password@localhost/espresso_tracker"
)
```

4. **Install PostgreSQL driver:**
```bash
pip install psycopg2-binary
```

5. **Update requirements.txt:**
```
psycopg2-binary>=2.9.0
```

## Production Configuration

### Backend Updates

1. **Update `backend/auth.py`:**
```python
import os
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
```

2. **Update `backend/main.py` CORS:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

3. **Create `backend/.env` (don't commit):**
```
SECRET_KEY=generate-a-secure-random-key-here
DATABASE_URL=postgresql://user:pass@localhost/espresso_tracker
ALLOWED_ORIGINS=https://yourdomain.com
```

### Frontend Updates

1. **Update API URL in production:**
   - Set `REACT_APP_API_URL` environment variable during build
   - Or update `frontend/src/api/client.ts`:
   ```typescript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com';
   ```

## Quick Start: Railway Deployment

### Backend

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `cd backend && railway init`
4. Add PostgreSQL: `railway add postgresql`
5. Set environment variables:
   - `SECRET_KEY` (generate with: `openssl rand -hex 32`)
   - `ALLOWED_ORIGINS` (your frontend URL)
6. Deploy: `railway up`

### Frontend

1. Initialize: `cd frontend && railway init`
2. Set environment variable: `REACT_APP_API_URL` (your backend URL)
3. Deploy: `railway up`

## Monitoring & Maintenance

- Set up logging (consider using Sentry)
- Monitor database size
- Regular backups
- Update dependencies regularly
- Monitor API response times

## Security Checklist

- [ ] HTTPS enabled
- [ ] Strong JWT secret key
- [ ] CORS properly configured
- [ ] Database credentials secured
- [ ] Environment variables not in code
- [ ] Regular security updates
- [ ] Rate limiting (consider adding)
- [ ] Input validation (already in place)

## Troubleshooting

### Backend won't start
- Check logs: `journalctl -u espresso-api -f`
- Verify database connection
- Check port availability

### Frontend can't connect to API
- Verify CORS settings
- Check API URL in frontend
- Verify network/firewall rules

### Database errors
- Check database is running
- Verify connection string
- Check user permissions
