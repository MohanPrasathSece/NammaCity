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

// Attach auth token: prefer Clerk session token, else fallback to legacy localStorage
api.interceptors.request.use(async (config) => {
  try {
    // If Clerk is initialized on window, use its JWT
    const clerk = window.Clerk;
    if (clerk?.session) {
      const token = await clerk.session.getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
    }
  } catch (e) {
    // Swallow and fallback
  }
  const stored = localStorage.getItem('ua-user');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
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

// Service endpoints
export const serviceAPI = {
  getAll: (params = {}) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  getByCategory: (category, params = {}) => api.get(`/services/category/${category}`, { params }),
  getNearby: (lat, lng, radius = 5000) => api.get('/services/nearby', { params: { lat, lng, radius } }),
  search: (params = {}) => api.get('/services/search', { params }),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`)
};

// Booking endpoints
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (params = {}) => api.get('/bookings/my-bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  getServiceBookings: (serviceId, params = {}) => api.get(`/bookings/service/${serviceId}`, { params }),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status })
};


// Weather endpoints
export const weatherAPI = {
  getCurrent: (lat, lng) => api.get('/weather/current', { params: { lat, lng } }),
  getForecast: (days = 3) => api.get('/weather/forecast', { params: { days } })
};

export const chatAPI = {
  sendMessage: (message, history) => api.post('/chat', { message, history }),
};




export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getStats: () => api.get('/user/stats'),
};

// Issues (Civic Reporting) endpoints
export const issueAPI = {
  getAll: (params = {}) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  update: (id, data) => api.put(`/issues/${id}`, data),
  delete: (id) => api.delete(`/issues/${id}`),
};

// Safety Alerts endpoints
export const safetyAPI = {
  getAll: (params = {}) => api.get('/safety', { params }),
  getById: (id) => api.get(`/safety/${id}`),
  create: (data) => api.post('/safety', data),
  update: (id, data) => api.put(`/safety/${id}`, data),
  delete: (id) => api.delete(`/safety/${id}`),
};

// Accessibility Reports endpoints
export const accessibilityAPI = {
  getAll: (params = {}) => api.get('/accessibility', { params }),
  getById: (id) => api.get(`/accessibility/${id}`),
  create: (data) => api.post('/accessibility', data),
  update: (id, data) => api.put(`/accessibility/${id}`, data),
  delete: (id) => api.delete(`/accessibility/${id}`),
};

export default api;
