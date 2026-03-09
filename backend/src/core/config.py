"""
Application configuration.
Loads settings from environment variables with validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Optional, Any, Union
import os
from dotenv import load_dotenv

# Load .env file explicitly
load_dotenv()

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "Documentation Consistency Enforcer"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "b111ae2654e33e5e759ee69d44e1d5dce0062d1adc11a59da0a6645d775ea97c")

    # Security
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "Rohit")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Rohit@2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
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
    
    # CORS (Include production domains in defaults)
    CORS_ORIGINS: Any = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://dce.rohitverma.social,https://dce.rohitverma.social").split(",")

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
