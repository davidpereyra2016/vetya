import React, { useEffect, useRef } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
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

// Configurar axios globalmente a nivel de módulo (inmediato, sin esperar useEffect)
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000; // 10 segundos
console.log('[App.js] baseURL configurada:', API_URL);

// Configurar el handler de notificaciones antes de renderizar
configurePushNotifications();

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

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
