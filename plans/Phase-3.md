# Phase 3: Docker + Infrastructure

## Overview

Add reproducible deployment with Docker Compose, a Makefile for common commands, and a root `.env.example` for environment documentation.

---

## Step 1: Create `.env.example` (root)

```env
# ==========================================
# CAD-Glaucoma Environment Configuration
# ==========================================
# Copy this file to .env and fill in values.

# Flask
FLASK_SECRET_KEY=change-me-to-a-random-string
FLASK_ENV=development

# Database
DB_HOST=db
DB_NAME=cad_glaucoma_app
DB_USER=root
DB_PASSWORD=glaucoma_dev_password

# Session (set true in production with HTTPS)
SESSION_COOKIE_SECURE=false
```

---

## Step 2: Create `Dockerfile.backend`

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

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0"]
```

Key decisions:
- `python:3.12-slim` — matches the `.venv-linux` Python version
- `libgl1-mesa-glx` and `libglib2.0-0` — required by OpenCV (`cv2`)
- Model files (`model/*.h5`) are included via `COPY backend/ .`
- Upload directories created at build time

---

## Step 3: Create `Dockerfile.frontend`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Key decisions:
- Multi-stage build: Node for build, nginx for serving
- `npm ci` for reproducible installs from lockfile
- Requires `frontend/nginx.conf` (created in Step 4)

---

## Step 4: Create `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Flask backend
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy uploaded images to Flask backend
    location /uploads/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
    }
}
```

Key decisions:
- `/api/` and `/uploads/` proxied to the `backend` service (Docker Compose service name)
- SPA fallback via `try_files` — all non-file routes serve `index.html`

---

## Step 5: Create `docker-compose.yml`

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
      FLASK_SECRET_KEY: ${FLASK_SECRET_KEY:-dev-secret-key}
      FLASK_ENV: ${FLASK_ENV:-development}
      DB_HOST: db
      DB_NAME: ${DB_NAME:-cad_glaucoma_app}
      DB_USER: root
      DB_PASSWORD: ${DB_PASSWORD:-glaucoma_dev_password}
      SESSION_COOKIE_SECURE: "false"
    volumes:
      - upload_data:/app/uploads
    ports:
      - "5000:5000"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  db_data:
  upload_data:
```

Key decisions:
- MariaDB 11 — compatible with the existing SQL dump
- SQL dump auto-loaded via `/docker-entrypoint-initdb.d/init.sql`
- `upload_data` volume persists patient images across container restarts
- Backend waits for DB health check before starting
- Frontend on port 80, backend on port 5000, DB on 3306

---

## Step 6: Create `Makefile`

```makefile
.PHONY: dev dev-backend dev-frontend build up down clean setup

# Development
dev:
	@echo "Starting frontend dev server..."
	cd frontend && npm run dev & \
	cd backend && source .venv-linux/bin/activate && flask run

dev-backend:
	cd backend && source .venv-linux/bin/activate && flask run

dev-frontend:
	cd frontend && npm run dev

# Docker
up:
	docker compose up -d

down:
	docker compose down

# Build
build:
	cd frontend && npm run build

# Setup
setup:
	cd backend && python3 -m venv .venv-linux && source .venv-linux/bin/activate && pip install -r requirements.txt
	cd frontend && npm install

# Clean
clean:
	rm -rf frontend/dist
	rm -rf backend/__pycache__ backend/app/__pycache__ backend/app/routes/__pycache__ backend/app/services/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
```

Key decisions:
- `dev` runs both servers concurrently
- `setup` creates venv and installs all dependencies
- `clean` removes build artifacts and Python cache

---

## Step 7: Update `.gitignore` (root)

Add Docker-related ignores:

```
# Docker
*.tar
```

Add to existing sections — no other changes needed since `.env` is already ignored.

---

## Step 8: Update `AGENTS.md`

Add a new section after "Developer Commands":

```markdown
## Docker Commands
```bash
# Start all services
make up

# Stop all services
make down

# Rebuild and start
docker compose up -d --build
```
```

---

## Verification Checklist

After completing all steps:

- [ ] `docker compose up -d` starts all three services
- [ ] Database initializes with `cad_glaucoma_app.sql`
- [ ] Backend connects to database and starts on port 5000
- [ ] Frontend serves SPA on port 80
- [ ] `/api/upload` works through nginx proxy
- [ ] `/uploads/<path>` serves images through nginx proxy
- [ ] `make dev` starts both dev servers
- [ ] `make build` produces `frontend/dist/`
- [ ] `make clean` removes all build artifacts
- [ ] `.env.example` documents all required variables
