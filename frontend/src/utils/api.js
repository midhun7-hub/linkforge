import axios from 'axios';

// Production-safe API URL resolution
// VITE_API_URL must be set at build time in production to prevent localhost fallback
const getApiUrl = () => {
  const envVar = import.meta.env.VITE_API_URL;
  const isProduction = import.meta.env.PROD;

  if (envVar) return envVar;

  if (isProduction) {
    throw new Error(
      '[LinkForge] VITE_API_URL environment variable is missing. ' +
      'Set VITE_API_URL in frontend/.env.production to the production backend URL ' +
      '(e.g., https://api.linkforge.example.com). Build will not proceed without it.'
    );
  }

  // Development fallback — warn but allow
  console.warn(
    '[LinkForge] VITE_API_URL not set. Using default http://localhost:5000. ' +
    'Create frontend/.env with VITE_API_URL=http://localhost:5000 to suppress this warning.'
  );
  return 'http://localhost:5000';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
