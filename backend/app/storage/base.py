from abc import ABC, abstractmethod
from typing import BinaryIO


class StorageBackend(ABC):
    """Abstract base for storage backends."""

    @abstractmethod
    async def save(self, key: str, data: BinaryIO) -> str:
        """Save data and return the storage path/key."""
        pass

    @abstractmethod
    async def get(self, key: str) -> bytes:
        """Retrieve data by key."""
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete data by key."""
        pass

    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if a key exists."""
        pass
