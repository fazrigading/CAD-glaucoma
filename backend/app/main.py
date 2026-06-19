from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db_pool, close_db_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    # 1. Create upload directories
    for folder in [settings.raw_folder, settings.mask_folder, settings.annot_folder]:
        folder.mkdir(parents=True, exist_ok=True)

    # 2. Initialize async DB connection pool
    await init_db_pool()

    # 3. Preload ML model into app state
    from app.services.ml import get_model
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


# --- Routers ---
from app.routes.auth import router as auth_router
from app.routes.upload import router as upload_router
from app.routes.history import router as history_router
from app.routes.polygon import router as polygon_router

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(history_router)
app.include_router(polygon_router)

# from app.routes.health import router as health_router
# app.include_router(health_router)
