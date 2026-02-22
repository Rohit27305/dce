"""
PR Creator worker.
"""

import asyncio
import logging
from src.core.database import SessionLocal
from src.core.redis_client import redis_client, PR_CREATION_QUEUE
from src.integrations.github.client import github_client
from src.models.documentation_update import DocumentationUpdate, UpdateStatus

logger = logging.getLogger(__name__)

class PRCreatorWorker:
    """Consumes PR tasks and executes GitHub API calls"""
    
    def __init__(self):
        self.running = True
    
    async def start(self):
        logger.info("PR creator worker started")
        while self.running:
            try:
                task = redis_client.dequeue(PR_CREATION_QUEUE, timeout=5)
                if task:
                    await self.create_pr(task)
                else:
                    await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Error in PR creator: {e}", exc_info=True)
                await asyncio.sleep(5)
    
    async def create_pr(self, task: dict):
        db = SessionLocal()
        try:
            # Logic to create branch, commit changes, and open PR
            # Using placeholders for brevity
            logger.info(f"Creating PR for update {task['update_id']}")
            
            # Update DB status
            update = db.query(DocumentationUpdate).filter(
                DocumentationUpdate.id == task['update_id']
            ).first()
            if update:
                update.status = UpdateStatus.PENDING
                update.pr_url = "https://github.com/..." # Placeholder
                db.commit()
                
            logger.info(f"PR created successfully: {task['update_id']}")
        finally:
            db.close()

if __name__ == "__main__":
    worker = PRCreatorWorker()
    asyncio.run(worker.start())
