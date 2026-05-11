import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { emergenciaService } from '../../services/api';
import useEmergencyStore from '../../store/useEmergencyStore';
import usePagoStore from '../../store/usePagoStore';

const { width } = Dimensions.get('window');

const EmergencyConfirmationScreen = ({ navigation, route }) => {
  const { 
    emergency, 
    emergencyData,
    vetInfo: initialVetInfo, 
    emergencyId, 
    petInfo: initialPetInfo, 
    emergencyDescription, 
    otroAnimalInfo: initialOtroAnimalInfo, 
    emergencyMode 
  } = route.params || {};
  
  // Determinar si es una emergencia para otro animal
  const esOtroAnimal = emergencyMode === 'otroAnimal';
  
  // Estados para manejar la carga y datos
  const [loading, setLoading] = useState(true);
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelingEmergency, setCancelingEmergency] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Efectivo');
  const [cashStatus, setCashStatus] = useState(null);
  const { obtenerEstadoEfectivoPrestador } = usePagoStore();
  
  // Efecto para cargar los detalles de la emergencia
  useEffect(() => {
    const loadEmergencyDetails = async () => {
      if (!emergencyId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await emergenciaService.getEmergencyDetails(emergencyId);
        if (response.success && response.data) {
          setEmergencyDetails(response.data);
        } else {
          console.error('No se pudieron cargar los detalles de la emergencia');
        }
      } catch (e) {
        console.error('Error al cargar detalles de la emergencia:', e);
      } finally {
        setLoading(false);
      }
    };
    
    loadEmergencyDetails();
  }, [emergencyId]);
  
  // Usar datos de la emergencia o valores por defecto si no están disponibles
  const petInfo = esOtroAnimal ? null : (emergencyDetails?.mascota || initialPetInfo || {});
  const otroAnimalInfo = esOtroAnimal ? (emergencyDetails?.otroAnimal || initialOtroAnimalInfo || {}) : null;
  const vetInfo = {
    ...(initialVetInfo || {}),
    ...(emergencyDetails?.veterinario || {})
  };
  const veterinarianId = vetInfo?._id || vetInfo?.id;
  const initialCanAcceptCash = vetInfo?.canAcceptCash ?? vetInfo?.can_accept_cash ?? true;
  const canUseCash = (cashStatus?.canAcceptCash ?? initialCanAcceptCash) !== false;
  const emergencyStatus = emergencyDetails?.estado || 'Solicitada';
  const emergencyIdToUse = emergencyDetails?._id || emergencyId;
  
  // Información del animal para mostrar (sea mascota registrada u otro animal)
  const animalInfo = esOtroAnimal ? otroAnimalInfo : petInfo;
  
  // Costo y tiempo estimado
  const emergencyCost = vetInfo?.precioEmergencia ?? vetInfo?.price ?? emergency?.precioEmergencia ?? 0;
  const estimatedTime = initialVetInfo?.estimatedTime || emergencyDetails?.tiempoEstimado?.texto || vetInfo?.tiempoEstimado?.texto || 'Calculando...';
  const emergencyAddress = emergencyDetails?.ubicacion?.direccion || emergency?.ubicacion?.direccion || emergencyData?.ubicacion?.direccion || 'Tu ubicación actual';
  
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

  useEffect(() => {
    const loadCashStatus = async () => {
      if (!veterinarianId) return;

      const result = await obtenerEstadoEfectivoPrestador(veterinarianId);
      if (result.success) {
        setCashStatus(result.data);
        if (result.data?.canAcceptCash === false) {
          setSelectedPaymentMethod('MercadoPago');
        }
      }
    };

    loadCashStatus();
  }, [veterinarianId]);

  useEffect(() => {
    if (!canUseCash && selectedPaymentMethod === 'Efectivo') {
      setSelectedPaymentMethod('MercadoPago');
    }
  }, [canUseCash, selectedPaymentMethod]);
  
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
      
      {/* Contenido principal con ScrollView */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            {emergencyStatus === 'Solicitada' && (
              esOtroAnimal
                ? `Tu solicitud para ${animalInfo?.descripcionAnimal || 'el animal'} ha sido enviada y se está procesando`
                : `Tu solicitud para ${animalInfo?.nombre || 'tu mascota'} ha sido enviada y se está procesando`
            )}
            {emergencyStatus === 'Asignada' && (
              esOtroAnimal
                ? `${vetInfo?.nombre || 'Un veterinario'} ha sido asignado para atender al ${animalInfo?.descripcionAnimal || 'animal'}`
                : `${vetInfo?.nombre || 'Un veterinario'} ha sido asignado para atender a ${animalInfo?.nombre || 'tu mascota'}`
            )}
            {emergencyStatus === 'En camino' && (
              esOtroAnimal
                ? `${vetInfo?.nombre || 'El veterinario'} está en camino para atender al ${animalInfo?.descripcionAnimal || 'animal'}`
                : `${vetInfo?.nombre || 'El veterinario'} está en camino para atender a ${animalInfo?.nombre || 'tu mascota'}`
            )}
            {emergencyStatus === 'Atendida' && (
              esOtroAnimal
                ? `La emergencia del ${animalInfo?.descripcionAnimal || 'animal'} ha sido atendida exitosamente`
                : `La emergencia de ${animalInfo?.nombre || 'tu mascota'} ha sido atendida exitosamente`
            )}
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
                <Text style={styles.infoValue}>{estimatedTime}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="cash-outline" size={24} color="#1E88E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Costo de la consulta</Text>
                <Text style={styles.infoValue}>${typeof emergencyCost === 'number' ? emergencyCost.toLocaleString() : emergencyCost}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location-outline" size={24} color="#1E88E5" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Dirección de atención</Text>
                <Text style={styles.infoValue}>{emergencyAddress}</Text>
              </View>
            </View>
          </View>
          
          {/* Selección de método de pago */}
          {emergencyStatus === 'Solicitada' && (
            <View style={styles.paymentMethodCard}>
              <Text style={styles.paymentMethodTitle}>Método de Pago</Text>
              <Text style={styles.paymentMethodSubtitle}>Selecciona cómo deseas pagar el servicio</Text>
              
              <TouchableOpacity 
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'Efectivo' && styles.paymentOptionSelected,
                  !canUseCash && styles.paymentOptionDisabled
                ]}
                onPress={() => canUseCash && setSelectedPaymentMethod('Efectivo')}
                disabled={!canUseCash}
              >
                <View style={styles.paymentOptionContent}>
                  <Ionicons 
                    name="cash-outline" 
                    size={28} 
                    color={selectedPaymentMethod === 'Efectivo' ? '#1E88E5' : '#666'} 
                  />
                  <View style={styles.paymentOptionText}>
                    <Text style={[
                      styles.paymentOptionTitle,
                      selectedPaymentMethod === 'Efectivo' && styles.paymentOptionTitleSelected
                    ]}>Efectivo</Text>
                    <Text style={styles.paymentOptionDescription}>
                      {canUseCash ? 'Pagas al veterinario cuando llegue' : 'No disponible por deuda de comisiones del veterinario'}
                    </Text>
                  </View>
                </View>
                {selectedPaymentMethod === 'Efectivo' && (
                  <Ionicons name="checkmark-circle" size={24} color="#1E88E5" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'MercadoPago' && styles.paymentOptionSelected
                ]}
                onPress={() => setSelectedPaymentMethod('MercadoPago')}
              >
                <View style={styles.paymentOptionContent}>
                  <Ionicons 
                    name="card-outline" 
                    size={28} 
                    color={selectedPaymentMethod === 'MercadoPago' ? '#1E88E5' : '#666'} 
                  />
                  <View style={styles.paymentOptionText}>
                    <Text style={[
                      styles.paymentOptionTitle,
                      selectedPaymentMethod === 'MercadoPago' && styles.paymentOptionTitleSelected
                    ]}>Mercado Pago</Text>
                    <Text style={styles.paymentOptionDescription}>
                      Pago seguro con tarjeta o saldo
                    </Text>
                  </View>
                </View>
                {selectedPaymentMethod === 'MercadoPago' && (
                  <Ionicons name="checkmark-circle" size={24} color="#1E88E5" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
      
      {/* Footer con botones */}
      <Animated.View 
        style={[
          styles.footer,
          { opacity: fadeAnim }
        ]}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#1E88E5" />
        ) : (
          <>
            <TouchableOpacity 
              style={styles.confirmButton || styles.contactButton}
              onPress={async () => {
                if ((!emergencyIdToUse && !emergencyData) || !vetInfo) {
                  Alert.alert('Error', 'No se puede procesar la solicitud sin datos de emergencia o información del veterinario');
                  return;
                }
                
                try {
                  setConfirming(true);
                  
                  let finalEmergencyId = emergencyIdToUse;
                  // Primero verificamos el estado actual de la emergencia
                  let currentEmergencyStatus = emergencyStatus;

                  if (!finalEmergencyId && emergencyData) {
                    const { createEmergency } = useEmergencyStore.getState();
                    const createResult = await createEmergency(emergencyData);

                    if (!createResult.success || !createResult.data?._id) {
                      Alert.alert('Error', createResult.error || 'No se pudo crear la emergencia');
                      return;
                    }

                    finalEmergencyId = createResult.data._id;
                    currentEmergencyStatus = createResult.data.estado || 'Solicitada';
                  }
                  
                  // Si es necesario, consultamos el estado actual desde el backend
                  if (finalEmergencyId) {
                    try {
                      const emergencyDetailsResponse = await emergenciaService.getEmergencyDetails(finalEmergencyId);
                      if (emergencyDetailsResponse.success && emergencyDetailsResponse.data) {
                        currentEmergencyStatus = emergencyDetailsResponse.data.estado;
                        // console.log(`Estado actual de la emergencia: ${currentEmergencyStatus}`);
                      }
                    } catch (detailError) {
                      console.error('Error al verificar estado de emergencia:', detailError);
                      // Continuamos con el estado que tenemos disponible
                    }
                  }
                  
                  // Si la emergencia está en estado 'Solicitada' (lo que implica que ya se seleccionó un vet en la pantalla anterior)
                  // o si ya está 'Asignada' (por algún otro flujo o re-entrada a la pantalla),
                  // procedemos a confirmar el servicio.
                  if ((currentEmergencyStatus === 'Solicitada' && vetInfo) || currentEmergencyStatus === 'Asignada' || currentEmergencyStatus === 'En camino') {
                    if (selectedPaymentMethod === 'Efectivo' && !canUseCash) {
                      Alert.alert('Efectivo no disponible', 'Este veterinario debe regularizar comisiones pendientes y por ahora solo puede recibir pagos con Mercado Pago.');
                      return;
                    }
                    // console.log(`Confirmando servicio para emergencia ${emergencyIdToUse} en estado ${currentEmergencyStatus}...`);
                    // console.log(`Método de pago seleccionado: ${selectedPaymentMethod}`);
                    const veterinarianId = vetInfo?._id || vetInfo?.id;
                    const result = await emergenciaService.confirmEmergencyService(
                      finalEmergencyId,
                      selectedPaymentMethod,
                      veterinarianId
                    );
                    
                    if (result.success) {
                      // Actualizar el estado localmente si es necesario, o confiar en la navegación y recarga de datos.
                      // Por ahora, asumimos que la navegación a Inicio recargará los estados.
                      Alert.alert(
                        'Solicitud Enviada',
                        'Tu solicitud ha sido enviada al veterinario. Recibirás una notificación cuando el veterinario confirme el servicio. Puedes ver el estado en la pantalla principal.',
                        [{ text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Inicio' }) }]
                      );
                    } else {
                      Alert.alert('Error de Confirmación', result.error || 'No se pudo confirmar el servicio de emergencia. Por favor, inténtalo de nuevo.');
                    }
                  } else {
                    // Estado no reconocido o incompatible, o falta vetInfo si está Solicitada.
                    Alert.alert('Acción no disponible', `La emergencia está en estado ${currentEmergencyStatus}. No se puede confirmar en este momento o falta información del veterinario.`);
                  }
                } catch (error) {
                  console.error('Error en la confirmación:', error);
                  Alert.alert('Error', 'Ocurrió un problema al procesar tu solicitud. Verifica el estado de la emergencia.');
                } finally {
                  setConfirming(false);
                }
              }}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.contactButtonText}>
                    {(emergencyStatus === 'Solicitada' && vetInfo) ? 'Enviar Solicitud al Veterinario' : 
                     (emergencyStatus === 'Asignada') ? 'Esperando Confirmación del Vet.' : 
                     (emergencyStatus === 'Confirmada' || emergencyStatus === 'En camino') ? 'Ver Progreso' : 'Enviar Solicitud'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={async () => {
                if (!emergencyIdToUse) {
                  navigation.navigate('MainTabs', { screen: 'Inicio' });
                  return;
                }
                
                Alert.alert(
                  'Cancelar Emergencia',
                  '¿Estás seguro de que deseas cancelar esta emergencia?',
                  [
                    { text: 'No', style: 'cancel' },
                    { 
                      text: 'Sí, cancelar', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          setCancelingEmergency(true);
                          const { cancelEmergency } = useEmergencyStore.getState();
                          const result = await cancelEmergency(emergencyIdToUse);
                          
                          if (result.success) {
                            Alert.alert(
                              'Emergencia Cancelada', 
                              'La solicitud de emergencia ha sido cancelada.',
                              [{ text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Inicio' }) }]
                            );
                          } else {
                            Alert.alert('Error', result.error || 'No se pudo cancelar la emergencia');
                          }
                        } catch (error) {
                          console.error('Error al cancelar emergencia:', error);
                          Alert.alert('Error', 'Ocurrió un error al cancelar la emergencia');
                        } finally {
                          setCancelingEmergency(false);
                        }
                      }
                    }
                  ]
                );
              }}
              disabled={cancelingEmergency}
            >
              {cancelingEmergency ? (
                <ActivityIndicator size="small" color="#F44336" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancelar emergencia</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => navigation.popToTop()}
            >
              <Ionicons name="home" size={20} color="#555" style={styles.buttonIcon} />
              <Text style={styles.homeButtonText}>Volver al inicio</Text>
            </TouchableOpacity>
          </>
        )}
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
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 30,//Radio de la esquina inferior izquierda
    borderBottomRightRadius: 30,//Radio de la esquina inferior derecha
    
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  content: {
    flex: 1,
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
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
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
  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: width - 40,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 200,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  paymentOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1E88E5',
  },
  paymentOptionDisabled: {
    opacity: 0.55,
    backgroundColor: '#F1F5F9',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: 15,
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentOptionTitleSelected: {
    color: '#1E88E5',
  },
  paymentOptionDescription: {
    fontSize: 13,
    color: '#666',
  },
});

export default EmergencyConfirmationScreen;
