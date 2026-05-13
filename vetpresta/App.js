import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, StatusBar, Platform, LogBox, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import axios from 'axios';

// Navegación
import AppNavigator from './src/navigation/AppNavigator';

// Splash Screen personalizada
import AppSplashScreen from './src/screens/splash/SplashScreen';

// Estado global y configuración de autenticación
import useAuthStore from './src/store/useAuthStore';

// Notificaciones Push
import {
  configurePushNotifications,
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  handleNotificationReceived,
  handleNotificationResponse
} from './src/services/pushNotificationService';
import useNotificacionStore from './src/store/useNotificacionStore';

// URL centralizada - se define ÚNICAMENTE en config/axios.js
import { API_URL } from './src/config/axios';

// Configurar axios globalmente a nivel de módulo (inmediato, sin esperar useEffect)
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000;
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

export default function App() {
  // Estado para controlar la visibilidad de la pantalla de splash
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  
  // Referencias para los listeners de notificaciones
  const notificationListener = useRef();
  const responseListener = useRef();
  
  // Store de notificaciones
  const { updateUnreadCount } = useNotificacionStore();
  
  // La restauración del token se maneja en checkAuth() de useAuthStore
  // que lee directamente de AsyncStorage si Zustand persist aún no rehidrató
  useEffect(() => {
    console.log('[App.js] Inicialización completada - checkAuth manejará la restauración del token');
  }, []);
  
  // Configurar notificaciones push
  useEffect(() => {
    // Configurar el handler de notificaciones (cómo se muestran)
    configurePushNotifications();
    
    // Registrar para notificaciones push cuando el usuario esté autenticado
    const initializePushNotifications = async () => {
      const { token, isAuthenticated } = useAuthStore.getState();
      
      if (token && isAuthenticated) {
        console.log('🔔 Inicializando notificaciones push...');
        const pushToken = await registerForPushNotifications();
        
        if (pushToken) {
          console.log('✅ Token de push registrado:', pushToken);
        } else {
          console.log('⚠️ No se pudo obtener token de push (normal en Expo Go)');
        }
      }
    };
    
    initializePushNotifications();
    
    // Listener para notificaciones recibidas (app en primer plano)
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('📬 Notificación recibida:', notification);
      handleNotificationReceived(notification);
      // Actualizar conteo de no leídas
      updateUnreadCount();
    });
    
    // Listener para respuestas a notificaciones (usuario toca la notificación)
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario tocó notificación:', response);
      handleNotificationResponse(response);
    });
    
    // Cleanup al desmontar
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);
  
  // Ignorar advertencias específicas
  useEffect(() => {
    LogBox.ignoreLogs([
      'Constants.deviceId has been deprecated',
      'Constants.installationId has been deprecated',
      'expo-notifications', // Ignorar advertencias de notificaciones en desarrollo
    ]);
  }, []);
  
  // Manejar finalización de splash screen
  const handleSplashFinish = () => {
    setIsSplashVisible(false);
  };
  
  // Renderizar splash screen o navegación principal
  if (isSplashVisible) {
    return <AppSplashScreen onFinish={handleSplashFinish} />;
  }
  
  // Renderizar navegación principal
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
