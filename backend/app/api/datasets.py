from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.schemas.dataset import DatasetResponse, DatasetListResponse
import uuid

router = APIRouter()


@router.get("", response_model=DatasetListResponse)
async def list_datasets():
    """List all datasets."""
    return DatasetListResponse(datasets=[], total=0)


@router.post("", response_model=DatasetResponse, status_code=201)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a dataset file (CSV, Excel, JSON, Parquet)."""
    # Placeholder: real implementation in services/datasets/ingestion.py
    return DatasetResponse(
        id=str(uuid.uuid4()),
        name=file.filename or "unnamed",
        status="processing",
        row_count=0,
        column_count=0,
    )


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: str):
    """Get dataset details."""
    raise HTTPException(status_code=404, detail="Dataset not found")


@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(dataset_id: str):
    """Delete a dataset."""
    pass
