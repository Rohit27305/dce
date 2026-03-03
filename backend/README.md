# Backend Module – Documentation Consistency Engine (DCE)

## 1. Module Identity
The **backend** directory implements the core server‑side components of the Documentation Consistency Engine. It provides:
- A **FastAPI** based HTTP API that exposes authentication, repository handling, documentation update orchestration and metrics.
- **Background workers** (orchestrator, PR creator, webhook processor) that run asynchronously using Redis as a lightweight task queue.
- **Database migrations** via Alembic and an SQLAlchemy ORM model layer.
- **Integration clients** for GitHub and the DigitalOcean Gradient AI platform.
- Centralised configuration, exception handling and response utilities.

## 2. Interface Contract
### 2.1 Public Configuration (`src/core/config.py`)
```python
class Settings(BaseSettings):
    APP_NAME: str = "Documentation Consistency Enforcer"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_change_me_in_production")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/doc_enforcer")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI: str = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/callback")
    GITHUB_WEBHOOK_SECRET: str = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_USERNAME: str = os.getenv("GITHUB_USERNAME", "")
    GRADIENT_ACCESS_KEY: str = os.getenv("GRADIENT_ACCESS_KEY", "")
    GRADIENT_AGENT_URL: str = os.getenv("GRADIENT_AGENT_URL", "")
    CORS_ORIGINS: List[str] = []
```
- **Exported object**: `settings` (module‑level instance created by `Settings()` when imported).
- **Usage**: All backend modules import `settings` to obtain validated environment values.

### 2.2 Gradient Agent Client (`src/agents/client.py`)
```python
class GradientAgentClient:
    def __init__(self):
        self.agent_url = settings.GRADIENT_AGENT_URL if settings else ""
        self.access_key = settings.GRADIENT_ACCESS_KEY if settings else ""
        self.headers = {
            "Authorization": f"Bearer {self.access_key}",
            "Content-Type": "application/json",
        }

    async def invoke(self, prompt: str, role: str, max_tokens: int = None, temperature: float = None) -> Dict[str, Any]:
        # Generates a cache key based on URL, role and a SHA‑256 hash of the prompt.
        # Looks up the response in Redis via `redis_client.get_cache`.
        # If a cache miss, will POST the payload to `{self.agent_url}/api` (truncated in the snippet).
        # Returns the JSON response directly.
```
- **Exports**: `GradientAgentClient` class – instantiated by workers that need to call the Gradient AI agent.
- **Side‑effects**: Reads from Redis cache; writes are performed later in the actual request implementation (not shown).

### 2.3 Authentication Router (`src/api/auth.py`)
```python
router = APIRouter()

@router.get("/login/github")
async def github_login():
    """Redirect to GitHub OAuth login"""
    client_id = settings.GITHUB_CLIENT_ID if settings else ''
    if not client_id:
        return success_response(data={"url": "#"}, message="GitHub Client ID not configured")
    url = f"https://github.com/login/oauth/authorize?client_id={client_id}"
    return success_response(data={"url": url}, message="GitHub login URL generated")

@router.get("/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback"""
    if not code:
        raise BadRequestException("Authorization code is missing")
    # Placeholder – real token exchange and user upsert would happen here.
    return success_response(data={"token": "JWT_TOKEN_PLACEHOLDER"}, message="Authentication successful")
```
- **Exports**: `router` – mounted by the main application under the `/api/auth` prefix (the mounting path is defined in `main.py`).
- **Dependencies**: `settings`, `success_response`, `BadRequestException`, `get_db`.

### 2.4 Application Entry Point (`src/main.py`)
```python
app = FastAPI(
    title="Documentation Consistency Enforcer API",
    description="AI-powered documentation synchronization system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware – only added when `settings.CORS_ORIGINS` is non‑empty.
# GZip compression for payloads > 1 KB.

# Routers are imported from src.api (auth, repositories, webhooks, documentation, metrics)
# and registered with `app.include_router` within the file (code omitted for brevity).
```
- **Exports**: `app` – the FastAPI instance used by `uvicorn` or any ASGI server.
- **Side‑effects**: Middleware registration, router inclusion, logging configuration.

