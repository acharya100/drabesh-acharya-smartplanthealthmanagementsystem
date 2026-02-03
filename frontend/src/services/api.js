/**
 * API Utility for Smart Plant Health Management System
 * 
 * Provides a central location for all backend service interactions.
 * Handles authentication headers, error responses, and resource-specific methods.
 * 
 * Author: Smart Plant Health Management System
 * Sprint: 3 - Plant and Disease Management
 */

import axios from 'axios';

// Base API configuration
const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add authorization token automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle token refresh and errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle unauthorized (401) with token refresh logic
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, {
                        refresh: refreshToken
                    });
                    localStorage.setItem('access_token', data.access);
                    originalRequest.headers.Authorization = `Bearer ${data.access}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, logout user
                    localStorage.clear();
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

// --- Auth Services ---
export const authService = {
    login: (credentials) => api.post('/auth/login/', credentials),
    register: (userData) => api.post('/auth/register/', userData),
    updateProfile: (data) => api.patch('/auth/update-profile/', data),
    changePassword: (data) => api.post('/auth/change-password/', data),
};

// --- Plant Services ---
export const plantService = {
    getAll: (params) => api.get('/plants/', { params }),
    getById: (id) => api.get(`/plants/${id}/`),
    getStatistics: () => api.get('/plants/statistics/'),
    getDiseases: (id) => api.get(`/plants/${id}/diseases/`),

    // Admin only
    create: (data) => api.post('/plants/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.patch(`/plants/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/plants/${id}/`),
};

// --- Disease Services ---
export const diseaseService = {
    getAll: (params) => api.get('/diseases/', { params }),
    getById: (id) => api.get(`/diseases/${id}/`),
    getTreatments: (id) => api.get(`/diseases/${id}/treatments/`),

    // Admin only
    create: (data) => api.post('/diseases/', data),
    update: (id, data) => api.patch(`/diseases/${id}/`, data),
    delete: (id) => api.delete(`/diseases/${id}/`),
};

// --- Treatment Services ---
export const treatmentService = {
    getAll: (params) => api.get('/diseases/treatments/', { params }),
    getById: (id) => api.get(`/diseases/treatments/${id}/`),
};

export default api;
