.PHONY: up down build logs shell-backend shell-frontend migrate-up

# Default: start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Build all services
build:
	docker compose build

# View logs for all services
logs:
	docker compose logs -f

# Open a shell in the backend container
shell-backend:
	docker compose exec backend /bin/bash

# Open a shell in the frontend container
shell-frontend:
	docker compose exec frontend /bin/sh

# Run database migrations
migrate-up:
	docker compose exec backend alembic upgrade head

# Initialize .env files from examples
init-env:
	cp .env.example .env
	cp backend/.env.example backend/.env
	cp frontend/.env.example frontend/.env
	@echo "Environment files created. Please edit them with your credentials."
