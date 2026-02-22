"""
DigitalOcean Gradient AI Platform client.
"""

import httpx
import json
import logging
import time
from typing import Dict, Any, Optional
from src.core.config import settings
from src.core.redis_client import redis_client

logger = logging.getLogger(__name__)

class GradientAgentClient:
    """Client for DigitalOcean Gradient AI agent"""
    
    def __init__(self):
        self.agent_url = settings.GRADIENT_AGENT_URL if settings else ""
        self.access_key = settings.GRADIENT_ACCESS_KEY if settings else ""
        
        self.headers = {
            "Authorization": f"Bearer {self.access_key}",
            "Content-Type": "application/json"
        }
    
    async def invoke(
        self,
        prompt: str,
        role: str,
        max_tokens: int = None,
        temperature: float = None
    ) -> Dict[str, Any]:
        """
        Invoke the agent with a prompt.
        Includes caching of agent responses to reduce latency and costs.
        """
        # Production-grade caching strategy: cache identical prompts for 1 hour
        import hashlib
        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
        cache_key = f"agent_response:{hashlib.md5(self.agent_url.encode()).hexdigest()}:{role}:{prompt_hash}"
        
        cached_response = redis_client.get_cache(cache_key)
        if cached_response:
            logger.info(f"Agent cache hit for role: {role}")
            return cached_response

        url = f"{self.agent_url.rstrip('/')}/api/v1/chat/completions"
        
        payload = {
            "model": settings.AGENT_MODEL if settings else "claude-3-5-sonnet-20241022",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens or (settings.AGENT_MAX_TOKENS if settings else 4096),
            "temperature": temperature or (settings.AGENT_TEMPERATURE if settings else 0.3)
        }
        
        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    url,
                    headers=self.headers,
                    json=payload
                )
                
                response.raise_for_status()
                result = response.json()
                
                latency = int((time.time() - start_time) * 1000)
                logger.info(f"Agent invocation successful in {latency}ms")
                
                # Cache the response for 1 hour
                redis_client.set_cache(cache_key, result, expiration=3600)
                
                return result
                
        except httpx.HTTPError as e:
            logger.error(f"Agent invocation failed: {e}")
            raise

# Global client instance
gradient_client = GradientAgentClient()
