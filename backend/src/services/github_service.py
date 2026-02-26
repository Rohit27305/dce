import httpx
from typing import Dict, Any, Optional, List
from src.core.config import settings
from src.core.exceptions import BadRequestException, InternalServerError

class GitHubService:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        github_token = getattr(settings, "GITHUB_TOKEN", None)
        if github_token:
            self.headers["Authorization"] = f"token {github_token}"

    async def get_repo_details(self, owner: str, repo: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/repos/{owner}/{repo}"
            response = await client.get(url, headers=self.headers)
            
            if response.status_code == 404:
                raise BadRequestException(f"Repository {owner}/{repo} not found on GitHub. If it's private, make sure your GITHUB_TOKEN has access.")
            if response.status_code != 200:
                raise InternalServerError(f"GitHub API error: {response.text}")
            
            return response.json()

    async def list_branches(self, owner: str, repo: str, per_page: int = 30) -> List[str]:
        """Fetch list of branch names for a repository."""
        async with httpx.AsyncClient(timeout=10) as client:
            url = f"{self.base_url}/repos/{owner}/{repo}/branches?per_page={per_page}"
            response = await client.get(url, headers=self.headers)
            if response.status_code != 200:
                return []
            return [b["name"] for b in response.json()]

    async def get_file_tree(self, owner: str, repo: str, branch: str = "main") -> List[str]:
        """Fetch a flat list of file paths in the repo using the Git Trees API."""
        async with httpx.AsyncClient(timeout=15) as client:
            url = f"{self.base_url}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
            response = await client.get(url, headers=self.headers)
            if response.status_code != 200:
                return []
            tree = response.json().get("tree", [])
            # Return only blob (file) paths, skip binaries
            return [
                item["path"] for item in tree
                if item["type"] == "blob"
                and not item["path"].endswith(('.png', '.jpg', '.gif', '.ico', '.woff', '.ttf', '.zip', '.tar'))
                and item.get("size", 0) < 100_000  # skip files > 100KB
            ]

    async def get_file_content_text(self, owner: str, repo: str, path: str, branch: str = "main") -> Optional[str]:
        """Fetch raw text content of a file (returns None on failure)."""
        import base64
        async with httpx.AsyncClient(timeout=10) as client:
            url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}?ref={branch}"
            response = await client.get(url, headers=self.headers)
            if response.status_code != 200:
                return None
            data = response.json()
            try:
                return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
            except Exception:
                return None

    def parse_github_url(self, url: str) -> Optional[Dict[str, str]]:
        """Parses a GitHub URL into owner and repo name."""
        url = url.strip().rstrip("/")
        if not url:
            return None
            
        # Handle SSH and HTTPS formats
        if url.startswith("https://github.com/"):
            parts = url.replace("https://github.com/", "").split("/")
        elif url.startswith("git@github.com:"):
            parts = url.replace("git@github.com:", "").replace(".git", "").split("/")
        else:
            return None
            
        if len(parts) >= 2:
            return {"owner": parts[0], "repo": parts[1]}
        return None

github_service = GitHubService()
