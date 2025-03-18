import os
import secrets
from typing import List, Union, Optional, Dict, Any

from pydantic import AnyHttpUrl, BaseSettings, PostgresDsn, validator


class Settings(BaseSettings):
    """Application settings."""
    
    # API settings
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Project settings
    PROJECT_NAME: str = "Intelligent Vulnerability Detection and Prioritization"
    PROJECT_DESCRIPTION: str = "An intelligent system for vulnerability detection and prioritization"
    VERSION: str = "1.0.0"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database settings
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "intellivulnscan")
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None
    
    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # Redis settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    
    # Celery settings
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    
    # Scanner settings
    TRIVY_PATH: str = os.getenv("TRIVY_PATH", "trivy")
    OPENVAS_HOST: str = os.getenv("OPENVAS_HOST", "localhost")
    OPENVAS_PORT: int = int(os.getenv("OPENVAS_PORT", "9390"))
    OPENVAS_USER: str = os.getenv("OPENVAS_USER", "admin")
    OPENVAS_PASSWORD: str = os.getenv("OPENVAS_PASSWORD", "admin")
    DEPENDENCY_CHECK_PATH: str = os.getenv("DEPENDENCY_CHECK_PATH", "dependency-check")
    
    # ML settings
    ML_MODEL_PATH: str = os.getenv("ML_MODEL_PATH", "models")
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings() 