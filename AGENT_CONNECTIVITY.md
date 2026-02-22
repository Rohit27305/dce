# Agent Connectivity

The system connects to the **DigitalOcean Gradient™ AI Platform** via REST API.

## 🔑 Authentication
Authentication is handled via the `DIGITALOCEAN_API_TOKEN` environment variable.

## 🤖 Configuration
- **AGENT_ID**: The unique identifier of your agent in the Gradient platform.
- **AGENT_MODEL**: `claude-3-5-sonnet-20241022` (Optimized for code analysis).
- **TEMPERATURE**: `0.3` (Balanced for consistency).

## 📊 Connection Testing
You can verify the connectivity using the health check endpoint or by running:
```bash
curl -X POST "https://api.digitalocean.com/v2/ai/agents/$AGENT_ID/chat" \
     -H "Authorization: Bearer $DIGITALOCEAN_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "ping"}]}'
```
