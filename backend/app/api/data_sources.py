from fastapi import APIRouter
from typing import List

router = APIRouter()


@router.get("")
async def list_data_sources():
    """List all connected data sources."""
    return {"data_sources": [], "total": 0}


@router.post("", status_code=201)
async def create_data_source(payload: dict):
    """Connect a new data source."""
    return {"message": "Data source creation coming soon"}
