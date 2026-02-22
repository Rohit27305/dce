# Agent Responses and Parsing

Our agents are instructed to respond in structured JSON format.

## 🔍 Parsing Strategy
The `src/agents/parser.py` uses Regex and JSON decoding to extract data from agent outputs, even if the agent includes conversational text or uses markdown code blocks.

## 🛠️ Expected Formats
### Watcher Agent
```json
{
  "requires_documentation_update": true,
  "change_events": [
    {
      "entity": "User",
      "action": "added_field",
      "details": "Added 'avatar_url' to User model"
    }
  ]
}
```

## ⚠️ Error Handling
If an agent returns invalid JSON, the system falls back to a safe default and logs the raw response for debugging.
