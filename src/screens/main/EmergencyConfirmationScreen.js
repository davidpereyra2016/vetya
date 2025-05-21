import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const EmergencyConfirmationScreen = ({ navigation, route }) => {
  const { emergency } = route.params || {};
  
  // Usar datos de la emergencia o valores por defecto si no están disponibles
  const petInfo = emergency?.mascota || {};
  const vetInfo = emergency?.veterinario;
  const emergencyStatus = emergency?.estado || 'Solicitada';
  
  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animación de pulso para el círculo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        })
      ])
    ).start();
    
    // Animación de entrada para el contenido
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false
      }),
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false
        })
      )
    ]).start();
  }, []);
  
  // Convertir la animación de rotación a grados
  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.popToTop()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergencia en camino</Text>
      </View>
      
      {/* Contenido principal */}
      <View style={styles.content}>
        {/* Círculo de estado */}
        <View style={styles.statusCircleContainer}>
          <Animated.View 
            style={[
              styles.pulseCircle,
              { 
                transform: [{ scale: pulseAnim }],
                opacity: 0.3
              }
            ]} 
          />
          <View style={styles.statusCircle}>
            <Animated.View 
              style={[
                styles.iconWrapper,
                { transform: [{ rotate: spin }] }
              ]}
            >
              <Ionicons name="medkit" size={40} color="#fff" />
            </Animated.View>
          </View>
        </View>
        
        <Animated.View 
          style={[
            styles.infoContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>
            {emergencyStatus === 'Solicitada' && 'Solicitud enviada'}
            {emergencyStatus === 'Asignada' && 'Veterinario asignado'}
            {emergencyStatus === 'En camino' && 'Veterinario en camino'}
            {emergencyStatus === 'Atendida' && 'Emergencia atendida'}
            {emergencyStatus === 'Cancelada' && 'Emergencia cancelada'}
          </Text>
          <Text style={styles.subtitle}>
            {emergencyStatus === 'Solicitada' && 
              `Tu solicitud para ${petInfo?.nombre || 'tu mascota'} ha sido enviada y se está procesando`
            }
            {emergencyStatus === 'Asignada' && 
              `${vetInfo?.nombre || 'Un veterinario'} ha sido asignado para atender a ${petInfo?.nombre || 'tu mascota'}`
            }
            {emergencyStatus === 'En camino' && 
              `${vetInfo?.nombre || 'El veterinario'} está en camino para atender a ${petInfo?.nombre || 'tu mascota'}`
            }
            {emergencyStatus === 'Atendida' && 
              `La emergencia de ${petInfo?.nombre || 'tu mascota'} ha sido atendida exitosamente`
            }
            {emergencyStatus === 'Cancelada' && 
              'La solicitud de emergencia ha sido cancelada'
            }
          </Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="time-outline" size={24} color="#1E88E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tiempo estimado de llegada</Text>
                <Text style={styles.infoValue}>{vetInfo?.estimatedTime || '10-15 minutos'}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="cash-outline" size={24} color="#1E88E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Costo de la consulta</Text>
                <Text style={styles.infoValue}>${vetInfo?.precio || emergency?.precio || '50.000'}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location-outline" size={24} color="#1E88E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Dirección de atención</Text>
                <Text style={styles.infoValue}>Tu ubicación actual</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
      
      {/* Footer con botones */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={20} color="#1E88E5" style={styles.buttonIcon} />
          <Text style={styles.contactButtonText}>Llamar al veterinario</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {
            // Mostrar un diálogo de confirmación antes de cancelar
            alert('Esta acción podría generar un cargo por cancelación tardía. ¿Estás seguro de cancelar la emergencia?');
          }}
        >
          <Text style={styles.cancelButtonText}>Cancelar emergencia</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.popToTop()}
        >
          <Ionicons name="home" size={20} color="#555" style={styles.buttonIcon} />
          <Text style={styles.homeButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statusCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 40,
    height: 150,
    width: 150,
  },
  pulseCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4CAF50',
  },
  statusCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: width - 40,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  homeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    color: '#555',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default EmergencyConfirmationScreen;
