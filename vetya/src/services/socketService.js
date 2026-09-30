import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/axios';
import useAuthStore from '../store/useAuthStore';
import logger from '../utils/logger';

let socket = null;

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

const getStoredToken = async () => {
  const storeToken = useAuthStore.getState()?.token;
  if (storeToken) return storeToken;

  const authData = await AsyncStorage.getItem('auth-storage');
  if (!authData) return null;

  const parsed = JSON.parse(authData);
  return parsed?.state?.token || null;
};

export const connectEmergencySocket = async () => {
  const token = await getStoredToken();
  if (!token) {
    logger.debug('[Socket] No hay token disponible para conectar');
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      logger.debug('[Socket] Conectado:', socket.id);
    });

    socket.on('connect_error', (error) => {
      logger.warn('[Socket] Error de conexion:', error?.message || error);
    });

    socket.on('disconnect', (reason) => {
      logger.debug('[Socket] Desconectado:', reason);
    });

    socket.on('socket:ready', (payload) => {
      logger.debug('[Socket] Ready:', payload);
    });
  } else {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
};

export const disconnectEmergencySocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onEmergencyUpdated = (callback) => {
  if (!socket) return () => {};
  socket.on('emergencia:actualizada', callback);
  return () => socket?.off('emergencia:actualizada', callback);
};

export const getEmergencySocket = () => socket;
