import axios from 'axios';
import { API_URL } from '../config/axios';

// Crear una única instancia de axios para toda la aplicación
// URL se importa de config/axios.js (único lugar donde se define)
const axiosInstance = axios.create({
  baseURL: API_URL
});

// Variable para evitar múltiples redirects al login
let isRedirectingToLogin = false;

// Interceptor para manejar errores globalmente
axiosInstance.interceptors.response.use(
  response => {
    if (Array.isArray(response.data?.data) && response.data?.pagination) {
      response.pagination = response.data.pagination;
      response.data = response.data.data;
    }
    // Si la respuesta es exitosa, resetear el flag de redirect
    isRedirectingToLogin = false;
    return response;
  },
  error => {
    console.log('API Error:', error.response?.data || error.message);
    const shouldSkipTokenHandling = error.config?.skipTokenExpiredHandler === true;
    
    // Si es un error 401 y no estamos ya redirigiendo
    if (error.response?.status === 401 && !isRedirectingToLogin && !shouldSkipTokenHandling) {
      console.log('Token expirado detectado en axiosInstance, limpiando sesión...');
      isRedirectingToLogin = true;
      
      // Limpiar token de axiosInstance
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      // Resetear el flag después de un breve delay
      setTimeout(() => {
        isRedirectingToLogin = false;
      }, 1000);
    }
    
    return Promise.reject(error);
  }
);

// Función para configurar el token en las cabeceras
export const setupAxiosToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Token configurado en axiosInstance:', token.substring(0, 10) + '...');
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
    console.log('Token eliminado de axiosInstance');
  }
};

export default axiosInstance;
