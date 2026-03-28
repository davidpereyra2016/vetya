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
const baseURL = API_URL;

// Crear una instancia personalizada de axios
const instance = axios.create({
  baseURL,
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para manejar tokens de autenticación
instance.interceptors.request.use(
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
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - Token incluido`);
        } else {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - Sin token`);
        }
      } else {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - No hay datos de auth`);
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
instance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response) {
      console.log(`[API Error] ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.log(`[API Error] Mensaje:`, error.response.data?.message || error.message);
      
      // Manejar errores 401 (token inválido/expirado)
      if (error.response.status === 401) {
        // Evitar múltiples ejecuciones del callback
        if (isHandlingExpiredToken) {
          console.log('[API Error] Token expirado - ya se está manejando, ignorando');
          return Promise.reject(error);
        }
        
        isHandlingExpiredToken = true;
        console.log('[API Error] Token inválido o expirado - ejecutando logout automático');
        
        // Ejecutar el callback de logout si está configurado
        if (onTokenExpiredCallback) {
          console.log('[API Error] Ejecutando callback de logout');
          onTokenExpiredCallback();
        } else {
          // Fallback: solo limpiar storage si no hay callback
          console.log('[API Error] No hay callback de logout, limpiando storage manualmente');
          try {
            await AsyncStorage.removeItem('auth-storage');
          } catch (storageError) {
            console.error('Error al limpiar storage:', storageError);
          }
        }
      }
    } else {
      console.log(`[API Error] Error de red:`, error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
