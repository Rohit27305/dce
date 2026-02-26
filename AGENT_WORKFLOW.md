# 🧠 Agent Orchestration & Workflow (DCE)

This document explains the internal mechanics of how the **Documentation Consistency Engine (DCE)** agents are invoked and how they collaborate to keep documentation synced.

---

## 🛠️ The Collaborative Agent Chain

When a change is detected (via Webhook) or manually triggered, DCE initiates a sequence of specialized AI agents. Each agent has a specific "Persona" and limited context to maximize precision.

### 1. The Watcher (Entry Point)
- **Role**: System Monitor
- **Trigger**: GitHub Push Webhook
- **Responsibility**: Scans the list of modified/added files. It ignores non-code files (like logs or temporary assets) and determines if the logic changes are significant enough to warrant a documentation refresh.
- **Output**: A decision boolean and a streamlined `change_event`.

### 2. The Lead Impact Architect (Navigator)
- **Role**: Structural Analyst
- **Trigger**: Watcher's positive signal or Manual Sync button.
- **Responsibility**: 
    - Analyzes the **Repository Blueprint** (file tree).
    - Maps changed source files to documentation gaps.
    - Identifies folders containing code but lacking a `README.md`.
- **Logic**: It prioritizes the Root README first, then subfolders with the highest concentration of logic changes.

### 3. The Content Generator (Creator)
- **Role**: Technical Writer / Architect
- **Trigger**: Impact Architect's file list.
- **Responsibility**: 
    - Receives **Context Harvesting** (actual source code snippets from modified files).
    - Compares existing documentation with the new source signals.
    - Generates high-fidelity Markdown content.
- **Instruction Set**: Forced to use actual imports, class names, and function signatures found in the code. It is prohibited from using placeholders or hallucinating features.

---

## 🔄 The Sync Lifecycle (Step-by-Step)

1.  **Signal Acquisition**: Repository event is received by the `api/repositories/{id}/analyze` endpoint or Webhook handler.
2.  **Task Enqueueing**: A background task is pushed to the Redis **Impact Analysis Queue**.
3.  **Orchestration**: The `AgentOrchestrator` worker picks up the task and invokes the **Architect** agent.
4.  **Content Synthesis**: For each affected doc, the **Generator** agent is called with gathered code context.
5.  **Validation**: A **Confidence Score** is assigned based on the agent's internal assessment and structural matching.
6.  **PR Execution**: If trust exceeds the threshold, the `PRCreatorWorker` creates a new branch, commits the markdown changes, and opens a Pull Request on GitHub.

---

## 📊 Trust & Confidence Scoring

DCE agents report a `confidence_score` (0.0 to 1.0).
- **> 0.90**: High Stability. Automations proceed seamlessly.
- **0.70 - 0.90**: Standard Review. Flagged for review in the Sync Events stream.
- **< 0.70**: Low Trust. PR is created but includes a "Warning: Manual Audit Required" label.

---
*For technical details on prompt engineering, see [AGENT_RESPONSES.md](AGENT_RESPONSES.md).*
