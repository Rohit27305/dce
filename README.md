# Documentation Consistency Engine (DCE)

## Vision
DCE is an AI‑powered documentation orchestration platform that eliminates documentation drift in fast‑moving codebases. By continuously monitoring repository changes, analysing them with Gradient™ agents, and automatically generating pull‑requests, DCE keeps all technical artefacts—Markdown files, OpenAPI specs, and code comments—in sync with the source code.

The system is built for scale‑up environments where multiple repositories, private and public, require reliable, real‑time documentation updates without manual overhead.

---

## Architecture
The project follows a clear separation of concerns:

- **FastAPI backend** (`backend/src/main.py`) exposes HTTP endpoints, handles authentication, and routes requests to the appropriate service modules.
- **Redis** (`backend/src/core/redis_client.py`) provides a caching layer for agent responses and a lightweight message broker for background workers.
- **Background workers** (`backend/src/workers/`) run asynchronous tasks such as processing webhooks, orchestrating agent invocations, and creating documentation PRs.
- **Agents** (`backend/src/agents/`) contain the Gradient AI client and parsing logic that interact with the external Gradient platform.
- **GitHub integration** (`backend/src/integrations/github/`) communicates with the GitHub API to fetch repository data and open pull‑requests.
- **Frontend** (`frontend/`) is a React‑Vite single‑page application that visualises repository health, sync events, and dashboard analytics.

All components are containerised and wired together via Docker Compose, enabling reproducible local and production deployments.

---

## Key Components
| Directory | Responsibility |
|-----------|-----------------|
| `backend/` | Python service layer, Alembic migrations, Docker image, and environment configuration. |
| `backend/src/api/` | FastAPI routers for authentication (`auth.py`), documentation handling, metrics, repository management, and webhook endpoints. |
| `backend/src/agents/` | Gradient AI client (`client.py`) and helper modules (`invoker.py`, `parser.py`). |
| `backend/src/core/` | Central utilities: configuration (`config.py`), database session handling (`database.py`), custom exceptions, Redis client, and response models. |
| `backend/src/models/` | SQLAlchemy ORM models for agent invocations, users, repositories, documentation updates, and feedback. |
| `backend/src/schemas/` | Pydantic schemas that validate request/response payloads. |
| `backend/src/services/` | Higher‑level services such as the GitHub service and the knowledge‑graph builder. |
| `backend/src/workers/` | Asynchronous workers: `orchestrator.py` (schedules jobs), `pr_creator.py` (opens PRs), and `webhook_processor.py` (handles incoming GitHub events). |
| `frontend/` | React 18 + TypeScript UI, built with Vite, includes layout components, pages, and a modal utility. |
| `frontend/public/` | Static assets (e.g., Vite logo). |
| `frontend/src/components/` | Reusable UI elements (layout, modal). |
| `frontend/src/pages/` | Main application pages such as the Dashboard. |

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Language | Python 3.11+, TypeScript, HTML, CSS |
| Web Framework | FastAPI |
| ORM & Migrations | SQLAlchemy, Alembic |
| Settings Management | pydantic‑settings |
| Authentication | python‑jose, pass‑lib (bcrypt) |
| HTTP Client | httpx |
| Caching & Messaging | redis (redis‑client) |
| Async Workers | RQ/queues (via `backend/src/workers/`), asyncio |
| Frontend Framework | React 18, Vite, TypeScript |
| UI Libraries | Framer Motion, TanStack Query, Lucide Icons |
| Containerisation | Docker, Docker Compose |
| CI/CD Integration | GitHub webhooks, GitHub API |
| AI Platform | DigitalOcean Gradient AI (accessed through `GradientAgentClient`) |

---

## Flow of Operation
1. **Repository Change** – A push or pull‑request event triggers a GitHub webhook that is received by the FastAPI endpoint in `backend/src/api/webhooks.py`.
2. **Webhook Processing** – `backend/src/workers/webhook_processor.py` validates the payload and enqueues a job for the **Orchestrator**.
3. **Orchestration** – `backend/src/workers/orchestrator.py` determines which documentation artefacts are affected, resolves dependencies via the knowledge graph, and decides which agents to invoke.
4. **Agent Invocation** – `backend/src/agents/client.py` (via `GradientAgentClient`) sends the relevant code diff to the Gradient AI platform. Responses are cached in Redis (`redis_client.get_cache`) to avoid duplicate calls.
5. **Content Generation** – The AI response is parsed (`agents/parser.py`) into markdown diff patches.
6. **PR Creation** – `backend/src/workers/pr_creator.py` uses the GitHub service (`services/github_service.py`) to open a new branch, commit the generated documentation updates, and submit a pull‑request.
7. **Dashboard Update** – The frontend polls the backend metrics endpoint (`api/metrics.py`) to display the status of each sync event, confidence scores, and any migration instructions.

---

## Interaction
### API Endpoints (FastAPI)
- `GET /login/github` – Returns the GitHub OAuth URL (defined in `api/auth.py`).
- `GET /callback` – Handles the OAuth callback and issues a placeholder JWT token.
- `GET /api/docs` – Interactive Swagger UI for all available routes.
- Additional routers (documentation, repositories, metrics, webhooks) are mounted in `backend/src/main.py` once their modules are importable.

### CLI / Docker Commands
- **Local Development** – `docker-compose up --build` starts the backend, Redis, PostgreSQL, and the frontend UI.
- **Trigger Manual Sync** – Send a `POST` request to `/api/webhooks/github` with a standard GitHub `push` payload to start the documentation sync cycle.

---

## Deployment
1. **Clone the repository**
   ```bash
   git clone https://github.com/Rohit27305/dce.git
   cd dce
   ```
2. **Create environment files**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   Populate the variables (e.g., `DATABASE_URL`, `REDIS_URL`, `GITHUB_TOKEN`, `GRADIENT_ACCESS_KEY`).
3. **Start the stack**
   ```bash
   docker-compose up --build -d
   ```
   - Backend API: `http://localhost:8000/api/docs`
   - Dashboard UI: `http://localhost:3000`
4. **Run database migrations**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```
5. **Verify connectivity** – Ensure the frontend can reach the backend (CORS origins are read from `settings.CORS_ORIGINS`).
6. **Production considerations**
   - Use a managed PostgreSQL instance and a secure Redis deployment.
   - Supply a strong `SECRET_KEY` and enable `DEBUG=False`.
   - Set up GitHub webhook URL pointing to `<host>/api/webhooks/github` and configure the shared secret (`GITHUB_WEBHOOK_SECRET`).
   - Scale workers horizontally by increasing the replica count in the Docker Compose file or by deploying to Kubernetes.

---

*Documentation generated by the Documentation Consistency Engine (DCE) – keeping docs in lockstep with code.*