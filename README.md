# Computer-Aided Detection System for Glaucoma Diagnosis

A Computer-Aided Detection (CAD) system for glaucoma diagnosis based on optic nerve head analysis in fundus images. This research project uses a U-Net deep learning model to segment the optic disc and cup, calculate the Cup-to-Disc Ratio (CDR), and assist ophthalmologists in glaucoma detection.

## Research Team

- **Prof. Dr. Ir. Anindita Septiarini, S.T., M.Cs., IPU.** - Project Leader
  - Writing – Original Draft, Conceptualization, Investigation, Methodology, Resources
- **Prof. Dr. Ir. Hamdani, S.T., M.Cs., IPM.** - Co-Investigator
  - Writing – Review & Editing, Funding Acquisition, Resources, Supervision, Validation
- **dr. Nur Khoma Fatmawati, Sp.M.** - Co-Investigator (Ophtalmologist, Project Partner from SMEC)
  - Formal Analysis, Supervision, Resources, Methodology, Validation 
- **Imam Muhammad Hakim, S.T., M.T.** - Back-end Developer & AI Engineer
  - Writing – Review & Editing, Data Curation, Methodology, Software, Investigation
- **Fazri Rahmad Nor Gading, S.Kom.** - Front-end Developer
  - Writing – Review & Editing, Project Administration, Investigation, Software, Visualization

**Previous Developers:**
- Bugi Sulistiyo, S.Kom.
  - Back-end Developer & AI Engineer:
    - Data Curation, Investigation, Methodology, Software 
- Eko Rahmat Darmawan, S.Kom.
  - Front-end Developer:
    - Investigation, Software, Visualization

**Supported by:** 
- Ministry of Higher Education, Science, and Technology of Indonesia _(Kemendikbud Ristekdikti)_
- Mulawarman University _(Universitas Mulawarman)_
- Sabang Merauke Eye Center (SMEC) Samarinda _(RS Mata SMEC)_

## Architecture

```
CAD-glaucoma/
├── backend/                 # FastAPI + ML inference
│   ├── app/
│   │   ├── main.py          # FastAPI app with lifespan, CORS, static mounts
│   │   ├── config.py        # Pydantic Settings (APP_* env vars)
│   │   ├── db.py            # Async DB connection pool (aiomysql)
│   │   ├── auth.py          # Session auth helpers
│   │   ├── routes/          # API endpoints (auth, upload, history, polygon, health)
│   │   ├── schemas/         # Pydantic request/response models
│   │   └── services/        # Business logic (ML inference, visualization, storage)
│   ├── model/               # U-Net model weights (.h5)
│   ├── uploads/             # Patient fundus images (runtime)
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # uvicorn entry point
├── frontend/                # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/           # Overview, Model, Correction, History, Login
│   │   ├── components/      # Canvas annotation, forms, navbar
│   │   └── hooks/           # Auth, state management
│   └── vite.config.ts       # Dev server with /api proxy
├── database/                # MySQL/MariaDB schema
├── docker-compose.yml       # MariaDB + backend services
├── Dockerfile.backend       # Production backend image
└── Dockerfile.frontend      # Production frontend image
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, TensorFlow 2.21, MySQL/MariaDB |
| **Frontend** | React 19, TypeScript, Vite 6, TailwindCSS 4, DaisyUI |
| **ML Model** | U-Net for optic disc/cup segmentation |
| **Python** | 3.12+ |

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- Docker & Docker Compose (for Docker setup)
- MySQL or MariaDB (for manual setup)

### Option A: Docker (Recommended)

Starts MariaDB and backend in containers. The database is auto-initialized from `database/cad_glaucoma_app.sql` on first run.

```bash
# Start all services (db + backend)
docker compose up -d

# Stop all services
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

Services: backend on `:5000`, db on `:3306`.

Then set up the frontend for development:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to the backend.

> **Note:** When using Docker, set `DB_HOST=localhost` and `DB_PASSWORD=glaucoma_dev_password` in `backend/.env` (the DB port 3306 is exposed to localhost).

### Option B: Manual Setup

#### 1. Database

