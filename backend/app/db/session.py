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


import json
from datetime import datetime

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

_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class _SessionProxy:
    """Callable proxy ensuring references imported prior to init_db() dispatch to active engine."""
    def __call__(self, **kwargs) -> AsyncSession:
        return _session_maker(**kwargs)


AsyncSessionLocal = _SessionProxy()


async def _seed_legacy_meta():
    """Migrates any existing datasets_meta.json entries into database if table is empty."""
    from app.db.models import DatasetModel
    from sqlalchemy import select
    try:
        meta_path = os.path.join(settings.LOCAL_STORAGE_PATH, "datasets_meta.json")
        if not os.path.exists(meta_path):
            return
        async with _session_maker() as session:
            res = await session.execute(select(DatasetModel).limit(1))
            if res.scalar_one_or_none() is not None:
                return  # Already populated
            with open(meta_path, "r") as f:
                data = json.load(f)
            for d_id, d in data.items():
                m = DatasetModel(
                    id=d_id,
                    name=d.get("name", "dataset.csv"),
                    file_path=d.get("file_path", ""),
                    size_bytes=d.get("size_bytes", 0),
                    total_rows=d.get("total_rows", 0),
                    total_columns=d.get("total_columns", 0),
                    status=d.get("status", "ready"),
                    profile=d.get("profile"),
                    preview_rows=d.get("preview_rows"),
                    ai_analysis=d.get("ai_analysis"),
                    created_at=datetime.utcnow()
                )
                session.add(m)
            await session.commit()
            logger.info(f"[Database] Migrated {len(data)} datasets from legacy datasets_meta.json.")
    except Exception as e:
        logger.warning(f"[Database Seed Warning] {e}")


async def init_db() -> None:
    """Initializes tables on startup."""
    global engine, _session_maker
    try:
        os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"[Database] Initialized tables successfully with URL: {DATABASE_URL.split('@')[-1]}")
        await _seed_legacy_meta()
    except Exception as e:
        logger.error(f"[Database Init Error] {e}")
        # If PostgreSQL is not reachable locally, gracefully fall back to local SQLite
        if not DATABASE_URL.startswith("sqlite"):
            logger.warning("[Database Fallback] Falling back to local embedded SQLite...")
            os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
            db_path = os.path.join(settings.LOCAL_STORAGE_PATH, "datavizai.db").replace("\\", "/")
            sqlite_url = f"sqlite+aiosqlite:///{db_path}"
            engine = create_async_engine(sqlite_url, echo=False, connect_args={"check_same_thread": False})
            _session_maker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("[Database] Local SQLite fallback database ready.")
            await _seed_legacy_meta()


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
