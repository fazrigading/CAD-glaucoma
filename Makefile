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
