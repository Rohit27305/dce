"""
Knowledge graph service for code-to-doc mapping.
"""

import logging
from typing import Dict, Any, List
from src.core.database import SessionLocal
from src.core.redis_client import redis_client

logger = logging.getLogger(__name__)

class KnowledgeGraphService:
    """Service for managing documentation mappings"""
    
    def get_mappings(self, repository_id: str) -> Dict[str, Any]:
        """
        Fetch code-to-doc mappings for a repository.
        Uses caching for performance.
        """
        cache_key = f"knowledge_graph:{repository_id}"
        cached = redis_client.get_cache(cache_key)
        if cached:
            return cached
            
        # Placeholder for actual DB query
        # In a real implementation, we'd query the code_doc_mappings table
        mappings = {
            "mappings": [
                {
                    "code_path": "src/",
                    "doc_path": "README.md",
                    "description": "General project overview and setup instructions."
                },
                {
                    "code_path": "helm/",
                    "doc_path": "README.md",
                    "description": "Helm chart configuration details."
                }
            ],
            "repository_id": repository_id
        }
        
        # Cache for 1 hour
        redis_client.set_cache(cache_key, mappings, expiration=3600)
        return mappings

    def add_mapping(self, repository_id: str, mapping_data: Dict):
        """Add a new code-to-doc relationship"""
        # Logic to persist in DB and invalidate cache
        redis_client.delete_cache(f"knowledge_graph:{repository_id}")
        logger.info(f"Added mapping for repo {repository_id}")

knowledge_graph_service = KnowledgeGraphService()
