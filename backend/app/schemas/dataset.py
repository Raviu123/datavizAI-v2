from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class DatasetStatus(str, Enum):
    uploading = "uploading"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class DatasetResponse(BaseModel):
    id: str
    name: str
    status: DatasetStatus
    row_count: int
    column_count: int
    file_size_bytes: Optional[int] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class DatasetListResponse(BaseModel):
    datasets: List[DatasetResponse]
    total: int
