import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Callback para ejecutar logout cuando el token expire
let onTokenExpiredCallback = null;
// Flag para evitar multiples ejecuciones del callback
let isHandlingExpiredToken = false;

// Funcion para configurar el callback de logout
export const setTokenExpiredCallback = (callback) => {
  onTokenExpiredCallback = callback;
  isHandlingExpiredToken = false;
};

// Funcion para resetear el flag
export const resetTokenExpiredFlag = () => {
  isHandlingExpiredToken = false;
};

// ============================================================
// URL base de la API.
// EXPO_PUBLIC_API_URL permite cambiar el backend de produccion
// desde Expo/EAS sin volver a editar el codigo.
// ============================================================
const DEV_API_URL = 'http://192.168.100.146:3000/api';
const PROD_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.vetya.com/api';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
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
    try {
      const authData = await AsyncStorage.getItem('auth-storage');
      if (authData) {
        const parsedData = JSON.parse(authData);
        const { state } = parsedData;

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
      console.error('Error al recuperar token de autenticacion:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response) {
      console.log(`[API Error] ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.log('[API Error] Mensaje:', error.response.data?.message || error.message);

      if (error.response.status === 401) {
        if (isHandlingExpiredToken) {
          console.log('[API Error] Token expirado - ya se esta manejando, ignorando');
          return Promise.reject(error);
        }

        isHandlingExpiredToken = true;
        console.log('[API Error] Token invalido o expirado - ejecutando logout automatico');

        if (onTokenExpiredCallback) {
          console.log('[API Error] Ejecutando callback de logout');
          onTokenExpiredCallback();
        } else {
          console.log('[API Error] No hay callback de logout, limpiando storage manualmente');
          try {
            await AsyncStorage.removeItem('auth-storage');
          } catch (storageError) {
            console.error('Error al limpiar storage:', storageError);
          }
        }
      }
    } else {
      console.log('[API Error] Error de red:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
