# 📦 Repository Setup Guide

This guide explains how to add repositories to the Documentation Consistency Enforcer and how to obtain the necessary information for the API payload.

## 🔍 How to get Repository Information

To add a repository via the API, you need the following fields:
- `github_repo_id`: The unique integer ID assigned by GitHub.
- `full_name`: The format `owner/repo_name`.
- `owner`: The GitHub username or organization name.
- `name`: The repository name.
- `default_branch`: Usually `main` or `master`.

### 🛠️ Finding the `github_repo_id`

#### Option 1: Using the GitHub API (Recommended)
You can find the ID by visiting the following URL in your browser (replacing `{owner}` and `{repo}`):
`https://api.github.com/repos/{owner}/{repo}`

Example for `facebook/react`:
1. Go to `https://api.github.com/repos/facebook/react`
2. Look for the `"id"` field at the very top. For React, it is `10270250`.

#### Option 2: Using `curl`
```bash
curl -s https://api.github.com/repos/owner/repo | grep '"id":'
```

---

## 🚀 Adding a Repository

Send a `POST` request to the backend API.

### Via `curl`
```bash
curl -X POST http://localhost:8000/api/repositories/ \
     -H "Content-Type: application/json" \
     -d '{
          "github_repo_id": 123456789,
          "full_name": "your-username/your-repo",
          "owner": "your-username",
          "name": "your-repo",
          "default_branch": "main"
         }'
```

### Via Swagger UI
1. Open `http://localhost:8000/api/docs`.
2. Find the `POST /api/repositories/` endpoint.
3. Click "Try it out", paste the JSON, and click "Execute".

---

## 🧠 Triggering Analysis

Once a repository is added, you can manually trigger a documentation analysis.

### Via `curl`
Replace `{repo_id}` with the UUID returned when you added the repository (or find it via `GET /api/repositories/`).

```bash
curl -X POST http://localhost:8000/api/repositories/{repo_id}/analyze
```

---

## 📋 Monitoring Status
You can view the status of all documentation updates at:
`http://localhost:8000/api/documentation-updates/`
