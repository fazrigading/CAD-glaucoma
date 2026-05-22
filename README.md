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
├── backend/                 # Flask API + ML inference
│   ├── app/
│   │   ├── __init__.py      # App factory (create_app)
│   │   ├── config.py        # Dev/Prod configuration
│   │   ├── db.py            # Database connection pool
│   │   ├── extensions.py    # CORS setup
│   │   ├── routes/          # API endpoints (auth, upload, history, polygon)
│   │   └── services/        # Business logic (ML, visualization, storage)
│   ├── model/               # U-Net model weights (.h5)
│   ├── uploads/             # Patient fundus images (runtime)
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # Flask entry point
├── frontend/                # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/           # Overview, Model, Correction, History, Login
│   │   ├── components/      # Canvas annotation, forms, navbar
│   │   └── hooks/           # Auth, state management
│   └── vite.config.ts       # Dev server with /api proxy
└── database/                # MySQL/MariaDB schema
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Flask 3.1, TensorFlow 2.21, MySQL/MariaDB |
| **Frontend** | React 19, TypeScript, Vite 6, TailwindCSS 4, DaisyUI |
| **ML Model** | U-Net for optic disc/cup segmentation |
| **Python** | 3.12+ |

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- MySQL or MariaDB

### 1. Database Setup

```bash
sudo mysql -u root -e "CREATE DATABASE glaucoma_db;"
sudo mysql -u root glaucoma_db < database/cad_glaucoma_app.sql
```

### 2. Backend

```bash
cd backend

# Linux
python -m venv .venv-linux && source .venv-linux/bin/activate
# Windows
python -m venv .venv-win && .venv-win\Scripts\activate

pip install -r requirements.txt
cp .env.example .env   # Edit FLASK_SECRET_KEY

flask run
```

Backend runs on `http://localhost:5000`.

### 3. Frontend

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
| `/uploads/<path>` | GET | Serve uploaded images |

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

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_SECRET_KEY` | *(required)* | Session encryption key |
| `FLASK_ENV` | `development` | `development` or `production` |
| `DB_HOST` | `localhost` | Database host |
| `DB_NAME` | `cad_glaucoma_app` | Database name |
| `DB_USER` | `root` | Database user |
| `DB_PASSWORD` | *(empty)* | Database password |
| `SESSION_COOKIE_SECURE` | `false` | Set `true` in production with HTTPS |

## Security Notes

- Passwords are stored as MD5 hashes (research project, not production-ready)
- Session cookies use `HttpOnly` and `SameSite=Lax`
- File uploads are validated for type (`.jpg`, `.jpeg`, `.png` only)
- Path traversal protection on `/uploads/<path>` endpoints


## License

This project is licensed under the [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License](LICENSE).

**You are free to:**
- **Share** — copy and redistribute the material in any medium or format

**Under the following terms:**
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.
- **NoDerivatives** — If you remix, transform, or build upon the material, you may not distribute the modified material.
