import axios from 'axios';

const isProduction = import.meta.env.MODE === 'production';

const api = axios.create({
  // En producción (Vercel), el frontend y backend comparten dominio, así que usamos ruta relativa.
  // En local, usamos localhost o lo que dicte el .env
  baseURL: isProduction ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('credisys_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente (ej: token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token es inválido o expiró, limpiar localStorage y redirigir
      localStorage.removeItem('credisys_token');
      localStorage.removeItem('credisys_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
