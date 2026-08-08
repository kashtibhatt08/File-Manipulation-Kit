import axios from 'axios';

const api = axios.create({
  baseURL: '', // Handled by Vite dev proxy in development
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
