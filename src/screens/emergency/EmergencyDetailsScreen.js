import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../styles/globalStyles';
import styles from './styles';
import useAuthStore from '../../store/useAuthStore';

// En un proyecto real, importaríamos el componente de MapView
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import MapViewDirections from 'react-native-maps-directions';

const { width } = Dimensions.get('window');

const EmergencyDetailsScreen = ({ navigation, route }) => {
  // Obtener la emergencia pasada como parámetro desde la pantalla anterior
  const { emergency } = route.params || {};
  
  // Estados para el manejo de datos y UI
  const [loading, setLoading] = useState(true);
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [distance, setDistance] = useState('');
  const [route2, setRoute] = useState(null);
  
  // Obtener información del prestador desde el store
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);
  
  // Referencia para el mapa
  const mapRef = useRef(null);
  
  // Cargar los detalles de la emergencia cuando se monte el componente
  useEffect(() => {
    loadEmergencyDetails();
  }, []);
  
  // Función para cargar los detalles completos de la emergencia
  const loadEmergencyDetails = async () => {
    try {
      // En un entorno de producción, haríamos una llamada a la API
      // const response = await fetch(`https://api.example.com/emergencias/${emergency.id}`);
      // const data = await response.json();
      
      // Por ahora simulamos datos de ejemplo
      setTimeout(() => {
        const mockEmergencyDetails = {
          id: emergency?.id || 'emergencia1',
          cliente: {
            id: 'user123',
            nombre: emergency?.usuarioNombre || 'María González',
            telefono: '+54 9 11 1234-5678',
            imagen: 'https://randomuser.me/api/portraits/women/44.jpg'
          },
          mascota: {
            id: 'pet123',
            nombre: emergency?.mascotaNombre || 'Max',
            tipo: emergency?.tipoMascota || 'Perro',
            raza: 'Golden Retriever',
            edad: '3 años',
            peso: '28 kg',
            imagen: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
          },
          tipoEmergencia: 'Accidente',
          descripcion: emergency?.descripcion || 'Atropellamiento, sangrado en pata trasera derecha, consciente pero con dolor.',
          nivelUrgencia: 'Alta',
          estado: emergency?.estado || 'Asignada',
          ubicacion: {
            direccion: 'Av. Corrientes 1234, Buenos Aires',
            coordenadas: {
              lat: -34.603722,
              lng: -58.381592
            }
          },
          fechaSolicitud: new Date().toISOString(),
          distancia: emergency?.distancia || '3.5 km',
          tiempoEstimado: emergency?.tiempoEstimado || '12 minutos'
        };
        
        setEmergencyDetails(mockEmergencyDetails);
        setCurrentStatus(mockEmergencyDetails.estado);
        setDistance(mockEmergencyDetails.distancia);
        setEstimatedArrival(mockEmergencyDetails.tiempoEstimado);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error al cargar los detalles de la emergencia:', error);
      Alert.alert('Error', 'No pudimos cargar los detalles de la emergencia');
      setLoading(false);
    }
  };
  
  // Función para actualizar el estado de la emergencia
  const updateEmergencyStatus = async (newStatus) => {
    try {
      setLoading(true);
      
      // En un entorno de producción, haríamos una llamada a la API
      // const response = await fetch(`https://api.example.com/emergencias/${emergency.id}/status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });
      // const data = await response.json();
      
      // Simulamos la respuesta
      setTimeout(() => {
        setCurrentStatus(newStatus);
        setLoading(false);
        
        // Mostrar mensaje según el estado
        let message = '';
        switch(newStatus) {
          case 'En camino':
            message = 'El cliente ha sido notificado que estás en camino';
            break;
          case 'Atendida':
            message = 'La emergencia ha sido marcada como atendida';
            break;
          default:
            message = 'Estado actualizado correctamente';
        }
        
        Alert.alert('Estado actualizado', message);
      }, 1000);
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      Alert.alert('Error', 'No pudimos actualizar el estado de la emergencia');
      setLoading(false);
    }
  };
  
  // Función para llamar al cliente
  const callClient = () => {
    if (!emergencyDetails?.cliente?.telefono) {
      Alert.alert('Error', 'No hay número de teléfono disponible');
      return;
    }
    
    const phoneNumber = emergencyDetails.cliente.telefono.replace(/\s+/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };
  
  // Función para abrir la ubicación en el mapa del dispositivo
  const openInMaps = () => {
    if (!emergencyDetails?.ubicacion?.coordenadas) {
      Alert.alert('Error', 'No hay coordenadas disponibles');
      return;
    }
    
    const { lat, lng } = emergencyDetails.ubicacion.coordenadas;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const label = 'Ubicación de Emergencia';
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    Linking.openURL(url);
  };
  
  // Renderizar botones de estado según el estado actual
  const renderStatusButtons = () => {
    switch (currentStatus) {
      case 'Asignada':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => updateEmergencyStatus('En camino')}
          >
            <Ionicons name="navigate-outline" size={22} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Iniciar Viaje</Text>
          </TouchableOpacity>
        );
      case 'En camino':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.successButton]}
            onPress={() => updateEmergencyStatus('Atendida')}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Marcar como Atendida</Text>
          </TouchableOpacity>
        );
      case 'Atendida':
        return (
          <View style={styles.statusCompleted}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.statusCompletedText}>Emergencia Atendida</Text>
          </View>
        );
      default:
        return null;
    }
  };
  
  // Si está cargando, mostrar indicador de carga
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando detalles de la emergencia...</Text>
      </SafeAreaView>
    );
  }
  
  // Renderizar la pantalla principal con los detalles de la emergencia
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergencia</Text>
          <View style={styles.headerRight} />
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de estado */}
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.statusBadge,
              currentStatus === 'Asignada' ? styles.statusAssigned : 
              currentStatus === 'En camino' ? styles.statusOnWay : 
              currentStatus === 'Atendida' ? styles.statusAttended : 
              styles.statusDefault
            ]}>
              <Text style={styles.statusText}>{currentStatus}</Text>
            </View>
            
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={18} color={COLORS.dark} />
              <Text style={styles.timeText}>
                Hace {Math.floor(Math.random() * 10) + 1} minutos
              </Text>
            </View>
          </View>
          
          <View style={styles.infoBlock}>
            <View style={styles.distanceInfo}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
              <View>
                <Text style={styles.infoLabel}>Distancia</Text>
                <Text style={styles.infoValue}>{distance}</Text>
              </View>
            </View>
            
            <View style={styles.timeInfo}>
              <Ionicons name="stopwatch" size={24} color={COLORS.primary} />
              <View>
                <Text style={styles.infoLabel}>Tiempo estimado</Text>
                <Text style={styles.infoValue}>{estimatedArrival}</Text>
              </View>
            </View>
          </View>
          
          {/* Acciones de estado */}
          <View style={styles.statusActionsContainer}>
            {renderStatusButtons()}
          </View>
        </View>
        
        {/* Sección del mapa (Placeholder) */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={50} color="#CCCCCC" />
            <Text style={styles.mapPlaceholderText}>Mapa no disponible en la versión de prueba</Text>
            
            {/* Botón para abrir en mapas */}
            <TouchableOpacity 
              style={styles.openInMapsButton}
              onPress={openInMaps}
            >
              <Ionicons name="navigate" size={18} color={COLORS.white} />
              <Text style={styles.openInMapsText}>Abrir en Mapas</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Detalles del cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.clientContainer}>
            {emergencyDetails?.cliente?.imagen ? (
              <Image 
                source={{ uri: emergencyDetails.cliente.imagen }} 
                style={styles.clientImage} 
              />
            ) : (
              <View style={styles.clientImagePlaceholder}>
                <Ionicons name="person" size={30} color="#DDD" />
              </View>
            )}
            
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{emergencyDetails?.cliente?.nombre}</Text>
              <Text style={styles.clientPhone}>{emergencyDetails?.cliente?.telefono}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.callButton}
              onPress={callClient}
            >
              <Ionicons name="call" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Detalles de la mascota */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mascota</Text>
          <View style={styles.petContainer}>
            {emergencyDetails?.mascota?.imagen ? (
              <Image 
                source={{ uri: emergencyDetails.mascota.imagen }} 
                style={styles.petImage} 
              />
            ) : (
              <View style={styles.petImagePlaceholder}>
                <Ionicons name="paw" size={30} color="#DDD" />
              </View>
            )}
            
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{emergencyDetails?.mascota?.nombre}</Text>
              <Text style={styles.petDetails}>
                {emergencyDetails?.mascota?.tipo} - {emergencyDetails?.mascota?.raza}
              </Text>
              <View style={styles.petDetailsRow}>
                <View style={styles.petDetail}>
                  <Text style={styles.petDetailLabel}>Edad:</Text>
                  <Text style={styles.petDetailValue}>{emergencyDetails?.mascota?.edad}</Text>
                </View>
                <View style={styles.petDetail}>
                  <Text style={styles.petDetailLabel}>Peso:</Text>
                  <Text style={styles.petDetailValue}>{emergencyDetails?.mascota?.peso}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Detalles de la emergencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de la Emergencia</Text>
          <View style={styles.emergencyDetailsContainer}>
            <View style={styles.emergencyDetail}>
              <Text style={styles.emergencyDetailLabel}>Tipo:</Text>
              <Text style={styles.emergencyDetailValue}>
                {emergencyDetails?.tipoEmergencia}
              </Text>
            </View>
            
            <View style={styles.emergencyDetail}>
              <Text style={styles.emergencyDetailLabel}>Nivel de urgencia:</Text>
              <View style={[
                styles.urgencyBadge,
                emergencyDetails?.nivelUrgencia === 'Alta' ? styles.urgencyHigh :
                emergencyDetails?.nivelUrgencia === 'Media' ? styles.urgencyMedium :
                styles.urgencyLow
              ]}>
                <Text style={styles.urgencyText}>
                  {emergencyDetails?.nivelUrgencia}
                </Text>
              </View>
            </View>
            
            <View style={styles.emergencyDetail}>
              <Text style={styles.emergencyDetailLabel}>Dirección:</Text>
              <Text style={styles.emergencyDetailValue}>
                {emergencyDetails?.ubicacion?.direccion}
              </Text>
            </View>
            
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Descripción:</Text>
              <Text style={styles.descriptionText}>
                {emergencyDetails?.descripcion}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmergencyDetailsScreen;
