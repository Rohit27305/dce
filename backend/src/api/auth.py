"""
GitHub OAuth and authentication endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.core.config import settings

router = APIRouter()

@router.get("/login/github")
async def github_login():
    """Redirect to GitHub OAuth login"""
    return {"url": f"https://github.com/login/oauth/authorize?client_id={settings.GITHUB_CLIENT_ID if settings else ''}"}

@router.get("/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback"""
    # Logic to exchange code for token and create/update user
    return {"status": "authenticated", "token": "JWT_TOKEN_PLACEHOLDER"}
