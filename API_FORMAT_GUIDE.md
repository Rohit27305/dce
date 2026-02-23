# Documentation Consistency Enforcer (DCEA) - API Format Guide

To maintain consistency across the application, all backend APIs follow a standardized JSON structure.

---

## 🏗️ Standard Response Wrapper
Every response from the backend will have this top-level envelope:

```json
{
  "success": boolean,    // true for 2xx status codes, false for 4xx/5xx
  "message": string,     // A human-readable summary of the result
  "data": object | null, // The actual payload (result of the operation)
  "error": object | null // Error details (only present if success is false)
}
```

---

## 📌 1. Repository Management

### List All Repositories
- **Endpoint**: `GET /api/repositories/`
- **Response Data**: Array of objects

**Response Example**:
```json
{
  "success": true,
  "message": "Repositories retrieved successfully",
  "data": [
    {
      "id": "uuid-v4",
      "github_repo_id": 160919119,
      "full_name": "fastapi/fastapi",
      "owner": "fastapi",
      "name": "fastapi",
      "enabled": true,
      "total_prs_created": 5,
      "confidence_score": 92
    }
  ],
  "error": null
}
```

### Fetch GitHub Metadata
- **Endpoint**: `POST /api/repositories/fetch-metadata`
- **Request Body**:
```json
{
  "url": "https://github.com/fastapi/fastapi"
}
```
- **Response Data**: Detailed GitHub repo object for UI confirmation.

---

## 📌 2. Documentation Updates (Sync Protocols)

### List Recent History
- **Endpoint**: `GET /api/documentation-updates/`

**Response Example**:
```json
{
  "success": true,
  "message": "Documentation updates retrieved successfully",
  "data": [
    {
      "id": "85594363-9763-4f3d-8ffe-d12da5649d96",
      "status": "pending",
      "confidence_score": 95,
      "affected_files": ["README.md", "docs/index.md"],
      "changes_summary": "Sync root documentation with latest core changes",
      "created_at": "2026-02-22T16:24:35"
    }
  ],
  "error": null
}
```

---

## ❌ Error Codes & Handling

When `success` is `false`, the `error` object provides context:

| Code | HTTP Status | Meaning |
| :--- | :--- | :--- |
| `BAD_REQUEST` | 400 | Invalid input (e.g., missing URL) |
| `UNAUTHORIZED` | 401 | GitHub Token missing or invalid |
| `NOT_FOUND` | 404 | Resource with specific ID doesn't exist |
| `INTERNAL_ERROR`| 500 | Server-side logic failure |

**Error Response Layout**:
```json
{
  "success": false,
  "message": "GitHub repository not found",
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "status": 404,
    "details": "The repository Rohit27305/fake-repo does not exist or matches."
  }
}
```

---

## 💡 Pro Tips for Frontend Integration
1.  **Check `results.success`**: Always check the success flag before accessing `data`.
2.  **Use `message` for Toasts**: The `message` field is designed to be user-friendly; use it directly in notification popups.
3.  **UUIDs**: All resource IDs are UUID v4.
