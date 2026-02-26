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
    user = db.query(User).filter(User.github_username == "Rohit").first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            github_id="rohit_id",
            github_username="Rohit",
            github_access_token="ghp_rohit_token",
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
    """Fetch repository metadata from GitHub URL for onboarding.
    Works for both public and private repos (if GITHUB_TOKEN has access)."""
    repository_url = payload.url
    if not repository_url:
        raise BadRequestException("GitHub URL is required")
    
    parsed_info = github_service.parse_github_url(repository_url)
    if not parsed_info:
        raise BadRequestException("Invalid GitHub URL format")
    
    github_details = await github_service.get_repo_details(parsed_info["owner"], parsed_info["repo"])
    
    # Fetch branches in parallel
    branches = await github_service.list_branches(parsed_info["owner"], parsed_info["repo"])
    
    return success_response(data={
        "github_repo_id": github_details.get("id"),
        "full_name": github_details.get("full_name"),
        "owner": github_details.get("owner", {}).get("login"),
        "name": github_details.get("name"),
        "default_branch": github_details.get("default_branch"),
        "description": github_details.get("description"),
        "stargazers_count": github_details.get("stargazers_count"),
        "private": github_details.get("private", False),
        "branches": branches,
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
        default_branch=repo_data.default_branch or "main",
        is_private=repo_data.is_private or False
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
    """Trigger documentation analysis for a repository — folder-by-folder"""
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
    code_exts = ('.py', '.ts', '.js', '.go', '.java', '.rs', '.rb', '.tsx', '.jsx', '.c', '.cpp', '.h', '.cs', '.php', '.swift', '.kt')

    doc_files = [f for f in file_tree if any(k in f.lower() for k in doc_priority)][:20]
    code_files = [f for f in file_tree if f.endswith(code_exts) and f not in doc_files][:50]

    # Fetch content of docs AND key code files so the AI has real source to reference
    key_contents: dict = {}

    # Docs first
    for path in doc_files[:5]:
        content = await github_service.get_file_content_text(
            repository.owner, repository.name, path, repository.default_branch
        )
        if content:
            key_contents[path] = content[:3000]

    # Then prioritize code files: entry points, configs, then others
    priority_patterns = ['main.', 'app.', 'index.', 'server.', 'setup.', 'manage.', 'package.json', 'requirements.txt',
                         'Cargo.toml', 'go.mod', 'pom.xml', 'Makefile', 'Dockerfile', 'pyproject.toml']
    config_files = [f for f in file_tree if any(p in f.lower() for p in priority_patterns)]

    # Fetch priority files first
    for path in config_files[:5]:
        if path not in key_contents:
            content = await github_service.get_file_content_text(
                repository.owner, repository.name, path, repository.default_branch
            )
            if content:
                key_contents[path] = content[:2000]

    # Then sample code files from different folders for diversity
    seen_folders: set = set()
    for path in code_files:
        folder = "/".join(path.split("/")[:-1]) or "(root)"
        if folder not in seen_folders and path not in key_contents:
            content = await github_service.get_file_content_text(
                repository.owner, repository.name, path, repository.default_branch
            )
            if content:
                key_contents[path] = content[:2000]
                seen_folders.add(folder)
            if len(key_contents) >= 15:
                break

    sync_task = {
        "repository_id": str(repository.id),
        "change_event": {
            "type": "manual_trigger",
            "timestamp": "now",
            "repository": repository.full_name,
            "branch": repository.default_branch,
            "description": f"Full documentation analysis for {repository.full_name}.",
            "summary": f"Analyze {repository.full_name} code structure and generate accurate documentation.",
            "author": "System",
            "repo_file_tree": file_tree[:120],
            "doc_files": doc_files,
            "code_files": code_files[:40],
            "key_file_contents": key_contents,
        }
    }

    try:
        is_enqueued = redis_client.enqueue(IMPACT_ANALYSIS_QUEUE, sync_task)
        if not is_enqueued:
            raise InternalServerError("Failed to enqueue analysis task")
    except Exception as e:
        raise InternalServerError(f"Queue error: {str(e)}") from e

    return success_response(data={"repository": repository.full_name}, message="Documentation analysis triggered")

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
