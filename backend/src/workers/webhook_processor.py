"""
Webhook processor worker.
Consumes webhook events from Redis queue and triggers agent orchestration.
"""

import asyncio
import logging
from datetime import datetime
from src.core.database import SessionLocal
from src.core.redis_client import redis_client, WEBHOOK_QUEUE, IMPACT_ANALYSIS_QUEUE
from src.agents.invoker import agent_invoker
from src.models.repository import Repository
from src.integrations.github.client import github_client

logger = logging.getLogger(__name__)

class WebhookProcessor:
    """Processes webhook events from the queue"""
    
    def __init__(self):
        self.running = True
    
    async def start(self):
        logger.info("Webhook processor started")
        while self.running:
            try:
                event = redis_client.dequeue(WEBHOOK_QUEUE, timeout=5)
                if event:
                    await self.process_event(event)
                else:
                    await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Error in webhook processor: {e}", exc_info=True)
                await asyncio.sleep(5)
    
    async def process_event(self, event: dict):
        db = SessionLocal()
        try:
            repo = db.query(Repository).filter(
                Repository.full_name == event['repository']['full_name']
            ).first()
            
            if not repo or not repo.enabled:
                return
            
            # Fetch diff using a token (in real app, use installation token or user token)
            # For this scaffold, we'll assume token is available in event or config
            token = event.get('token', 'PLACEHOLDER_TOKEN')
            
            diff = await github_client.get_commit_diff(
                repo.owner, repo.name, event['head_commit']['id'], token
            )
            event['code_diff'] = diff
            
            watcher_result = await agent_invoker.invoke_as_watcher(event)
            
            if watcher_result['requires_documentation_update']:
                for change_event in watcher_result['change_events']:
                    impact_data = {
                        "repository_id": str(repo.id),
                        "change_event": change_event,
                        "trigger_commit": event['head_commit'],
                        "token": token
                    }
                    redis_client.enqueue(IMPACT_ANALYSIS_QUEUE, impact_data)
        finally:
            db.close()

if __name__ == "__main__":
    processor = WebhookProcessor()
    asyncio.run(processor.start())
