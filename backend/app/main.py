from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.core.logging import setup_logging
from app.db.session import init_db
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_db()
    yield
    # Shutdown
    print(f"Shutting down {settings.APP_NAME}")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-powered data intelligence and visualization platform",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # CORS middleware - origins configured completely via environment variables
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.CORS_ORIGIN_REGEX,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
