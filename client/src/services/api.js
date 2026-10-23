import axios from 'axios';

/**
 * Retrieve active JWT token from supported client storage locations
 */
export const getStoredToken = () => {
  try {
    return (
      localStorage.getItem('safepath_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('safepath_token') ||
      sessionStorage.getItem('token') ||
      null
    );
  } catch (err) {
    return null;
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Configure default Authorization header across all requests
 */
export const setAuthToken = (token) => {
  if (token) {
    const bearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    api.defaults.headers.common['Authorization'] = bearer;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize with any previously persisted session token
const initialToken = getStoredToken();
if (initialToken) {
  setAuthToken(initialToken);
}

// Request interceptor to dynamically inject latest JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      const bearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      if (config.headers?.set) {
        config.headers.set('Authorization', bearer);
      } else if (config.headers) {
        config.headers.Authorization = bearer;
        config.headers.authorization = bearer;
      }
    }

    // Let browser set multipart/form-data boundary automatically when submitting FormData
    if (config.data instanceof FormData) {
      if (config.headers?.delete) {
        config.headers.delete('Content-Type');
      } else if (config.headers) {
        delete config.headers['Content-Type'];
      }
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
  updateStatus: (id, status) => api.patch(`/reports/${id}/status`, { status }),
  reviewReport: (id, reviewData) => api.patch(`/reports/${id}/review`, reviewData),
  getAuditLogs: (params) => api.get('/reports/audit/logs', { params })
};

export const navigationAPI = {
  analyzeJourney: (source, destination) => api.post('/navigation', { source, destination })
};

export const healthAPI = {
  check: () => api.get('/health')
};

export default api;