```bash
# Start MariaDB/MySQL
sudo systemctl start mariadb   # Linux
# brew services start mariadb  # macOS

# Fix root auth (MariaDB uses unix_socket by default — apps can't connect with empty password)
# Set a password for root (replace 'your_password' with your chosen password):
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password'; FLUSH PRIVILEGES;"

# Create database and import schema
sudo mysql -u root -p -e "CREATE DATABASE cad_glaucoma_app;"
sudo mysql -u root -p cad_glaucoma_app < database/cad_glaucoma_app.sql
```

#### 2. Backend

```bash
cd backend
python -m venv .venv

source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

pip install -r requirements.txt
cp .env.example .env       # Edit APP_SECRET_KEY, DB_PASSWORD (must match the password set above)

uvicorn app.main:app --reload --port 5000
```

Backend runs on `http://localhost:5000`.

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to the backend.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contributor setup instructions, including how to download the required model files.

## Project Structure

### Backend Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload fundus image, run U-Net prediction |
| `/api/history` | GET | Get all prediction history |
| `/api/history/<id>` | GET/DELETE | Get or delete a prediction |
| `/api/save-polygon/<id>` | POST | Save doctor's polygon corrections |
| `/api/get-polygon/<id>` | GET | Retrieve saved polygon data |
| `/api/login` | POST | Doctor login |
| `/api/logout` | POST | Doctor logout |
| `/api/auth/check` | GET | Check authentication status |
| `/api/health` | GET | Health check |
| `/api/health/db` | GET | Database connectivity check |
| `/uploads/{path}` | GET | Serve uploaded images |

### Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Overview — project information |
| `/model` | Model testing — upload fundus image for prediction |
| `/correction` | Doctor correction — polygon annotation of disc/cup |
| `/history` | Prediction history — view, edit, delete past results |
| `/login` | Doctor authentication |

## How It Works

1. **Upload** — Doctor uploads a fundus image with patient metadata
2. **Predict** — U-Net model segments optic disc and cup
3. **Calculate** — CDR (Cup-to-Disc Ratio) computed from segmentation
4. **Diagnose** — `v_cdr > 0.5` → Glaucoma, otherwise Non-Glaucoma
5. **Correct** — Doctor can refine segmentation with polygon annotations
6. **Save** — Results stored in database with optional doctor attribution

## Environment Variables

| Variable | Manual Default | Docker Default | Description |
|----------|---------------|----------------|-------------|
| `APP_SECRET_KEY` | *(required)* | *(required)* | Session encryption key |
| `APP_ENV` | `development` | `production` | `development` or `production` |
| `DB_HOST` | `localhost` | `localhost` | Database host (`db` inside compose) |
| `DB_NAME` | `cad_glaucoma_app` | `cad_glaucoma_app` | Database name |
| `DB_USER` | `root` | `root` | Database user |
| `DB_PASSWORD` | *(empty)* | `glaucoma_dev_password` | Database password |

## Security Notes

- Passwords are stored as MD5 hashes (research project, not production-ready)
- Session cookies use `HttpOnly` and `SameSite=Lax`
- File uploads are validated for type (`.jpg`, `.jpeg`, `.png` only)
- Path traversal protection on `/uploads/{path}` endpoints

## Docker

```bash
docker compose up -d        # Start (db + backend)
docker compose down         # Stop
docker compose up -d --build  # Rebuild after code changes
```

Services: backend on `:5000`, db on `:3306`. In production the FastAPI backend also serves the frontend SPA from `frontend/dist/`.

> When connecting from the host (e.g., backend running locally against Docker DB), use `DB_HOST=localhost` and `DB_PASSWORD=glaucoma_dev_password`. Inside compose networking, the backend uses `DB_HOST=db`.

## Makefile

```bash
make setup        # Create venv + install backend/frontend deps
make dev          # Start both dev servers (frontend + backend)
make dev-backend  # Start backend only
make dev-frontend # Start frontend only
make build        # Build frontend for production
make up           # docker compose up -d
make down         # docker compose down
make clean        # Remove build artifacts + __pycache__
```


## License

This project is licensed under the [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License](LICENSE).

**You are free to:**
- **Share** — copy and redistribute the material in any medium or format

**Under the following terms:**
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.
- **NoDerivatives** — If you remix, transform, or build upon the material, you may not distribute the modified material.
