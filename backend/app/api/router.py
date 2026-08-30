from fastapi import APIRouter
from app.api import health, datasets, data_sources, chat, dashboards

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
api_router.include_router(data_sources.router, prefix="/data-sources", tags=["data-sources"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(dashboards.router, prefix="/dashboards", tags=["dashboards"])
