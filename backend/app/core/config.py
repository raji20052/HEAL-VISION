"""Application Configuration and Environment Settings."""

import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Wound Healing Monitor"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "healvision-super-secret-jwt-key-for-research-monitoring-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for ease of testing
    
    # Database
    # Defaults to local SQLite for instant zero-configuration running; can be overridden by DATABASE_URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'healvision.db'))}"
    )
    
    # Storage
    STORAGE_DIR: str = os.getenv(
        "STORAGE_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'storage'))
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    DEMO_MODE: bool = True

    class Config:
        case_sensitive = True


settings = Settings()
