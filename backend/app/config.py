import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # API settings
    app_name: str = "AI Data Analysis API"
    version: str = "1.0.0"
    description: str = "API pour l'analyse de données avec IA utilisant CrewAI et Groq"

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000

    # Database settings
    database_url: str = Field(default="sqlite:///./data.db", env="DATABASE_URL")

    # CORS settings
    cors_origins: list[str] = ["*"]

    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    # AI settings (from env)
    groq_api_key: Optional[str] = Field(default=None, env="GROQ_API_KEY")

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()