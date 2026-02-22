"""
Role-based agent invoker.
"""

import json
import logging
from typing import Dict, Any, List
from src.agents.client import gradient_client
from src.agents.parser import AgentResponseParser
from src.core.utils import CustomJSONEncoder

logger = logging.getLogger(__name__)

class AgentRoleInvoker:
    """Specialized methods for each agent role"""
    
    def __init__(self):
        self.client = gradient_client
        self.parser = AgentResponseParser()
    
    async def invoke_as_watcher(self, webhook_payload: Dict) -> Dict[str, Any]:
        prompt = f"""
ROLE: WATCHER AGENT
TASK: Analyze code changes for documentation impact.
WEBHOOK: {json.dumps(webhook_payload, cls=CustomJSONEncoder)}
OUTPUT: JSON with 'requires_documentation_update' (bool) and 'change_events' (list).
"""
        response = await self.client.invoke(prompt, role="watcher")
        return self.parser.parse_watcher_response(response)
    
    async def invoke_as_impact_analyzer(self, change_event: Dict, knowledge_graph: Dict) -> Dict[str, Any]:
        prompt = f"""
ROLE: IMPACT ANALYSIS AGENT
TASK: Identify affected documentation files.
CHANGE: {json.dumps(change_event, cls=CustomJSONEncoder)}
GRAPH: {json.dumps(knowledge_graph, cls=CustomJSONEncoder)}
OUTPUT: JSON with 'affected_documents' (list).
"""
        response = await self.client.invoke(prompt, role="impact_analyzer")
        return self.parser.parse_impact_analyzer_response(response)
    
    async def invoke_as_content_generator(self, change_event: Dict, existing_content: str, path: str) -> Dict[str, Any]:
        prompt = f"""
ROLE: CONTENT GENERATOR AGENT
TASK: Generate documentation unit diff.
CHANGE: {json.dumps(change_event, cls=CustomJSONEncoder)}
FILE: {path}
CONTENT: {existing_content}
OUTPUT: JSON with 'diff' (unified format) and 'confidence_score'.
"""
        response = await self.client.invoke(prompt, role="content_generator")
        return self.parser.parse_content_generator_response(response)

    async def invoke_as_pr_creator(self, updates: List[Dict], context: Dict) -> str:
        prompt = f"""
ROLE: PR ORCHESTRATOR
TASK: Create professional PR description.
UPDATES: {json.dumps(updates, cls=CustomJSONEncoder)}
CONTEXT: {json.dumps(context, cls=CustomJSONEncoder)}
OUTPUT: Markdown formatted description.
"""
        response = await self.client.invoke(prompt, role="pr_creator")
        content = response["choices"][0]["message"]["content"]
        return content.strip()

agent_invoker = AgentRoleInvoker()
