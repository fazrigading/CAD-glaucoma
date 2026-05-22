# Phase 0 — Project Scaffolding & Dependencies

**Goal:** Replace all Flask-specific dependencies with FastAPI equivalents and set up the project skeleton.

**Effort:** Small (~15 minutes)

---

## 0.1 Dependency Changes

### `backend/requirements.txt`

**Remove:**
```
flask>=3.1.0,<4.0
flask-cors>=5.0.0,<6.0
werkzeug>=3.1.0,<4.0
mysql-connector-python>=9.0.0,<10.0
```

**Add:**
```
fastapi>=0.115.0,<1.0
uvicorn[standard]>=0.34.0,<1.0
python-multipart>=0.0.18,<1.0       # Required for UploadFile
python-jose[cryptography]>=3.3.0,<4.0  # JWT creation/validation
pydantic-settings>=2.7.0,<3.0       # Type-safe config from env
asyncmy>=0.2.10,<1.0                # Async MySQL driver
aiomysql>=0.2.0,<1.0                # Connection pool helper for asyncmy
aiofiles>=24.1.0,<25.0              # Async file I/O (optional)
```

**Kept (unchanged):**
```
numpy>=1.26.4,<2.0
tensorflow>=2.16.0,<3.0
opencv-python>=4.10.0,<5.0
matplotlib>=3.9.0,<4.0
scikit-image>=0.24.0,<1.0
```

### Environment variables

Rename `FLASK_*` vars for clarity:

| Old (.env) | New (.env) | Notes |
|---|---|---|
| `FLASK_SECRET_KEY` | `APP_SECRET_KEY` | Also used as JWT signing key |
| `FLASK_ENV` | `APP_ENV` | `"development"` or `"production"` |
| `SESSION_COOKIE_SECURE` | *(remove)* | No longer relevant (JWT-based) |

Other vars (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) stay the same.

Update `backend/.env.example` to reflect the new names.

---

## 0.2 Directory Structure Changes

### New files to create

```
backend/app/
├── main.py              # FastAPI app creation (replaces __init__.py)
├── schemas/             # Pydantic request/response models
│   ├── __init__.py
│   ├── auth.py
│   ├── upload.py
│   ├── history.py
│   └── polygon.py
└── auth.py              # JWT helpers & get_current_user dependency
```

### Files to modify

| File | Action |
|---|---|
| `backend/app/__init__.py` | Delete or gut — logic moves to `main.py` |
| `backend/app/config.py` | Replace with `pydantic-settings` Pydantic model |
| `backend/app/db.py` | Replace sync with async pool |
| `backend/app/extensions.py` | Replace flask-cors with FastAPI middleware |
| `backend/run.py` | Replace with uvicorn entry point |
| `backend/.env.example` | Rename vars |

### Files to keep (no change needed)

```
backend/app/services/
├── __init__.py     (doesn't exist — create empty if needed)
├── cdr.py          (pure numpy — no changes)
├── ml.py           (TF — kept sync, wrapped in executor at call-site)
├── storage.py      (file ops — may add aiofiles wrapper)
└── visualization.py (OpenCV/Matplotlib — kept sync)
```

---

## 0.3 New Entry Point

### `backend/run.py`

```python
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=5000, reload=True)
```

---

## 0.4 What to Verify

1. `pip install -r requirements.txt` succeeds with new deps
2. `python run.py` starts uvicorn without import errors (app will fail at route registration until later phases, but the framework should boot)
3. `.env` variables are loadable via `pydantic-settings`
