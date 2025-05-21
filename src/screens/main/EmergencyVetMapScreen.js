import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useEmergencyStore from '../../store/useEmergencyStore';
import * as Location from 'expo-location';
import { MapView, Marker, Circle } from 'expo-maps';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const SPACING_FOR_CARD_INSET = width * 0.1 - 10;

const EmergencyVetMapScreen = ({ navigation, route }) => {
  const { petInfo, emergencyDescription, emergencyData, images } = route.params || {};
  const [vets, setVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [isSearching, setIsSearching] = useState(true);
  const [isLoadingVisible, setIsLoadingVisible] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(220);
  
  // Animaciones solo para scroll (no conflictivas)
  const vetListRef = useRef();
  const mapIndex = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Reemplazo de animaciones por estado
  const showContent = () => {
    console.log('Mostrando contenido y ocultando loading...');
    setIsLoadingVisible(false);
    setIsContentVisible(true);
  };
  
  // Ajustar altura del panel inferior cuando se selecciona un veterinario
  useEffect(() => {
    if (selectedVet) {
      setBottomSheetHeight(300);
    }
  }, [selectedVet]);

  // Cargar veterinarios disponibles reales
  useEffect(() => {
    const loadVets = async () => {
      try {
        // Obtener veterinarios disponibles desde el store
        const { loadAvailableVets } = useEmergencyStore.getState();
        console.log('Solicitando veterinarios disponibles para emergencia...');
        const result = await loadAvailableVets();
        
        console.log('Resultado de la búsqueda de veterinarios:', result);
        
        // Determinar si result es directamente un array o tiene una propiedad data que es un array
        const vetsData = Array.isArray(result) ? result : (result?.data || []);
        
        console.log('Datos de veterinarios procesados:', vetsData);
        
        if (vetsData.length > 0) {
          // Primero obtenemos una ubicación aproximada base
          const baseLocation = await getApproximateLocation();
          
          // Transformar los datos para adaptarlos a nuestro formato
          const availableVets = vetsData.map(vet => {
            // Crear variaciones aleatorias para cada veterinario a partir de la ubicación base
            const randomOffset = () => (Math.random() - 0.5) * 0.01;
            const vetCoordinate = {
              latitude: baseLocation.latitude + randomOffset(),
              longitude: baseLocation.longitude + randomOffset()
            };
            
            return {
              id: vet._id,
              name: vet.nombre,
              specialty: vet.especialidad || 'Medicina general',
              rating: vet.rating || 4.5,
              price: vet.precioEmergencia || 50000,
              distance: vet.distancia || '2 km',
              estimatedTime: vet.tiempoEstimado || '10 min',
              coordinate: vetCoordinate,
              image: vet.imagen || 'https://randomuser.me/api/portraits/men/32.jpg',
              experiencia: vet.experiencia || '3 años'
            };
          });
          
          setVets(availableVets);
          if (availableVets.length > 0) {
            setSelectedVet(availableVets[0]);
          }
          
          // Mostrar contenido y ocultar indicador de carga
          showContent();
        } else {
          // Si no hay veterinarios disponibles, mostrar información detallada
          console.log('Error/Sin datos: La respuesta no contiene veterinarios disponibles');
          console.log('Contenido de result:', JSON.stringify(result));
          
          // Intento de recuperación - si hay datos pero no en el formato esperado
          if (result && result.data && !Array.isArray(result.data) && typeof result.data === 'object') {
            // Convertir objeto a array si es posible
            const vetsArray = [result.data];
            console.log('Intentando recuperar con formato alternativo:', vetsArray);
            
            if (vetsArray.length > 0) {
              const baseLocation = await getApproximateLocation();
              const availableVets = vetsArray.map(vet => {
                const randomOffset = () => (Math.random() - 0.5) * 0.01;
                const vetCoordinate = {
                  latitude: baseLocation.latitude + randomOffset(),
                  longitude: baseLocation.longitude + randomOffset()
                };
                
                return {
                  id: vet._id,
                  name: vet.nombre,
                  specialty: vet.especialidad || 'Medicina general',
                  rating: vet.rating || 4.5,
                  price: vet.precioEmergencia || 50000,
                  distance: vet.distancia || '2 km',
                  estimatedTime: vet.tiempoEstimado || '10 min',
                  coordinate: vetCoordinate,
                  image: vet.imagen || 'https://randomuser.me/api/portraits/men/32.jpg',
                  experiencia: vet.experiencia || '3 años'
                };
              });
              
              setVets(availableVets);
              if (availableVets.length > 0) {
                setSelectedVet(availableVets[0]);
                
                // Mostrar contenido
                showContent();
                return;
              }
            }
          }
          
          // Si todavía no hay datos, mostrar el mensaje de error
          Alert.alert('Sin disponibilidad', 'No hay veterinarios disponibles en este momento. Por favor, inténtalo más tarde.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error al cargar veterinarios:', error);
        Alert.alert('Error', 'No pudimos cargar los veterinarios disponibles. Por favor, inténtalo de nuevo.');
        navigation.goBack();
      } finally {
        setIsSearching(false);
      }
    };
    
    loadVets();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!emergencyData) {
        console.warn('No hay datos de emergencia disponibles');
        return;
      }
      
      try {
        // Iniciar animación de carga
        setIsLoadingVisible(true);
        
        // Cargar veterinarios disponibles
        const { loadAvailableVets } = useEmergencyStore.getState();
        const result = await loadAvailableVets();
        
        // Procesar las coordenadas de los veterinarios para el mapa
        processVeterinariansForMap(result);
        
        // Animar la interfaz para mostrar el mapa y los veterinarios
        showContent();
      } catch (error) {
        console.error('Error loading emergency data:', error);
        Alert.alert(
          'Error', 
          'Ocurrió un error al cargar los datos. Por favor, inténtalo de nuevo.'
        );
        navigation.goBack();
      } finally {
        // Finalizar animación de carga
        setIsLoadingVisible(false);
      }
    };
    
    loadData();
  }, [emergencyData]);

  // Función para procesar las coordenadas de los veterinarios para el mapa
  const processVeterinariansForMap = (result) => {
    if (!Array.isArray(result) || result.length === 0 || !emergencyData?.ubicacion?.coordenadas) {
      return; // Validación defensiva
    }
    
    const userLat = emergencyData.ubicacion.coordenadas.latitud || -27.451;
    const userLng = emergencyData.ubicacion.coordenadas.longitud || -59.005;
    
    // Actualizar cada veterinario con coordenadas adecuadas para el mapa
    setVets(prev => {
      if (!Array.isArray(prev)) return [];
      
      return prev.map((vet, index) => {
        if (!vet || typeof vet !== 'object') return null;
        
        // Simulamos coordenadas cercanas al usuario (esto sería reemplazado por datos reales)
        // Cálculo de posición aleatoria pero cercana al usuario
        const angle = (2 * Math.PI * index) / prev.length;
        const distance = 0.01 + (Math.random() * 0.005); // Aproximadamente 1-1.5km
        const lat = userLat + (Math.cos(angle) * distance);
        const lng = userLng + (Math.sin(angle) * distance);
        
        return {
          ...vet,
          coordinate: {
            latitude: lat,
            longitude: lng
          }
        };
      }).filter(Boolean); // Eliminar los items nulos
    });
  };

  // Función para obtener una ubicación aproximada para los veterinarios
  // basada en la ubicación actual del usuario y un radio aleatorio
  const getApproximateLocation = async () => {
    try {
      // Si tenemos las coordenadas del emergencyData, las usamos
      if (emergencyData?.ubicacion?.coordenadas) {
        const userLat = emergencyData.ubicacion.coordenadas.latitud;
        const userLng = emergencyData.ubicacion.coordenadas.longitud;
        
        // Añadir un desplazamiento aleatorio en un radio de ~1km
        // 0.01 en coordenadas es aproximadamente 1km
        const randomOffset = () => (Math.random() - 0.5) * 0.01;
        
        return {
          latitude: userLat + randomOffset(),
          longitude: userLng + randomOffset()
        };
      }
      
      // Si no hay coordenadas en emergencyData, intenta obtener la ubicación actual
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Si no hay permisos, usa una ubicación predeterminada (por ejemplo, el centro de la ciudad)
        return {
          latitude: -27.451,  // Coordenadas aproximadas de una ciudad en Argentina
          longitude: -59.005
        };
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const userLat = location.coords.latitude;
      const userLng = location.coords.longitude;
      
      // Añadir un desplazamiento aleatorio
      const randomOffset = () => (Math.random() - 0.5) * 0.01;
      
      return {
        latitude: userLat + randomOffset(),
        longitude: userLng + randomOffset()
      };
    } catch (error) {
      console.error('Error al obtener ubicación aproximada:', error);
      // En caso de error, devolver coordenadas predeterminadas
      return {
        latitude: -27.451,
        longitude: -59.005
      };
    }
  };
  
  // Este efecto ya se ha reemplazado por el que está arriba
  // Aquí solo lo dejamos por compatibilidad con versiones anteriores, pero ya no hace nada
  useEffect(() => {
    // La funcionalidad de cambiar el tamaño del panel se maneja ahora con estados (bottomSheetHeight)
    // Este código viejo ya no se ejecuta porque mapBottomSheetHeight ya no existe
    if (selectedVet) {
      // No hacemos nada aquí porque ya tenemos un useEffect arriba que hace setBottomSheetHeight(300)
    }
  }, [selectedVet]);
  
  // Sincronización de la lista de veterinarios con el mapa
  useEffect(() => {
    scrollX.addListener(({ value }) => {
      const index = Math.floor(value / CARD_WIDTH + 0.3);
      if (index >= 0 && index < vets.length && mapIndex.current !== index) {
        mapIndex.current = index;
        setSelectedVet(vets[index]);
      }
    });
    
    return () => {
      scrollX.removeAllListeners();
    };
  }, [vets]);

  // Función asíncrona para confirmar la selección del veterinario
  const handleConfirmVet = async () => {
    if (!selectedVet) {
      Alert.alert('Selección requerida', 'Por favor selecciona un veterinario para continuar');
      return;
    }
    
    try {
      // Mostrar indicador de carga
      setIsSearching(true);
      
      // Obtener datos para enviar la emergencia
      const { createEmergency } = useEmergencyStore.getState();
      
      // Preparar datos combinados para el envío
      const emergencyRequestData = {
        ...emergencyData,
        veterinarioId: selectedVet.id,
        estado: 'pending',
      };
      
      // Enviar petición al servidor
      const result = await createEmergency(emergencyRequestData, images || []);
      
      // Ocultar indicador de carga
      setIsSearching(false);
      
      if (result.success) {
        // Navegar a la pantalla de confirmación
        navigation.replace('EmergencyConfirmation', {
          emergencyId: result.data._id,
          vetInfo: selectedVet,
          petInfo,
          emergencyDescription,
        });
      } else {
        Alert.alert('Error', result.message || 'No se pudo procesar la solicitud de emergencia. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al enviar solicitud de emergencia:', error);
      setIsSearching(false);
      Alert.alert('Error', 'Hubo un problema al enviar tu solicitud. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veterinarios cercanos</Text>
      </View>
      
      {/* Vista del mapa principal */}
      <View style={styles.mainContent}>
        {/* Mapa real con expo-maps */}
        <View style={styles.mapContainer}>
          {emergencyData?.ubicacion?.coordenadas && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: emergencyData.ubicacion.coordenadas.latitud || -27.451,
                longitude: emergencyData.ubicacion.coordenadas.longitud || -59.005,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
              rotateEnabled={true}
              scrollEnabled={true}
              zoomEnabled={true}
              toolbarEnabled={true}
            >
              {/* Marcador para el usuario */}
              <Marker
                id="user-location"
                coordinate={{
                  latitude: emergencyData.ubicacion.coordenadas.latitud || -27.451,
                  longitude: emergencyData.ubicacion.coordenadas.longitud || -59.005,
                }}
                title="Tu ubicación"
                description="Aquí es donde te encuentras"
                pinColor="#1E88E5"
              >
                <View style={styles.userMarker}>
                  <Ionicons name="location" size={26} color="#1E88E5" />
                </View>
              </Marker>
              
              {/* Marcadores para los veterinarios disponibles */}
              {vets.map((vet) => {
                if (!vet.coordinate || typeof vet.coordinate.latitude !== 'number' || typeof vet.coordinate.longitude !== 'number') {
                  return null; // Protección contra datos inválidos
                }
                
                return (
                  <React.Fragment key={vet.id}>
                    {/* Marcador del veterinario */}
                    <Marker
                      id={`vet-${vet.id}`}
                      coordinate={vet.coordinate}
                      title={vet.name}
                      description={`${vet.distance} • ${vet.estimatedTime}`}
                      pinColor="#F44336"
                      onPress={() => setSelectedVet(vet)}
                    >
                      <View style={[styles.vetMarker, selectedVet?.id === vet.id ? styles.selectedVetMarker : null]}>
                        <Text style={{ color: '#fff' }}>
                          <Ionicons name="medical" size={18} color="#fff" />
                        </Text>
                      </View>
                    </Marker>
                    
                    {/* Círculo de aproximación para proteger la privacidad */}
                    <Circle
                      center={vet.coordinate}
                      radius={800}  // Radio aproximado de 800 metros
                      fillColor="rgba(244, 67, 54, 0.1)"
                      strokeColor="rgba(244, 67, 54, 0.3)"
                      strokeWidth={1}
                    />
                  </React.Fragment>
                );
              })}
            </MapView>
          )}
          
          {/* Leyenda del mapa */}
          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#1E88E5'}]} />
              <Text style={styles.legendText}>Tu ubicación</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#F44336'}]} />
              <Text style={styles.legendText}>Veterinarios (ubicación aproximada)</Text>
            </View>
          </View>
        </View>

        {/* Capa de carga */}
        {isLoadingVisible && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#1E88E5" />
              <Text style={styles.loadingText}>Buscando veterinarios cercanos...</Text>
              <Text style={styles.loadingSubText}>Estamos conectándote con profesionales disponibles</Text>
            </View>
          </View>
        )}

        {/* Panel inferior con veterinarios */}
        {isContentVisible && (
          <View style={[styles.bottomSheet, { height: bottomSheetHeight }]}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>
                {vets.length} veterinarios disponibles
              </Text>
            </View>
            
            {/* Lista de veterinarios disponibles */}
            <ScrollView
              ref={vetListRef}
              horizontal
              pagingEnabled
              scrollEventThrottle={1}
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 20}
              snapToAlignment="center"
              contentInset={{
                top: 0,
                left: SPACING_FOR_CARD_INSET,
                bottom: 0,
                right: SPACING_FOR_CARD_INSET,
              }}
              contentContainerStyle={{
                paddingHorizontal: Platform.OS === 'android' ? SPACING_FOR_CARD_INSET : 0,
              }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
            >
              {vets.map((vet, index) => (
                <TouchableOpacity
                  key={vet.id}
                  style={styles.vetCard}
                  onPress={() => {
                    setSelectedVet(vet);
                    vetListRef.current?.scrollTo({
                      x: index * CARD_WIDTH,
                      animated: true,
                    });
                  }}
                >
                  <View style={styles.vetImageContainer}>
                    <View style={styles.vetImagePlaceholder}>
                      <Ionicons name="person" size={28} color="#fff" />
                    </View>
                  </View>
                  
                  <View style={styles.vetInfo}>
                    <Text style={styles.vetName}>{vet.name}</Text>
                    <Text style={styles.vetSpecialty}>{vet.specialty}</Text>
                    
                    <View style={styles.vetMetrics}>
                      <View style={styles.metricItem}>
                        <Ionicons name="star" size={14} color="#FFC107" />
                        <Text style={styles.metricText}>{vet.rating}</Text>
                      </View>
                      <View style={styles.metricDot} />
                      <View style={styles.metricItem}>
                        <Ionicons name="location" size={14} color="#F44336" />
                        <Text style={styles.metricText}>{vet.distance}</Text>
                      </View>
                      <View style={styles.metricDot} />
                      <View style={styles.metricItem}>
                        <Ionicons name="time" size={14} color="#4CAF50" />
                        <Text style={styles.metricText}>{vet.estimatedTime}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Tarifa</Text>
                    <Text style={styles.priceValue}>${vet.price.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Botón de solicitar separado del resto del componente para evitar problemas de z-index */}
        {isContentVisible && selectedVet && (
          <View style={styles.fixedActionContainer}>
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={handleConfirmVet}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>
                Solicitar a {selectedVet.name.split(' ')[0]}
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.confirmIcon} />
            </TouchableOpacity>
            <Text style={styles.arrivalText}>
              Tiempo estimado de llegada: <Text style={styles.arrivalTime}>{selectedVet.estimatedTime}</Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourLocationIndicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -30 }],
  },
  yourLocationDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 136, 229, 0.2)',
    borderWidth: 2,
    borderColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yourLocationText: {
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '600',
    marginTop: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  veterinarianIndicators: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  veterinarianMarker: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  privacyCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: '#F44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderStyle: 'dashed',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 8,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  header: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
    zIndex: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  loadingSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  pulseContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 136, 229, 0.3)',
    position: 'absolute',
    borderWidth: 5,
    borderColor: 'rgba(30, 136, 229, 0.5)',
    transform: [
      { scale: 1 }
    ],
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    padding: 20,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vetCard: {
    width: CARD_WIDTH,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  vetImageContainer: {
    marginRight: 15,
  },
  vetImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  vetSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  vetMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 12,
    color: '#666',
  },
  metricDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  mapContainer: {
    height: height * 0.6,
    width: width,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
    position: 'relative',
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  actionContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  fixedActionContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 999,
  },
  userMarker: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetMarker: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedVetMarker: {
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: '#FFEB3B',
    transform: [{ scale: 1.1 }],
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
  },
  confirmIcon: {
    marginLeft: 8,
  },
  arrivalText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  arrivalTime: {
    color: '#4CAF50',
    fontWeight: 'bold',
  }
});

export default EmergencyVetMapScreen;
