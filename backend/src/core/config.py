"""
Application configuration.
Loads settings from environment variables with validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Optional, Any, Union
import os
from dotenv import load_dotenv

# Explicitly load .env if it exists
load_dotenv()

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "Documentation Consistency Enforcer"
    DEBUG: bool = False
    SECRET_KEY: str = "dev_secret_key_change_me_in_production"

    # Security
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/doc_enforcer"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # GitHub OAuth
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/api/auth/callback"
    GITHUB_WEBHOOK_SECRET: str = ""
    GITHUB_TOKEN: str = ""
    GITHUB_USERNAME: str = ""
    
    # DigitalOcean Gradient AI
    GRADIENT_ACCESS_KEY: str = ""
    GRADIENT_AGENT_URL: str = ""
    
    # CORS
    CORS_ORIGINS: Any = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v
    
    # Agent Configuration
    AGENT_MODEL: str = "claude-3-5-sonnet-20241022"
    AGENT_MAX_TOKENS: int = 4096
    AGENT_TEMPERATURE: float = 0.3
    
    # Thresholds
    MIN_CONFIDENCE_THRESHOLD: float = 0.7
    AUTO_MERGE_THRESHOLD: float = 0.95
    
    # Notifications
    SLACK_WEBHOOK_URL: str = ""
    SENDGRID_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=None, # Variables provided by Docker ENV
        case_sensitive=True,
        extra="ignore"
    )

# Global settings instance
settings = Settings()

def validate_config():
    """Validates that all required production settings are present"""
    if not settings.DEBUG:
        required = [
            "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", 
            "GRADIENT_ACCESS_KEY", "GRADIENT_AGENT_URL",
            "GITHUB_WEBHOOK_SECRET"
        ]
        missing = [f for f in required if not getattr(settings, f)]
        if missing:
            raise ValueError(f"Missing required production environment variables: {', '.join(missing)}")
