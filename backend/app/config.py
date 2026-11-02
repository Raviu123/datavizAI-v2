from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache
from typing import List, Optional, Union
import json
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # App
    APP_NAME: str = "DataViz AI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # API
    API_V1_PREFIX: str = "/api/v1"

    # CORS / Access Origins
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ORIGINS: Optional[Union[List[str], str]] = None
    FRONTEND_URL: Optional[str] = None
    CORS_ORIGIN_REGEX: Optional[str] = None
    CORS_ALLOW_CREDENTIALS: bool = True

    @field_validator("ALLOWED_ORIGINS", "CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, (list, tuple, set)):
            return [str(item).strip() for item in v if str(item).strip()]
        return v

    @property
    def cors_origins(self) -> List[str]:
        origins: List[str] = []
        if isinstance(self.ALLOWED_ORIGINS, list):
            origins.extend(self.ALLOWED_ORIGINS)
        elif isinstance(self.ALLOWED_ORIGINS, str) and self.ALLOWED_ORIGINS.strip():
            origins.append(self.ALLOWED_ORIGINS.strip())

        if self.CORS_ORIGINS:
            if isinstance(self.CORS_ORIGINS, list):
                origins.extend(self.CORS_ORIGINS)
            elif isinstance(self.CORS_ORIGINS, str) and self.CORS_ORIGINS.strip():
                origins.append(self.CORS_ORIGINS.strip())

        if self.FRONTEND_URL:
            trimmed = self.FRONTEND_URL.strip()
            if trimmed and trimmed not in origins:
                origins.append(trimmed)

        # De-duplicate while preserving order, and normalize trailing slashes
        unique_origins: List[str] = []
        for origin in origins:
            cleaned = origin.strip().rstrip("/") if origin != "*" else origin
            if cleaned and cleaned not in unique_origins:
                unique_origins.append(cleaned)

        return unique_origins

    # Database (PostgreSQL via Docker Compose)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "datavizai"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/datavizai"

    # Storage
    STORAGE_BACKEND: str = "local"
    LOCAL_STORAGE_PATH: str = "./storage"

    # AI / LLM
    LLM_PROVIDER: str = "openrouter"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "nvidia/nemotron-3-ultra-550b-a55b:free"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # Security
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
