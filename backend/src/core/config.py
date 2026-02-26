"""
Application configuration.
Loads settings from environment variables with validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os
from dotenv import load_dotenv

# Explicitly load .env if it exists
load_dotenv()

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "Documentation Consistency Enforcer"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_change_me_in_production")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/doc_enforcer")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # GitHub OAuth
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI: str = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/callback")
    GITHUB_WEBHOOK_SECRET: str = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
    GITHUB_USERNAME: str = os.getenv("GITHUB_USERNAME", "")
    
    # DigitalOcean Gradient AI
    GRADIENT_ACCESS_KEY: str = os.getenv("GRADIENT_ACCESS_KEY", "")
    GRADIENT_AGENT_URL: str = os.getenv("GRADIENT_AGENT_URL", "")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yourdomain.com"
    ]
    
    # Agent Configuration
    AGENT_MODEL: str = os.getenv("AGENT_MODEL", "claude-3-5-sonnet-20241022")
    AGENT_MAX_TOKENS: int = int(os.getenv("AGENT_MAX_TOKENS", "4096"))
    AGENT_TEMPERATURE: float = float(os.getenv("AGENT_TEMPERATURE", "0.3"))
    
    # Thresholds
    MIN_CONFIDENCE_THRESHOLD: float = float(os.getenv("MIN_CONFIDENCE_THRESHOLD", "0.7"))
    AUTO_MERGE_THRESHOLD: float = float(os.getenv("AUTO_MERGE_THRESHOLD", "0.95"))
    
    # Notifications
    SLACK_WEBHOOK_URL: str = os.getenv("SLACK_WEBHOOK_URL", "")
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
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
