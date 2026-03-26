/*
 * API Service Layer
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
 */
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle unauthorized (401) with token refresh logic
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = sessionStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, {
                        refresh: refreshToken
                    });
                    sessionStorage.setItem('access_token', data.access);
                    originalRequest.headers.Authorization = `Bearer ${data.access}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, logout user
                    sessionStorage.clear();
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
    delete: (id) => api.delete(`/predictions/${id}/`),
    update: (id, data) => api.patch(`/predictions/${id}/`, data),
};

// --- Admin Services ---
export const adminService = {
    getDashboard: () => api.get('/auth/admin/dashboard/'),
    getUsers: () => api.get('/auth/admin/users/'),
    getUserDetail: (userId) => api.get(`/auth/admin/users/${userId}/`),
    deleteUser: (userId) => api.delete(`/auth/admin/users/${userId}/`),
    getAllPredictions: () => api.get('/auth/admin/predictions/'),
    toggleStaff: (userId) => api.post(`/auth/admin/users/${userId}/toggle-staff/`),
};

// --- Ecommerce Services ---
export const eCommerceService = {
    getCategories: () => api.get('/ecommerce/categories/'),
    getProducts: (params) => api.get('/ecommerce/products/', { params }),
    getOrders: () => api.get('/ecommerce/orders/'),
    placeOrder: (orderData) => api.post('/ecommerce/orders/', orderData),
    // Reviews
    getReviews: (productId) => api.get('/ecommerce/reviews/', { params: { product: productId } }),
    submitReview: (reviewData) => api.post('/ecommerce/reviews/', reviewData),
    updateReview: (id, data) => api.patch(`/ecommerce/reviews/${id}/`, data),
    deleteReview: (id) => api.delete(`/ecommerce/reviews/${id}/`),
    // Saved Addresses
    getAddresses: () => api.get('/ecommerce/addresses/'),
    saveAddress: (data) => api.post('/ecommerce/addresses/', data),
    deleteAddress: (id) => api.delete(`/ecommerce/addresses/${id}/`),
    setDefaultAddress: (id) => api.post(`/ecommerce/addresses/${id}/set_default/`),
    // Disease Recommendations
    getRecommendations: (diseaseName) => api.get('/ecommerce/disease-mappings/recommendations/', { params: { disease_name: diseaseName } }),
};

export default api;
