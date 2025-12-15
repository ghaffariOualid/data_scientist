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
    port: int = 8001

    # Database settings
    database_url: str = Field(default="sqlite:///./data.db", env="DATABASE_URL")

    # CORS settings
    cors_origins: list[str] = ["*"]

    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    # AI settings (from env)
    openrouter_api_key: Optional[str] = Field(default=None, env="OPENROUTER_API_KEY")
    llm_model: str = Field(default="mistralai/mistral-7b-instruct:free", env="LLM_MODEL")

    # CrewAI settings
    crewai_tracing_enabled: bool = Field(default=False, env="CREWAI_TRACING_ENABLED")

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()