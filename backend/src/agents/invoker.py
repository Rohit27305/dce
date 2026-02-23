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
        repo_name = change_event.get('repository', 'the repository')
        doc_files = change_event.get('doc_files', [])
        code_files = change_event.get('code_files', [])
        file_tree = change_event.get('repo_file_tree', [])
        key_contents = change_event.get('key_file_contents', {})
        
        doc_files_str = "\n".join(doc_files[:15]) if doc_files else "None found"
        code_files_str = "\n".join(code_files[:15]) if code_files else "None found"
        
        existing_docs_preview = ""
        for path, content in list(key_contents.items())[:3]:
            existing_docs_preview += f"\n\n### {path}\n```\n{content[:800]}\n```"
        if not existing_docs_preview:
            existing_docs_preview = "\nNone available."
        
        prompt = f"""
ROLE: IMPACT ANALYSIS AGENT
REPOSITORY: {repo_name}

TASK: Identify which documentation files need to be created or updated for this repository.

DOCUMENTATION FILES ALREADY IN REPO:
{doc_files_str}

SOURCE CODE FILES:
{code_files_str}

EXISTING DOCUMENTATION CONTENT:{existing_docs_preview}

GRAPH: {json.dumps(knowledge_graph, cls=CustomJSONEncoder)[:500]}

INSTRUCTIONS:
- Pick 1-3 documentation files that most need improvement or creation based on the actual code files present
- Prefer files like README.md, CONTRIBUTING.md, docs/index.md, or similar
- If a README already exists, include it so we can improve it
- Only pick files from the doc_files list above, or suggest creating README.md if none exist

OUTPUT: Respond with ONLY a JSON object (no markdown, no explanation):
{{"affected_documents": ["path/to/file1.md", "path/to/file2.md"]}}
"""
        response = await self.client.invoke(prompt, role="impact_analyzer")
        return self.parser.parse_impact_analyzer_response(response)
    
    async def invoke_as_content_generator(self, change_event: Dict, existing_content: str, path: str) -> Dict[str, Any]:
        repo_name = change_event.get('repository', 'the repository')
        code_files = change_event.get('code_files', [])
        key_contents = change_event.get('key_file_contents', {})
        
        # Get a code sample from any available source file
        code_sample = ""
        for p, content in list(key_contents.items())[:2]:
            if not p.lower().endswith('.md'):
                code_sample += f"\n\n### {p}\n```\n{content[:600]}\n```"
        
        code_files_str = "\n".join(code_files[:20]) or "Not available"
        if not code_sample:
            code_sample = "\nNot available."
        
        prompt = f"""
ROLE: DOCUMENTATION WRITER
REPOSITORY: {repo_name}
FILE TO UPDATE: {path}

TASK: Write high-quality, accurate documentation for the '{path}' file in the {repo_name} repository.

SOURCE CODE FILES IN THIS REPO:
{code_files_str}

CODE SAMPLES:{code_sample}

EXISTING CONTENT OF {path}:
```
{existing_content[:2000]}
```

INSTRUCTIONS:
- Write documentation that accurately reflects the actual codebase above
- Use proper Markdown formatting
- If writing README: include Overview, Installation, Usage, and Contributing sections
- If writing API docs: document the actual functions/endpoints visible in the code
- Make it professional and complete — not generic filler
- The confidence_score should reflect how well you could write this given the context (0.0 to 1.0)

OUTPUT: Respond with ONLY a JSON object (no markdown code blocks, no explanation):
{{"updated_content": "full markdown content here", "confidence_score": 0.85}}
"""
        response = await self.client.invoke(prompt, role="content_generator")
        return self.parser.parse_content_generator_response(response)

agent_invoker = AgentRoleInvoker()
