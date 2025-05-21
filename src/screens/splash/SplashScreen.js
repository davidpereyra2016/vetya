import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../styles/globalStyles';
import * as SplashScreen from 'expo-splash-screen';

// Mantener visible la splash screen nativa mientras se carga nuestra splash personalizada
SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

const AppSplashScreen = ({ onFinish }) => {
  // Animaciones
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const translateYAnim = new Animated.Value(20);

  useEffect(() => {
    // Esconder la splash screen nativa
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 300);

    // Iniciar las animaciones en secuencia
    Animated.sequence([
      // Aparecer y escalar el logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),

      // Esperar un momento con todo visible
      Animated.delay(1000),
    ]).start(() => {
      // Notificar que la splash screen ha terminado
      if (onFinish) {
        onFinish();
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim },
            ],
          },
        ]}
      >
        {/* Logo de la app - Reemplazar con el path correcto */}
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        {/* Nombre de la app */}
        <Animated.Text style={styles.title}>
          VetPresta!
        </Animated.Text>
        
        <Text style={styles.subtitle}>
          Veterinarios a domicilio
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
});

export default AppSplashScreen;
