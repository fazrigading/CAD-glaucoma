# Phase 6 — SPA Serving & Health Route

**Goal:** Serve the React SPA statically from FastAPI (replacing the Flask SPA routes) and rewrite the health check endpoint.

**Effort:** Small (~15 minutes)

---

## 6.1 SPA Static Serving

### Current Flask Approach

The Flask app has an explicit route for each SPA page:

```python
@static_bp.route("/", methods=["GET"])
@static_bp.route("/correction", methods=["GET"])
@static_bp.route("/history", methods=["GET"])
@static_bp.route("/model", methods=["GET"])
@static_bp.route("/login", methods=["GET"])
```

### FastAPI Approach

FastAPI's `StaticFiles` with `html=True` automatically serves `index.html` for any unmatched path — this is the SPA fallback behavior. No need for individual routes.

```python
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# In main.py, inside create_app():
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="spa")
```

**How it works:**
1. Requests to `/`, `/history`, `/login`, etc. that don't match any API route will be looked up in `frontend/dist/`
2. If the exact file doesn't exist, `index.html` is served (thanks to `html=True`)
3. The React app handles client-side routing from there
4. API requests (`/api/*`) are caught by routers before the static mount (order matters — register API routers **before** the static mount)

**Critical — route order in `main.py`:**

```python
# 1. API routers (registered first, take priority)
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(history_router)
app.include_router(polygon_router)
app.include_router(health_router)

# 2. Uploaded file serving (if using StaticFiles mount)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_folder)), name="uploads")

# 3. SPA static files (last — catch-all fallback)
if settings.is_production:
    frontend_dist = get_frontend_dist_path()
    if frontend_dist.exists():
        app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="spa")
```

### Remove `backend/app/routes/static.py`

Delete this file entirely. Its functionality is replaced by the `StaticFiles` mount.

---

## 6.2 Health Check — `backend/app/routes/health.py`

### Flask Version

```python
@health_bp.route("/api/health", methods=["GET"])
def health_check():
    status = {"status": "ok", "database": "unknown"}
    connection = get_db_connection()
    if connection and connection.is_connected():
        status["database"] = "connected"
        connection.close()
    else:
        status["database"] = "disconnected"
        status["status"] = "degraded"
    return jsonify(status), 200 if status["status"] == "ok" else 503
```

### FastAPI Version

```python
from fastapi import APIRouter, Depends
from asyncmy import Connection

from app.db import get_db

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "ok", "framework": "fastapi"}


@router.get("/health/db")
async def health_check_db(db: Connection = Depends(get_db)):
    try:
        async with db.cursor() as cursor:
            await cursor.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception:
        return {"status": "degraded", "database": "disconnected"}
```

Two separate endpoints (`/api/health` for a lightweight check, `/api/health/db` for a full DB check) allow load balancers to ping the API without consuming a database connection.

---

## 6.3 What to Verify

1. `GET /api/health` returns `{"status": "ok", "framework": "fastapi"}` (200)
2. `GET /api/health/db` returns `{"status": "ok", "database": "connected"}` when DB is up
3. All SPA routes (`/`, `/login`, `/history`, `/model`, `/correction`) return the React app's `index.html` in production
4. API routes still work after static files are mounted
5. Unknown routes (e.g., `/nonexistent`) fall back to SPA's `index.html`
