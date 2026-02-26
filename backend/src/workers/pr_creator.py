import asyncio
import logging
import uuid
from datetime import datetime
from src.core.config import settings
from src.core.database import SessionLocal
from src.core.redis_client import redis_client, PR_CREATION_QUEUE
from src.integrations.github.client import github_client
from src.models.documentation_update import DocumentationUpdate, UpdateStatus
from src.models.repository import Repository
from src.models.user import User

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class PRCreatorWorker:
    """Consumes PR tasks and executes GitHub API calls.
    Supports fork-based PRs for public repos we don't own."""
    
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
            update_id = task.get('update_id')
            token = settings.GITHUB_TOKEN or task.get('token')
            
            update = db.query(DocumentationUpdate).filter(DocumentationUpdate.id == update_id).first()
            if not update:
                logger.error(f"Update {update_id} not found in database")
                return

            repo = db.query(Repository).filter(Repository.id == update.repository_id).first()
            if not repo:
                logger.error(f"Repository {update.repository_id} not found")
                return

            if not token or token == "PLACEHOLDER_TOKEN":
                user = db.query(User).filter(User.id == repo.user_id).first()
                if user and user.github_access_token:
                    token = user.github_access_token
                else:
                    logger.error(f"No valid GitHub token found for repository {repo.full_name}")
                    update.status = UpdateStatus.FAILED
                    db.commit()
                    return

            logger.info(f"Starting PR creation for {repo.full_name} (Update: {update_id})")

            # --- Determine if we need to fork ---
            authenticated_user = await github_client.get_authenticated_user(token)
            logger.info(f"Authenticated as: {authenticated_user}")

            repo_info = await github_client.check_repo_owner(repo.owner, repo.name, token)
            can_push = repo_info.get("can_push", False)
            
            # Decide: push directly or fork first
            use_fork = not can_push
            push_owner = repo.owner  # where we push branches and files
            pr_head = ""  # the 'head' param for PR creation

            if use_fork:
                logger.info(f"Cannot push to {repo.full_name} directly — forking to {authenticated_user}/{repo.name}")
                try:
                    fork_data = await github_client.fork_repo(repo.owner, repo.name, token)
                    push_owner = fork_data.get("owner", {}).get("login", authenticated_user)
                    logger.info(f"Fork ready at: {push_owner}/{repo.name}")
                    
                    # Wait for fork to be ready (GitHub forks are async)
                    fork_ready = await github_client.wait_for_fork_ready(
                        push_owner, repo.name, repo.default_branch, token, max_wait=60
                    )
                    if not fork_ready:
                        logger.error(f"Fork {push_owner}/{repo.name} not ready after 60s")
                        update.status = UpdateStatus.FAILED
                        db.commit()
                        return
                except Exception as e:
                    logger.error(f"Failed to fork {repo.full_name}: {e}")
                    update.status = UpdateStatus.FAILED
                    db.commit()
                    return
            else:
                logger.info(f"We have push access to {repo.full_name} — pushing directly")

            # 1. Get base branch SHA (from the fork or the original repo)
            try:
                base_sha = await github_client.get_ref_sha(push_owner, repo.name, repo.default_branch, token)
                logger.info(f"Base SHA for {push_owner}/{repo.name}:{repo.default_branch} = {base_sha[:10]}...")
            except Exception as e:
                logger.error(f"Failed to get base SHA: {e}")
                update.status = UpdateStatus.FAILED
                db.commit()
                return

            # 2. Create new branch (on the fork or the original)
            branch_name = f"docs/update-{uuid.uuid4().hex[:8]}"
            try:
                await github_client.create_ref(push_owner, repo.name, branch_name, base_sha, token)
                update.pr_branch = branch_name
                db.commit()
                logger.info(f"Branch created: {push_owner}/{repo.name}:{branch_name}")
            except Exception as e:
                logger.error(f"Failed to create branch {branch_name}: {e}")
                update.status = UpdateStatus.FAILED
                db.commit()
                return

            # 3. Update files in the new branch (on the fork or the original)
            updates_successful = 0
            for doc_upd in update.generated_updates:
                file_path = doc_upd.get('file_path')
                new_content = doc_upd.get('updated_content')
                
                if not file_path or not new_content:
                    logger.warning(f"Skipping update for {file_path} due to missing data")
                    continue

                try:
                    await github_client.update_file(
                        owner=push_owner,
                        repo=repo.name,
                        path=file_path,
                        message=f"docs: update {file_path} via AI documentation agent",
                        content=new_content,
                        branch=branch_name,
                        token=token
                    )
                    updates_successful += 1
                    logger.info(f"Updated file: {push_owner}/{repo.name}/{file_path} on {branch_name}")
                except Exception as e:
                    logger.error(f"Failed to update file {file_path}: {e}")

            if updates_successful == 0:
                logger.error("No files were successfully updated in the branch")
                update.status = UpdateStatus.FAILED
                db.commit()
                return

            # 4. Create Pull Request
            try:
                pr_title = f"docs: AI-generated documentation update for {repo.name}"
                pr_body = update.changes_summary or "AI-generated documentation update."
                
                if use_fork:
                    # Cross-repo PR: head = "fork_owner:branch_name"
                    pr_head = f"{push_owner}:{branch_name}"
                else:
                    pr_head = branch_name
                
                pr_response = await github_client.create_pull_request(
                    owner=repo.owner,    # PR goes to the ORIGINAL repo
                    repo=repo.name,
                    title=pr_title,
                    body=pr_body,
                    head=pr_head,
                    base=repo.default_branch,
                    token=token
                )
                
                update.pr_number = pr_response.get('number')
                update.pr_url = pr_response.get('html_url')
                update.status = UpdateStatus.PENDING
                
                repo.total_prs_created += 1
                
                db.commit()
                logger.info(f"PR created successfully: {update.pr_url}")
                
            except Exception as e:
                logger.error(f"Failed to create PR: {e}")
                update.status = UpdateStatus.FAILED
                db.commit()

        except Exception as e:
            logger.error(f"Unexpected error in PR creation: {e}", exc_info=True)
        finally:
            db.close()

if __name__ == "__main__":
    worker = PRCreatorWorker()
    asyncio.run(worker.start())
