"""
Documentation update tracking endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.documentation_update import DocumentationUpdate
from src.core.responses import success_response
from src.core.exceptions import NotFoundException, BadRequestException, InternalServerError
from src.schemas.documentation import DocumentationUpdateResponse
from src.schemas.base import StandardResponse
from typing import List
import uuid

router = APIRouter()

@router.get("/", response_model=StandardResponse[List[DocumentationUpdateResponse]])
async def list_updates(db: Session = Depends(get_db)):
    """List all documentation updates"""
    updates = db.query(DocumentationUpdate).order_by(DocumentationUpdate.created_at.desc()).all()
    return success_response(data=updates, message="Documentation updates retrieved successfully")

@router.delete("/all")
async def delete_all_updates(db: Session = Depends(get_db)):
    """Delete all documentation updates"""
    try:
        count = db.query(DocumentationUpdate).delete()
        db.commit()
        return success_response(message=f"Deleted {count} documentation updates", data={"deleted_count": count})
    except Exception as e:
        db.rollback()
        raise InternalServerError(f"Failed to delete updates: {str(e)}")

@router.get("/{update_id}", response_model=StandardResponse[DocumentationUpdateResponse])
async def get_update_details(update_id: str, db: Session = Depends(get_db)):
    """Get details for a specific documentation update"""
    update = db.query(DocumentationUpdate).filter(DocumentationUpdate.id == update_id).first()
    if not update:
        raise NotFoundException(f"Documentation update with ID {update_id} not found")
    return success_response(data=update, message="Documentation update details retrieved successfully")

@router.delete("/{update_id}")
async def delete_update(update_id: str, db: Session = Depends(get_db)):
    """Delete a specific documentation update"""
    try:
        update_uuid = uuid.UUID(update_id)
    except ValueError:
        raise BadRequestException("Invalid update ID format")

    update = db.query(DocumentationUpdate).filter(DocumentationUpdate.id == update_uuid).first()
    if not update:
        raise NotFoundException(f"Documentation update with ID {update_id} not found")

    try:
        db.delete(update)
        db.commit()
        return success_response(message="Documentation update deleted successfully", data={"id": update_id})
    except Exception as e:
        db.rollback()
        raise InternalServerError(f"Failed to delete update: {str(e)}")
