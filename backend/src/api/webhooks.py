"""
Webhook receiver for GitHub events.
"""

from fastapi import APIRouter, Header, Request, HTTPException
from src.core.redis_client import redis_client, WEBHOOK_QUEUE
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
    body = await request.body()
    # Logic to verify signature
    
    payload = await request.json()
    if x_github_event == "push":
        event_data = {
            "event_type": x_github_event,
            "repository": payload.get("repository", {}),
            "head_commit": payload.get("head_commit"),
            "commits": payload.get("commits", [])
        }
        redis_client.enqueue(WEBHOOK_QUEUE, event_data)
        return {"message": "Queued"}
    
    return {"message": "Ignored"}
