# Database Migrations with Alembic

We use Alembic to manage database schema evolutions.

## 🔄 Running Migrations
Locally with Docker:
```bash
docker-compose exec backend alembic upgrade head
```

## ➕ Creating New Migrations
1. Modify your models in `backend/src/models/`.
2. Generate a migration script:
   ```bash
   docker-compose exec backend alembic revision --autogenerate -m "description"
   ```
3. Review the generated file in `backend/alembic/versions/`.
4. Apply the migration:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```
