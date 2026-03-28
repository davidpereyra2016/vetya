import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/globalStyles';
import useAuthStore from '../../store/useAuthStore';
import useEmergencyStore from '../../store/useEmergencyStore';
import usePagoStore from '../../store/usePagoStore';
import * as Location from 'expo-location';

// En un proyecto real, importaríamos el componente de MapView
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');

const EmergencyDetailsScreen = ({ navigation, route }) => {
  // Obtener la emergencia pasada como parámetro desde la pantalla anterior
  const { emergency, emergencyId } = route.params || {};
  
  // Estados para el manejo de datos y UI
  const [loading, setLoading] = useState(true);
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const locationUpdateIntervalRef = useRef(null);
  const [pagoInfo, setPagoInfo] = useState(null);
  const [loadingPago, setLoadingPago] = useState(false);
  
  // Obtener información del prestador desde el store
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);
  
  // Acceder a funciones del store de emergencias
  const { 
    fetchEmergencyById, 
    setEmergencyOnWay, 
    completeEmergency,
    updateEmergencyLocation
  } = useEmergencyStore();
  
  // Acceder a funciones del store de pagos
  const { obtenerPagosPorReferencia } = usePagoStore();
  
  // Referencia para el mapa
  const mapRef = useRef(null);
  
  // Verificar permisos de ubicación
  useEffect(() => {
    checkLocationPermission();
    return () => {
      // Limpiar el intervalo de actualización de ubicación cuando se desmonte el componente
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, []);
  
  // Cargar los detalles de la emergencia cuando se monte el componente
  useEffect(() => {
    loadEmergencyDetails();
  }, [emergencyId]);
  
  // Cargar información del pago
  useEffect(() => {
    if (emergencyDetails?.id) {
      loadPaymentInfo();
    }
  }, [emergencyDetails?.id]);
  
  // Función para cargar información de pago
  const loadPaymentInfo = async () => {
    if (!emergencyDetails?.id) return;
    
    try {
      setLoadingPago(true);
      const result = await obtenerPagosPorReferencia('Emergencia', emergencyDetails.id);
      if (result.success && result.data && result.data.length > 0) {
        setPagoInfo(result.data[0]);
        // console.log('💰 Info de pago cargada:', result.data[0]);
      } else {
        setPagoInfo(null);
      }
    } catch (error) {
      console.error('Error al cargar pago:', error);
      setPagoInfo(null);
    } finally {
      setLoadingPago(false);
    }
  };
  
  // Verificar permisos de ubicación
  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setIsLocationPermissionGranted(true);
        getCurrentLocation();
        
        // Configurar un intervalo para actualizar la ubicación si el estado es "En camino"
        if (currentStatus === 'En camino' && emergencyDetails?.id) {
          if (locationUpdateIntervalRef.current) {
            clearInterval(locationUpdateIntervalRef.current);
          }
          locationUpdateIntervalRef.current = setInterval(async () => {
            await getCurrentLocation(true);
          }, 30000); // Actualizar cada 30 segundos
        }
      } else {
        setIsLocationPermissionGranted(false);
        Alert.alert(
          "Permisos de ubicación requeridos",
          "Para brindar una mejor atención de emergencia, necesitamos acceder a tu ubicación."
        );
      }
    } catch (error) {
      console.error('Error al solicitar permisos de ubicación:', error);
    }
  };
  
  // Obtener la ubicación actual
  const getCurrentLocation = async (updateServer = false) => {
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(newLocation);
      
      // Si estamos en camino y se solicita actualizar al servidor, enviar la ubicación
      if (updateServer && currentStatus === 'En camino' && emergencyDetails?.id) {
        await updateEmergencyLocation(
          emergencyDetails.id,
          newLocation.latitude,
          newLocation.longitude
        );
      }
      
      return newLocation;
    } catch (error) {
      console.error('Error al obtener la ubicación actual:', error);
      return null;
    }
  };
  
  // Función para cargar los detalles completos de la emergencia
  const loadEmergencyDetails = async () => {
    try {
      setLoading(true);
      
      // Si ya tenemos los datos completos de la emergencia
      if (emergency && emergency.id && emergency.cliente && emergency.mascota) {
        setEmergencyDetails(emergency);
        setCurrentStatus(emergency.estado);
        setLoading(false);
        return;
      }
      
      // Si solo tenemos el ID, buscar los detalles completos
      if (emergencyId) {
        const result = await fetchEmergencyById(emergencyId);
        
        if (result.success && result.data) {
          setEmergencyDetails(result.data);
          setCurrentStatus(result.data.estado);
          setLoading(false);
          return;
        }
      }
      
      // Si no tenemos datos suficientes, mostrar un error
      if (!emergency && !emergencyId) {
        Alert.alert(
          "Error",
          "No se pudo cargar la emergencia. Datos insuficientes.",
          [{ text: "Volver", onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'Inicio' });
            }
          }}]
        );
        return;
      }
      
      Alert.alert('Error', 'No pudimos cargar los detalles de la emergencia');
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar los detalles de la emergencia:', error);
      Alert.alert('Error', 'No pudimos cargar los detalles de la emergencia');
      setLoading(false);
    }
  };
  
  // Marcar emergencia como "En camino"
  const handleOnWay = async () => {
    if (!emergencyDetails?.id) return;
    
    try {
      setIsUpdatingStatus(true);
      const result = await setEmergencyOnWay(emergencyDetails.id);
      
      if (result.success) {
        setCurrentStatus('En camino');
        setEmergencyDetails(prev => ({ ...prev, estado: 'En camino' }));
        
        // Comenzar a enviar actualizaciones de ubicación
        if (isLocationPermissionGranted) {
          getCurrentLocation(true);
          
          // Configurar actualización periódica de la ubicación
          if (locationUpdateIntervalRef.current) {
            clearInterval(locationUpdateIntervalRef.current);
          }
          locationUpdateIntervalRef.current = setInterval(async () => {
            await getCurrentLocation(true);
          }, 30000); // Actualizar cada 30 segundos
        }
        
        Alert.alert(
          "¡En camino!",
          "Se ha notificado que estás en camino hacia la emergencia. Tu ubicación se actualizará periódicamente."
        );
      } else {
        Alert.alert("Error", result.error || "No se pudo actualizar el estado de la emergencia");
      }
    } catch (error) {
      console.error('Error al marcar emergencia como "En camino":', error);
      Alert.alert("Error", "Ocurrió un error al actualizar el estado de la emergencia");
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  // Marcar emergencia como "Atendida"
  const handleCompleted = async () => {
    // console.log('🔵 handleCompleted iniciado');
    // console.log('   emergencyDetails:', emergencyDetails);
    // console.log('   emergencyDetails.id:', emergencyDetails?.id);
    // console.log('   emergencyDetails._id:', emergencyDetails?._id);
    // console.log('   currentStatus:', currentStatus);
    
    // Usar _id si id no está disponible (MongoDB devuelve _id)
    const emergencyId = emergencyDetails?.id || emergencyDetails?._id;
    
    if (!emergencyId) {
      // console.log('❌ No hay ID de emergencia (ni id ni _id)');
      return;
    }
    
    // Verificar que la emergencia esté en estado "En atención"
    if (currentStatus !== 'En atención') {
      // console.log('❌ Estado no válido:', currentStatus);
      Alert.alert("Error", "El cliente debe confirmar tu llegada antes de marcar como atendida");
      return;
    }
    
    try {
      // console.log('🟢 Intentando completar emergencia:', emergencyId);
      setIsUpdatingStatus(true);
      const result = await completeEmergency(emergencyId);
      
      // console.log('📥 Resultado de completeEmergency:', result);
      
      if (result.success) {
        // console.log('✅ Emergencia completada exitosamente');
        setCurrentStatus('Atendida');
        setEmergencyDetails(prev => ({ ...prev, estado: 'Atendida' }));
        
        // Detener actualizaciones de ubicación
        if (locationUpdateIntervalRef.current) {
          clearInterval(locationUpdateIntervalRef.current);
          locationUpdateIntervalRef.current = null;
        }
        
        Alert.alert(
          "Emergencia completada",
          "Has marcado esta emergencia como atendida. ¿Deseas volver a la pantalla principal?",
          [
            { text: "Permanecer aquí", style: "cancel" },
            { text: "Volver al inicio", onPress: () => navigation.navigate('Inicio') }
          ]
        );
      } else {
        // console.log('❌ Error en completeEmergency:', result.error);
        Alert.alert("Error", result.error || "No se pudo actualizar el estado de la emergencia");
      }
    } catch (error) {
      console.error('💥 Excepción en handleCompleted:', error);
      Alert.alert("Error", "Ocurrió un error al actualizar el estado de la emergencia");
    } finally {
      // console.log('🔵 handleCompleted finalizado');
      setIsUpdatingStatus(false);
    }
  };
  
  // Llamar al cliente
  const handleCallClient = () => {
    if (!emergencyDetails?.cliente?.telefono) {
      Alert.alert("Error", "No se pudo obtener el número de teléfono del cliente");
      return;
    }
    
    const phoneNumber = emergencyDetails.cliente.telefono.replace(/\s/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };
  
  // Renderizado del componente
  return (
    <SafeAreaView style={localStyles.container}>
      <StatusBar style="light" />
      
      {/* Encabezado */}
      <View style={localStyles.header}>
        <View style={localStyles.headerContent}>
          <TouchableOpacity 
            style={localStyles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'Inicio' });
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={localStyles.headerTitle}>Emergencia</Text>
          {/* Badge con el estado actual */}
          <View style={[
            localStyles.statusBadge,
            currentStatus === 'Confirmada' && localStyles.confirmedStatus,
            currentStatus === 'Asignada' && localStyles.assignedStatus,
            currentStatus === 'En camino' && localStyles.onWayStatus,
            currentStatus === 'En atención' && localStyles.inAttentionStatus,
            currentStatus === 'Atendida' && localStyles.completedStatus,
          ]}>
            <Text style={[
              localStyles.statusText,
              (currentStatus === 'Confirmada' || currentStatus === 'Asignada') && localStyles.statusTextAssigned,
              currentStatus === 'En camino' && localStyles.statusTextOnWay,
              currentStatus === 'En atención' && localStyles.statusTextInAttention,
              currentStatus === 'Atendida' && localStyles.statusTextCompleted,
            ]}>{currentStatus}</Text>
          </View>
        </View>
      </View>
      
      {loading ? (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={localStyles.loadingText}>Cargando detalles...</Text>
        </View>
      ) : emergencyDetails ? (
        <ScrollView contentContainerStyle={localStyles.content}>
          {/* Detalles del cliente y mascota */}
          <View style={localStyles.sectionCard}>
            <Text style={localStyles.sectionTitle}>Cliente</Text>
            <View style={localStyles.infoRow}>
              <Image 
                source={{ uri: 
                  // Usar cliente.imagen si está disponible, si no, intentar usuario.profilePicture
                  emergencyDetails.cliente?.imagen || 
                  emergencyDetails.usuario?.profilePicture || 
                  'https://randomuser.me/api/portraits/lego/1.jpg' 
                }}
                style={localStyles.userImage}
              />
              <View style={localStyles.userInfo}>
                <Text style={localStyles.userName}>
                  {/* Usar cliente.nombre si está disponible, si no, intentar usuario.username o usuario.email */}
                  {emergencyDetails.cliente?.nombre || 
                   emergencyDetails.usuario?.username || 
                   emergencyDetails.usuario?.email || 
                   'Cliente'}
                </Text>
                {(emergencyDetails.cliente?.telefono) && (
                  <TouchableOpacity style={localStyles.phoneContainer} onPress={handleCallClient}>
                    <Ionicons name="call" size={16} color="#1E88E5" />
                    <Text style={localStyles.phoneText}>{emergencyDetails.cliente.telefono}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <Text style={[localStyles.sectionTitle, { marginTop: 20 }]}>Datos de la mascota</Text>
            {emergencyDetails.mascota ? (
              <View style={localStyles.petContainer}>
                <Image 
                  source={{ uri: emergencyDetails.mascota?.imagen || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }}
                  style={localStyles.petImage}
                />
                <View style={localStyles.petInfo}>
                  <Text style={localStyles.petName}>{emergencyDetails.mascota?.nombre || 'Mascota'}</Text>
                  <Text style={localStyles.petDetails}>{emergencyDetails.mascota?.tipo || 'No especificado'} • {emergencyDetails.mascota?.raza || 'No especificada'}</Text>
                  <Text style={localStyles.petDetails}>{emergencyDetails.mascota?.edad || 'No especificada'} • {emergencyDetails.mascota?.peso || 'No especificado'}</Text>
                </View>
              </View>
            ) : (
              <View style={localStyles.emptyStateContainer}>
                <Text style={localStyles.emptyStateText}>No hay datos disponibles de la mascota</Text>
              </View>
            )}
          </View>
          
          {/* Detalles de la emergencia */}
          <View style={localStyles.sectionCard}>
            <Text style={localStyles.sectionTitle}>Detalles de la emergencia</Text>
            
            <View style={localStyles.emergencyDetailsContainer}>
              <View style={localStyles.emergencyDetail}>
                <Text style={localStyles.detailLabel}>Tipo:</Text>
                <Text style={localStyles.detailValue}>{emergencyDetails.tipoEmergencia || 'Emergencia veterinaria'}</Text>
              </View>
              
              <View style={localStyles.emergencyDetail}>
                <Text style={localStyles.detailLabel}>Nivel de urgencia:</Text>
                <View style={[localStyles.urgencyBadge, 
                  emergencyDetails.nivelUrgencia === 'Alta' ? localStyles.highUrgency :
                  emergencyDetails.nivelUrgencia === 'Media' ? localStyles.mediumUrgency :
                  localStyles.lowUrgency
                ]}>
                  <Text style={localStyles.urgencyText}>{emergencyDetails.nivelUrgencia || 'Media'}</Text>
                </View>
              </View>
              
              <View style={localStyles.emergencyDetail}>
                <Text style={localStyles.detailLabel}>Fecha y hora:</Text>
                <Text style={localStyles.detailValue}>
                  {new Date(emergencyDetails.fechaSolicitud).toLocaleString()}
                </Text>
              </View>
              
              <View style={[localStyles.emergencyDetail, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Text style={localStyles.detailLabel}>Descripción:</Text>
                <Text style={[localStyles.detailValue, { marginTop: 5 }]}>
                  {emergencyDetails.descripcion}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Ubicación y Mapa */}
          <View style={localStyles.sectionCard}>
            <Text style={localStyles.sectionTitle}>Ubicación</Text>
            
            <View style={localStyles.locationContainer}>
              <Ionicons name="location" size={18} color="#F44336" />
              <Text style={localStyles.locationText}>{emergencyDetails.ubicacion.direccion}</Text>
            </View>
            
            <View style={localStyles.distanceTimeContainer}>
              {emergencyDetails.distancia && (
                <View style={localStyles.distanceTime}>
                  <Ionicons name="navigate" size={16} color="#666" />
                  <Text style={localStyles.distanceTimeText}>
                    {typeof emergencyDetails.distancia === 'string' ? 
                      emergencyDetails.distancia : 
                      emergencyDetails.distancia?.texto || '3.5 km'}
                  </Text>
                </View>
              )}
              {emergencyDetails.tiempoEstimado && (
                <View style={localStyles.distanceTime}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={localStyles.distanceTimeText}>
                    {typeof emergencyDetails.tiempoEstimado === 'string' ? 
                      emergencyDetails.tiempoEstimado : 
                      emergencyDetails.tiempoEstimado?.texto || '10 min'} en auto
                  </Text>
                </View>
              )}
            </View>
            
            {isLocationPermissionGranted && emergencyDetails.ubicacion.coordenadas ? (
              <View style={localStyles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={localStyles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: emergencyDetails.ubicacion.coordenadas.lat || -34.603722,
                    longitude: emergencyDetails.ubicacion.coordenadas.lng || -58.381592,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  {/* Marcador de la ubicación del cliente */}
                  <Marker
                    coordinate={{
                      latitude: emergencyDetails.ubicacion.coordenadas.lat || -34.603722,
                      longitude: emergencyDetails.ubicacion.coordenadas.lng || -58.381592,
                    }}
                    title="Ubicación del cliente"
                    description={emergencyDetails.ubicacion.direccion}
                    pinColor="red"
                  />
                  
                  {/* Marcador de nuestra ubicación si está disponible */}
                  {currentLocation && (
                    <Marker
                      coordinate={{
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                      }}
                      title="Mi ubicación"
                      description="Estás aquí"
                      pinColor="blue"
                    >
                      <Ionicons name="navigate" size={24} color="#1E88E5" />
                    </Marker>
                  )}
                  
                  {/* Línea entre los dos puntos */}
                  {currentLocation && (
                    <Polyline
                      coordinates={[
                        {
                          latitude: currentLocation.latitude,
                          longitude: currentLocation.longitude,
                        },
                        {
                          latitude: emergencyDetails.ubicacion.coordenadas.lat || -34.603722,
                          longitude: emergencyDetails.ubicacion.coordenadas.lng || -58.381592,
                        },
                      ]}
                      strokeWidth={3}
                      strokeColor="#1E88E5"
                    />
                  )}
                </MapView>
              </View>
            ) : (
              <View style={localStyles.mapContainer}>
                <View style={localStyles.mapPlaceholder}>
                  <Ionicons name="map" size={50} color="#CCC" />
                  <Text style={localStyles.mapPlaceholderText}>
                    {!isLocationPermissionGranted
                      ? "Se requieren permisos de ubicación"
                      : "Mapa no disponible"}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Información de Pago */}
          {pagoInfo && (
            <View style={localStyles.sectionCard}>
              <Text style={localStyles.sectionTitle}>Estado del Pago</Text>
              
              {loadingPago ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 15 }} />
              ) : (
                <View style={localStyles.paymentInfoContainer}>
                  <View style={localStyles.paymentStatusRow}>
                    <View style={localStyles.paymentStatusItem}>
                      <Ionicons 
                        name={
                          pagoInfo.estado === 'Capturado' ? 'checkmark-circle' :
                          pagoInfo.estado === 'Pagado' ? 'time' :
                          pagoInfo.estado === 'Pendiente' ? 'hourglass' :
                          'alert-circle'
                        } 
                        size={24} 
                        color={
                          pagoInfo.estado === 'Capturado' ? '#4CAF50' :
                          pagoInfo.estado === 'Pagado' ? '#FF9800' :
                          pagoInfo.estado === 'Pendiente' ? '#FFC107' :
                          '#999'
                        } 
                      />
                      <View style={localStyles.paymentStatusTextContainer}>
                        <Text style={localStyles.paymentStatusLabel}>Estado</Text>
                        <Text style={[
                          localStyles.paymentStatusValue,
                          pagoInfo.estado === 'Capturado' && { color: '#4CAF50' },
                          pagoInfo.estado === 'Pagado' && { color: '#FF9800' },
                          pagoInfo.estado === 'Pendiente' && { color: '#FFC107' },
                        ]}>{pagoInfo.estado}</Text>
                      </View>
                    </View>
                    
                    <View style={localStyles.paymentStatusItem}>
                      <Ionicons name="cash" size={24} color={COLORS.primary} />
                      <View style={localStyles.paymentStatusTextContainer}>
                        <Text style={localStyles.paymentStatusLabel}>Monto</Text>
                        <Text style={localStyles.paymentStatusValue}>
                          ${pagoInfo.monto?.toLocaleString() || '0'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {pagoInfo.estado === 'Pagado' && (
                    <View style={localStyles.paymentNoteContainer}>
                      <Ionicons name="information-circle" size={20} color="#FF9800" />
                      <Text style={localStyles.paymentNoteText}>
                        El cliente ya pagó. El dinero se liberará cuando confirme el servicio completado.
                      </Text>
                    </View>
                  )}
                  
                  {pagoInfo.estado === 'Capturado' && (
                    <View style={[localStyles.paymentNoteContainer, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={[localStyles.paymentNoteText, { color: '#2E7D32' }]}>
                        ¡Pago procesado! El dinero está en camino a tu cuenta.
                      </Text>
                    </View>
                  )}
                  
                  {pagoInfo.estado === 'Pendiente' && (
                    <View style={[localStyles.paymentNoteContainer, { backgroundColor: '#FFF9E6' }]}>
                      <Ionicons name="hourglass" size={20} color="#FFC107" />
                      <Text style={[localStyles.paymentNoteText, { color: '#F57C00' }]}>
                        Esperando confirmación del cliente para procesar el pago.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
          
          {/* Botones de acción */}
          <View style={localStyles.actionsContainer}>
            <TouchableOpacity 
              style={[localStyles.actionButton, localStyles.callButton]}
              onPress={handleCallClient}
            >
              <Ionicons name="call" size={20} color="#FFF" />
              <Text style={localStyles.actionButtonText}>Llamar al cliente</Text>
            </TouchableOpacity>
            
            {currentStatus === 'Asignada' && (
              <TouchableOpacity 
                style={[localStyles.actionButton, localStyles.onWayButton, isUpdatingStatus && localStyles.disabledButton]}
                onPress={() => {
                  Alert.alert(
                    "Confirmar",
                    "¿Confirmas que estás en camino hacia la emergencia?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Confirmar", onPress: handleOnWay }  
                    ]
                  );
                }}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="navigate" size={20} color="#FFF" />
                    <Text style={localStyles.actionButtonText}>Estoy en camino</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {currentStatus === 'En atención' && (
              <TouchableOpacity 
                style={[localStyles.actionButton, localStyles.completeButton, isUpdatingStatus && localStyles.disabledButton]}
                onPress={() => {
                  Alert.alert(
                    "Confirmar",
                    "¿Confirmas que has completado la atención de esta emergencia?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Confirmar", onPress: handleCompleted }  
                    ]
                  );
                }}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={localStyles.actionButtonText}>Marcar como atendida</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {currentStatus === 'En camino' && (
              <View style={localStyles.waitingForClientConfirmation}>
                <Ionicons name="time-outline" size={20} color="#FF9800" />
                <Text style={localStyles.waitingText}>Esperando que el cliente confirme tu llegada...</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={localStyles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#F44336" />
          <Text style={localStyles.errorText}>No se pudo cargar la emergencia</Text>
          <TouchableOpacity 
            style={localStyles.refreshButton}
            onPress={loadEmergencyDetails}
          >
            <Text style={localStyles.refreshButtonText}>Intentar nuevamente</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  confirmedStatus: { backgroundColor: '#FFF8E1' },
  assignedStatus: { backgroundColor: '#E3F2FD' },
  onWayStatus: { backgroundColor: '#F3E5F5' },
  inAttentionStatus: { backgroundColor: '#FFF3E0' },
  completedStatus: { backgroundColor: '#E8F5E9' },
  statusTextAssigned: { color: '#1976D2' },
  statusTextOnWay: { color: '#7B1FA2' },
  statusTextInAttention: { color: '#F57C00' },
  statusTextCompleted: { color: '#388E3C' },
  content: {
    padding: 15,
    paddingBottom: 30,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E3F2FD',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  phoneText: {
    fontSize: 14,
    color: '#1E88E5',
    marginLeft: 5,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E3F2FD',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  petDetails: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 3,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.grey,
  },
  emergencyDetailsContainer: {
    gap: 12,
  },
  emergencyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.grey,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.dark,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highUrgency: {
    backgroundColor: '#FFEBEE',
  },
  mediumUrgency: {
    backgroundColor: '#FFF8E1',
  },
  lowUrgency: {
    backgroundColor: '#E8F5E9',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 8,
    flex: 1,
  },
  distanceTimeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  distanceTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  distanceTimeText: {
    fontSize: 13,
    color: COLORS.grey,
    marginLeft: 5,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 10,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    elevation: 2,
  },
  callButton: {
    backgroundColor: '#1E88E5',
  },
  onWayButton: {
    backgroundColor: '#7B1FA2',
  },
  completeButton: {
    backgroundColor: '#43A047',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  waitingForClientConfirmation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
  },
  waitingText: {
    fontSize: 14,
    color: '#FF8F00',
    marginLeft: 10,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.grey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.grey,
    marginTop: 15,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Estilos para información de pago
  paymentInfoContainer: {
    marginTop: 15,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  paymentStatusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  paymentStatusTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  paymentStatusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  paymentStatusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  paymentNoteContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  paymentNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    lineHeight: 18,
  },
});

export default EmergencyDetailsScreen;
