/**
 * API Service Layer
 * 
 * This module acts as the bridge between our frontend UI and the backend Django server.
 * Instead of scattering fetch calls everywhere, we centralize them here.
 * 
 * Key Features:
 * 1. Automatic Token Management: Attaches your access token to every request.
 * 2. Smart Error Handling: Automatically tries to refresh your session if it expires.
 * 3. Organized Endpoints: Grouped by feature (Auth, Plants, Diseases, etc.) for easy maintenance.
 * 
 * Author: Drabesh Acharya
 */

import axios from 'axios';

// Base API configuration - points to our Django backend
const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request Interceptor
 * 
 * Before any request leaves the browser, this function runs.
 * It checks if we have a logged-in user (access_token exists) and stamps
 * the request with an Authorization header. This works like a VIP pass.
 */
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

/**
 * Response Interceptor
 * 
 * This function watches every response coming back from the server.
 * If everything is fine, it just passes the data through.
 * 
 * But if we get a 401 Unauthorized error (meaning the token expired),
 * it silently tries to use the refresh token to get a new access pass.
 * If successful, it retries the failed request so the user never notices.
 * If that fails too, it logs the user out for security.
 */
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
    getProfile: () => api.get('/auth/update-profile/'),
    updateProfile: (data) => api.post('/auth/update-profile/', data),
    changePassword: (data) => api.post('/auth/change-password/', data),
    deleteAccount: () => api.delete('/auth/delete-account/'),
    listUsers: () => api.get('/auth/list/'),
    switchUser: (userId) => api.post('/auth/switch/', { user_id: userId }),
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
    create: (data) => api.post('/diseases/treatments/', data),
    update: (id, data) => api.patch(`/diseases/treatments/${id}/`, data),
    delete: (id) => api.delete(`/diseases/treatments/${id}/`),
};

// --- AI & Prediction Services ---
export const predictionService = {
    identify: (formData) => api.post('/predictions/identify/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    detect: (formData) => api.post('/predictions/detect/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getHistory: () => api.get('/predictions/'),
    getDetails: (id) => api.get(`/predictions/${id}/`),
};

export default api;
