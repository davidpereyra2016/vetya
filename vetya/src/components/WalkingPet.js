// src/components/WalkingPet.js
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Dimensions, View } from 'react-native';
import LottieView from 'lottie-react-native';

const { width: screenWidth } = Dimensions.get('window');

const WalkingPet = () => {
  // 1. Definimos una posición inicial fuera de la pantalla a la izquierda (-100)
  const xPosition = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // 2. Definimos la animación de movimiento
    const walkAnimation = Animated.timing(xPosition, {
      toValue: screenWidth + 100, // Se mueve hasta salir por la derecha
      duration: 10000, // Tiempo que tarda en cruzar (10 segundos)
      useNativeDriver: true, // ¡Crucial para el rendimiento!
    });

    // 3. Creamos un bucle infinito que reinicia la posición al principio
    const loopAnimation = Animated.loop(
      Animated.sequence([
        walkAnimation,
        Animated.timing(xPosition, { toValue: -100, duration: 0, useNativeDriver: true }), // Teletransporte al inicio
      ])
    );

    // 4. Iniciamos el bucle
    loopAnimation.start();

    // 5. Limpieza al desmontar el componente
    return () => loopAnimation.stop();
  }, [xPosition]);

  return (
    // 6. Usamos un Animated.View para que pueda moverse
    <Animated.View style={[styles.container, { transform: [{ translateX: xPosition }] }]}>
      <LottieView
        // 7. Ruta a tu archivo de animación Lottie
        source={require('../assets/animations/Moody_Dog.json')}
        autoPlay
        loop
        style={styles.animation}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 5, // Justo encima del "piso" visual de la app
    zIndex: 10, // Asegura que esté sobre el fondo gris pero bajo las tarjetas (opcional)
    width: 80, // Ancho sutil
    height: 80,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

export default WalkingPet;