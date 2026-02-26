"""
Role-based agent invoker — enhanced prompt strategy.
Analyses code folder-by-folder and generates accurate documentation.
"""

import json
import logging
from typing import Dict, Any, List
from src.agents.client import gradient_client
from src.agents.parser import AgentResponseParser
from src.core.utils import CustomJSONEncoder

logger = logging.getLogger(__name__)


def _build_folder_tree_summary(file_tree: List[str]) -> str:
    """Build a human-readable folder structure from file paths."""
    folders: Dict[str, list] = {}
    for f in file_tree:
        parts = f.split("/")
        folder = "/".join(parts[:-1]) or "(root)"
        folders.setdefault(folder, []).append(parts[-1])

    lines = []
    for folder in sorted(folders.keys()):
        files = folders[folder]
        lines.append(f"📁 {folder}/ ({len(files)} files)")
        for fi in files[:12]:
            lines.append(f"   └─ {fi}")
        if len(files) > 12:
            lines.append(f"   └─ ... and {len(files) - 12} more")
    return "\n".join(lines)


class AgentRoleInvoker:
    """Specialized methods for each agent role with professional personas."""

    def __init__(self):
        self.client = gradient_client
        self.parser = AgentResponseParser()

    async def invoke_as_watcher(self, webhook_payload: Dict) -> Dict[str, Any]:
        prompt = f"""
ROLE: WATCHER AGENT (System Monitor)
TASK: Analyze incoming GitHub webhook event to determine if code changes necessitate a documentation sync.
WEBHOOK PAYLOAD: {json.dumps(webhook_payload, cls=CustomJSONEncoder)}

INSTRUCTIONS:
1. Examine the list of modified, added, and removed files.
2. If any source code (.py, .js, .ts, .go, .java) has changed, flag it.
3. If entry points OR major logic files have changed, mark as high priority.

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

        folder_summary = _build_folder_tree_summary(file_tree)

        existing_docs_preview = ""
        for path, content in list(key_contents.items())[:5]:
            existing_docs_preview += f"\n\n### {path}\n```\n{content[:1000]}\n```"
        if not existing_docs_preview:
            existing_docs_preview = "\nNo existing documentation content provided."

        prompt = f"""You are the **Lead Impact Architect**. Your persona is sharp, analytical, and highly organized. 
Your mission is to map specific code changes in the repository "{repo_name}" to the relevant documentation files.

## CONTEXT: Repository Blueprint
{folder_summary}

## CURRENT STATE: Documentation Assets
{chr(10).join(doc_files[:25]) if doc_files else "None found"}

## SOURCE SIGNALS: Target Source Files
{chr(10).join(code_files[:40]) if code_files else "None found"}

## TELEMETRY: Existing Content Samples
{existing_docs_preview}

## MISSION OBJECTIVE:
Select exactly 1-5 documentation files that must be updated to align with the source code.
PRIORITY RANKING:
1. **README.md (Root)**: Mandatory if the core project architecture or entry point has changed.
2. **Subfolder READMEs**: Required for folders containing significant new logic or modified interfaces.
3. **Reference Docs**: Specialized documentation like API.md or SETUP.md that directly references modified modules.

CRITICAL CONSTRAINTS:
- You MUST only use real paths derived from the 'Repository Blueprint' above.
- If a folder has code but no README, suggest creating one: "folder_path/README.md".
- Avoid generic selections; focus only on files directly impacted by the source signals.

Respond with ONLY a clean JSON object. No narrative. No backticks.
{{"affected_documents": ["path/to/file.md"]}}
"""
        response = await self.client.invoke(prompt, role="impact_analyzer")
        return self.parser.parse_impact_analyzer_response(response)

    async def invoke_as_content_generator(self, change_event: Dict, existing_content: str, path: str) -> Dict[str, Any]:
        repo_name = change_event.get('repository', 'the repository')
        code_files = change_event.get('code_files', [])
        file_tree = change_event.get('repo_file_tree', [])
        key_contents = change_event.get('key_file_contents', {})

        parts = path.split("/")
        target_folder = "/".join(parts[:-1]) if len(parts) > 1 else ""

        if target_folder:
            folder_code_files = [f for f in code_files if f.startswith(target_folder + "/")]
            folder_all_files = [f for f in file_tree if f.startswith(target_folder + "/")]
        else:
            folder_code_files = code_files
            folder_all_files = file_tree

        folder_summary = _build_folder_tree_summary(folder_all_files[:80])

        # Enhanced code context harvesting
        code_samples = ""
        samples_count = 0
        preferred_order = sorted(key_contents.items(), key=lambda x: (not x[0].startswith(target_folder), x[0]))
        
        for p, content in preferred_order:
            if not p.lower().endswith('.md') and samples_count < 8:
                code_samples += f"\n\n### FILE: {p}\n```\n{content[:1500]}\n```"
                samples_count += 1

        is_root = path.lower() in ("readme.md", "./readme.md")

        if is_root:
            instruction_block = """
You are the **Technical Writer Persona**. Your tone is professional, authoritative, and helpful.
COMMAND: Generate a master README.md that acts as the "Source of Truth" for the project.

STRUCTURE REQUIREMENTS:
1. **Title & Vision**: A clear H1 title and a 2-para summary of the project's purpose.
2. **Architecture**: Describe the high-level design based on the folder structure and imports.
3. **Key Components**: Explain the roles of the main directories (e.g., backend, frontend, agents).
4. **Tech Stack**: Table of languages, frameworks, and key libraries actually visible in the code.
5. **Flow of Operation**: Describe how data moves through the system (Backend -> Redis -> Workers, etc).
6. **Interaction**: How to trigger the main functionality (API endpoints, commands).
7. **Deployment**: Real-world setup steps using Docker or local envs.

STRICT RULE: Do not use placeholders. If you see 'pydantic' in code, list it. If you see 'FastAPI', list it. Base every word on the provided Code Samples.
"""
        else:
            instruction_block = f"""
You are the **Sub-Module Architect**. Your tone is focused and precise.
COMMAND: Generate a localized README for the `{target_folder}` module.

STRUCTURE REQUIREMENTS:
1. **Module Identity**: What does this specific part of the system do?
2. **Interface Contract**: Document key functions, classes, or endpoints exported by this folder.
3. **Logic Flow**: How these files interact within the folder.
4. **Dependencies**: What other project modules does this folder rely on?

STRICT RULE: Focus deeply on the logic inside the provided code samples. Describe the actual implementation details.
"""

        prompt = f"""RETAIL DOCS SYSTEM v2.0
TARGET FILE: {path}
REPOSITORY: {repo_name}

## FILE SYSTEM BLUEPRINT (Current Scope)
{folder_summary}

## LIVE SOURCE CODE SAMPLES
{code_samples}

## CURRENT FILE VERSION
```markdown
{existing_content if existing_content else "INITIALIZATION REQUIRED — NO EXISTING CONTENT"}
```

## TASK INSTRUCTIONS
{instruction_block}

Respond ONLY with a JSON payload with escaping where necessary:
{{"updated_content": "Full markdown content with proper header hierarchy", "confidence_score": 0.92}}
"""
        response = await self.client.invoke(prompt, role="content_generator")
        return self.parser.parse_content_generator_response(response)

agent_invoker = AgentRoleInvoker()
