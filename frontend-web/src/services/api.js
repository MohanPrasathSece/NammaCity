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

// Review endpoints
export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getServiceReviews: (serviceId, params = {}) => api.get(`/reviews/service/${serviceId}`, { params }),
  getMyReviews: (params = {}) => api.get('/reviews/my-reviews', { params }),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`)
};

// Weather endpoints
export const weatherAPI = {
  getCurrent: (lat, lng) => api.get('/weather/current', { params: { lat, lng } }),
  getForecast: (days = 3) => api.get('/weather/forecast', { params: { days } })
};

export const chatAPI = {
  sendMessage: async (msg, history) => {
    const HUGGINGFACE_TOKEN = process.env.REACT_APP_HUGGINGFACE_TOKEN;
    if (!HUGGINGFACE_TOKEN) {
      throw new Error('Hugging Face token is not configured. Please check your .env file and restart the server.');
    }

    const API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
    const PROXY_URL = 'https://cors.eu.org/';

    const past_user_inputs = history.filter(m => m.sender === 'user').map(m => m.text);
    const generated_responses = history.filter(m => m.sender === 'ai').map(m => m.text);

    const payload = {
      inputs: {
        past_user_inputs,
        generated_responses,
        text: msg,
      },
      options: {
        wait_for_model: true,
      },
    };

    const response = await fetch(PROXY_URL + API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get response from Hugging Face API.');
    }

    return { reply: data.generated_text };
  },
};


export const journalAPI = {
  getEntries: () => api.get('/journals/my'),
  createEntry: (entry) => api.post('/journals', entry),
  updateEntry: (id, entry) => api.put(`/journals/${id}`, entry),
  deleteEntry: (id) => api.delete(`/journals/${id}`),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getStats: () => api.get('/user/stats'),
};

export default api;
