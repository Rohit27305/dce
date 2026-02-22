import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const dashboardService = {
    getMetrics: async () => {
        const { data } = await api.get('/metrics/dashboard');
        return data;
    },
};

export const repositoryService = {
    list: async () => {
        const { data } = await api.get('/repositories/');
        return data;
    },
    create: async (repoData: any) => {
        const { data } = await api.post('/repositories/', repoData);
        return data;
    },
    analyze: async (repoId: string) => {
        const { data } = await api.post(`/repositories/${repoId}/analyze`);
        return data;
    },
};

export const updatesService = {
    list: async () => {
        const { data } = await api.get('/documentation-updates/');
        return data;
    },
};

export default api;
