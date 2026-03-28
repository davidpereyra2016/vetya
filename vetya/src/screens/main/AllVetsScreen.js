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

  // Renderizar un veterinario individual
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
    const veterinarioImagen = item.imagen;
    // Usar disponibleEmergencias para veterinarios (campo correcto del modelo)
    const disponible = item.disponibleEmergencias === true;
    
    return (
      <TouchableOpacity 
        style={styles.veterinarioCard}
        onPress={() => navigation.navigate('VetDetail', { vet: item })}
      >
        <View style={styles.veterinarioHeader}>
          <View style={styles.veterinarioImageContainer}>
            {veterinarioImagen ? (
              <Image source={{ uri: veterinarioImagen }} style={styles.veterinarioImage} />
            ) : (
              <View style={styles.veterinarioImagePlaceholder}>
                <Text><Ionicons name="person" size={30} color="#fff" /></Text>
              </View>
            )}
            {disponible && (
              <View style={styles.disponibleBadge}>
                <View style={styles.disponibleDot} />
              </View>
            )}
          </View>
          <View style={styles.veterinarioInfo}>
            <Text style={styles.veterinarioNombre}>{veterinarioNombre}</Text>
            <Text style={styles.veterinarioEspecialidad}>{especialidadTexto}</Text>
            <View style={styles.ratingContainer}>
              <RatingStars rating={veterinarioRating} size={16} />
              <Text style={styles.ratingText}>
                {veterinarioRating.toFixed(1)} ({veterinarioReviews} reseñas)
              </Text>
            </View>
            {disponible && (
              <View style={styles.disponibleTag}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.disponibleTagText}>Disponible ahora</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.estadisticasContainer}>
          <View style={styles.estadisticaItem}>
            <Text><Ionicons name="people" size={18} color="#4285F4" /></Text>
            <Text style={styles.estadisticaValor}>{veterinarioPacientes}</Text>
            <Text style={styles.estadisticaLabel}>Pacientes</Text>
          </View>
          <View style={styles.estadisticaItem}>
            <Text><Ionicons name="star" size={18} color="#FFC107" /></Text>
            <Text style={styles.estadisticaValor}>{veterinarioRating.toFixed(1)}</Text>
            <Text style={styles.estadisticaLabel}>Rating</Text>
          </View>
          <View style={styles.estadisticaItem}>
            <Text><Ionicons name="chatbubbles" size={18} color="#4CAF50" /></Text>
            <Text style={styles.estadisticaValor}>{veterinarioReviews}</Text>
            <Text style={styles.estadisticaLabel}>Reseñas</Text>
          </View>
        </View>
      
        <TouchableOpacity 
          style={styles.agendarButton}
          onPress={() => navigation.navigate('AgendarCita', { selectedVet: item })}
        >
          <Text><Ionicons name="calendar" size={18} color="#fff" /></Text>
          <Text style={styles.agendarButtonText}>Agendar Cita</Text>
        </TouchableOpacity>
      </TouchableOpacity>
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
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veterinarios Disponibles</Text>
        <View style={styles.headerSpacer} />
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
              selectedFilter === filtro && styles.filtroButtonSelected
            ]}
            onPress={() => setSelectedFilter(filtro)}
          >
            <Text 
              style={[
                styles.filtroButtonText,
                selectedFilter === filtro && styles.filtroButtonTextSelected
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
          <Text><Ionicons name="alert-circle-outline" size={60} color="#78909C" /></Text>
          <Text style={styles.emptyText}>
            {selectedFilter === 'Todos' 
              ? 'No hay veterinarios disponibles en este momento' 
              : selectedFilter === 'Disponibles'
                ? 'No hay veterinarios disponibles ahora'
                : 'No hay veterinarios con valoración mayor a 4.5'
            }
          </Text>
          <TouchableOpacity 
            style={styles.reloadButton}
            onPress={loadVeterinarios}
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
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 34, // Para balancear el botón de atrás
  },
  filtrosScrollView: {
    maxHeight: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtrosContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  filtroButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filtroButtonSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  filtroButtonText: {
    fontSize: 14,
    color: '#616161',
  },
  filtroButtonTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#616161',
  },
  veterinariosList: {
    flex: 1,
  },
  veterinariosListContent: {
    padding: 12,
  },
  veterinarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  veterinarioHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  veterinarioImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
  },
  veterinarioImage: {
    width: '100%',
    height: '100%',
  },
  veterinarioImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#90CAF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disponibleBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  disponibleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  veterinarioInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  veterinarioNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  veterinarioEspecialidad: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#757575',
  },
  disponibleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  disponibleTagText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    marginVertical: 12,
  },
  estadisticaItem: {
    alignItems: 'center',
  },
  estadisticaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginVertical: 2,
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#757575',
  },
  agendarButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agendarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#78909C',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default AllVetsScreen;
