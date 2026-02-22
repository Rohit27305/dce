"""
Documentation update model for tracking generated PRs.
"""

from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from src.core.database import Base

class UpdateStatus(enum.Enum):
    """Status of documentation update"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    MERGED = "merged"
    FAILED = "failed"

class DocumentationUpdate(Base):
    """Documentation update PR tracking"""
    
    __tablename__ = "documentation_updates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Repository reference
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False)
    
    # Triggering event
    trigger_commit_sha = Column(String, nullable=False)
    trigger_commit_message = Column(Text)
    trigger_author = Column(String)
    
    # GitHub PR data
    pr_number = Column(Integer)
    pr_url = Column(String)
    pr_branch = Column(String)
    
    # Documentation changes
    affected_files = Column(JSON, default=[])  # List of file paths
    changes_summary = Column(Text)  # Human-readable summary
    
    # AI metadata
    confidence_score = Column(Integer)  # 0-100
    agent_role = Column(String)  # Which agent generated this
    
    # Status
    status = Column(Enum(UpdateStatus), default=UpdateStatus.PENDING)
    
    # Review data
    reviewed_by = Column(String)
    reviewed_at = Column(DateTime)
    rejection_reason = Column(String)
    
    # Human edits (for learning)
    had_edits = Column(Boolean, default=False)
    edit_summary = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    merged_at = Column(DateTime)
    
    # Relationships
    repository = relationship("Repository", back_populates="documentation_updates")
    
    def __repr__(self):
        return f"<DocumentationUpdate {self.id} - {self.status.value}>"
