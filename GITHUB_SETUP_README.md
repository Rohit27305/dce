# GitHub Token Generation & Setup Guide

This guide explains how to generate a GitHub Personal Access Token (PAT) and configure it for the Documentation Consistency Enforcer (DCEA) to automate Pull Request creation.

## 1. Why is a Token Required?

To raise a Pull Request (PR) on your behalf, the application needs to interact with the GitHub API. GitHub requires authentication for these actions:
- **Creating a Branch**: To push documentation changes without affecting your `main` branch directly.
- **Committing Files**: To upload the AI-generated documentation.
- **Opening a PR**: To create the actual Pull Request link for you to review.

Even though it's your repository, an automated tool cannot "login" as you with a password; it uses a **Token** as a secure, scoped key.

## 2. Generate a Personal Access Token (Classic)

1.  Log in to your GitHub account.
2.  Go to **Settings** (top right profile icon -> Settings).
3.  On the left sidebar, scroll down to **Developer settings**.
4.  Click **Tokens (classic)** under **Personal access tokens**.
5.  Click **Generate new token** -> **Generate new token (classic)**.
6.  **Note**: Enter something like `DCEA-Automated-Docs`.
7.  **Expiration**: Choose your preferred duration (e.g., 30 or 90 days).
8.  **Select Scopes**: You MUST check the following:
    - [x] **repo** (Full control of private and public repositories)
9.  Scroll to the bottom and click **Generate token**.
10. **Copy the token immediately**. You won't be able to see it again!

## 3. Configure DCEA

Open your `.env` file in the project root and add your details:

```env
# Personal GitHub Credentials for PR Worker
GITHUB_USERNAME=your_github_username
GITHUB_TOKEN=ghp_your_secret_token_here
```

## 4. Troubleshooting

- **401 Unauthorized**: This means the token is invalid or has expired. Regenerate a new token and update your `.env`.
- **404 Not Found**: This usually happens if the token doesn't have the `repo` scope, or if the repository URL/name is incorrect.
- **403 Forbidden**: You might have reached API rate limits, or the token doesn't have write permissions for that specific repository.
