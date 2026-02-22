"""
Agent orchestrator worker.
"""

import asyncio
import logging
from src.core.database import SessionLocal
from src.core.redis_client import redis_client, IMPACT_ANALYSIS_QUEUE, PR_CREATION_QUEUE
from src.agents.invoker import agent_invoker
from src.models.repository import Repository
from src.models.documentation_update import DocumentationUpdate, UpdateStatus
from src.integrations.github.client import github_client
from src.services.knowledge_graph import knowledge_graph_service
from src.core.config import settings
import uuid

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """Orchestrates the complete documentation update workflow"""
    
    def __init__(self):
        self.running = True
    
    async def start(self):
        logger.info("Agent orchestrator started")
        while self.running:
            try:
                task = redis_client.dequeue(IMPACT_ANALYSIS_QUEUE, timeout=5)
                if task:
                    await self.process_task(task)
                else:
                    await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Error in orchestrator: {e}", exc_info=True)
                await asyncio.sleep(5)
    
    async def process_task(self, task: dict):
        db = SessionLocal()
        try:
            repo = db.query(Repository).filter(Repository.id == task['repository_id']).first()
            if not repo: return
            
            token = task.get('token', 'PLACEHOLDER_TOKEN')
            knowledge_graph = knowledge_graph_service.get_mappings(repo.id)
            
            impact_result = await agent_invoker.invoke_as_impact_analyzer(
                task['change_event'], knowledge_graph
            )
            logger.info(f"Impact Result: {impact_result}")
            
            doc_updates = []
            if not impact_result.get('affected_documents'):
                logger.info("No affected documents found, but this is a manual trigger. Forcing README.md update.")
                impact_result['affected_documents'] = [{"file_path": "README.md", "reason": "Manual sync request"}]
            
            for doc in impact_result.get('affected_documents', []):
                try:
                    existing_content = await github_client.get_file_content(
                        repo.owner, repo.name, doc['file_path'], repo.default_branch, token
                    )
                except Exception as e:
                    logger.warning(f"Error fetching content for {doc['file_path']}: {e}. Using fallback.")
                    existing_content = None

                if not existing_content:
                    logger.info(f"Using fallback content for {doc['file_path']}.")
                    existing_content = "# Project Overview\n\nThis is a sample documentation file."
                
                update = await agent_invoker.invoke_as_content_generator(
                    task['change_event'], existing_content, doc['file_path']
                )
                update['file_path'] = doc['file_path']
                doc_updates.append(update)
            
            if not doc_updates:
                logger.info("No document updates generated.")
                return
            
            avg_conf = sum(u.get('confidence_score', 0.8) for u in doc_updates) / len(doc_updates)
            
            if avg_conf < (settings.MIN_CONFIDENCE_THRESHOLD if settings else 0.7):
                return
            
            # Create DB entry and enqueue for PR
            desc = await agent_invoker.invoke_as_pr_creator(doc_updates, task['change_event'])
            
            # Save the DocumentationUpdate to the database
            db_update = DocumentationUpdate(
                id=uuid.uuid4(),
                repository_id=repo.id,
                trigger_commit_sha=task.get('change_event', {}).get('checkout_sha', 'manual'),
                trigger_commit_message=task.get('change_event', {}).get('commit_message', 'Manual Analysis Trigger'),
                trigger_author=task.get('change_event', {}).get('author', 'User'),
                affected_files=[u['file_path'] for u in doc_updates],
                changes_summary=desc,
                confidence_score=int(avg_conf * 100),
                status=UpdateStatus.PENDING,
                agent_role="orchestrator"
            )
            
            db.add(db_update)
            db.commit()
            db.refresh(db_update)
            
            logger.info(f"PR generation complete for repo {repo.full_name}, Update ID: {db_update.id}")
        finally:
            db.close()

if __name__ == "__main__":
    orchestrator = AgentOrchestrator()
    asyncio.run(orchestrator.start())
