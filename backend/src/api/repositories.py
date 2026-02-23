from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from src.core.database import get_db
from src.models.repository import Repository
from src.models.user import User
from src.core.redis_client import redis_client, IMPACT_ANALYSIS_QUEUE
from src.core.exceptions import BadRequestException, NotFoundException, InternalServerError
from src.core.responses import success_response
from src.services.github_service import github_service
from src.schemas.repository import (
    RepositoryResponse, 
    RepositoryCreate, 
    RepositoryFetchMetadata,
    RepositorySyncTriggerResponse
)
from src.schemas.base import StandardResponse

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

@router.get("/", response_model=StandardResponse[List[RepositoryResponse]])
async def get_all_repositories(db: Session = Depends(get_db)):
    """List all connected repositories"""
    repositories = db.query(Repository).all()
    return success_response(data=repositories, message="Repositories retrieved successfully")

@router.post("/fetch-metadata", response_model=StandardResponse[dict])
async def get_github_repository_info(payload: RepositoryFetchMetadata):
    """Fetch repository metadata from GitHub URL for onboarding"""
    repository_url = payload.url
    if not repository_url:
        raise BadRequestException("GitHub URL is required")
    
    parsed_info = github_service.parse_github_url(repository_url)
    if not parsed_info:
        raise BadRequestException("Invalid GitHub URL format")
    
    github_details = await github_service.get_repo_details(parsed_info["owner"], parsed_info["repo"])
    
    return success_response(data={
        "github_repo_id": github_details.get("id"),
        "full_name": github_details.get("full_name"),
        "owner": github_details.get("owner", {}).get("login"),
        "name": github_details.get("name"),
        "default_branch": github_details.get("default_branch"),
        "description": github_details.get("description"),
        "stargazers_count": github_details.get("stargazers_count")
    }, message="GitHub repository information retrieved successfully")

@router.post("/", response_model=StandardResponse[RepositoryResponse])
async def connect_new_repository(repo_data: RepositoryCreate, db: Session = Depends(get_db)):
    """Add a new repository for monitoring"""
    current_user = get_or_create_demo_user(db)
    
    # Check if exists
    existing_repo = db.query(Repository).filter(Repository.github_repo_id == repo_data.github_repo_id).first()
    if existing_repo:
        return success_response(data=existing_repo, message="Repository already connected")

    new_repository = Repository(
        id=uuid.uuid4(),
        user_id=current_user.id,
        github_repo_id=repo_data.github_repo_id,
        full_name=repo_data.full_name,
        owner=repo_data.owner,
        name=repo_data.name,
        default_branch=repo_data.default_branch or "main"
    )
    
    try:
        db.add(new_repository)
        db.commit()
        db.refresh(new_repository)
        return success_response(data=new_repository, message="Repository connected successfully")
    except Exception as e:
        db.rollback()
        raise InternalServerError(f"Failed to save repository connection: {str(e)}")

@router.post("/{repository_id}/analyze", response_model=StandardResponse[RepositorySyncTriggerResponse])
async def trigger_repository_sync(repository_id: str, db: Session = Depends(get_db)):
    """Trigger documentation synchronization analysis for a repository"""
    try:
        repository_uuid = uuid.UUID(repository_id)
    except ValueError:
        raise BadRequestException("Invalid repository ID format")

    repository = db.query(Repository).filter(Repository.id == repository_uuid).first()
    if not repository:
        raise NotFoundException("Repository not found")

    # Fetch real repo file tree from GitHub
    file_tree = await github_service.get_file_tree(
        repository.owner, repository.name, repository.default_branch
    )

    doc_priority = ['readme', 'contributing', 'changelog', 'license', 'docs/', 'doc/', '.md']
    code_exts = ('.py', '.ts', '.js', '.go', '.java', '.rs', '.rb', '.tsx', '.jsx')

    doc_files = [f for f in file_tree if any(k in f.lower() for k in doc_priority)][:20]
    code_files = [f for f in file_tree if f.endswith(code_exts) and f not in doc_files][:30]

    # Fetch actual content of top documentation files
    key_contents: dict = {}
    for path in doc_files[:5]:
        content = await github_service.get_file_content_text(
            repository.owner, repository.name, path, repository.default_branch
        )
        if content:
            key_contents[path] = content[:3000]

    sync_task = {
        "repository_id": str(repository.id),
        "change_event": {
            "type": "manual_trigger",
            "timestamp": "now",
            "repository": repository.full_name,
            "branch": repository.default_branch,
            "description": f"User requested full documentation sync for {repository.full_name}.",
            "summary": f"Analyze {repository.full_name} and update its documentation to be accurate and complete.",
            "author": "System",
            "repo_file_tree": file_tree[:80],
            "doc_files": doc_files,
            "code_files": code_files[:20],
            "key_file_contents": key_contents,
        }
    }

    try:
        is_enqueued = redis_client.enqueue(IMPACT_ANALYSIS_QUEUE, sync_task)
        if not is_enqueued:
            raise InternalServerError("Failed to enqueue sync task")
    except Exception as e:
        raise InternalServerError(f"Orchestrator communication error (Redis): {str(e)}") from e

    return success_response(data={"repository": repository.full_name}, message="Synchronization protocol triggered successfully")

@router.delete("/{repository_id}")
async def disconnect_repository(repository_id: str, db: Session = Depends(get_db)):
    """Diconnect and remove a repository from monitoring"""
    try:
        repository_uuid = uuid.UUID(repository_id)
    except ValueError:
        raise BadRequestException("Invalid repository ID format")

    repository = db.query(Repository).filter(Repository.id == repository_uuid).first()
    if not repository:
        raise NotFoundException("Repository not found")
        
    try:
        db.delete(repository)
        db.commit()
        return success_response(message="Repository disconnected successfully", data={"id": repository_id})
    except Exception as e:
        db.rollback()
        raise InternalServerError(f"Failed to disconnect repository: {str(e)}")
