import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('safepath_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network communication error';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const areaAPI = {
  getAreas: () => api.get('/areas'),
  getAreaById: (id) => api.get(`/areas/${id}`)
};

export const reportAPI = {
  getReports: (params) => api.get('/reports', { params }),
  getReportById: (id) => api.get(`/reports/${id}`),
  createReport: (data) => api.post('/reports', data),
  updateStatus: (id, status) => api.patch(`/reports/${id}/status`, { status })
};

export const navigationAPI = {
  analyzeJourney: (source, destination) => api.post('/navigation', { source, destination })
};

export const healthAPI = {
  check: () => api.get('/health')
};

export default api;
