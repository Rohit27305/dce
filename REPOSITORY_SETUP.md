# 📦 Asset Integration Guide (DCE)

This guide explains how to connect your GitHub repositories to the **Documentation Consistency Engine (DCE)** and initiate the synchronization protocol.

---

## 🔗 Connecting a Repository

DCE supports both Public and Private repositories. 

### Option 1: Using the Dashboard (Recommended)
1. Navigate to the **Repositories** page (`http://localhost:3000/repositories`).
2. Click the **"Connect Repository"** button.
3. Paste the full GitHub URL (e.g., `https://github.com/owner/repo`).
4. Click **"Fetch"**. DCE will automatically retrieve the Repository ID, Owner, and default branch using your configured `GITHUB_TOKEN`.
5. Verify the details (DCE will show a "PRIVATE" badge if the repo is private) and click **"Confirm Connection"**.

### Option 2: via REST API
If you prefer automation, send a `POST` request to the backend:

```bash
curl -X POST http://localhost:8000/api/repositories/ \
     -H "Content-Type: application/json" \
     -d '{
          "github_repo_id": 123456789,
          "full_name": "owner/repo",
          "owner": "owner",
          "name": "repo",
          "default_branch": "main",
          "is_private": true
         }'
```

---

## ⚡ Initiating Sync Protocol

Once connected, you can trigger a full documentation analysis (Sync Protocol).

### Dashboard Workflow
1. Find your repository in the card list.
2. Click the **"Sync Protocol"** button (Rotating arrows icon).
3. Review the target branch in the modal and click **"Execute Sync"**.
4. Monitor the real-time status in the **Sync Events** stream.

### Manual API Trigger
```bash
# Replace {repo_id} with the DCE UUID
curl -X POST http://localhost:8000/api/repositories/{repo_id}/analyze
```

---

## 🛰️ Monitoring Sync Status

You can monitor generated Pull Requests and AI confidence scores in two ways:
1. **Sync Events Page**: `http://localhost:3000/updates` (Rich UI with analysis reports).
2. **Dashboard**: `http://localhost:3000/` (Real-time activity stream).
3. **API History**: `http://localhost:8000/api/documentation-updates/`.

---
*Note: Ensure your `GITHUB_TOKEN` in `backend/.env` has `repo` scope for private repository access.*
