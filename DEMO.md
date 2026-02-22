# 🎮 Demo Walkthrough (First Run)

Welcome to the **Documentation Consistency Enforcer**! This guide will help you test the core "Sync" functionality as a first-time user.

## 🏁 Prerequisites
1.  Verify the system is running using `docker ps`.
2.  Ensure you have followed [GITHUB_SETUP.md](./GITHUB_SETUP.md) and filled your `.env`.

---

## 🚀 Step 1: Access the Dashboard
Open your resident browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

You should see the futuristic **Command Hub**. At this stage, it will likely show "No Active Repositories".

---

## 🛠️ Step 2: Connect a Repository
1.  Click on the **"Protocols"** (Databases icon) tab in the navbar.
2.  Click **"Add Repository"**.
3.  Enter the URL of a GitHub repository you own or have push access to.
4.  The system will perform an initial scan of the codebase and its current `README.md`.

---

## 🧠 Step 3: Trigger an AI Sync
Now, let's see the agent in action.

1.  Open your IDE and make a significant change to a core function in your repository (e.g., change a return type or add a new mandatory parameter).
2.  **Commit and Push** the change to GitHub.
3.  Back in the Dashboard, navigate to the **"Sync Protocols"** tab.
4.  You will see a new entry appearing (e.g., `#SY-4091`).
5.  Click on it to see the **AI Analysis**:
    - The **DigitalOcean Gradient™ AI** will explain *why* the documentation is now inconsistent.
    - It will generate a **Unified Diff** to update the README.

---

## 📬 Step 4: Verification
1.  If the **Confidence** score is above 95%, a Pull Request will be automatically created on your GitHub repo.
2.  Check your repo's **Pull Requests** tab. You'll find a PR titled `[DOCS] Update documentation for core/config.py`.
3.  Review and merge!

---

## 🛡️ Troubleshooting
- **No Sync entries?**: Check the worker logs: `docker compose logs -f worker-webhook`.
- **Agent error?**: Verify your `GRADIENT_AGENT_URL` and `ACCESS_KEY` in the root `.env`.
