import os
import aiofiles
from pathlib import Path
from typing import BinaryIO
from app.storage.base import StorageBackend
from app.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class LocalStorage(StorageBackend):
    """Local filesystem storage for development."""

    def __init__(self, base_path: str = None):
        self.base_path = Path(base_path or settings.LOCAL_STORAGE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _full_path(self, key: str) -> Path:
        return self.base_path / key

    async def save(self, key: str, data: BinaryIO) -> str:
        full_path = self._full_path(key)
        full_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(full_path, "wb") as f:
            content = data.read() if hasattr(data, "read") else data
            await f.write(content)
        logger.info(f"Saved file to {full_path}")
        return str(full_path)

    async def get(self, key: str) -> bytes:
        async with aiofiles.open(self._full_path(key), "rb") as f:
            return await f.read()

    async def delete(self, key: str) -> None:
        path = self._full_path(key)
        if path.exists():
            path.unlink()

    async def exists(self, key: str) -> bool:
        return self._full_path(key).exists()


# Default storage instance
storage = LocalStorage()
