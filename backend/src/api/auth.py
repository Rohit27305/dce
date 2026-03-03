from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.core.config import settings
from src.core.responses import success_response
from src.core.exceptions import BadRequestException, UnauthorizedException
from src.core.auth import create_access_token

router = APIRouter()

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Simple login with hardcoded credentials"""
    if form_data.username != settings.ADMIN_USERNAME or form_data.password != settings.ADMIN_PASSWORD:
        raise UnauthorizedException("Incorrect username or password")
    
    access_token = create_access_token(data={"sub": form_data.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": form_data.username
    }

@router.get("/login/github")
async def github_login():
    """Redirect to GitHub OAuth login (Placeholder)"""
    client_id = settings.GITHUB_CLIENT_ID if settings else ''
    if not client_id:
         return success_response(data={"url": "#"}, message="GitHub Client ID not configured")
         
    url = f"https://github.com/login/oauth/authorize?client_id={client_id}"
    return success_response(data={"url": url}, message="GitHub login URL generated")

@router.get("/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback (Placeholder)"""
    if not code:
        raise BadRequestException("Authorization code is missing")
        
    return success_response(data={"token": "JWT_TOKEN_PLACEHOLDER"}, message="Authentication successful")
