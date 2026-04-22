import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import usePrestadoresStore from '../../store/usePrestadoresStore';
import useValoracionesStore from '../../store/useValoracionesStore';
import useCountPacientesStore from '../../store/useCountPacientesStore';
import StarRating from '../../components/StarRating';

// Helper para asegurar que el valor es un string o un string vacío si es null/undefined
const ensureString = (value, fallback = '') => {
  if (value === null || typeof value === 'undefined') {
    return fallback;
  }
  return String(value);
};

// Helper para asegurar que el valor es un número o un valor por defecto si es null/undefined/NaN
const ensureNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const PrestaDetailsScreen = ({ navigation }) => {
  // Estados para control de UI
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState('Todos');

  // Estados desde los stores
  const { 
    prestadores,
    fetchAllPrestadores,
    clearPrestadores,
    isLoading: loadingPrestadores,
    error: prestadoresError 
  } = usePrestadoresStore();
  
  const { 
    fetchEstadisticasPrestador
  } = useValoracionesStore();
  
  const { 
    fetchTotalPacientes
  } = useCountPacientesStore();
  
  // Estado para almacenar prestadores con estadísticas completas
  const [prestadoresConStats, setPrestadoresConStats] = useState([]);
  // Estado para almacenar prestadores filtrados por tipo y ordenados por rating
  const [prestadoresFiltrados, setPrestadoresFiltrados] = useState([]);
  // Estado para controlar si los datos están listos
  const [datosListos, setDatosListos] = useState(false);
  
  // Cargar todos los prestadores al montar el componente
  useEffect(() => {
    const inicializar = async () => {
      // Limpiar datos previos
      clearPrestadores();
      setDatosListos(false);
      setPrestadoresConStats([]);
      setPrestadoresFiltrados([]);
      
      // Cargar prestadores
      await loadPrestadores();
      setDatosListos(true);
    };
    
    inicializar();
  }, []);
  
  // Cargar las estadísticas de valoraciones y pacientes para cada prestador
  useEffect(() => {
    const cargarEstadisticasPrestadores = async () => {
      // Solo procesar si los datos están listos
      if (!datosListos || !prestadores?.length) return;
      
      const listaConStats = await Promise.all(
        prestadores.map(async (prestador) => {
          try {
            const [statsResult, pacientesResult] = await Promise.all([
              fetchEstadisticasPrestador(prestador._id),
              fetchTotalPacientes(prestador._id)
            ]);

            const estadisticas = statsResult.success ? statsResult.data : { promedio: 0, total: 0 };
            const pacientes = pacientesResult.success ? pacientesResult.data.totalPacientes : 0;

            return {
              ...prestador,
              rating: estadisticas.promedio,
              totalValoraciones: estadisticas.total,
              pacientesAtendidos: pacientes
            };
          } catch (error) {
            console.error(`Error al cargar estadísticas para prestador ${prestador._id}:`, error);
            return {
              ...prestador,
              rating: 0,
              totalValoraciones: 0,
              pacientesAtendidos: 0
            };
          }
        })
      );
      
      // Actualizar el estado con todos los prestadores ordenados por rating (de mayor a menor)
      const ordenados = listaConStats.sort((a, b) => b.rating - a.rating);
      setPrestadoresConStats(ordenados);
      // Inicialmente mostrar todos
      setPrestadoresFiltrados(ordenados);
    };
    
    cargarEstadisticasPrestadores();
  }, [datosListos, prestadores, fetchEstadisticasPrestador, fetchTotalPacientes]);

  // Filtrar prestadores por tipo
  useEffect(() => {
    if (prestadoresConStats.length > 0) {
      if (selectedTipo === 'Todos') {
        setPrestadoresFiltrados(prestadoresConStats);
      } else {
        const filtrados = prestadoresConStats.filter(p => p.tipo === selectedTipo);
        setPrestadoresFiltrados(filtrados);
      }
    }
  }, [selectedTipo, prestadoresConStats]);

  // Función para cargar los prestadores
  const loadPrestadores = async () => {
    setRefreshing(true);
    try {
      await fetchAllPrestadores();
    } catch (error) {
      console.error('Error al cargar prestadores:', error);
      Alert.alert('Error', 'No se pudieron cargar los prestadores destacados');
    } finally {
      setRefreshing(false);
    }
  };

  // Renderizar un prestador individual
  const renderPrestador = ({ item }) => {
    const prestadorNombre = ensureString(item.nombre, 'Nombre no disponible');
    const prestadorTipo = ensureString(item.tipo, 'Tipo no disponible');
    const prestadorEspecialidad = ensureString(item.especialidad, 'Especialidad no disponible');
    const prestadorRating = ensureNumber(item.rating, 0);
    const prestadorReviews = ensureNumber(item.totalValoraciones, 0);
    const prestadorPacientes = ensureNumber(item.pacientesAtendidos, 0);
    const prestadorImagen = item.imagen;
    const defaultImage = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=250&q=80';
    
    return (
      <View style={styles.prestadorCard}>
        {/* Área tappable que lleva al detalle del prestador */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('VetDetail', { vet: item })}
        >
        {/* Hero mini del prestador */}
        <View style={styles.cardHero}>
          <View style={styles.cardImageWrapper}>
            <Image 
              source={{ uri: prestadorImagen || defaultImage }} 
              style={styles.cardImage} 
            />
            <View style={styles.cardVerifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#FFF" />
            </View>
          </View>
          <View style={styles.cardHeroInfo}>
            <Text style={styles.prestadorNombre} numberOfLines={1}>{prestadorNombre}</Text>
            <View style={styles.tipoContainer}>
              <Text style={styles.tipoBadge}>{prestadorTipo}</Text>
            </View>
            <Text style={styles.prestadorEspecialidad} numberOfLines={1}>{prestadorEspecialidad}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.starsRowSmall}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(prestadorRating) ? 'star' : 'star-outline'}
                    size={12}
                    color="#FFB300"
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>
                {prestadorRating.toFixed(1)} ({prestadorReviews})
              </Text>
            </View>
          </View>
        </View>

        {/* Stats grid mini */}
        <View style={styles.cardStatsGrid}>
          <View style={styles.cardStatBox}>
            <View style={styles.cardStatIconRow}>
              <Ionicons name="star" size={12} color="#FFB300" style={{ marginRight: 3 }} />
              <Text style={styles.cardStatValue}>{prestadorRating.toFixed(1)}</Text>
            </View>
            <Text style={styles.cardStatLabel}>Rating</Text>
          </View>
          <View style={styles.cardStatBox}>
            <View style={styles.cardStatIconRow}>
              <Ionicons name="people" size={12} color="#1E88E5" style={{ marginRight: 3 }} />
              <Text style={styles.cardStatValue}>{prestadorPacientes}</Text>
            </View>
            <Text style={styles.cardStatLabel}>Pacientes</Text>
          </View>
          <View style={styles.cardStatBox}>
            <View style={styles.cardStatIconRow}>
              <Ionicons name="chatbubbles" size={12} color="#4CAF50" style={{ marginRight: 3 }} />
              <Text style={styles.cardStatValue}>{prestadorReviews}</Text>
            </View>
            <Text style={styles.cardStatLabel}>Reseñas</Text>
          </View>
        </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.agendarButton}
          onPress={() => navigation.navigate('AgendarCita', { selectedVet: item })}
          activeOpacity={0.9}
        >
          <Ionicons name="calendar" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.agendarButtonText}>Agendar Cita</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Componente para mostrar estrellas
  const RatingStars = ({ rating, size = 18 }) => {
    const numericRating = ensureNumber(rating, 0);
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <Text key={`full-${i}`}>
            <Ionicons name="star" size={size} color="#FFC107" />
          </Text>
        ))}
        {Boolean(halfStar) && (
          <Text key="half">
            <Ionicons name="star-half" size={size} color="#FFC107" />
          </Text>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Text key={`empty-${i}`}>
            <Ionicons name="star-outline" size={size} color="#FFC107" />
          </Text>
        ))}
      </View>
    );
  };

  // Array de tipos de prestadores disponibles
  const tiposPrestadores = ['Todos', 'Veterinario', 'Centro Veterinario', 'Otro'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Directorio de Prestadores</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Filtros de tipo */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tiposScrollView}
        contentContainerStyle={styles.tiposContainer}
      >
        {tiposPrestadores.map((tipo) => (
          <TouchableOpacity
            key={tipo}
            style={[
              styles.tipoButton,
              selectedTipo === tipo && styles.tipoButtonSelected
            ]}
            onPress={() => setSelectedTipo(tipo)}
          >
            <Text 
              style={[
                styles.tipoButtonText,
                selectedTipo === tipo && styles.tipoButtonTextSelected
              ]}
            >
              {tipo}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loadingPrestadores && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Cargando prestadores destacados...</Text>
        </View>
      ) : prestadoresFiltrados.length > 0 ? (
        <FlatList
          data={prestadoresFiltrados}
          renderItem={renderPrestador}
          keyExtractor={(item) => item._id}
          style={styles.prestadoresList}
          contentContainerStyle={styles.prestadoresListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadPrestadores}
              colors={['#1E88E5']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text><Ionicons name="alert-circle-outline" size={60} color="#78909C" /></Text>
          <Text style={styles.emptyText}>
            No hay prestadores{selectedTipo !== 'Todos' ? ` de tipo ${selectedTipo}` : ''} disponibles
          </Text>
          <TouchableOpacity 
            style={styles.reloadButton}
            onPress={loadPrestadores}
          >
            <Text><Ionicons name="refresh" size={18} color="#fff" /></Text>
            <Text style={styles.reloadButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // ─── HEADER PREMIUM ───
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },

  // ─── FILTROS DE TIPO ───
  tiposScrollView: {
    maxHeight: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tiposContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tipoButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tipoButtonSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  tipoButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tipoButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  // ─── LOADING ───
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: '#888',
  },

  // ─── LISTA DE PRESTADORES ───
  prestadoresList: {
    flex: 1,
  },
  prestadoresListContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // ─── CARD PREMIUM ───
  prestadorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHero: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  cardImageWrapper: {
    position: 'relative',
    backgroundColor: '#FFF',
    padding: 3,
    borderRadius: 18,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  cardVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 3,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cardHeroInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  prestadorNombre: {
    fontSize: 17,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  tipoContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tipoBadge: {
    fontSize: 11,
    color: '#FFF',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '600',
  },
  prestadorEspecialidad: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRowSmall: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },

  // ─── STATS GRID MINI ───
  cardStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardStatBox: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardStatIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardStatValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
  },
  cardStatLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
  },

  // ─── BOTÓN AGENDAR ───
  agendarButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 14,
    height: 46,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  agendarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // ─── EMPTY STATE ───
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PrestaDetailsScreen;
