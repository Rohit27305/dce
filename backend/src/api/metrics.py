"""
Analytics and metrics endpoints.
"""

from fastapi import APIRouter
from src.core.responses import success_response

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_metrics():
    """Get high-level metrics for the dashboard"""
    # Mock data for now
    data = {
        "active_repositories": 12,
        "prs_created_30d": 45,
        "acceptance_rate": 88,
        "avg_confidence": 92
    }
    return success_response(data=data, message="Dashboard metrics retrieved successfully")
