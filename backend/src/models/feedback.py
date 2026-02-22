"""
Agent feedback model for learning and improvement.
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from src.core.database import Base

class AgentFeedback(Base):
    """Human feedback on agent actions"""
    
    __tablename__ = "agent_feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invocation_id = Column(UUID(as_uuid=True), ForeignKey("agent_invocations.id"))
    pr_id = Column(String)  # GitHub PR reference
    feedback_type = Column(String(20)) # e.g., 'approved', 'rejected', 'modified'
    human_edits = Column(Text)
    rejection_reason = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
