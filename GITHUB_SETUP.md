# 🐙 GitHub Setup Guide

This guide will walk you through the steps required to connect the **Documentation Consistency Enforcer** to your GitHub account and repositories.

## 1. Create a GitHub OAuth Application
To allow users to log in with GitHub and manage repositories, you need to create an OAuth App.

1.  Go to **[GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)**.
2.  Click **"New OAuth App"**.
3.  **Application Name**: `Documentation Enforcer (Local)` (or your choice).
4.  **Homepage URL**: `http://localhost:3000`.
5.  **Authorization callback URL**: `http://localhost:8000/api/auth/callback`.
6.  Click **"Register application"**.
7.  Copy the **Client ID** and generate a **Client Secret**. Paste these into your `.env` file:
    ```env
    GITHUB_CLIENT_ID=your_id_here
    GITHUB_CLIENT_SECRET=your_secret_here
    ```

---

## 2. Generate a `SECRET_KEY`
The `SECRET_KEY` is used by the backend to sign authentication tokens (JWTs). It should be a long, random string.

### How to generate one:
Run this command in your terminal:
```bash
python3 -c 'import secrets; print(secrets.token_hex(32))'
```
Copy the output and paste it into your `.env`:
```env
SECRET_KEY=paste_the_output_here
```

---

## 3. Configure Repository Webhooks
To receive real-time updates when code is pushed or PRs are created, you need to add a webhook to your target repository.

1.  Go to your repository on GitHub.
2.  Navigate to **Settings > Webhooks > Add webhook**.
3.  **Payload URL**: `http://your-server-ip:8000/api/webhooks/github` 
    > [!NOTE]
    > For local testing, use a tool like **ngrok** to expose your local port 8000 to the internet.
4.  **Content type**: `application/json`.
5.  **Secret**: Enter a random string (e.g., `my_ultra_secret_webhook_key`).
6.  **Which events?**: Select "Send me everything" or just "Push" and "Pull requests".
7.  Update your `.env`:
    ```env
    GITHUB_WEBHOOK_SECRET=my_ultra_secret_webhook_key
    ```

---

## 4. Summary of .env Requirements
Ensure the following variables are filled in your root `.env`:

| Variable | Source | Use Case |
| :--- | :--- | :--- |
| `GITHUB_CLIENT_ID` | OAuth App | User Login |
| `GITHUB_CLIENT_SECRET` | OAuth App | User Login |
| `GITHUB_WEBHOOK_SECRET` | Webhook Settings | Real-time Sync |
| `SECRET_KEY` | Generated (Step 2) | Security / Sessions |
