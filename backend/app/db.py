import asyncmy
from asyncmy.pool import Pool

from app.config import settings

_pool: Pool | None = None


async def init_db_pool():
    global _pool
    _pool = await asyncmy.create_pool(
        host=settings.db_host,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        minsize=1,
        maxsize=10,
        autocommit=True,
    )


async def close_db_pool():
    global _pool
    if _pool:
        _pool.close()
        await _pool.wait_closed()
        _pool = None


async def get_db():
    """FastAPI dependency that yields an asyncmy connection."""
    if _pool is None:
        raise RuntimeError("Database pool not initialized")
    async with _pool.acquire() as conn:
        yield conn
