"""
Analytics and metrics endpoints.
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_metrics():
    """Get high-level metrics for the dashboard"""
    return {
        "active_repositories": 12,
        "prs_created_30d": 45,
        "acceptance_rate": 88,
        "avg_confidence": 92
    }
