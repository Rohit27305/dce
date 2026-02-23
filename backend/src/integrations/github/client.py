"""
GitHub API client for repository management and PR creation.
Supports fork-based PRs for public repos we don't own.
"""

import httpx
import logging
import base64
import asyncio
from typing import Dict, Any, List, Optional
from src.core.config import settings
from src.core.redis_client import redis_client

logger = logging.getLogger(__name__)

class GitHubClient:
    """Async client for GitHub API"""
    
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
    
    def _get_headers(self, token: str) -> Dict[str, str]:
        """Get headers with bearer token"""
        headers = self.headers.copy()
        headers["Authorization"] = f"token {token}"
        return headers

    async def get_authenticated_user(self, token: str) -> str:
        """Get the username of the authenticated user."""
        url = f"{self.base_url}/user"
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()["login"]

    async def check_repo_owner(self, owner: str, repo: str, token: str) -> Dict[str, Any]:
        """Check if the authenticated user owns the repo. Returns repo info with permissions."""
        url = f"{self.base_url}/repos/{owner}/{repo}"
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            return {
                "full_name": data.get("full_name"),
                "private": data.get("private", False),
                "can_push": data.get("permissions", {}).get("push", False),
                "fork": data.get("fork", False),
            }

    async def fork_repo(self, owner: str, repo: str, token: str) -> Dict[str, Any]:
        """Fork a repository to the authenticated user's account."""
        url = f"{self.base_url}/repos/{owner}/{repo}/forks"
        headers = self._get_headers(token)
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, headers=headers, json={})
            response.raise_for_status()
            fork_data = response.json()
            logger.info(f"Fork created/found: {fork_data.get('full_name')}")
            return fork_data

    async def wait_for_fork_ready(self, fork_owner: str, repo: str, branch: str, token: str, max_wait: int = 60) -> bool:
        """Wait for a fork to be ready (GitHub forks are async)."""
        headers = self._get_headers(token)
        for i in range(max_wait // 5):
            await asyncio.sleep(5)
            try:
                url = f"{self.base_url}/repos/{fork_owner}/{repo}/git/refs/heads/{branch}"
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200:
                        logger.info(f"Fork {fork_owner}/{repo} is ready (attempt {i+1})")
                        return True
            except Exception:
                pass
            logger.info(f"Waiting for fork to be ready... (attempt {i+1})")
        return False

    async def get_commit_diff(self, owner: str, repo: str, commit_sha: str, token: str) -> str:
        """Fetch commit diff from GitHub with caching."""
        cache_key = f"diff:{owner}/{repo}:{commit_sha}"
        cached_diff = redis_client.get_cache(cache_key)
        if cached_diff:
            logger.info(f"Cache hit for diff: {cache_key}")
            return cached_diff

        url = f"{self.base_url}/repos/{owner}/{repo}/commits/{commit_sha}"
        headers = self._get_headers(token)
        headers["Accept"] = "application/vnd.github.v3.diff"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            diff = response.text
            redis_client.set_cache(cache_key, diff, expiration=86400)
            return diff

    async def get_file_content(self, owner: str, repo: str, path: str, ref: str, token: str) -> Optional[str]:
        """Fetch file content from a specific reference"""
        url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}?ref={ref}"
        headers = self._get_headers(token)

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 404:
                return None
            response.raise_for_status()
            data = response.json()
            content = base64.b64decode(data['content']).decode('utf-8')
            return content

    async def get_ref_sha(self, owner: str, repo: str, ref: str, token: str) -> str:
        """Get the SHA of a reference (branch)"""
        url = f"{self.base_url}/repos/{owner}/{repo}/git/refs/heads/{ref.replace('heads/', '')}"
        logger.info(f"Fetching Ref SHA from: {url}")
        headers = self._get_headers(token)

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()["object"]["sha"]

    async def create_ref(self, owner: str, repo: str, ref: str, sha: str, token: str) -> Dict[str, Any]:
        """Create a new reference (branch)"""
        url = f"{self.base_url}/repos/{owner}/{repo}/git/refs"
        headers = self._get_headers(token)
        payload = {
            "ref": f"refs/heads/{ref}",
            "sha": sha
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def update_file(
        self, 
        owner: str, 
        repo: str, 
        path: str, 
        message: str, 
        content: str, 
        branch: str, 
        token: str,
        sha: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update or create a file content"""
        if not sha:
            sha_url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}?ref={branch}"
            async with httpx.AsyncClient() as client:
                res = await client.get(sha_url, headers=self._get_headers(token))
                if res.status_code == 200:
                    sha = res.json()["sha"]

        url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
        headers = self._get_headers(token)
        payload = {
            "message": message,
            "content": base64.b64encode(content.encode()).decode(),
            "branch": branch
        }
        if sha:
            payload["sha"] = sha

        async with httpx.AsyncClient() as client:
            response = await client.put(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def create_pull_request(
        self, 
        owner: str, 
        repo: str, 
        title: str, 
        body: str, 
        head: str, 
        base: str, 
        token: str
    ) -> Dict[str, Any]:
        """Create a new pull request on GitHub. head can be 'user:branch' for cross-repo PRs."""
        url = f"{self.base_url}/repos/{owner}/{repo}/pulls"
        headers = self._get_headers(token)
        payload = {
            "title": title,
            "body": body,
            "head": head,
            "base": base
        }
        logger.info(f"Creating PR: {owner}/{repo} head={head} base={base}")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

# Global GitHub client instance
github_client = GitHubClient()
