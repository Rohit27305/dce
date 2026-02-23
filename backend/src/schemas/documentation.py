from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum

class UpdateStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    MERGED = "merged"
    FAILED = "failed"

class DocumentationUpdateResponse(BaseModel):
    id: UUID
    repository_id: UUID
    trigger_commit_sha: str
    trigger_commit_message: Optional[str]
    trigger_author: Optional[str]
    pr_number: Optional[int]
    pr_url: Optional[str]
    pr_branch: Optional[str]
    affected_files: List[str]
    changes_summary: Optional[str]
    confidence_score: int
    status: UpdateStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
