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
