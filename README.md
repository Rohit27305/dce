# Documentation Consistency Engine (DCE)

AI-powered documentation orchestration for scale-ups. DCE monitors codebase drift, generates documentation updates, and maintains technical consistency automatically.

[![DCE Dashboard](https://img.shields.io/badge/UI-Premium_Glassmorphism-0c8da1)](http://localhost:3000)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-05998b)](http://localhost:8000/api/docs)
[![Repo Support](https://img.shields.io/badge/Repos-Public_%26_Private-7928ca)](http://localhost:3000/repositories)

## 🚀 Overview
DCE (formerly DCEA) is a high-performance system designed to solve the problem of "Documentation Rot." By monitoring GitHub repositories via webhooks and manual triggers, DCE uses advanced AI agents (powered by Gradient™) to analyze code changes and generate pull requests that update documentation in real-time.

---

## ✨ Features
- **Premium Real-time Dashboard**: Monitor repository health, PR success rates, and documentation stability with a state-of-the-art glassmorphism UI.
- **Private Repository Support**: Full integration with private GitHub repositories, including "PRIVATE" badges and secure token-based access.
- **"Sync Events" Stream**: A detailed history of AI-triggered documentation events with confidence scores and analysis reports.
- **AI Agent Orchestration**:
    - **Watcher**: Identifies documentation-relevant signals in the codebase.
    - **Impact Analyzer**: Maps code changes to specific documentation files using a knowledge graph.
    - **Content Generator**: Produces high-accuracy markdown updates with specialized prompts.
- **Automated PR Workflows**: Seamlessly creates branches and pull requests to keep documentation in sync.

---

## 🏗️ Technical Stack
- **Frontend**: React 18, TypeScript, Vite, Framer Motion, TanStack Query, Lucide Icons.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL.
- **AI Platform**: Gradient™ AI Platform.
- **Orchestration**: Redis (RQ/Queues), Docker, Docker Compose.

---

## 🏁 Local Setup Guide

### 1. Prerequisites
- Docker & Docker Compose
- GitHub Personal Access Token (with `repo` permissions)
- Gradient™ AI Platform credentials

### 2. Quick Install
```bash
# Clone the repository
git clone https://github.com/Rohit27305/dcea.git
cd dcea

# Set up environment variables
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Launch the Stack
```bash
docker-compose up --build
```
- **Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api/docs`
- **Sync History**: `http://localhost:3000/updates`

---

## 📖 Component Documentation
- [**Repository Setup & Integration**](REPOSITORY_SETUP.md) - How to connect your first repo.
- [**GitHub Secrets & PATs**](GITHUB_SETUP.md) - Enabling private repo support.
- [**Agent Orchestration Workflow**](AGENT_WORKFLOW.md) - Internal logic of AI collaboration.
- [**Agent Prompt Strategy**](AGENT_RESPONSES.md) - Technical details on the AI layer.
- [**Docker Deployment**](DOCKER.md) - Advanced container configuration.
- [**API Format Guide**](API_FORMAT_GUIDE.md) - Integrating with the DCE API.

---

## 🛡️ Security & Privacy
DCE is built with security in mind. All GitHub tokens are handled via environment variables and are nunca shared on the frontend. The system supports full end-to-end encryption for private repository analysis.

---
*Created with ❤️ by the Rohit27305 Team.*

