"""
Redis client for message queue and production-grade caching.
"""

import redis
import json
import logging
from typing import Any, Optional, Union
from src.core.config import settings
from src.core.utils import CustomJSONEncoder

logger = logging.getLogger(__name__)

class RedisClient:
    """Redis client wrapper for queue and caching operations"""
    
    def __init__(self):
        self._url = settings.REDIS_URL if settings else "redis://localhost:6379/0"
        self.client = redis.from_url(
            self._url,
            decode_responses=True
        )
        logger.info(f"Redis client initialized with URL: {self._url}")
    
    # --- Queue Operations ---
    
    def enqueue(self, queue_name: str, data: dict) -> bool:
        """Add item to queue (Producer)"""
        try:
            serialized = json.dumps(data, cls=CustomJSONEncoder)
            self.client.rpush(queue_name, serialized)
            return True
        except Exception as e:
            logger.error(f"Failed to enqueue to {queue_name}: {e}")
            return False
    
    def dequeue(self, queue_name: str, timeout: int = 5) -> Optional[dict]:
        """Remove and return item from queue (Consumer - blocking)"""
        try:
            result = self.client.blpop(queue_name, timeout=timeout)
            if result:
                _, data = result
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to dequeue from {queue_name}: {e}")
            return None
    
    # --- Caching Operations (Production Strategy) ---
    
    def set_cache(self, key: str, value: Any, expiration: int = 3600):
        """
        Set cache with expiration. 
        Automatically handles serialization.
        """
        try:
            serialized = json.dumps(value, cls=CustomJSONEncoder)
            self.client.setex(key, expiration, serialized)
        except Exception as e:
            logger.error(f"Failed to set cache for key {key}: {e}")
    
    def get_cache(self, key: str) -> Optional[Any]:
        """
        Get cached value.
        Automatically handles deserialization.
        """
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Failed to get cache for key {key}: {e}")
            return None
    
    def delete_cache(self, key: str):
        """Invalidate cache entry"""
        try:
            self.client.delete(key)
        except Exception as e:
            logger.error(f"Failed to delete cache for key {key}: {e}")

# Global Redis client instance
redis_client = RedisClient()

# Queue names constants
WEBHOOK_QUEUE = "webhook_events"
IMPACT_ANALYSIS_QUEUE = "impact_analysis"
CONTENT_GENERATION_QUEUE = "content_generation"
PR_CREATION_QUEUE = "pr_creation"
