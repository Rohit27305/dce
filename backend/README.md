# DCE Backend - Documentation Consistency Engine

This is the core API and worker engine for the Documentation Consistency Engine (DCE).

## Features
- **AI Orcherstration**: Multi-agent system (Watcher, Architect, Generator).
- **GitHub Integration**: Full support for public and private repositories.
- **Async Workers**: Distributed processing using Redis and Celery-style task patterns.
- **Impact Analysis**: Deep code scan to identify documentation drift.

## Technology Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (SQLAlchemy ORM)
- **Task Queue**: Redis
- **AI Interface**: Gradient™ AI Platform

## Standalone Setup

### 1. Prerequisites
- Python 3.11+
- Redis (running locally or via Docker)
- PostgreSQL

### 2. Installation
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment
Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL`
- `REDIS_URL`
- `GITHUB_TOKEN`
- `GRADIENT_ACCESS_KEY`

### 4. Running the API
```bash
python -m src.main
```

### 5. Running Workers
Run each worker in a separate terminal:
```bash
python src/workers/webhook_processor.py
python src/workers/orchestrator.py
python src/workers/pr_creator.py
```

## API Documentation
Once running, docs are available at:
- Swagger UI: `http://localhost:8000/api/docs`
- Redoc: `http://localhost:8000/api/redoc`

---
*Created by the DCE Team.*
