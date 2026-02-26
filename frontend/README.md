    # DCE Command Hub - Frontend

Premium AI-powered documentation management interface.

## Features
- **Glassmorphism UI**: High-end aesthetic with responsive layouts.
- **Dynamic Stats**: Real-time monitoring of repository health and PR success.
- **Sync Protocol**: One-click documentation analysis and generation.
- **Privacy Support**: Visual indicators for private vs public assets.
- **Authentication**: GitHub-integrated profile and plan management.

## Technology Stack
- **Framework**: React 18 (TypeScript)
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Fetching**: TanStack Query (React Query)

## Standalone Setup

### 1. Prerequisites
- Node.js 18+
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment
Copy `.env.example` to `.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_GITHUB_CLIENT_ID=your_client_id
```

### 4. Running the App
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## UI Guidelines
The project uses a custom design system based on:
- **Primary**: Accent Cyan (`#00F2FF`)
- **Secondary**: Accent Purple (`#9D4EDD`)
- **Accent**: Accent Neon (`#CCFF00`)
- **Background**: Deep Graphite (`#0A0B0E`)

---
*Created by the DCE Team.*
