import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import RepositoriesPage from './pages/Repositories';
import DocumentationUpdatesPage from './pages/DocumentationUpdates';
import './index.css';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/repositories" element={<RepositoriesPage />} />
          <Route path="/updates" element={<DocumentationUpdatesPage />} />
          <Route path="/settings" element={<div className="flex items-center justify-center h-[60vh] text-4xl font-black glow-text animate-pulse">SYSTEM_CORE_LOCKED</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </QueryClientProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
