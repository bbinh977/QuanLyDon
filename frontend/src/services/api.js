import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  listUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  changePassword: (data) => api.put('/auth/me/password', data),
};

// Config
export const configAPI = {
  get: () => api.get('/config'),
  update: (data) => api.put('/config', data),
};

// Customers
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Orders
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  complete: (id) => api.put(`/orders/${id}/complete`),
};

// Finance
export const financeAPI = {
  getAll: (params) => api.get('/finance', { params }),
  getOne: (id) => api.get(`/finance/${id}`),
  create: (data) => api.post('/finance', data),
  update: (id, data) => api.put(`/finance/${id}`, data),
  delete: (id) => api.delete(`/finance/${id}`),
};

// Dashboard
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getRecentOrders: (params) => api.get('/dashboard/recent-orders', { params }),
  getTopCustomers: (params) => api.get('/dashboard/top-customers', { params }),
  getChartData: (params) => api.get('/dashboard/chart-data', { params }),
  getAlerts: (params) => api.get('/dashboard/alerts', { params }),
};

// Tracking
export const trackingAPI = {
  track: (code) => api.get(`/tracking/gianghuy/${code}`),
  syncOrder: (id) => api.put(`/tracking/sync-order/${id}`),
  syncAll: () => api.post('/tracking/sync-all'),
};

// AI
export const aiAPI = {
  generateInsight: (params) => api.post('/ai/insight', null, { params }),
  chat: (question, params) => api.post('/ai/chat', null, { params: { question, ...params } }),
};

export default api;