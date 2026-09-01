/*
 * API Service Layer
 */

import axios from 'axios';
import { toCamel, toSnake } from '../utils/caseTransformer';

// Base API configuration - points to our Django backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

        // Transform data to snake_case for the backend
        if (config.data && !(config.data instanceof FormData)) {
            config.data = toSnake(config.data);
        }

        // Transform params to snake_case for the backend
        if (config.params) {
            config.params = toSnake(config.params);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 */
api.interceptors.response.use(
    (response) => {
        // Transform data to camelCase for the frontend
        if (response.data && response.headers['content-type']?.includes('application/json')) {
            response.data = toCamel(response.data);
        }
        return response;
    },
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

export const authService = {
    login: (credentials) => api.post('/auth/login/', credentials),
    register: (userData) => api.post('/auth/register/', userData),
    forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
    verifyOtp: (email, code) => api.post('/auth/verify-otp/', { email, code }),
    resetPassword: (email, code, newPassword) => api.post('/auth/reset-password/', { email, code, newPassword }),
    sendPhoneOtp: (phoneNumber) => api.post('/auth/send-phone-otp/', { phoneNumber }),
    verifyPhoneOtp: (phoneNumber, code) => api.post('/auth/verify-phone-otp/', { phoneNumber, code }),
    getProfile: () => api.get('/auth/update-profile/'),
    updateProfile: (data) => api.post('/auth/update-profile/', data),
    changePassword: (data) => api.post('/auth/change-password/', data),
    deleteAccount: (password) => api.delete('/auth/delete-account/', { data: { password } }),
    listUsers: () => api.get('/auth/list/'),
    switchUser: (userId) => api.post('/auth/switch/', { userId }),
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
    // User management
    getDashboard: () => api.get('/auth/admin/dashboard/'),
    getUsers: () => api.get('/auth/admin/users/'),
    getUserDetail: (userId) => api.get(`/auth/admin/users/${userId}/`),
    getAllPlants: () => api.get('/auth/admin/plants/'),
    deleteUser: (userId) => api.delete(`/auth/admin/users/${userId}/`),
    getAllPredictions: () => api.get('/auth/admin/predictions/'),
    toggleStaff: (userId) => api.post(`/auth/admin/users/${userId}/toggle-staff/`),
    // E-Commerce management
    getEcommerceOverview: () => api.get('/auth/admin/ecommerce/overview/'),
    adminGetAllOrders: () => api.get('/ecommerce/orders/'),
    updateOrderStatus: (orderId, data) => api.patch(`/auth/admin/orders/${orderId}/update-status/`, data),
    // Admin product CRUD (uses ecommerce endpoints with admin token)
    adminGetAllProducts: (params) => api.get('/ecommerce/products/', { params: { ...params, pageSize: 200 } }),
    adminCreateProduct: (formData) => api.post('/ecommerce/products/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    adminUpdateProduct: (id, formData) => api.patch(`/ecommerce/products/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    adminDeleteProduct: (id) => api.delete(`/ecommerce/products/${id}/`),
    adminDeleteOrder: (id) => api.delete(`/ecommerce/orders/${id}/`),
    // Admin coupons
    adminGetCoupons: () => api.get('/ecommerce/coupons/'),
    adminCreateCoupon: (data) => api.post('/ecommerce/coupons/', data),
    adminUpdateCoupon: (id, data) => api.patch(`/ecommerce/coupons/${id}/`, data),
    adminDeleteCoupon: (id) => api.delete(`/ecommerce/coupons/${id}/`),
    // Admin reviews
    adminGetAllReviews: (params) => api.get('/ecommerce/reviews/', { params }),
    adminDeleteReview: (id) => api.delete(`/ecommerce/reviews/${id}/`),
    adminApproveReview: (id) => api.post(`/ecommerce/reviews/${id}/approve/`),
    approveReview: (id) => api.post(`/ecommerce/reviews/${id}/approve/`),
    // Admin categories
    adminGetCategories: () => api.get('/ecommerce/categories/'),
    // Coupon aliases (for backward compatibility with AdminPanel)
    createCoupon: (data) => api.post('/ecommerce/coupons/', data),
    updateCoupon: (id, data) => api.patch(`/ecommerce/coupons/${id}/`, data),
};

// --- Ecommerce Services ---
export const eCommerceService = {
    // Products
    getCategories: () => api.get('/ecommerce/categories/'),
    getProducts: (params) => api.get('/ecommerce/products/', { params }),
    getProductById: (id) => api.get(`/ecommerce/products/${id}/`),
    getFeaturedProducts: () => api.get('/ecommerce/products/featured/'),
    getRelatedProducts: (id) => api.get(`/ecommerce/products/${id}/related/`),
    getLowStockProducts: () => api.get('/ecommerce/products/low_stock/'),
    // Orders
    getOrders: () => api.get('/ecommerce/orders/'),
    getOrderById: (id) => api.get(`/ecommerce/orders/${id}/`),
    placeOrder: (orderData) => api.post('/ecommerce/orders/', orderData),
    cancelOrder: (id) => api.post(`/ecommerce/orders/${id}/cancel/`),
    getAnalytics: () => api.get('/ecommerce/orders/analytics/'),
    // Reviews
    getReviews: (productId) => api.get('/ecommerce/reviews/', { params: { product: productId } }),
    submitReview: (reviewData) => api.post('/ecommerce/reviews/', reviewData),
    getMyReview: (productId) => api.get('/ecommerce/reviews/my_review/', { params: { product: productId } }),
    updateReview: (id, data) => api.patch(`/ecommerce/reviews/${id}/`, data),
    deleteReview: (id) => api.delete(`/ecommerce/reviews/${id}/`),
    // Saved Addresses
    getAddresses: () => api.get('/ecommerce/addresses/'),
    saveAddress: (data) => api.post('/ecommerce/addresses/', data),
    deleteAddress: (id) => api.delete(`/ecommerce/addresses/${id}/`),
    setDefaultAddress: (id) => api.post(`/ecommerce/addresses/${id}/set_default/`),
    // Wishlist
    getWishlist: () => api.get('/ecommerce/wishlist/'),
    getWishlistIds: () => api.get('/ecommerce/wishlist/ids/'),
    toggleWishlist: (productId) => api.post('/ecommerce/wishlist/toggle/', { productId }),
    // Coupons
    validateCoupon: (code, orderTotal) => api.post('/ecommerce/coupons/validate/', { code, orderTotal }),
    getCoupons: () => api.get('/ecommerce/coupons/'),
    createCoupon: (data) => api.post('/ecommerce/coupons/', data),
    updateCoupon: (id, data) => api.patch(`/ecommerce/coupons/${id}/`, data),
    deleteCoupon: (id) => api.delete(`/ecommerce/coupons/${id}/`),
    // Notifications
    getNotifications: () => api.get('/ecommerce/notifications/'),
    getUnreadCount: () => api.get('/ecommerce/notifications/unread_count/'),
    markNotificationRead: (id) => api.post(`/ecommerce/notifications/${id}/mark_read/`),
    markAllRead: () => api.post('/ecommerce/notifications/mark_all_read/'),
};

// --- Chat Services ---
export const chatService = {
    getRooms: () => api.get('/chat/rooms/'),
    getRoom: (id) => api.get(`/chat/rooms/${id}/`),
    createRoom: (data) => api.post('/chat/rooms/', data),
    getRoomMessages: (id) => api.get(`/chat/rooms/${id}/messages/`),
    sendMessage: (id, content) => api.post(`/chat/rooms/${id}/send/`, { content }),
    updateRoom: (id, data) => api.patch(`/chat/rooms/${id}/`, data),
    deleteRoom: (id) => api.delete(`/chat/rooms/${id}/`),
    getPendingRooms: () => api.get('/chat/rooms/pending/'),
};

// --- Soil Analysis Services ---
export const soilService = {
    analyze: (data) => api.post('/soil/analyze/', data),
    quickAnalyze: (data) => api.post('/soil/quick_analyze/', data),
    getHistory: () => api.get('/soil/'),
    getAnalysis: (id) => api.get(`/soil/${id}/`),
    deleteHistory: (id) => api.delete(`/soil/${id}/`),
};

export default api;
