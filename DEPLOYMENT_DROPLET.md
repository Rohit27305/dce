# Deployment Guide: DigitalOcean Droplet

This guide covers how to deploy the **Documentation Consistency Engine (DCE)** to a DigitalOcean Droplet with a custom domain (`dce.rohitverma.social`).

## 🏗️ Architecture Overview
- **Frontend**: Nginx serving React static files, proxying `/api` to the backend.
- **Backend**: FastAPI running behind Gunicorn/Uvicorn.
- **Workers**: Orchestrator, Webhook Processor, and PR Creator running as background processes.
- **Infrastructure**: Managed via Docker Compose.

## 1. Domain Configuration
1. Point your domain `dce.rohitverma.social` to your Droplet's IP address.
2. In your Droplet, ensure Ports **80** (HTTP) and **443** (HTTPS) are open.

## 2. Updated Nginx Configuration
The current `frontend/nginx.conf` is optimized to handle internal routing:

```nginx
server {
    listen 80;
    server_name dce.rohitverma.social;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend internal network
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 3. Deployment Steps

### Step A: Update Environment Variables
On the server, your `.env` should use the domain name for callbacks:
```env
# Change this for deployment
GITHUB_REDIRECT_URI=http://dce.rohitverma.social/api/auth/callback
VITE_API_URL=/api
```
*Note: Setting `VITE_API_URL=/api` allows the browser to use relative paths, which Nginx then proxies to the backend.*

### Step B: Build and Deploy
Run the following command on your Droplet:
```bash
docker compose -f docker-compose.yml up -d --build
```

## 4. Required Changes vs Local
1. **CORS**: Ensure `BACKEND_CORS_ORIGINS` in `config.py` includes `http://dce.rohitverma.social`.
2. **Relative API Path**: We've updated the frontend to use `/api` instead of `http://localhost:8000/api` to simplify proxying.
3. **Internal Networking**: Docker Compose ensures that `frontend` can reach `backend` using the hostname `backend:8000`.

## 5. SSL (Recommended)
Once deployed, we recommend using Certbot to enable HTTPS:
```bash
docker exec -it dcea-frontend-1 certbot --nginx -d dce.rohitverma.social
```
*(Or run Certbot on the host if using a reverse proxy setup).*

---
*Created for the DCE Deployment Workflow.*
