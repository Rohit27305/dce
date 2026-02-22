"""
Agent invocation model for monitoring and learning.
"""

from sqlalchemy import Column, String, DateTime, JSON, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from src.core.database import Base

class AgentInvocation(Base):
    """Tracking of AI agent invocations"""
    
    __tablename__ = "agent_invocations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(String, nullable=False)
    role = Column(String, nullable=False)
    prompt_hash = Column(String(64))
    response_json = Column(JSON)
    latency_ms = Column(Integer)
    confidence_score = Column(Numeric(3, 2))
    status = Column(String(20))
    error_message = Column(Text if 'Text' in globals() else String) # Text is better for error messages
    created_at = Column(DateTime, default=datetime.utcnow)

from sqlalchemy import Text # Ensure Text is imported
