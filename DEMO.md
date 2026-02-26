# 🎮 Demo Walkthrough (DCE)

Welcome to the **Documentation Consistency Engine (DCE)**! This guide will help you experience the full sync cycle—from repository connection to AI-generated Pull Requests.

---

## 🚀 Step 1: The Command Hub
Open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

Explore the **DCE Dashboard**:
- Observe the **Stat Cards** (Repositories, PRs Created, etc.).
- Notice the **Live Flow** activity stream on the right.
- Check your user profile by clicking the avatar in the top-right corner.

---

## 🛠️ Step 2: Connect your First Asset
1.  Navigate to the **Repositories** page via the sidebar (Database icon).
2.  Click **"Connect Repository"**.
3.  Enter a URL for a project you want to document (e.g., `https://github.com/your-user/your-repo`).
4.  Click **"Fetch"** followed by **"Confirm Connection"**.
5.  *Note: If it's a private repo, ensure your `GITHUB_TOKEN` is set in the backend env.*

---

## 🧠 Step 3: Trigger the Sync Protocol
Let's manually trigger the AI agents to analyze your repository.

1.  On the Repositories page, locate your new card.
2.  Click the **"Sync Protocol"** button (Refreshing arrows).
3.  In the modal, click **"Execute Sync"**.
4.  Switch to the **Sync Events** page (`http://localhost:3000/updates`).

---

## 📬 Step 4: AI Analysis & PR Creation
1.  In the **Sync Events** stream, you will see a new entry being processed.
2.  Once finished, click the card to expand the **Analysis Report**. The **Lead Impact Architect** agent will explain which files were affected.
3.  Click **"Review PR"**. This will take you directly to your GitHub repository where a new Pull Request has been created with the AI-generated documentation changes.
4.  Review the Markdown diff and **Merge** the PR!

---

## 🛡️ Support & Monitoring
- **Real-time Logs**: See the agents working in the terminal: `docker compose logs -f backend`.
- **Confidence Scores**: If an update has a low trust factor (< 70%), it will be flagged in the UI for mandatory manual review.

---
*DCE - Keeping code and docs in perfect synchronicity.*
