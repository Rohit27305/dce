import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Response interceptor to handle the standard API response structure
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // Return only the 'data' part of our standard response if it exists
        if (response.data && response.data.success !== undefined) {
            return response.data.data;
        }
        return response.data;
    },
    (error) => {
        const errorDetail = error.response?.data?.message || error.message || 'An unexpected error occurred';
        console.error('API Error:', errorDetail);
        return Promise.reject(errorDetail);
    }
);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const dashboardService = {
    getOverviewMetrics: async () => {
        return await api.get('/metrics/dashboard');
    },
};

export const repositoryService = {
    getAllConnected: async () => {
        return await api.get('/repositories/');
    },
    connectRepository: async (repositoryData: any) => {
        return await api.post('/repositories/', repositoryData);
    },
    getGitHubInfo: async (url: string) => {
        return await api.post('/repositories/fetch-metadata', { url });
    },
    triggerSyncProtocol: async (repositoryId: string) => {
        return await api.post(`/repositories/${repositoryId}/analyze`);
    },
    disconnectRepository: async (repositoryId: string) => {
        return await api.delete(`/repositories/${repositoryId}`);
    }
};

export const updatesService = {
    getRecentSyncHistory: async () => {
        return await api.get('/documentation-updates/');
    },
    deleteUpdate: async (updateId: string) => {
        return await api.delete(`/documentation-updates/${updateId}`);
    },
    deleteAllUpdates: async () => {
        return await api.delete('/documentation-updates/all');
    },
};

export const authService = {
    login: async (credentials: FormData) => {
        const response = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/login`, credentials);
        return response.data;
    },
};

export default api;
