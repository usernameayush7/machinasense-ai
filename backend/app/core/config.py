"""Application configuration settings using pydantic-settings."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Global configuration settings for MachinaSense backend."""

    PROJECT_NAME: str = "MachinaSense Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS Origins for frontend integrations (Vite/React/Next.js default ports)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Telemetry streaming & buffer configuration
    DEFAULT_BUFFER_SIZE: int = 128  # rolling samples per machine
    DEFAULT_SAMPLE_RATE_HZ: float = 10.0  # simulated stream rate

    # Inference & Alert thresholds
    Z_SCORE_ALERT_THRESHOLD: float = 3.0  # 3-sigma anomaly rule
    PERSISTENCE_COUNT_FOR_ALERT: int = 3  # consecutive anomalous samples before triggering an alert

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
