import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/axios';
import useAuthStore from '../store/useAuthStore';

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
    console.log('[Socket] No hay token disponible para conectar');
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
      console.log('[Socket] Conectado:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.log('[Socket] Error de conexion:', error?.message || error);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Desconectado:', reason);
    });

    socket.on('socket:ready', (payload) => {
      console.log('[Socket] Ready:', payload);
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

export const onEmergencyListUpdated = (callback) => {
  if (!socket) return () => {};

  socket.on('emergencia:nueva', callback);
  socket.on('emergencia:lista-actualizada', callback);

  return () => {
    socket?.off('emergencia:nueva', callback);
    socket?.off('emergencia:lista-actualizada', callback);
  };
};

export const getEmergencySocket = () => socket;
