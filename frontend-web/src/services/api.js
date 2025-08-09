import axios from 'axios';

// Base URL for your backend server
const BASE_URL = 'http://localhost:3000/api';

// Axios instance with sane defaults
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT automatically when present in localStorage
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('ua-user');
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.config.method.toUpperCase(), response.config.url);
    return response.data;
  },
  (error) => {
    console.error('❌ API Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      fullError: error
    });
    
    // Network error
    if (!error.response) {
      console.error('🔌 Network Error: Backend server may be down or unreachable');
      console.error('🔍 Check if backend is running on http://localhost:3000');
      return Promise.reject(new Error('Network error: Cannot connect to server'));
    }
    
    // Server error
    const message = error.response?.data?.message || error.message || 'Server error';
    return Promise.reject(new Error(message));
  }
);

// ------- Endpoints wrappers ---------
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (body) => api.post('/auth/signup', body),
  logout: () => api.post('/auth/logout'),
};

export const servicesAPI = {
  getServices: (location) => api.get('/services', { params: { location } }),
  getServiceById: (id) => api.get(`/services/${id}`),
  searchServices: (query) => api.get('/services/search', { params: { q: query } }),
};

export const chatAPI = {
  sendMessage: (message) => api.post('/chat', { message }),
  getChatHistory: () => api.get('/chat/history'),
};

export const journalAPI = {
  getEntries: () => api.get('/journal'),
  createEntry: (entry) => api.post('/journal', entry),
  updateEntry: (id, entry) => api.put(`/journal/${id}`, entry),
  deleteEntry: (id) => api.delete(`/journal/${id}`),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getStats: () => api.get('/user/stats'),
};

export default api;
