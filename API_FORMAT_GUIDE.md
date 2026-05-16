# 📦 `backend/src/agents` – Agent Integration Module

## 1. Module Identity
The **agents** package encapsulates the logic required to communicate with external AI agents (currently DigitalOcean Gradient AI). It provides a thin, reusable client that handles:
- Configuration loading (agent URL & access key) from environment variables.
- Request preparation, including authentication headers.
- Prompt‑level caching using Redis to minimise latency and external costs.
- Asynchronous HTTP invocation of the remote agent API.

> **Note**: At present the module only contains a client for the Gradient AI agent, but the structure allows adding additional agent clients or helper utilities.

---
## 2. Interface Contract
### `GradientAgentClient`
| Member | Type | Description |
|--------|------|-------------|
| `agent_url: str` | URL of the Gradient AI service (from `settings.GRADIENT_AGENT_URL`). |
| `access_key: str` | Bearer token used for authentication (from `settings.GRADIENT_ACCESS_KEY`). |
| `headers: dict` | HTTP headers injected into every request (Authorization & Content‑Type). |

#### Public Methods
```python
class GradientAgentClient:
    def __init__(self) -> None:
        """Create a client instance.
        It reads configuration from :class:`src.core.config.Settings`.
        """

    async def invoke(
        self,
        prompt: str,
        role: str,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> Dict[str, Any]:
        """Send a prompt to the Gradient agent and obtain the response.

        Workflow:
        1. Compute a deterministic SHA‑256 hash of the *prompt*.
        2. Build a Redis cache key that incorporates the agent URL, role and prompt hash.
        3. Attempt to fetch a cached JSON payload via ``redis_client.get_cache``.
        4. If a cache hit occurs, the cached response is returned immediately.
        5. On a miss, an HTTP ``POST`` is sent to ``{agent_url}/api`` (endpoint truncated in the source).
        6. The JSON body includes the supplied ``prompt``, ``role`` and optional parameters.
        7. The response is stored in Redis for **1 hour** (caching policy defined in the client code) before being returned.

        Parameters
        ----------
        prompt: str
            The raw text to be processed by the AI agent.
        role: str
            Logical role name that groups prompts (e.g., "summarizer", "code‑generator").
        max_tokens: int | None, optional
            Maximum number of tokens the model may generate.
        temperature: float | None, optional
            Sampling temperature controlling randomness.
        """
```

---
## 3. Logic Flow Within the Folder
```mermaid
flowchart TD
    A[GradientAgentClient.__init__] --> B[Load Settings]
    B --> C[Set agent_url & access_key]
    C --> D[Prepare default headers]
    D --> E[GradientAgentClient.invoke]
    E --> F[Compute prompt_hash (SHA‑256)]
    F --> G[Create Redis cache key]
    G --> H{Cache hit?}
    H -- Yes --> I[Return cached response]
    H -- No --> J[Build HTTP request payload]
    J --> K[httpx.AsyncClient POST to {agent_url}/api]
    K --> L[Parse JSON response]
    L --> M[Store response in Redis (TTL 1h)]
    M --> N[Return fresh response]
```

* The **only** direct interaction with other modules is through:
  - `src.core.config.settings` for environment‑derived configuration.
  - `src.core.redis_client.redis_client` for cache operations.
  - The third‑party library `httpx` for asynchronous HTTP calls.

---
## 4. Dependencies
| Dependency | Category | Reason |
|------------|----------|--------|
| `src.core.config.Settings` | Internal project module | Provides `GRADIENT_AGENT_URL` and `GRADIENT_ACCESS_KEY`.
| `src.core.redis_client.redis_client` | Internal project module | Centralised Redis wrapper exposing `get_cache` (and implicitly `set_cache`).
| `httpx` | External library | Async HTTP client used to call the remote Gradient endpoint.
| `json`, `logging`, `time`, `hashlib`, `typing` | Python std‑lib | Utility functions for payload handling, logging, hashing, and type hints.
| `pydantic_settings` (via `Settings`) | External library | Environment variable validation (indirect dependency).

---
## 5. Extending the Module
*To add a new external agent*:
1. Create a new client class (e.g., `AnotherAgentClient`) mirroring the structure of `GradientAgentClient`.
2. Re‑use the same caching pattern via `redis_client` for consistency.
3. Export the new client in `backend/src/agents/__init__.py` so that higher‑level services can import it seamlessly.

---
### Confidence Score
The analysis is based on the provided source snippets (`client.py`) and surrounding project structure. All identified functions and interactions are present in the visible code; however, the actual request body and response handling in `invoke` are truncated in the sample, so the description of those steps is inferred from typical patterns.
