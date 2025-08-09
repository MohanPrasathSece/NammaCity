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

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) return Promise.reject(error.response.data);
    if (error.request) return Promise.reject({ message: 'Network error' });
    return Promise.reject({ message: error.message });
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
