"""
Webhook receiver for GitHub events.
"""

from fastapi import APIRouter, Header, Request
from src.core.redis_client import redis_client, WEBHOOK_QUEUE
from src.core.responses import success_response
from src.core.exceptions import BadRequestException
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/github")
async def receive_github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None),
    x_github_event: str = Header(None)
):
    """Receive and queue GitHub webhooks"""
    try:
        payload = await request.json()
    except Exception:
        raise BadRequestException("Invalid JSON payload")
        
    # Logic to verify signature
    
    if x_github_event == "push":
        event_data = {
            "event_type": x_github_event,
            "repository": payload.get("repository", {}),
            "head_commit": payload.get("head_commit"),
            "commits": payload.get("commits", [])
        }
        redis_client.enqueue(WEBHOOK_QUEUE, event_data)
        return success_response(message="Event queued successfully")
    
    return success_response(message=f"Event '{x_github_event}' ignored")
