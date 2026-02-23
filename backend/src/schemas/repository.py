from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class RepositoryBase(BaseModel):
    full_name: str
    owner: str
    name: str
    default_branch: str = "main"

class RepositoryCreate(BaseModel):
    github_repo_id: int
    full_name: str
    owner: str
    name: str
    default_branch: Optional[str] = "main"

class RepositoryFetchMetadata(BaseModel):
    url: str

class RepositoryResponse(RepositoryBase):
    id: UUID
    github_repo_id: int
    enabled: bool
    created_at: datetime
    updated_at: datetime
    total_prs_created: int
    total_prs_merged: int
    total_prs_rejected: int
    average_confidence_score: int

    class Config:
        from_attributes = True

class RepositorySyncTriggerResponse(BaseModel):
    repository: str
    status: str = "triggered"
