"""
GitHub OAuth and authentication endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.core.config import settings
from src.core.responses import success_response
from src.core.exceptions import BadRequestException

router = APIRouter()

@router.get("/login/github")
async def github_login():
    """Redirect to GitHub OAuth login"""
    client_id = settings.GITHUB_CLIENT_ID if settings else ''
    if not client_id:
         return success_response(data={"url": "#"}, message="GitHub Client ID not configured")
         
    url = f"https://github.com/login/oauth/authorize?client_id={client_id}"
    return success_response(data={"url": url}, message="GitHub login URL generated")

@router.get("/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback"""
    if not code:
        raise BadRequestException("Authorization code is missing")
        
    # Logic to exchange code for token and create/update user
    # This is a placeholder for the actual implementation
    return success_response(data={"token": "JWT_TOKEN_PLACEHOLDER"}, message="Authentication successful")
