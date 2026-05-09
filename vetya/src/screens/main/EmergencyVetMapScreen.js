// Archivo reorganizado y optimizado del componente EmergencyVetMapScreen
// Se integró lógica del store: carga, procesamiento y asignación de veterinarios
// + SIMULACIÓN DE LLEGADA (UBER STYLE)
// + MEJORA UI TARJETAS DE PRESTADORES

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import useAuthStore from '../../store/useAuthStore';
import { emergenciaService } from '../../services/api';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
// Aumentamos ligeramente el ancho de la tarjeta para dar más aire al contenido
const CARD_WIDTH = width * 0.8; 
const SPACING_FOR_CARD_INSET = (width - CARD_WIDTH) / 2;

const EmergencyVetMapScreen = ({ navigation, route }) => {
  const { petInfo, emergencyDescription, emergencyData, emergencyId, otroAnimalInfo, emergencyMode } = route.params || {};
  
  const esOtroAnimal = emergencyMode === 'otroAnimal' || emergencyData?.emergencyMode === 'otroAnimal';

  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [vets, setVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [isSearching, setIsSearching] = useState(true);
  const [isLoadingVisible, setIsLoadingVisible] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false);
  // Aumentamos la altura del panel inferior para que quepan bien las tarjetas mejoradas
  const [bottomSheetHeight, setBottomSheetHeight] = useState(280);

  // --- ESTADOS PARA LA SIMULACIÓN ---
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const [eta, setEta] = useState('00:00:00');
  const [distanceText, setDistanceText] = useState('0 km');
  const [simulationActive, setSimulationActive] = useState(false);
  const [clientLocation, setClientLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true); 

  const { availableVets, loadAvailableVets } = useEmergencyStore();

  const vetListRef = useRef();
  const mapIndex = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);

  // Referencias para la animación
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const clientLocationRef = useRef(null);
  const emergencyCoordsRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const initialEmergencyIdRef = useRef(emergencyId);
  const initialEmergencyDataRef = useRef(emergencyData);

  const showContent = useCallback(() => {
    setTimeout(() => {
      setIsLoadingVisible(false);
      setIsContentVisible(true);
    }, 0);
  }, []);

  // Obtener ubicación del cliente al montar el componente - SOLO UNA VEZ
  useEffect(() => {
    const getClientLocation = async () => {
      try {
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser?.ubicacionActual?.coordinates?.lat && currentUser?.ubicacionActual?.coordinates?.lng) {
          console.log('📍 Usando ubicación guardada del usuario');
          const loc = {
            latitude: currentUser.ubicacionActual.coordinates.lat,
            longitude: currentUser.ubicacionActual.coordinates.lng
          };
          setClientLocation(loc);
          clientLocationRef.current = loc;
          setLocationLoading(false);
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('⚠️ Permisos de ubicación denegados');
          setLocationLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        console.log('📍 Ubicación GPS obtenida:', location.coords.latitude, location.coords.longitude);
        const loc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
        setClientLocation(loc);
        clientLocationRef.current = loc;
      } catch (error) {
        console.error('Error al obtener ubicación del cliente:', error);
      } finally {
        setLocationLoading(false);
      }
    };

    getClientLocation();
  }, []); 

  const getEmergencyCoordinates = useCallback((coords) => {
    const source = coords;
    if (!source || (source.lat == null && source.latitud == null && source.latitude == null)) return null;
    return {
      latitude: parseFloat(source.latitud ?? source.lat ?? source.latitude),
      longitude: parseFloat(source.longitud ?? source.lng ?? source.longitude)
    };
  }, []);

  const getVetCoordinates = useCallback((vet) => {
    console.log('🔍 [MAP] Procesando coordenadas de veterinario:', vet?.nombre || 'Sin nombre');
    console.log('   -> ubicacionActual:', vet?.ubicacionActual?.coordenadas || 'NO TIENE');
    console.log('   -> direccion:', vet?.direccion?.coordenadas || 'NO TIENE');
    
    const sourceCoords = vet?.ubicacionActual?.coordenadas || vet?.direccion?.coordenadas;
    if (!sourceCoords || (sourceCoords.lat == null && sourceCoords.lng == null && sourceCoords.latitude == null && sourceCoords.longitude == null)) {
      console.log('   ❌ No hay coordenadas válidas para:', vet?.nombre);
      return null;
    }

    const latitude = parseFloat(sourceCoords.lat ?? sourceCoords.latitude);
    const longitude = parseFloat(sourceCoords.lng ?? sourceCoords.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      console.log('   ❌ Coordenadas NaN para:', vet?.nombre);
      return null;
    }

    console.log('   ✅ Coordenadas válidas:', { latitude, longitude });
    return { latitude, longitude };
  }, []);

  // --- LÓGICA DE SIMULACIÓN (Copiada del archivo original) ---
  const calculateDistance = (coord1, coord2) => {
    const R = 6371; 
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startSimulation = (destinationCoords, vetCoords = null) => {
    if (!destinationCoords) return;

    let startCoords;
    if (vetCoords && vetCoords.latitude && vetCoords.longitude) {
      console.log('🚗 Usando ubicación REAL del veterinario:', vetCoords);
      startCoords = vetCoords;
    } else {
      console.log('⚠️ Sin ubicación real del veterinario, usando aproximación');
      startCoords = {
        latitude: destinationCoords.latitude + 0.015,
        longitude: destinationCoords.longitude + 0.015
      };
    }

    setSimulatedLocation(startCoords);
    setSimulationActive(true);
    
    if (mapRef.current) {
        mapRef.current.fitToCoordinates([startCoords, destinationCoords], {
            edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
            animated: true,
        });
    }

    const realDistKm = calculateDistance(startCoords, destinationCoords);
    const SPEED_KMH = 40; 
    const DURATION = Math.min(60000, Math.max(10000, realDistKm * 10000));

    const animate = () => {
      const now = Date.now();
      if (!startTimeRef.current) startTimeRef.current = now;
      
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      const currentLat = startCoords.latitude + (destinationCoords.latitude - startCoords.latitude) * progress;
      const currentLng = startCoords.longitude + (destinationCoords.longitude - startCoords.longitude) * progress;
      
      const currentPos = { latitude: currentLat, longitude: currentLng };
      setSimulatedLocation(currentPos);

      const distKm = calculateDistance(currentPos, destinationCoords);
      const distMeters = distKm * 1000;
      
      if (distMeters > 1000) {
        setDistanceText(`${distKm.toFixed(2)} km`);
      } else {
        setDistanceText(`${Math.round(distMeters)} m`);
      }

      const speedMs = (SPEED_KMH * 1000) / 3600;
      const secondsLeft = distMeters / speedMs;
      setEta(formatTime(secondsLeft));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setEta("00:00:00");
        setDistanceText("0 m");
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);
  // --- FIN LÓGICA SIMULACIÓN ---

  const lastFetchRef = useRef(0);
  const isLoadingVetsRef = useRef(false);
  const MIN_FETCH_INTERVAL = 15000;
  
  const loadVets = useCallback(async (coords) => {
    if (isLoadingVetsRef.current) return;
    const now = Date.now();
    if (lastFetchRef.current > 0 && now - lastFetchRef.current < MIN_FETCH_INTERVAL) return;
    
    isLoadingVetsRef.current = true;
    lastFetchRef.current = now;
    setIsSearching(true);
    
    let finalCoords = getEmergencyCoordinates(coords || emergencyCoordsRef.current);
    if (!finalCoords && clientLocationRef.current) {
        finalCoords = clientLocationRef.current;
    }
    
    if (!finalCoords) {
        isLoadingVetsRef.current = false;
        setIsSearching(false);
        return;
    }

    try {
      const refreshedVets = await loadAvailableVets();
      const sourceVets = Array.isArray(refreshedVets) && refreshedVets.length > 0
        ? refreshedVets
        : useEmergencyStore.getState().availableVets;

      console.log('🔍 [MAP] Procesando', sourceVets?.length || 0, 'veterinarios...');

      const processedVets = Array.isArray(sourceVets)
        ? sourceVets
            .map(vet => {
              console.log('   [MAP] Procesando vet:', vet?.nombre, 'ID:', vet?._id || vet?.id);
              
              const coordinate = getVetCoordinates(vet);
              if (!coordinate) {
                console.log('   ❌ [MAP] Vet descartado - sin coordenadas válidas');
                return null;
              }

              const distanceKm = calculateDistance(finalCoords, coordinate);
              const estimatedMinutes = Math.max(2, Math.ceil((distanceKm / 30) * 60));

              const processed = {
                id: vet._id || vet.id,
                name: vet.nombre || vet.name || 'Veterinario',
                specialty: vet.especialidades?.join(', ') || vet.especialidad || 'Medicina general',
                rating: vet.rating ?? 4.5,
                price: vet.precioEmergencia ?? vet.price ?? 0,
                image: vet.imagen || null,
                coordinate,
                radio: vet.radio || 1,
                distanceValue: distanceKm,
                distance: distanceKm < 1 ? '1.0 km' : `${distanceKm.toFixed(1)} km`,
                estimatedTimeValue: estimatedMinutes,
                estimatedTime: `${estimatedMinutes} min`,
                lastUpdate: vet.ubicacionActual?.ultimaActualizacion || new Date(),
              };
              
              console.log('   ✅ [MAP] Vet procesado:', processed.name, '->', processed.distance);
              return processed;
            })
            .filter(Boolean)
            .sort((a, b) => a.distanceValue - b.distanceValue)
        : [];

      console.log('✅ [MAP] Total veterinarios procesados:', processedVets.length);

      setVets(processedVets);

      if (processedVets.length > 0) {
        const currentSelectedId = selectedVetRef.current?.id;
        const nextSelectedVet = processedVets.find(vet => vet.id === currentSelectedId) || processedVets[0];

        if (!currentSelectedId || currentSelectedId !== nextSelectedVet.id) {
          setSelectedVet(nextSelectedVet);
        }
        setSimulationActive(true);
        setEta(nextSelectedVet.estimatedTime);
        setDistanceText(nextSelectedVet.distance);

        if (mapRef.current) {
          const coordsToFit = [finalCoords, ...processedVets.map(vet => vet.coordinate)];
          mapRef.current.fitToCoordinates(coordsToFit, {
            edgePadding: { top: 120, right: 60, bottom: 320, left: 60 },
            animated: true,
          });
        }
      } else {
        setSelectedVet(null);
        setSimulationActive(false);
        setEta('00:00:00');
        setDistanceText('0 km');
      }
    } catch (error) {
      console.error('loadVets error:', error);
      setVets([]);
    } finally {
      isLoadingVetsRef.current = false;
      setIsSearching(false);
      showContent();
    }
  }, [getEmergencyCoordinates, getVetCoordinates, loadAvailableVets, showContent]);


  const fetchEmergencyData = useCallback(async () => {
    const currentEmergencyId = initialEmergencyIdRef.current;
    const currentEmergencyData = initialEmergencyDataRef.current;

    if (currentEmergencyId) {
      try {
        const response = await emergenciaService.getEmergencyDetails(currentEmergencyId);
        if (response.success && response.data) {
          setEmergencyDetails(response.data);
          const coords = response.data.ubicacion?.coordenadas;
          const processedCoords = coords ? {
              latitude: parseFloat(coords.latitud || coords.lat),
              longitude: parseFloat(coords.longitud || coords.lng)
          } : null;
          emergencyCoordsRef.current = processedCoords;
          await loadVets(processedCoords);
        } else {
          throw new Error('Sin datos de emergencia');
        }
      } catch (e) {
        console.error('fetchEmergencyData:', e);
        Alert.alert('Error', 'No se pudieron cargar los detalles.');
        navigation.goBack();
      }
    } 
    else if (currentEmergencyData && currentEmergencyData.ubicacion?.coordenadas) {
      const coords = currentEmergencyData.ubicacion.coordenadas;
      emergencyCoordsRef.current = {
        latitude: parseFloat(coords.latitud || coords.latitude),
        longitude: parseFloat(coords.longitud || coords.longitude)
      };
      setEmergencyDetails({
        ...currentEmergencyData,
        estado: 'Temporal'
      });
      await loadVets({
          latitude: parseFloat(coords.latitud || coords.latitude),
          longitude: parseFloat(coords.longitud || coords.longitude)
      });
    } 
    else if (clientLocationRef.current) {
      await loadVets(clientLocationRef.current);
    }
  }, [loadVets, navigation]);

  useEffect(() => {
    if (locationLoading || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    let isMounted = true;

    const refreshVetList = async () => {
      if (!isMounted) return;

      if (!initialEmergencyIdRef.current && initialEmergencyDataRef.current && initialEmergencyDataRef.current.ubicacion?.coordenadas) {
        await fetchEmergencyData();
        return;
      }

      const emergencyCoords = emergencyCoordsRef.current;
      await loadVets(emergencyCoords || clientLocationRef.current);
    };

    refreshVetList();
    const intervalId = setInterval(refreshVetList, 20000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [locationLoading, fetchEmergencyData, loadVets]);
  
  const prevSelectedVetIdRef = useRef(null);
  const selectedVetRef = useRef(null);
  useEffect(() => {
    selectedVetRef.current = selectedVet;
  }, [selectedVet]);
  useEffect(() => {
    if (selectedVet && selectedVet.coordinate && clientLocationRef.current && 
        selectedVet.id !== prevSelectedVetIdRef.current) {
      prevSelectedVetIdRef.current = selectedVet.id;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        startTimeRef.current = null;
      }
      const destCoords = emergencyCoordsRef.current || clientLocationRef.current;
      if (destCoords && selectedVet.coordinate) {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates([destCoords, selectedVet.coordinate], {
            edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
            animated: true,
          });
        }
      }
    }
  }, [selectedVet?.id]); 

  const handleConfirmVet = async () => {
    if (!selectedVet) {
      Alert.alert('Atención', 'Selecciona un veterinario.');
      return;
    }
    setIsSearching(true);
    
    try {
      let finalEmergencyId;
      
      if (emergencyId) {
        finalEmergencyId = emergencyId;
      }
      else if (emergencyData) {
        finalEmergencyId = null;
      } else {
        throw new Error('No hay datos de emergencia disponibles');
      }
      
      navigation.replace('EmergencyConfirmation', {
        emergencyId: finalEmergencyId,
        emergencyData,
        vetInfo: selectedVet,
        petInfo: esOtroAnimal ? null : petInfo,
        otroAnimalInfo: esOtroAnimal ? otroAnimalInfo : null,
        emergencyMode: esOtroAnimal ? 'otroAnimal' : 'mascota',
        emergencyDescription
      });
      
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'No se pudo procesar la solicitud.');
    } finally {
      setIsSearching(false);
    }
  };

  const destCoords = getEmergencyCoordinates() || clientLocation;
  
  const mapRegion = destCoords ? {
    ...destCoords,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  } : {
    latitude: -34.6037, 
    longitude: -58.3816,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* --- MAPA DE FONDO --- */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={mapRegion}
        customMapStyle={[
            { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] }
        ]}
      >
        {destCoords && (
          <Marker coordinate={destCoords}>
              <View style={styles.markerContainer}>
                  <View style={styles.userMarkerPulse} />
                  <View style={styles.userMarkerDot} />
              </View>
          </Marker>
        )}

        {vets.map((vet) => (
          vet.coordinate ? (
            <Marker
              key={vet.id}
              coordinate={vet.coordinate}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => setSelectedVet(vet)}
            >
              <View style={styles.vetMarkerContainer}>
                <Ionicons name="medical" size={18} color="#fff" />
              </View>
            </Marker>
          ) : null
        ))}
      </MapView>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veterinarios cercanos</Text>
      </View>

      {/* --- PANEL DE ESTADO REAL --- */}
      {simulationActive && selectedVet && (
          <View style={styles.simulationPanel}>
             <View style={styles.simulationRow}>
                 <View>
                     <Text style={styles.simLabel}>TIEMPO ESTIMADO</Text>
                     <Text style={styles.simValue}>{eta}</Text>
                 </View>
                 <View style={{ alignItems: 'flex-end' }}>
                     <Text style={styles.simLabel}>DISTANCIA</Text>
                     <Text style={styles.simValue}>{distanceText}</Text>
                 </View>
             </View>
          </View>
      )}

      <View style={styles.mainContent}>
        {(isLoadingVisible || locationLoading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.loadingText}>
              {locationLoading ? 'Obteniendo tu ubicación...' : 'Buscando veterinarios...'}
            </Text>
          </View>
        )}

        {isContentVisible && (
          <View style={[styles.bottomSheet, { height: bottomSheetHeight }]}>            
            <View style={styles.handleBar} />
            <Text style={styles.bottomSheetTitle}>
                {vets.length > 0 ? `${vets.length} disponibles` : 'Buscando...'}
            </Text>
            <ScrollView
              ref={vetListRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 20}
              contentContainerStyle={{ paddingHorizontal: SPACING_FOR_CARD_INSET }}
              onScroll={({ nativeEvent }) => {
                const x = nativeEvent.contentOffset.x;
                scrollX.setValue(x);
                const index = Math.round(x / CARD_WIDTH);
                if (index !== mapIndex.current && vets[index]) {
                  mapIndex.current = index;
                  setSelectedVet(vets[index]);
                }
              }}
              scrollEventThrottle={16}
            >
              {vets.length > 0 ? (
                vets.map((vet) => (
                  <TouchableOpacity
                    key={vet.id}
                    style={[styles.vetCard, selectedVet?.id === vet.id && styles.selectedVetCard]}
                    onPress={() => setSelectedVet(vet)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.vetCardContent}>
                      <View style={styles.vetImageContainer}>
                        {vet.image ? (
                          <Image source={{ uri: vet.image }} style={styles.vetImage} />
                        ) : (
                          <View style={styles.vetImagePlaceholder}>
                            <Ionicons name="person" size={28} color="#fff" />
                          </View>
                        )}
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="shield-checkmark" size={12} color="#fff" />
                        </View>
                      </View>
                      
                      <View style={styles.vetInfo}>
                        <View>
                            <Text style={styles.vetName} numberOfLines={2} ellipsizeMode="tail">
                                {vet.name || 'Veterinario'}
                            </Text>
                            <Text style={styles.vetSpecialty} numberOfLines={1}>
                                {vet.specialty || 'Medicina general'}
                            </Text>
                        </View>
                        
                        <View style={styles.vetStatsRow}>
                            <View style={styles.metricBadge}>
                                <Ionicons name="star" size={12} color="#FF9800" />
                                <Text style={styles.metricTextBold}>{vet.rating || '4.5'}</Text>
                            </View>
                            <View style={[styles.metricBadge, { marginLeft: 8, backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="location" size={12} color="#1E88E5" />
                                <Text style={[styles.metricTextBold, {color: '#1E88E5'}]}>{vet.distance || '1.0 km'}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.priceContainer}>
                             <Text style={styles.priceLabel}>Tarifa base</Text>
                             <Text style={styles.priceText}>
                                ${(vet.price || 0).toLocaleString()}
                             </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noVetsContainer}>
                  <Ionicons name="search-outline" size={40} color="#ccc" />
                  <Text style={styles.noVetsText}>Buscando veterinarios cercanos...</Text>
                </View>
              )}

            </ScrollView>
          </View>
        )}

        {isContentVisible && selectedVet && (
          <View style={styles.fixedActionContainer}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmVet}>
              <Text style={styles.confirmButtonText}>
                Solicitar a {selectedVet.name?.split(' ')[0] || 'Veterinario'}
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  
  // Estilos de Mapa y Marcadores
  markerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
  },
  userMarkerDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#1E88E5',
      borderWidth: 2,
      borderColor: 'white',
      zIndex: 2,
  },
  userMarkerPulse: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(30, 136, 229, 0.3)',
      zIndex: 1,
  },
  pawMarkerContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'black',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
  },
  vetMarkerContainer: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#1E88E5',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 4,
  },

  // Panel de Simulación
  simulationPanel: {
      position: 'absolute',
      top: 100, 
      left: 20,
      right: 20,
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
      zIndex: 10,
  },
  simulationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  simLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#888',
      letterSpacing: 1,
  },
  simValue: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      fontVariant: ['tabular-nums'], 
  },

  noVetsContainer: {
    width: CARD_WIDTH * 0.9,
    height: 140,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 15
  },
  noVetsText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 10,
    textAlign: 'center'
  },

  header: {
    position: 'absolute', 
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 136, 229, 0.9)', 
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    marginRight: 15
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff'
  },
  mainContent: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30
  },
  loadingText: { marginTop: 20, fontSize: 16, color: '#333', fontWeight: 'bold' },
  
  bottomSheet: {
    position: 'absolute',
    bottom: 0, 
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 90, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  handleBar: {
      width: 40,
      height: 5,
      backgroundColor: '#ddd',
      borderRadius: 3,
      alignSelf: 'center',
      marginBottom: 10
  },
  bottomSheetTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  
  // ESTILOS MEJORADOS DE LA TARJETA
  vetCard: {
    width: CARD_WIDTH,
    height: 145, // Altura fija para consistencia
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden'
  },
  selectedVetCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F9FDF9',
    borderWidth: 2,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    elevation: 6
  },
  vetCardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  vetImageContainer: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vetImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#f0f0f0'
  },
  vetImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BBDEFB'
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  vetInfo: { 
    flex: 1,
    justifyContent: 'space-between', // Distribuye el espacio verticalmente
    paddingVertical: 2
  },
  vetName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#333',
    marginBottom: 2
  },
  vetSpecialty: { 
    fontSize: 13, 
    color: '#757575',
  },
  vetStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  metricBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF8E1',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6
  },
  metricTextBold: {
    fontSize: 12,
    marginLeft: 4,
    color: '#333',
    fontWeight: '600'
  },
  priceContainer: {
      marginTop: 4,
      flexDirection: 'column'
  },
  priceLabel: {
      fontSize: 10,
      color: '#9E9E9E',
      textTransform: 'uppercase'
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E88E5', // Azul destacado
    marginTop: -2
  },
  fixedActionContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 40,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default EmergencyVetMapScreen;
