import React, { useEffect, useRef } from 'react';
import { StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import axios from 'axios';

// Navegación
import AppNavigator from './src/navigation/AppNavigator';

// URL centralizada - se define ÚNICAMENTE en config/axios.js
import { API_URL } from './src/config/axios';

// Notificaciones push
import {
  configurePushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  handleNotificationReceived,
  handleNotificationResponse
} from './src/services/pushNotificationService';
import useAuthStore from './src/store/useAuthStore';
import useEmergencyStore from './src/store/useEmergencyStore';
import {
  connectEmergencySocket,
  disconnectEmergencySocket,
  onEmergencyUpdated
} from './src/services/socketService';

// Configurar axios globalmente a nivel de módulo (inmediato, sin esperar useEffect)
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000; // 10 segundos
if (!axios.__vetyaPaginationInterceptorId) {
  axios.__vetyaPaginationInterceptorId = axios.interceptors.response.use((response) => {
    if (Array.isArray(response.data?.data) && response.data?.pagination) {
      response.pagination = response.data.pagination;
      response.data = response.data.data;
    }
    return response;
  });
}
console.log('[App.js] baseURL configurada:', API_URL);

// Configurar el handler de notificaciones antes de renderizar
configurePushNotifications();

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    if (!token) {
      disconnectEmergencySocket();
      return () => {};
    }

    const setupEmergencyRealtime = async () => {
      const socket = await connectEmergencySocket();
      if (!isMounted || !socket) return;

      unsubscribe = onEmergencyUpdated((payload) => {
        const updatedEmergency = payload?.emergencia;
        if (!updatedEmergency) return;

        console.log('[App] Emergencia actualizada por socket:', {
          emergenciaId: payload?.emergenciaId || updatedEmergency?._id,
          eventType: payload?.eventType,
          estado: updatedEmergency?.estado,
        });

        useEmergencyStore.getState().applySocketEmergencyUpdate(updatedEmergency);
      });
    };

    setupEmergencyRealtime();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [token]);

  useEffect(() => {
    // Listener para notificaciones recibidas en primer plano
    notificationListener.current = addNotificationReceivedListener(handleNotificationReceived);

    // Listener para cuando el usuario toca una notificación
    responseListener.current = addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        style="auto" 
        backgroundColor="#1E88E5" 
        barStyle="light-content"
      />
      <AppNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
