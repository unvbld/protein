import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle auth errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

//Auth API
export const auth = {
    login: (username, password) =>
        apiClient.post('/auth/login', { username, password }),
    logout: () => apiClient.post('/auth/logout'),
    getCurrentUser: () => apiClient.get('/auth/me')
};

// Products API
export const products = {
    getAll: (params) => apiClient.get('/products', { params }),
    getById: (id) => apiClient.get(`/products/${id}`),
    create: (data) => apiClient.post('/products', data),
    update: (id, data) => apiClient.put(`/products/${id}`, data),
    delete: (id) => apiClient.delete(`/products/${id}`),
    getCategories: () => apiClient.get('/products/categories')
};

// POS API
export const pos = {
    getProducts: (search) => apiClient.get('/pos/products', { params: { search } }),
    createOrder: (data) => apiClient.post('/pos/orders', data),
    getOrders: (params) => apiClient.get('/pos/orders', { params }),
    getOrderById: (id) => apiClient.get(`/pos/orders/${id}`)
};

// Dashboard API
export const dashboard = {
    getStats: () => apiClient.get('/dashboard/stats'),
    getSalesData: (period) => apiClient.get('/dashboard/sales', { params: { period } }),
    getTopProducts: (limit) => apiClient.get('/dashboard/top-products', { params: { limit } }),
    getLowStock: (threshold) => apiClient.get('/dashboard/low-stock', { params: { threshold } })
};

export default apiClient;
