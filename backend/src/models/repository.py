"""
Repository model for tracking monitored GitHub repositories.
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from src.core.database import Base

class Repository(Base):
    """Monitored GitHub repository"""
    
    __tablename__ = "repositories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Owner reference
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # GitHub data
    github_repo_id = Column(Integer, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)  # e.g., "owner/repo"
    owner = Column(String, nullable=False)
    name = Column(String, nullable=False)
    default_branch = Column(String, default="main")
    is_private = Column(Boolean, default=False)
    
    # Monitoring settings
    enabled = Column(Boolean, default=True)
    
    # Configuration (stored as JSON)
    config = Column(JSON, default={
        "triggers": {
            "public_api_changes": True,
            "internal_api_changes": False,
            "config_file_changes": True
        },
        "generation": {
            "confidence_threshold": 0.7,
            "auto_merge_threshold": 0.95
        },
        "notifications": {
            "slack_enabled": False,
            "email_enabled": True
        }
    })
    
    # Statistics
    total_prs_created = Column(Integer, default=0)
    total_prs_merged = Column(Integer, default=0)
    total_prs_rejected = Column(Integer, default=0)
    average_confidence_score = Column(Integer, default=0)  # Stored as percentage (0-100)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_webhook_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="repositories")
    documentation_updates = relationship("DocumentationUpdate", back_populates="repository", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Repository {self.full_name}>"
