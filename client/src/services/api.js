import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopsphere_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto token refresh interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('shopsphere_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          const newAccessToken = res.data.data.accessToken;
          const newRefreshToken = res.data.data.refreshToken;
          localStorage.setItem('shopsphere_access_token', newAccessToken);
          localStorage.setItem('shopsphere_refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('shopsphere_access_token');
          localStorage.removeItem('shopsphere_refresh_token');
          localStorage.removeItem('shopsphere_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Products Endpoints
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
};

// Stores Endpoints
export const storesAPI = {
  getAll: () => api.get('/stores'),
  getById: (id) => api.get(`/stores/${id}`),
  getMyStore: () => api.get('/stores/my/profile'),
  updateMyStore: (data) => api.put('/stores/my/profile', data),
};

// Orders & Checkout Endpoints
export const ordersAPI = {
  checkout: (data) => api.post('/orders/checkout', data),
  getMyOrders: () => api.get('/orders/my'),
  getById: (id) => api.get(`/orders/${id}`),
  getSubOrderById: (subOrderId) => api.get(`/orders/suborders/${subOrderId}`),
  cancelSubOrder: (subOrderId) => api.put(`/orders/suborders/${subOrderId}/cancel`),
  raiseDispute: (subOrderId, data) => api.post(`/orders/suborders/${subOrderId}/dispute`, data),
};

// Seller Endpoints
export const sellerAPI = {
  getDashboard: () => api.get('/seller/dashboard'),
  getOrders: (params) => api.get('/seller/orders', { params }),
  updateOrderStatus: (subOrderId, data) => api.put(`/seller/orders/${subOrderId}/status`, data),
  getProducts: () => api.get('/seller/products'),
};

// Admin Endpoints
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getStores: (params) => api.get('/admin/stores', { params }),
  toggleStoreApproval: (storeId, data) => api.put(`/admin/stores/${storeId}/approval`, data),
  getProducts: () => api.get('/admin/products'),
  moderateProduct: (productId, data) => api.put(`/admin/products/${productId}/moderation`, data),
  getDisputes: () => api.get('/admin/disputes'),
};

// Support Endpoints
export const supportAPI = {
  getDisputes: (params) => api.get('/support/disputes', { params }),
  resolveDispute: (subOrderId, data) => api.put(`/support/disputes/${subOrderId}/resolve`, data),
};

// Delivery Endpoints
export const deliveryAPI = {
  getFeed: () => api.get('/delivery/feed'),
  claimShipment: (subOrderId) => api.put(`/delivery/claim/${subOrderId}`),
  updateStatus: (subOrderId, data) => api.put(`/delivery/orders/${subOrderId}/status`, data),
};

// AI Endpoints
export const aiAPI = {
  generateDescription: (data) => api.post('/ai/generate-description', data),
  semanticSearch: (query) => api.get('/ai/semantic-search', { params: { query } }),
};

// Upload Endpoints
export const uploadAPI = {
  uploadImage: (data) => api.post('/upload', data),
};

export default api;
