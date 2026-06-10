import axios from 'axios';

// ─── CONFIGURACIÓN DE URL DEL BACKEND ─────────────────────────────────────────
// Descomenta la URL que quieras usar y comenta la otra.
// Si usas VITE_API_BASE_URL en un archivo .env, esa tendrá prioridad.

// OPCIÓN 1: Backend Local (Para desarrollo en tu PC)
const API_URL = 'http://localhost:4000';

// OPCIÓN 2: Backend en Producción (Render)
// const API_URL = 'https://portal-web-t7bz.onrender.com';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add a request interceptor
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401s
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default client;
