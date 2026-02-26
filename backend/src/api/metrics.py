"""
Analytics and metrics endpoints.
Computes real values from the database.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.core.database import get_db
from src.core.responses import success_response
from src.models.repository import Repository
from src.models.documentation_update import DocumentationUpdate

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Get high-level metrics for the dashboard — computed from real DB data"""

    active_repositories = db.query(Repository).filter(Repository.enabled == True).count()

    total_prs = db.query(func.sum(Repository.total_prs_created)).scalar() or 0

    total_merged = db.query(func.sum(Repository.total_prs_merged)).scalar() or 0
    acceptance_rate = round((total_merged / total_prs * 100) if total_prs > 0 else 0)

    avg_conf_row = db.query(func.avg(DocumentationUpdate.confidence_score)).scalar()
    avg_confidence = round(avg_conf_row) if avg_conf_row else 0

    data = {
        "active_repositories": active_repositories,
        "prs_created_30d": total_prs,
        "acceptance_rate": acceptance_rate,
        "avg_confidence": avg_confidence,
    }
    return success_response(data=data, message="Dashboard metrics retrieved successfully")
