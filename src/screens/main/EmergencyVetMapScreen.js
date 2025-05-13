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
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
// En un proyecto real se usaría el componente de MapView
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const SPACING_FOR_CARD_INSET = width * 0.1 - 10;

const EmergencyVetMapScreen = ({ navigation, route }) => {
  const { petInfo, emergencyDescription } = route.params || {};
  const [vets, setVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [isSearching, setIsSearching] = useState(true);
  
  // Animaciones
  const mapBottomSheetHeight = useRef(new Animated.Value(220)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const vetListRef = useRef();
  const mapIndex = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Simular la búsqueda de veterinarios cercanos
  useEffect(() => {
    // Simulamos una carga para mejorar UX
    setTimeout(() => {
      const mockVets = [
        {
          id: '1',
          name: 'Dr. Carlos Rodríguez',
          specialty: 'Medicina general',
          rating: 4.9,
          price: '60.000',
          distance: '1.5 km',
          estimatedTime: '8 min',
          coordinate: {
            latitude: -33.447487,
            longitude: -70.673676
          }
        },
        {
          id: '2',
          name: 'Dra. María Gómez',
          specialty: 'Cirugía',
          rating: 4.8,
          price: '75.000',
          distance: '2.3 km',
          estimatedTime: '12 min',
          coordinate: {
            latitude: -33.450987,
            longitude: -70.680676
          }
        },
        {
          id: '3',
          name: 'Dr. Juan Pérez',
          specialty: 'Emergencias',
          rating: 4.7,
          price: '65.000',
          distance: '3.1 km',
          estimatedTime: '15 min',
          coordinate: {
            latitude: -33.453487,
            longitude: -70.667676
          }
        },
      ];
      setVets(mockVets);
      setSelectedVet(mockVets[0]);
      
      // Animaciones después de cargar los datos
      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsSearching(false);
      });
    }, 2000);
  }, []);
  
  // Efecto para navegar a la siguiente pantalla al seleccionar un veterinario
  useEffect(() => {
    // Animación para cambiar tamaño del panel cuando se selecciona un veterinario
    if (selectedVet) {
      Animated.spring(mapBottomSheetHeight, {
        toValue: 300,
        friction: 7,
        useNativeDriver: false,
      }).start();
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
  
  // Función para solicitar el veterinario seleccionado
  const handleConfirmVet = () => {
    if (selectedVet) {
      navigation.navigate('EmergencyConfirmation', {
        petInfo,
        emergencyDescription,
        vetInfo: selectedVet
      });
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
      
      {/* Simular un MapView */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>
            Mapa con veterinarios cercanos
          </Text>
        </View>
        
        {/* Loading overlay */}
        {isSearching && (
          <Animated.View 
            style={[
              styles.loadingOverlay,
              { opacity: loadingOpacity }
            ]}
          >
            <View style={styles.loadingContent}>
              <Ionicons name="search" size={40} color="#1E88E5" />
              <Text style={styles.loadingText}>
                Buscando veterinarios disponibles...
              </Text>
              <Text style={styles.loadingSubtext}>
                Estamos encontrando la mejor atención para {petInfo?.name}
              </Text>
              <View style={styles.pulseContainer}>
                <View style={styles.pulse} />
              </View>
            </View>
          </Animated.View>
        )}
      </View>
      
      {/* Bottom Sheet con veterinarios */}
      <Animated.View 
        style={[
          styles.bottomSheet,
          { 
            height: mapBottomSheetHeight,
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>
            {vets.length} veterinarios disponibles
          </Text>
        </View>
        
        <Animated.ScrollView
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
                <Text style={styles.priceValue}>${vet.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>
        
        {selectedVet && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmVet}>
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
  loadingSubtext: {
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
    marginLeft: 3,
  },
  metricDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
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
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmIcon: {
    marginLeft: 8,
  },
  arrivalText: {
    fontSize: 14,
    color: '#666',
  },
  arrivalTime: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default EmergencyVetMapScreen;
