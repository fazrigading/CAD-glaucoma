# Phase 8 — Docker & Deployment Configuration

**Goal:** Update the Docker configuration to run the FastAPI app with Uvicorn instead of Flask, and optionally simplify the service architecture by serving the SPA from FastAPI directly.

**Effort:** Small (~30 minutes)

---

## 8.1 Dockerfile Changes

### `Dockerfile.backend`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN mkdir -p uploads/raw uploads/mask uploads/annot

# Copy frontend dist for SPA serving
COPY frontend/dist /app/../frontend/dist

ENV APP_ENV=production

EXPOSE 5000

# Changed from: CMD ["flask", "run", "--host=0.0.0.0"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
```

**Key changes:**
- `FLASK_APP` / `FLASK_ENV` replaced with `APP_ENV`
- `CMD` uses `uvicorn` instead of `flask run`
- Added `COPY frontend/dist` so FastAPI can serve the SPA statically
- `--port 5000` keeps backward compatibility with nginx proxy config

If using `gunicorn` with uvicorn workers for production:

```dockerfile
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:5000"]
```

### `Dockerfile.frontend`

No changes needed if keeping the nginx frontend. If eliminating the frontend service entirely (recommended — FastAPI serves the SPA), this file becomes unnecessary.

---

## 8.2 Docker Compose Changes

### Option A: No nginx (FastAPI serves SPA) — Recommended

```yaml
services:
  db:
    image: mariadb:11
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-glaucoma_dev_password}
      MYSQL_DATABASE: ${DB_NAME:-cad_glaucoma_app}
    volumes:
      - db_data:/var/lib/mysql
      - ./database/cad_glaucoma_app.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      APP_SECRET_KEY: ${APP_SECRET_KEY:-dev-secret-key}
      APP_ENV: production
      DB_HOST: db
      DB_NAME: ${DB_NAME:-cad_glaucoma_app}
      DB_USER: root
      DB_PASSWORD: ${DB_PASSWORD:-glaucoma_dev_password}
    volumes:
      - upload_data:/app/uploads
    ports:
      - "5000:5000"
    depends_on:
      db:
        condition: service_healthy

volumes:
  db_data:
  upload_data:
```

**Differences from current compose:**
- Removed `frontend` service entirely
- Backend serves both API and SPA on port 5000
- `FLASK_SECRET_KEY` → `APP_SECRET_KEY`, `FLASK_ENV` → `APP_ENV`
- Removed `SESSION_COOKIE_SECURE` (no longer needed with JWT)

### Option B: Keep nginx (separate frontend service)

If you prefer to keep the nginx frontend for production CDN/proxy benefits:

- Frontend service unchanged
- Backend changes are the same as Option A (env vars + CMD)
- nginx `proxy_pass` still points to `http://backend:5000` — no change needed

If you do keep nginx, update `Dockerfile.frontend` to remove the `COPY backend/...` and `RUN mkdir -p` lines specific to Flask (there are none — the frontend Dockerfile is already clean).

---

## 8.3 Environment Variables

### `backend/.env.example`

```ini
# Application
APP_SECRET_KEY=change-me-to-random-string
APP_ENV=development

# Database
DB_HOST=localhost
DB_NAME=cad_glaucoma_app
DB_USER=root
DB_PASSWORD=
```

### `.env.example` (project root, for Docker Compose)

```ini
# Application
APP_SECRET_KEY=change-me-to-a-random-string
APP_ENV=production

# Database
DB_HOST=db
DB_NAME=cad_glaucoma_app
DB_USER=root
DB_PASSWORD=glaucoma_dev_password
```

---

## 8.4 Makefile Updates

```makefile
# Replace flask run with uvicorn
dev-backend:
	cd backend && source .venv-linux/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 5000

# Optionally add uvicorn reload for development
dev:
	@echo "Starting frontend dev server..."
	cd frontend && npm run dev & \
	cd backend && source .venv-linux/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

---

## 8.5 nginx.conf (if keeping frontend service)

No changes needed. The nginx config already proxies `/api/` and `/uploads/` to `http://backend:5000`, which is still the backend's port.

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:5000;  # unchanged
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://backend:5000;  # unchanged
        proxy_set_header Host $host;
    }
}
```

---

## 8.6 Production Considerations

### Running Uvicorn in Production

For production, use `gunicorn` with uvicorn workers (already included via `uvicorn[standard]`):

```dockerfile
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--workers", "4", "--bind", "0.0.0.0:5000", "app.main:app"]
```

### Concurrency Strategy

| Component | Concurrency Model |
|---|---|
| Uvicorn workers | 4 workers for 4 CPU cores |
| DB connections | Pool of 10 connections, shared across workers (each worker has its own pool) |
| ML model | One model instance per worker (global `_model` per process) |
| Thread pool | Default Python thread pool (`concurrent.futures.ThreadPoolExecutor`) |

### Health Checks for Docker

Production health check for the backend service:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
  interval: 30s
  timeout: 5s
  retries: 3
```

---

## 8.7 What to Verify

1. `docker compose build --no-cache backend` succeeds
2. `docker compose up -d` starts all services without errors
3. `curl http://localhost:5000/api/health` returns 200
4. `curl http://localhost:5000/api/health/db` returns `{"status": "ok", "database": "connected"}`
5. The SPA is accessible at `http://localhost:5000/` (serving `index.html`)
6. API requests through the SPA work (login, upload, history)
7. If keeping nginx: `http://localhost/` serves the SPA and proxies API correctly
