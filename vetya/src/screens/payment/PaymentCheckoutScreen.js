import React, { useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

/**
 * Pantalla de Checkout de Mercado Pago
 * Muestra el WebView con el checkout de Mercado Pago
 * Detecta las URLs de retorno para manejar el resultado del pago
 */
const PaymentCheckoutScreen = ({ route, navigation }) => {
  const params = route?.params ?? {};
  const { initPoint, emergenciaId, citaId, referenceType } = params;
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef(null);
  const destinationRoute = useMemo(() => {
    if (referenceType === 'emergencia' || emergenciaId) {
      return { name: 'MisEmergencias' };
    }

    if (referenceType === 'cita' || citaId) {
      return { name: 'MainTabs', params: { screen: 'Citas' } };
    }

    return null;
  }, [citaId, emergenciaId, referenceType]);

  const goToDestination = () => {
    if (destinationRoute) {
      navigation.navigate(destinationRoute.name, destinationRoute.params);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (!initPoint) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <Ionicons name="warning-outline" size={40} color="#F44336" />
          <Text style={styles.loadingText}>No se encontró el enlace de pago.</Text>
          <TouchableOpacity style={[styles.backButton, { marginTop: 16 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleNavigationStateChange = (navState) => {
    const { url, canGoBack } = navState;
    setCanGoBack(canGoBack);

    console.log('🌐 Navegación WebView:', url);

    if (typeof url !== 'string') {
      return;
    }

    // Detectar URLs de retorno de Mercado Pago
    if (url.includes('/pago-exitoso')) {
      setLoading(false);
      Alert.alert(
        '✅ Pago Reservado',
        'El pago ha sido reservado exitosamente. Se cobrará cuando confirmes que el servicio esté completado.',
        [
          {
            text: 'Entendido',
            onPress: () => {
              goToDestination();
            }
          }
        ]
      );
    } else if (url.includes('/pago-fallido')) {
      setLoading(false);
      Alert.alert(
        '❌ Pago Fallido',
        'No se pudo procesar el pago. Por favor, verifica tus datos e intenta nuevamente.',
        [
          {
            text: 'Reintentar',
            onPress: () => {
              // Recargar el WebView
              if (webViewRef.current) {
                webViewRef.current.reload();
              }
              setLoading(true);
            }
          },
          {
            text: 'Cancelar',
            onPress: () => navigation.goBack(),
            style: 'cancel'
          }
        ]
      );
    } else if (url.includes('/pago-pendiente')) {
      setLoading(false);
      Alert.alert(
        '⏳ Pago Pendiente',
        'Tu pago está siendo procesado. Recibirás una notificación cuando se complete.',
        [
          {
            text: 'Entendido',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      Alert.alert(
        'Cancelar pago',
        '¿Estás seguro de que quieres cancelar el pago?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Sí, cancelar', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagar con Mercado Pago</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Cargando checkout...</Text>
        </View>
      )}
      
      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: initPoint }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoad={() => {
          console.log('✅ WebView cargado');
          setLoading(false);
        }}
        onLoadStart={() => {
          console.log('🔵 WebView cargando...');
          setLoading(true);
        }}
        onLoadEnd={() => {
          console.log('✅ WebView finalizado');
          setLoading(false);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ Error en WebView:', nativeEvent);
          setLoading(false);
          Alert.alert(
            'Error',
            'No se pudo cargar el checkout de pago. Por favor, verifica tu conexión e intenta nuevamente.',
            [
              {
                text: 'Reintentar',
                onPress: () => {
                  if (webViewRef.current) {
                    webViewRef.current.reload();
                  }
                }
              },
              {
                text: 'Cancelar',
                onPress: () => navigation.goBack(),
                style: 'cancel'
              }
            ]
          );
        }}
        style={styles.webview}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  webview: {
    flex: 1
  }
});

export default PaymentCheckoutScreen;
