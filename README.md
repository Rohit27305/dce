# Documentation Consistency Enforcer

AI-powered documentation synchronization system that ensures your technical documentation stays perfectly in sync with your codebase.

## 🚀 Overview
The Documentation Consistency Enforcer monitors your GitHub repositories via webhooks. When code changes occur, it uses the DigitalOcean Gradient™ AI platform to analyze the impact on documentation and automatically generates pull requests with updated content.

## 🏗️ Architecture
- **Backend**: FastAPI with Python 3.11
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **AI Engine**: DigitalOcean Gradient™ AI Platform
- **Data Store**: PostgreSQL
- **Message Queue/Cache**: Redis
- **Containerization**: Docker & Docker Compose

## 🛠️ Components
- **Watcher Agent**: Monitors push events and identifies documentation-relevant changes.
- **Impact Analyzer Agent**: Maps code changes to specific markdown files using a knowledge graph.
- **Content Generator Agent**: Generates unified diffs for documentation updates.
- **PR Orchestrator**: Creates and manages GitHub pull requests.

## 🏁 Local Setup Guide (How to Start)

Follow these steps to set up the project on your local machine for development:

### 1. Prerequisites
- Docker and Docker Compose installed.
- (Optional) Python 3.11+ and Node.js 20+ for local development without Docker.

### 2. Environment Configuration
Clone the provided `.env.example` files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Update these files with your specific keys, especially the **GitHub OAuth** and **DigitalOcean Gradient™** credentials.

### 3. Launching the Stack
Use Docker Compose to build and start all services:
```bash
docker-compose up --build
```
This will start:
- **Frontend**: Dashboard on `http://localhost:3000`
- **Backend API**: Documentation on `http://localhost:8000/api/docs`
- **Database**: PostgreSQL (accessible via port 5432)
- **Cache/Queue**: Redis (accessible via port 6379)
- **Workers**: Automated background processors.

### 4. Running Migrations
If the database schema changes, run the migrations:
```bash
docker-compose exec backend alembic upgrade head
```

## 📖 Usage Guide

### 1. Using Swagger UI
The backend provides a comprehensive Swagger UI for API exploration and testing.
- **URL**: `http://localhost:8000/api/docs`
- **Features**: Test all endpoints directly, view request/response schemas, and explore the API structure.

### 2. Managing Repositories
Instructions for adding repositories and triggering manual analysis can be found in the separate setup guide.
- [Repository Setup Guide](REPOSITORY_SETUP.md)

### 3. Monitoring Updates
Once a repository is added, the system will:
1. Listen for GitHub Push webhooks (if configured).
2. Analyze the impact of code changes on documentation.
3. Generate pull requests with suggested documentation updates.
4. You can view all updates at `http://localhost:8000/api/documentation-updates/`.

---

## 🏗️ Technical Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion, TanStack Query.
- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, Redis.
- **Infrastructure**: Docker, Docker Compose, Nginx.

## 📖 Detailed Documentation
- [Repository Setup & Usage](REPOSITORY_SETUP.md)
- [GitHub Setup & Secret Key](GITHUB_SETUP.md)
- [Demo Walkthrough](DEMO.md)
- [Docker Setup Guide](DOCKER.md)
- [Database Migrations](DATABASE_MIGRATIONS.md)
- [Agent Connectivity](AGENT_CONNECTIVITY.md)
- [Agent Response Parsing](AGENT_RESPONSES.md)
