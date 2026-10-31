import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.core.logging import get_logger
from app.db.models import Base

logger = get_logger("app.db.session")


def get_resolved_database_url() -> str:
    """
    Returns an async-compatible database connection URL.
    - If DATABASE_URL is set to PostgreSQL (e.g. Neon, Render, Docker), adapts to postgresql+asyncpg://
    - If SQLite or unset, defaults to local embedded sqlite+aiosqlite:///storage/datavizai.db
    """
    raw_url = (settings.DATABASE_URL or "").strip()

    if not raw_url:
        os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
        db_path = os.path.join(settings.LOCAL_STORAGE_PATH, "datavizai.db").replace("\\", "/")
        return f"sqlite+aiosqlite:///{db_path}"

    # Handle standard Neon / Supabase / Render postgres URLs
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
        raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return raw_url


DATABASE_URL = get_resolved_database_url()

# Engine arguments
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initializes tables on startup."""
    global engine, AsyncSessionLocal
    try:
        os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"[Database] Initialized tables successfully with URL: {DATABASE_URL.split('@')[-1]}")
    except Exception as e:
        logger.error(f"[Database Init Error] {e}")
        # If PostgreSQL is not reachable locally, gracefully fall back to local SQLite
        if not DATABASE_URL.startswith("sqlite"):
            logger.warning("[Database Fallback] Falling back to local embedded SQLite...")
            os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
            db_path = os.path.join(settings.LOCAL_STORAGE_PATH, "datavizai.db").replace("\\", "/")
            sqlite_url = f"sqlite+aiosqlite:///{db_path}"
            engine = create_async_engine(sqlite_url, echo=False, connect_args={"check_same_thread": False})
            AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("[Database] Local SQLite fallback database ready.")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for obtaining an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for standalone async functions/background tasks."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
