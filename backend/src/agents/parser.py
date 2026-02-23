"""
Agent response parser and validator.
Handles extracting structured data from agent outputs.
"""

import json
import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class AgentResponseParser:
    """Parse and validate responses from the agent"""
    
    @staticmethod
    def _extract_json(content: str) -> Dict:
        """Extract JSON from various formats (direct JSON, markdown code blocks, etc.)"""
        content = content.strip()
        
        # Try direct JSON parse
        if content.startswith("{"):
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                pass
        
        # Try extracting from markdown code block
        patterns = [
            r'```json\s*\n(.*?)\n```',
            r'```\s*\n(.*?)\n```',
            r'({.*})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    continue
        
        raise ValueError("Could not extract valid JSON from response")

    @staticmethod
    def parse_watcher_response(raw_response: Dict) -> Dict[str, Any]:
        """Parse Watcher agent response"""
        try:
            content = raw_response["choices"][0]["message"]["content"]
            parsed = AgentResponseParser._extract_json(content)
            
            # Basic validation
            if not isinstance(parsed.get("requires_documentation_update"), bool):
                parsed["requires_documentation_update"] = False
            if not isinstance(parsed.get("change_events"), list):
                parsed["change_events"] = []
                
            return parsed
        except Exception as e:
            logger.error(f"Watcher parse failure: {e}")
            return {"requires_documentation_update": False, "change_events": []}

    @staticmethod
    def parse_impact_analyzer_response(raw_response: Dict) -> Dict[str, Any]:
        """Parse Impact Analyzer response"""
        try:
            content = raw_response["choices"][0]["message"]["content"]
            parsed = AgentResponseParser._extract_json(content)
            if not isinstance(parsed.get("affected_documents"), list):
                parsed["affected_documents"] = []
            return parsed
        except Exception as e:
            logger.error(f"Impact analyzer parse failure: {e}")
            return {"affected_documents": [], "confidence": 0.0}

    @staticmethod
    def parse_content_generator_response(raw_response: Dict) -> Dict[str, Any]:
        """Parse Content Generator response"""
        try:
            content = raw_response["choices"][0]["message"]["content"]
            parsed = AgentResponseParser._extract_json(content)
            return parsed
        except Exception as e:
            logger.error(f"Content generator parse failure: {e}")
            content = raw_response["choices"][0]["message"]["content"]
            return {"updated_content": content, "confidence_score": 0.5, "requires_human_review": True}
