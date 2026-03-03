# Server-Side Nginx & SSL Setup Guide

Since your application is currently running on `http://dce.rohitverma.social:3000`, we need to set up a **Reverse Proxy** on the host machine. This will map standard HTTP (80) and HTTPS (443) to your Docker container and enable SSL.

## 1. Install Nginx and Certbot on Droplet
Run these commands on your DigitalOcean Droplet:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

## 2. Host-Level Nginx Configuration
Create a new configuration file:
`sudo nano /etc/nginx/sites-available/dce.rohitverma.social`

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name dce.rohitverma.social;

    location / {
        proxy_pass http://localhost:3000; # Points to your Docker Frontend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API Proxy (Optional if frontend handles it, but safer here)
    location /api {
        proxy_pass http://localhost:8000; # Points to your Docker Backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 3. Enable Configuration
```bash
sudo ln -s /etc/nginx/sites-available/dce.rohitverma.social /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. Obtain Free SSL (Let's Encrypt)
Run Certbot to automatically fetch and install the SSL certificate:
```bash
sudo certbot --nginx -d dce.rohitverma.social
```
*Follow the prompts (enter email, agree to terms, and choose **Redirect** to force HTTPS).*

## 5. Final Checks
1. Your site should now be live at **https://dce.rohitverma.social**.
2. Update your **GitHub OAuth Callback** to use `https` instead of `http`.
3. Update your `.env` files to reflect the `https` protocol.

---
*Note: Ensure your Droplet's Firewall (UFW) allows 'Nginx Full'.*
```bash
sudo ufw allow 'Nginx Full'
```