### 2.5 Alembic Migration Environment (`alembic/env.py`)
- Sets up logging, inserts the project root into `sys.path` so `src.core.config` can be imported.
- Retrieves `settings.DATABASE_URL` and passes it to Alembic's `context.configure` for offline/online migrations.
- Uses `Base.metadata` (from `src.models`) as the target metadata for autogeneration.

## 3. Logic Flow
1. **Process start** – `uvicorn backend/src/main.py` (or `python -m src.main`) imports `src.core.config.Settings` which loads environment variables and validates them.
2. **FastAPI app creation** – `main.py` builds `app`, attaches CORS (if any) and GZip middleware, then includes API routers.
3. **Request handling** – When a client calls `/api/auth/login/github`, FastAPI routes the request to `github_login` in `src/api/auth.py`. The endpoint uses `settings` to construct the OAuth URL and returns a standardized success payload (`success_response`).
4. **OAuth callback** – `/api/auth/callback` validates the `code` query parameter, raises `BadRequestException` on missing values, and (in a full implementation) would exchange the code for a token, create or update a `User` record via the injected DB session.
5. **Background workers** – Workers (`src/workers/orchestrator.py`, `pr_creator.py`, `webhook_processor.py`) import the same `settings` and share the Redis client (`src.core.redis_client`). The `GradientAgentClient` is used by orchestration logic to invoke the external AI service, with responses cached in Redis to minimise cost and latency.
6. **Database migrations** – Alembic commands (`alembic upgrade head`) import the same configuration, read `settings.DATABASE_URL`, and apply schema changes defined in `alembic/versions/` (e.g., the initial migration that creates `agent_invocations` and `users` tables).
7. **Error handling & responses** – All API endpoints raise custom exceptions from `src.core.exceptions` which are intercepted by FastAPI exception handlers (registered elsewhere) to produce uniform JSON error payloads via `src.core.responses.error_response`.

## 4. Dependencies
| Module | Depends on | Purpose |
|--------|------------|---------|
| **src/core/config.py** | `pydantic_settings`, `dotenv`, `os` | Centralised, validated environment configuration. |
| **src/agents/client.py** | `settings`, `redis_client`, `httpx`, `logging` | Wrapper around the Gradient AI HTTP API with Redis caching. |
| **src/api/auth.py** | `settings`, `src.core.database.get_db`, `src.core.responses.success_response`, `src.core.exceptions.BadRequestException` | Public OAuth endpoints. |
| **src/main.py** | `settings`, `src.api.*` routers, `fastapi` middleware, `src.core.exceptions`, `src.core.responses` | FastAPI application bootstrap. |
| **alembic/env.py** | `src.core.config.settings`, `src.models.Base` | Migration environment – provides DB URL and ORM metadata. |
| **workers/** | `settings`, `redis_client`, `GradientAgentClient`, database models | Asynchronous processing of webhooks, PR creation, and orchestration. |
| **requirements.txt** | – | Lists external libraries (`fastapi`, `sqlalchemy`, `alembic`, `redis`, `httpx`, etc.). |

## 5. Quick Reference
- **FastAPI app** – `backend/src/main.py` → `app`
- **Auth router** – `backend/src/api/auth.py` → `router`
- **Gradient client** – `backend/src/agents/client.py` → `GradientAgentClient`
- **Settings object** – `backend/src/core/config.py` → `settings`
- **Redis cache** – `backend/src/core/redis_client.py` (used by the agent client and workers)
- **Database models** – `backend/src/models/*.py` (e.g., `agent_invocation.py`, `user.py`)
- **Migrations** – `backend/alembic/versions/*.py`

---
*Generated by the Documentation Consistency Enforcer Sub‑Module Architect.*