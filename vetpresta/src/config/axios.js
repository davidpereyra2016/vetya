import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

// Callback para ejecutar logout cuando el token expire
let onTokenExpiredCallback = null;
// Flag para evitar multiples ejecuciones del callback
let isHandlingExpiredToken = false;
let cachedAuthToken = null;
let hasLoadedTokenFromStorage = false;

// Funcion para configurar el callback de logout
export const setTokenExpiredCallback = (callback) => {
  onTokenExpiredCallback = callback;
  isHandlingExpiredToken = false;
};

// Funcion para resetear el flag
export const resetTokenExpiredFlag = () => {
  isHandlingExpiredToken = false;
};

export const setAuthToken = (token) => {
  cachedAuthToken = token || null;
  hasLoadedTokenFromStorage = true;

  if (cachedAuthToken) {
    instance.defaults.headers.common.Authorization = `Bearer ${cachedAuthToken}`;
  } else {
    delete instance.defaults.headers.common.Authorization;
  }
};

const getAuthToken = async () => {
  if (cachedAuthToken || hasLoadedTokenFromStorage) {
    return cachedAuthToken;
  }

  try {
    const authData = await AsyncStorage.getItem('auth-storage');
    const parsedData = authData ? JSON.parse(authData) : null;
    cachedAuthToken = parsedData?.state?.token || null;
    hasLoadedTokenFromStorage = true;
    return cachedAuthToken;
  } catch (error) {
    hasLoadedTokenFromStorage = true;
    logger.warn('Error al recuperar token de autenticacion:', error);
    return null;
  }
};

// ============================================================
// URL base de la API.
// EXPO_PUBLIC_API_URL permite cambiar el backend de produccion
// desde Expo/EAS sin volver a editar el codigo.
// ============================================================
const DEV_API_URL = 'http://192.168.1.5:3000/api';
const PROD_API_URL = 'https://vetya-backend.onrender.com/api';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_API_URL : PROD_API_URL);
const baseURL = API_URL;

const instance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

instance.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.network(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => {
    if (Array.isArray(response.data?.data) && response.data?.pagination) {
      response.pagination = response.data.pagination;
      response.data = response.data.data;
    }
    logger.network(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response) {
      logger.network(`[API Error] ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      logger.warn('[API Error] Mensaje:', error.response.data?.message || error.message);

      if (error.response.status === 401) {
        if (isHandlingExpiredToken) {
          logger.network('[API Error] Token expirado - ya se esta manejando, ignorando');
          return Promise.reject(error);
        }

        isHandlingExpiredToken = true;
        logger.warn('[API Error] Token invalido o expirado - ejecutando logout automatico');

        if (onTokenExpiredCallback) {
          logger.network('[API Error] Ejecutando callback de logout');
          onTokenExpiredCallback();
        } else {
          logger.network('[API Error] No hay callback de logout, limpiando storage manualmente');
          try {
            await AsyncStorage.removeItem('auth-storage');
          } catch (storageError) {
            logger.warn('Error al limpiar storage:', storageError);
          }
        }
      }
    } else {
      logger.warn('[API Error] Error de red:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
