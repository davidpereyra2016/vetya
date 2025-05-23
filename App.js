import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import 'react-native-gesture-handler';
import axios from 'axios';

// Navegación
import AppNavigator from './src/navigation/AppNavigator';

// Splash Screen personalizada
import AppSplashScreen from './src/screens/splash/SplashScreen';

// Config para API
// IMPORTANTE: Usa la dirección IP de tu computadora, no localhost
// Para dispositivos físicos, usa la IP de tu red WiFi
// Para emuladores Android, 10.0.2.2 apunta a la máquina host
const API_URL = Platform.OS === 'android' 
  ? 'http://192.168.100.146:3000/api'  // Para emulador Android
  : 'http://192.168.100.146:3000/api';  // REEMPLAZA X con tu última posición IP

export default function App() {
  // Estado para controlar la visibilidad de la pantalla de splash
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  
  // Configurar axios globalmente
  useEffect(() => {
    // Configurar base URL
    axios.defaults.baseURL = API_URL;
    
    // Interceptor para manejar errores globalmente
    axios.interceptors.response.use(
      response => response,
      error => {
        console.log('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
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
