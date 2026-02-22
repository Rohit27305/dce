"""
User model for authentication and authorization.
"""

from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from src.core.database import Base

class User(Base):
    """User account model"""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # GitHub OAuth data
    github_id = Column(String, unique=True, nullable=False, index=True)
    github_username = Column(String, nullable=False)
    github_email = Column(String)
    github_access_token = Column(String, nullable=False)  # Encrypted in production
    
    # Profile
    full_name = Column(String)
    avatar_url = Column(String)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # Subscription/plan
    plan = Column(String, default="free")  # free, pro, team, enterprise
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime)
    
    # Relationships
    repositories = relationship("Repository", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.github_username}>"
