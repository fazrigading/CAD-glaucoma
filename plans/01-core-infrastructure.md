# Phase 1 — Core Infrastructure Rewrite

**Goal:** Replace the Flask app factory with a FastAPI application, set up async database connectivity, and configure CORS.

**Effort:** Medium (~1–2 hours)

---

## 1.1 Configuration — `backend/app/config.py`

Replace the Flask `Config` class hierarchy with a Pydantic `BaseSettings` model.

```python
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    app_secret_key: str = "dev-secret-key-change-me"
    app_env: str = "development"

    db_host: str = "localhost"
    db_name: str = "cad_glaucoma_app"
    db_user: str = "root"
    db_password: str = ""

    cdr_threshold: float = 0.5
    allowed_image_extensions: set[str] = {".jpg", ".jpeg", ".png"}

    @property
    def upload_folder(self) -> Path:
        return Path(__file__).parent.parent.parent / "uploads"

    @property
    def raw_folder(self) -> Path:
        return self.upload_folder / "raw"

    @property
    def mask_folder(self) -> Path:
        return self.upload_folder / "mask"

    @property
    def annot_folder(self) -> Path:
        return self.upload_folder / "annot"

    @property
    def model_path(self) -> Path:
        return Path(__file__).parent.parent.parent / "model" / "unet_model_aug.h5"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    model_config = {"env_file": ".env", "case_sensitive": False}

settings = Settings()  # Singleton
```

**Key differences from current Flask config:**
- Auto-reads from `.env` file and environment variables
- Properties instead of pre-computed paths (avoids issues at import time)
- `os.path.join` replaced with `pathlib.Path`
- Single `Settings()` instance used app-wide (no more `current_app.config["KEY"]`)

---

## 1.2 App Factory — `backend/app/main.py`

Replace `backend/app/__init__.py` with a FastAPI application with lifespan.

```python
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db import init_db_pool, close_db_pool
from app.services.ml import get_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    # 1. Create upload directories
    for folder in [settings.raw_folder, settings.mask_folder, settings.annot_folder]:
        folder.mkdir(parents=True, exist_ok=True)

    # 2. Initialize async DB connection pool
    await init_db_pool()

    # 3. Preload ML model into app state
    app.state.model = get_model(str(settings.model_path))

    yield

    # --- Shutdown ---
    await close_db_pool()


app = FastAPI(
    title="CAD-Glaucoma API",
    lifespan=lifespan,
)


# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5000",
        "http://localhost:5000",
    ],
    allow_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    expose_headers=["Content-Type", "Authorization"],
)


# --- Routers (to be registered in later phases) ---
# from app.routes.auth import router as auth_router
# from app.routes.upload import router as upload_router
# from app.routes.history import router as history_router
# from app.routes.polygon import router as polygon_router
# from app.routes.health import router as health_router

# app.include_router(auth_router)
# app.include_router(upload_router)
# app.include_router(history_router)
# app.include_router(polygon_router)
# app.include_router(health_router)


# --- SPA static files (Phase 6) ---
# if settings.is_production:
#     frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
#     if frontend_dist.exists():
#         app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="spa")
```

---

## 1.3 Async Database — `backend/app/db.py`

Replace synchronous `get_db_connection()` with an async connection pool.

```python
import asyncmy
from asyncmy.pool import Pool

from app.config import settings

_pool: Pool | None = None


async def init_db_pool():
    global _pool
    _pool = await asyncmy.create_pool(
        host=settings.db_host,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        minsize=1,
        maxsize=10,
        autocommit=True,
    )


async def close_db_pool():
    global _pool
    if _pool:
        _pool.close()
        await _pool.wait_closed()
        _pool = None


async def get_db():
    """FastAPI dependency that yields an asyncmy connection."""
    if _pool is None:
        raise RuntimeError("Database pool not initialized")
    async with _pool.acquire() as conn:
        yield conn
```

**Usage in routes:**
```python
from fastapi import Depends
from asyncmy import Connection

@app.get("/api/something")
async def get_something(db: Connection = Depends(get_db)):
    async with db.cursor() as cursor:
        await cursor.execute("SELECT ...")
        result = await cursor.fetchall()
    return result
```

**How existing queries map:**
- `cursor.execute(query, params)` → `await cursor.execute(query, params)`
- `cursor.fetchone()` → `await cursor.fetchone()`
- `cursor.fetchall()` → `await cursor.fetchall()`
- `connection.close()` → handled by context manager (no explicit close needed)
- `cursor.close()` → handled by context manager
- No need for `connection.commit()` if `autocommit=True` is set on pool creation (use transactions explicitly when needed)

---

## 1.4 CORS — `backend/app/extensions.py`

Can be deleted entirely — CORS is configured inline in `main.py` via `CORSMiddleware`. If you prefer a separate function:

```python
def setup_cors(app):
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(...)
```

But inline registration in `main.py` is cleaner.

---

## 1.5 What to Verify

1. `python run.py` starts uvicorn successfully
2. `GET /docs` shows the interactive OpenAPI docs
3. `GET /openapi.json` returns a valid OpenAPI schema
4. DB pool initializes (check logs)
5. Model loads successfully on startup (check logs)
