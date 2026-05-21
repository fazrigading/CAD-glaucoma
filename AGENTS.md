# AGENTS.md — CAD-glaucoma

## Architecture
- **Backend**: Flask app with app factory (`backend/app/__init__.py`). TensorFlow 2.21.0 U-Net model for glaucoma detection from fundus images. Serves both API and SPA in production.
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS v4 + DaisyUI (`frontend/`).
- **Database**: MySQL/MariaDB, DB `cad_glaucoma_app`, user `root`, password `""` (empty).
- **Vite dev server** (port 5173) proxies `/api` → `http://localhost:5000`.

## Developer Commands
```bash
# Frontend dev server (port 5173)
cd frontend && npm run dev

# Backend (port 5000) — must run from backend/ dir
cd backend && source .venv-linux/bin/activate && flask run   # Linux
cd backend && .venv-win/Scripts/flask run                     # Windows

# Alternative: run backend directly
cd backend && source .venv-linux/bin/activate && python run.py  # Linux
cd backend && .venv-win/Scripts/python run.py                   # Windows

# Frontend build (outputs to frontend/dist/)
cd frontend && npm run build

# Frontend lint
cd frontend && npm run lint
```

## Setup
- **Backend venv**: `cd backend && python -m venv .venv-linux && source .venv-linux/bin/activate && pip install -r requirements.txt`
  - Requires Python 3.12+ (TensorFlow 2.21.0). Windows: use `.venv-win/`.
- **Frontend**: `cd frontend && npm install`
- **Database**: Import `database/cad_glaucoma_app.sql` into MySQL/MariaDB.
- **Model files**: `backend/model/unet_model_aug.h5` (primary) and `unet_model_ori.h5` — must exist for predictions to work.
- **Environment**: Copy `backend/.env.example` to `backend/.env` and set `FLASK_SECRET_KEY`.

## Key Paths
- `backend/app/__init__.py` — `create_app()` factory, registers all blueprints
- `backend/app/config.py` — DevConfig / ProdConfig with env var loading
- `backend/app/db.py` — centralized `get_db_connection()` using app config
- `backend/app/routes/` — auth, upload, history, polygon, static (SPA serving)
- `backend/app/services/ml.py` — U-Net inference with **cached model** (loaded once at startup)
- `backend/app/services/storage.py` — `clean_temp_files()` only removes `temp_*` files
- `backend/run.py` — Flask entry point
- `frontend/src/pages/` — Overview, Model, Correction, History, Login
- `frontend/src/components/correction/` — polygon annotation UI for doctor corrections

## Conventions & Gotchas
- **Auth**: MD5-hashed passwords (insecure, research project). Session-based with `supports_credentials=True`.
- **`@login_required` decorator** is defined in `app/routes/auth.py` — can be applied to any route.
- **No tests** exist in either backend or frontend.
- **Database passwords stored as MD5 hashes** — default password hash is `5d41402abc4b2a76b9719d911017c592` (MD5 of "hello").
- **Eye-side labels**: `"Kanan"` (right) / `"Kiri"` (left) — Indonesian.
- **Gender labels**: `"Laki-laki"` / `"Perempuan"` — Indonesian.
- **Glaucoma threshold**: `v_cdr > 0.5` → Glaucoma (defined in `Config.CDR_THRESHOLD`).
- **Model is cached** — `get_model()` in `services/ml.py` loads once, reused across requests.
- **Temp file cleanup** — `clean_temp_files()` only deletes files starting with `temp_`, not persisted patient images.
- **Path traversal protection** — `/uploads/<path>` validates filename doesn't escape upload directory.
- **File type validation** — only `.jpg`, `.jpeg`, `.png` accepted on upload.
- **Venv directories** — `.venv-linux/` (Linux) and `.venv-win/` (Windows) are gitignored.
