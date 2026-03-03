# Alembic Migration Module (`backend/alembic`)

## 1. Module Identity
The **Alembic migration module** lives under `backend/alembic/` and is responsible for managing all database schema changes for the Documentation Consistency Enforcer service. It provides:
- A runtime environment (`env.py`) that configures Alembic with the project's SQLAlchemy models.
- A collection of versioned migration scripts (`versions/*.py`) that describe incremental schema evolutions.
- The Alembic configuration file (`alembic.ini`) used by CLI commands.

This module enables developers to evolve the PostgreSQL schema in a reproducible, version‑controlled way, both locally and in Docker containers.

## 2. Interface Contract
### Public Files
| File | Exported Symbol(s) | Purpose |
|------|-------------------|---------|
| `env.py` | `run_migrations_offline`, `run_migrations_online` (implicitly via Alembic entry‑point) | Sets up Alembic context, loads the SQLAlchemy `Base.metadata` from `src.models`, and reads connection settings from `src.core.config.Settings`. |
| `versions/7131f776166f_initial_migration.py` | `revision`, `down_revision`, `upgrade`, `downgrade` | First migration that creates the `agent_invocations` and `users` tables. |
| `versions/a8c5984ee9bd_add_generated_updates_to_documentation_.py` | (not shown, but follows same pattern) | Example of a later migration adding new columns/tables. |

### Expected Functions (Alembic conventions)
- **`upgrade()`** – applies the forward migration.
- **`downgrade()`** – reverts the migration (auto‑generated stub if not manually edited).

These functions are discovered and executed by the Alembic CLI (`alembic upgrade head`, `alembic downgrade -1`, etc.).

## 3. Logic Flow
1. **Application Startup** – When Alembic is invoked, it imports `env.py`.
2. **Configuration Loading** – `env.py`:
   - Loads environment variables via `pydantic-settings` (`src.core.config.settings`).
   - Inserts the project’s `src` directory into `sys.path` so that `from src.models import Base` resolves.
   - Retrieves the SQLAlchemy `Base.metadata` object, which contains all model table definitions.
3. **Migration Context Creation** – Depending on the mode (`offline` vs `online`), Alembic configures the context with either a URL string or an active `Engine`.
4. **Running Migrations** – The Alembic command line calls the `upgrade()` (or `downgrade()`) function of the target version script. Each script:
   - Calls `op.create_table`, `op.add_column`, `op.drop_table`, etc., using the Alembic Operations API.
   - Relies on the `revision`/`down_revision` metadata to order migrations correctly.
5. **Version Tracking** – Alembic records the applied revision in the `alembic_version` table of the target database, ensuring idempotent execution.

## 4. Dependencies
| Dependent Module | Reason for Dependency |
|------------------|-----------------------|
| `src.core.config` | Provides `settings.DATABASE_URL` used to configure the migration connection. |
| `src.models` (specifically `Base`) | Supplies the `metadata` object that represents the current model schema for autogeneration. |
| `alembic` package | Core migration engine (`alembic.context`, `alembic.op`). |
| `sqlalchemy` | Underlying ORM and schema definition library used by both the application and Alembic operations. |
| `python-dotenv` (via `load_dotenv`) | Allows local development to pick up `.env` values before the settings object is created. |

---
### Quick Reference Commands
```bash
# Apply all pending migrations
docker-compose exec backend alembic upgrade head

# Generate a new migration after model changes
docker-compose exec backend alembic revision --autogenerate -m "add new column"

# Roll back the last migration (for testing)
docker-compose exec backend alembic downgrade -1
```

---
*This README was generated automatically from the current source code. It reflects the actual implementation details present in `backend/alembic/` as of the latest commit.*