# Containerization Strategy

This project uses Docker for local development and production orchestration.

## 🐋 Services
- **db**: PostgreSQL 15 database.
- **redis**: Redis 7 cache and message broker.
- **backend**: FastAPI application.
- **frontend**: Vite-built React SPA served by Nginx.
- **worker-webhook**: Background processor for incoming events.
- **worker-orchestrator**: AI orchestration worker.

## 🛠️ Local Development
To run the entire stack locally:
```bash
docker-compose up
```

## 🚀 Production Deployment
For production, we recommend deploying to **DigitalOcean App Platform**.
1. Create a PostgreSQL database on DO.
2. Create a Redis instance on DO.
3. Use the `App Spec` provided in the infrastructure folder.
