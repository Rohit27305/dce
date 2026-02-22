"""
Documentation update tracking endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.documentation_update import DocumentationUpdate

router = APIRouter()

@router.get("/")
async def list_updates(db: Session = Depends(get_db)):
    """List all documentation updates"""
    return db.query(DocumentationUpdate).all()

@router.get("/{id}")
async def get_update_details(id: str, db: Session = Depends(get_db)):
    """Get details for a specific documentation update"""
    return db.query(DocumentationUpdate).filter(DocumentationUpdate.id == id).first()
