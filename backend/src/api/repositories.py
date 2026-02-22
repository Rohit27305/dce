from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from src.core.database import get_db
from src.models.repository import Repository
from src.models.user import User
from src.core.redis_client import redis_client, IMPACT_ANALYSIS_QUEUE

router = APIRouter()

def get_or_create_demo_user(db: Session):
    user = db.query(User).filter(User.github_username == "demo_user").first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            github_id="demo_id",
            github_username="demo_user",
            github_access_token="demo_token",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.get("/")
async def list_repositories(db: Session = Depends(get_db)):
    """List monitored repositories"""
    repos = db.query(Repository).all()
    return repos

@router.post("/")
async def add_repository(repo_data: dict, db: Session = Depends(get_db)):
    """Add a new repository for monitoring"""
    user = get_or_create_demo_user(db)
    
    # Required fields check
    required = ["github_repo_id", "full_name", "owner", "name"]
    for field in required:
        if field not in repo_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

    # Check if exists
    existing = db.query(Repository).filter(Repository.github_repo_id == repo_data.get("github_repo_id")).first()
    if existing:
        return existing

    new_repo = Repository(
        id=uuid.uuid4(),
        user_id=user.id,
        github_repo_id=repo_data.get("github_repo_id"),
        full_name=repo_data.get("full_name"),
        owner=repo_data.get("owner"),
        name=repo_data.get("name"),
        default_branch=repo_data.get("default_branch", "main")
    )
    
    db.add(new_repo)
    db.commit()
    db.refresh(new_repo)
    return new_repo

@router.post("/{repo_id}/analyze")
async def analyze_repository(repo_id: str, db: Session = Depends(get_db)):
    """Trigger analysis for a repository"""
    try:
        repo_uuid = uuid.UUID(repo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid repository ID format")

    repo = db.query(Repository).filter(Repository.id == repo_uuid).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
        
    task = {
        "repository_id": str(repo.id),
        "change_event": {
            "type": "manual_trigger",
            "timestamp": "now",
            "description": "User requested full repository documentation sync.",
            "summary": "Updated Helm templates and core source code logic.",
            "author": "Rohit27305"
        }
    }
    
    success = redis_client.enqueue(IMPACT_ANALYSIS_QUEUE, task)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to enqueue analysis task")
        
    return {"status": "Analysis triggered", "repository": repo.full_name}
    
@router.delete("/{repo_id}")
async def delete_repository(repo_id: str, db: Session = Depends(get_db)):
    """Delete a repository"""
    try:
        repo_uuid = uuid.UUID(repo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid repository ID format")

    repo = db.query(Repository).filter(Repository.id == repo_uuid).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
        
    db.delete(repo)
    db.commit()
    return {"status": "Repository deleted", "id": repo_id}
