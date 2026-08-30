from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_dashboards():
    """List all dashboards."""
    return {"dashboards": [], "total": 0}


@router.post("", status_code=201)
async def create_dashboard(payload: dict):
    """Create a new dashboard."""
    return {"message": "Dashboard creation coming soon"}
