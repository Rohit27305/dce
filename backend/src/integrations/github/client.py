"""
GitHub API client for repository management and PR creation.
"""

import httpx
import logging
import base64
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

    async def get_commit_diff(self, owner: str, repo: str, commit_sha: str, token: str) -> str:
        """
        Fetch commit diff from GitHub.
        Uses caching to avoid redundant API calls.
        """
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
            
            # Cache the diff for 24 hours
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
            
            # Decode base64 content
            content = base64.b64decode(data['content']).decode('utf-8')
            return content

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
        """Create a new pull request on GitHub"""
        url = f"{self.base_url}/repos/{owner}/{repo}/pulls"
        headers = self._get_headers(token)
        payload = {
            "title": title,
            "body": body,
            "head": head,
            "base": base
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

# Global GitHub client instance
github_client = GitHubClient()
