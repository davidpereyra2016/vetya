// config/axios.js - Configuración centralizada de axios para toda la aplicación
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Callback para ejecutar logout cuando el token expire
let onTokenExpiredCallback = null;
// Flag para evitar múltiples ejecuciones del callback
let isHandlingExpiredToken = false;

// Función para configurar el callback de logout
export const setTokenExpiredCallback = (callback) => {
  onTokenExpiredCallback = callback;
  isHandlingExpiredToken = false; // Reset flag cuando se configura nuevo callback
};

// Función para resetear el flag (útil después de login exitoso)
export const resetTokenExpiredFlag = () => {
  isHandlingExpiredToken = false;
};

// ============================================================
// URL BASE DE LA API - ÚNICO LUGAR DONDE SE DEFINE
// Cambiar DEV_API_URL para desarrollo local
// Cambiar PROD_API_URL antes de publicar en Play Store / App Store
// ============================================================
const DEV_API_URL = 'http://192.168.100.146:3000/api';
const PROD_API_URL = 'https://api.vetya.com/api'; // Reemplazar con URL de producción

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// Crear instancia de axios con configuración centralizada
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para manejar tokens de autenticación
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Obtener datos de autenticación del storage
      const authData = await AsyncStorage.getItem('auth-storage');
      if (authData) {
        const parsedData = JSON.parse(authData);
        const { state } = parsedData;
        
        // Si existe un token en el estado, incluirlo en la solicitud
        if (state && state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    } catch (error) {
      console.error('Error al recuperar token de autenticación:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
axiosInstance.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response) {
      // Manejar errores 401 (token inválido/expirado)
      if (error.response.status === 401) {
        // Evitar múltiples ejecuciones del callback
        if (isHandlingExpiredToken) {
          return Promise.reject(error);
        }
        
        isHandlingExpiredToken = true;
        console.log('[API Error] Token inválido o expirado - ejecutando logout automático');
        
        // Ejecutar el callback de logout si está configurado
        if (onTokenExpiredCallback) {
          onTokenExpiredCallback();
        } else {
          // Fallback: solo limpiar storage si no hay callback
          try {
            await AsyncStorage.removeItem('auth-storage');
          } catch (storageError) {
            console.error('Error al limpiar storage:', storageError);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
