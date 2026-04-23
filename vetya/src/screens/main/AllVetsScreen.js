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

const AllVetsScreen = ({ navigation, route }) => {
  // Parámetros de navegación
  const { filter } = route.params || { filter: 'all' };

  // Estados para control de UI
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  // Estados desde los stores
  const { 
    prestadores,
    fetchVeterinariosDisponibles,
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
  
  // Estado para almacenar veterinarios con estadísticas completas
  const [veterinariosConStats, setVeterinariosConStats] = useState([]);
  // Estado para almacenar veterinarios filtrados
  const [veterinariosFiltrados, setVeterinariosFiltrados] = useState([]);
  
  // Estado para controlar si los datos son de veterinarios (no de otra pantalla)
  const [datosListos, setDatosListos] = useState(false);
  
  // Limpiar estado y cargar veterinarios al montar el componente
  useEffect(() => {
    const inicializar = async () => {
      // Limpiar prestadores previos y resetear estado
      clearPrestadores();
      setDatosListos(false);
      setVeterinariosConStats([]);
      setVeterinariosFiltrados([]);
      
      // Cargar solo veterinarios
      await loadVeterinarios();
      setDatosListos(true);
    };
    
    inicializar();
  }, []);
  
  // Cargar las estadísticas de valoraciones y pacientes para cada veterinario
  // Solo cuando los datos estén listos (después de cargar veterinarios)
  useEffect(() => {
    const cargarEstadisticasVeterinarios = async () => {
      // Solo procesar si los datos están listos y hay prestadores
      if (!datosListos || !prestadores?.length) return;
      
      const vetsConStats = await Promise.all(
        prestadores.map(async (veterinario) => {
          try {
            const [statsResult, pacientesResult] = await Promise.all([
              fetchEstadisticasPrestador(veterinario._id),
              fetchTotalPacientes(veterinario._id)
            ]);

            const estadisticas = statsResult.success ? statsResult.data : { promedio: 0, total: 0 };
            const pacientes = pacientesResult.success ? pacientesResult.data.totalPacientes : 0;

            return {
              ...veterinario,
              rating: estadisticas.promedio,
              totalValoraciones: estadisticas.total,
              pacientesAtendidos: pacientes
            };
          } catch (error) {
            console.error(`Error al cargar estadísticas para veterinario ${veterinario._id}:`, error);
            return {
              ...veterinario,
              rating: 0,
              totalValoraciones: 0,
              pacientesAtendidos: 0
            };
          }
        })
      );
      
      // Actualizar el estado con todos los veterinarios ordenados por rating (de mayor a menor)
      const ordenados = vetsConStats.sort((a, b) => b.rating - a.rating);
      setVeterinariosConStats(ordenados);
      // Inicialmente mostrar todos
      setVeterinariosFiltrados(ordenados);
    };
    
    cargarEstadisticasVeterinarios();
  }, [datosListos, prestadores, fetchEstadisticasPrestador, fetchTotalPacientes]);

  // Filtrar veterinarios por disponibilidad
  useEffect(() => {
    if (veterinariosConStats.length > 0) {
      if (selectedFilter === 'Todos') {
        setVeterinariosFiltrados(veterinariosConStats);
      } else if (selectedFilter === 'Disponibles') {
        // Filtrar por disponibleEmergencias (campo correcto del modelo Prestador)
        const disponibles = veterinariosConStats.filter(v => v.disponibleEmergencias === true);
        setVeterinariosFiltrados(disponibles);
      } else if (selectedFilter === 'Mejor valorados') {
        // Ya están ordenados por rating descendente
        const mejores = veterinariosConStats.filter(v => v.rating >= 4.5);
        setVeterinariosFiltrados(mejores);
      }
    }
  }, [selectedFilter, veterinariosConStats]);

  // Función para cargar los veterinarios
  const loadVeterinarios = async () => {
    setRefreshing(true);
    try {
      await fetchVeterinariosDisponibles();
    } catch (error) {
      console.error('Error al cargar veterinarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los veterinarios');
    } finally {
      setRefreshing(false);
    }
  };

  // Renderizar un veterinario individual (diseño premium consistente con PrestaDetailsScreen)
  const renderVeterinario = ({ item }) => {
    const veterinarioNombre = ensureString(item.nombre, 'Nombre no disponible');

    // Manejar especialidades (puede ser array o string)
    let especialidadTexto = 'Medicina general';
    if (Array.isArray(item.especialidades) && item.especialidades.length > 0) {
      especialidadTexto = item.especialidades.join(', ');
    } else if (item.especialidad) {
      especialidadTexto = Array.isArray(item.especialidad)
        ? item.especialidad.join(', ')
        : item.especialidad;
    }

    const veterinarioRating = ensureNumber(item.rating, 0);
    const veterinarioReviews = ensureNumber(item.totalValoraciones, 0);
    const veterinarioPacientes = ensureNumber(item.pacientesAtendidos, 0);
    const veterinarioImagen = item.usuario?.profilePicture || item.imagen;
    const disponible = item.disponibleEmergencias === true;
    const defaultImage = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=250&q=80';

    return (
      <View style={styles.prestadorCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('VetDetail', { vet: item })}
        >
          {/* Hero mini del veterinario */}
          <View style={styles.cardHero}>
            <View style={styles.cardImageWrapper}>
              <Image
                source={{ uri: veterinarioImagen || defaultImage }}
                style={styles.cardImage}
              />
              {disponible ? (
                <View style={styles.cardAvailableBadge}>
                  <View style={styles.availableDot} />
                </View>
              ) : (
                <View style={styles.cardVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#FFF" />
                </View>
              )}
            </View>
            <View style={styles.cardHeroInfo}>
              <Text style={styles.prestadorNombre} numberOfLines={1}>{veterinarioNombre}</Text>
              <View style={styles.tipoContainer}>
                <Text style={styles.tipoBadge}>Veterinario</Text>
                {disponible && (
                  <View style={styles.disponibleTag}>
                    <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                    <Text style={styles.disponibleTagText}>Disponible ahora</Text>
                  </View>
                )}
              </View>
              <Text style={styles.prestadorEspecialidad} numberOfLines={1}>{especialidadTexto}</Text>
              <View style={styles.ratingContainer}>
                <View style={styles.starsRowSmall}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(veterinarioRating) ? 'star' : 'star-outline'}
                      size={12}
                      color="#FFB300"
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {veterinarioRating.toFixed(1)} ({veterinarioReviews})
                </Text>
              </View>
            </View>
          </View>

          {/* Stats grid mini */}
          <View style={styles.cardStatsGrid}>
            <View style={styles.cardStatBox}>
              <View style={styles.cardStatIconRow}>
                <Ionicons name="star" size={12} color="#FFB300" style={{ marginRight: 3 }} />
                <Text style={styles.cardStatValue}>{veterinarioRating.toFixed(1)}</Text>
              </View>
              <Text style={styles.cardStatLabel}>Rating</Text>
            </View>
            <View style={styles.cardStatBox}>
              <View style={styles.cardStatIconRow}>
                <Ionicons name="people" size={12} color="#1E88E5" style={{ marginRight: 3 }} />
                <Text style={styles.cardStatValue}>{veterinarioPacientes}</Text>
              </View>
              <Text style={styles.cardStatLabel}>Pacientes</Text>
            </View>
            <View style={styles.cardStatBox}>
              <View style={styles.cardStatIconRow}>
                <Ionicons name="chatbubbles" size={12} color="#4CAF50" style={{ marginRight: 3 }} />
                <Text style={styles.cardStatValue}>{veterinarioReviews}</Text>
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

  // Array de filtros disponibles
  const filtrosDisponibles = ['Todos', 'Disponibles', 'Mejor valorados'];

  return (
    <View style={styles.container}>
      {/* Header premium (consistente con PrestaDetailsScreen) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Veterinarios Disponibles</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScrollView}
        contentContainerStyle={styles.filtrosContainer}
      >
        {filtrosDisponibles.map((filtro) => (
          <TouchableOpacity
            key={filtro}
            style={[
              styles.filtroButton,
              selectedFilter === filtro && styles.filtroButtonSelected,
            ]}
            onPress={() => setSelectedFilter(filtro)}
          >
            <Text
              style={[
                styles.filtroButtonText,
                selectedFilter === filtro && styles.filtroButtonTextSelected,
              ]}
            >
              {filtro}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loadingPrestadores && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Cargando veterinarios...</Text>
        </View>
      ) : veterinariosFiltrados.length > 0 ? (
        <FlatList
          data={veterinariosFiltrados}
          renderItem={renderVeterinario}
          keyExtractor={(item) => item._id}
          style={styles.veterinariosList}
          contentContainerStyle={styles.veterinariosListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadVeterinarios}
              colors={['#1E88E5']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#78909C" />
          <Text style={styles.emptyText}>
            {selectedFilter === 'Todos'
              ? 'No hay veterinarios disponibles en este momento'
              : selectedFilter === 'Disponibles'
                ? 'No hay veterinarios disponibles ahora'
                : 'No hay veterinarios con valoración mayor a 4.5'}
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={loadVeterinarios}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
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

  // ─── FILTROS ───
  filtrosScrollView: {
    maxHeight: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtrosContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filtroButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  filtroButtonSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  filtroButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filtroButtonTextSelected: {
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

  // ─── LISTA ───
  veterinariosList: {
    flex: 1,
  },
  veterinariosListContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // ─── CARD PREMIUM (consistente con PrestaDetailsScreen) ───
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
    backgroundColor: '#E3F2FD',
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
  cardAvailableBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 3,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  availableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
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
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
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
    marginRight: 6,
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
  disponibleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  disponibleTagText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 3,
    fontWeight: '700',
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

export default AllVetsScreen;
