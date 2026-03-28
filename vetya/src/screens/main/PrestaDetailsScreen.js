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
    
    return (
      <TouchableOpacity 
        style={styles.prestadorCard}
        onPress={() => navigation.navigate('VetDetail', { vet: item })}
      >
        <View style={styles.prestadorHeader}>
          <View style={styles.prestadorImageContainer}>
            {prestadorImagen ? (
              <Image source={{ uri: prestadorImagen }} style={styles.prestadorImage} />
            ) : (
              <View style={styles.prestadorImagePlaceholder}>
                <Text><Ionicons name="person" size={30} color="#fff" /></Text>
              </View>
            )}
          </View>
          <View style={styles.prestadorInfo}>
            <Text style={styles.prestadorNombre}>{prestadorNombre}</Text>
            <View style={styles.tipoContainer}>
              <Text style={styles.tipoBadge}>{prestadorTipo}</Text>
            </View>
            <Text style={styles.prestadorEspecialidad}>{prestadorEspecialidad}</Text>
            <View style={styles.ratingContainer}>
              <RatingStars rating={prestadorRating} size={16} />
              <Text style={styles.ratingText}>
                {prestadorRating.toFixed(1)} ({prestadorReviews} reseñas)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.estadisticasContainer}>
          <View style={styles.estadisticaItem}>
            <Text><Ionicons name="people" size={18} color="#4285F4" /></Text>
            <Text style={styles.estadisticaValor}>{prestadorPacientes}</Text>
            <Text style={styles.estadisticaLabel}>Pacientes</Text>
          </View>
          <View style={styles.estadisticaItem}>
            <Text><Ionicons name="star" size={18} color="#FFC107" /></Text>
            <Text style={styles.estadisticaValor}>{prestadorRating.toFixed(1)}</Text>
            <Text style={styles.estadisticaLabel}>Rating</Text>
          </View>
          <View style={styles.estadisticaItem}>
            <Text><Ionicons name="chatbubbles" size={18} color="#4CAF50" /></Text>
            <Text style={styles.estadisticaValor}>{prestadorReviews}</Text>
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

  // Array de tipos de prestadores disponibles
  const tiposPrestadores = ['Todos', 'Veterinario', 'Centro Veterinario', 'Otro'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Directorio de Prestadores</Text>
        <View style={styles.headerSpacer} />
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
  headerSpacer: {
    width: 34,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tiposScrollView: {
    maxHeight: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tiposContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tipoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tipoButtonSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  tipoButtonText: {
    fontSize: 14,
    color: '#616161',
  },
  tipoButtonTextSelected: {
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
  prestadoresList: {
    flex: 1,
  },
  prestadoresListContent: {
    padding: 12,
  },
  prestadorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  prestadorHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  prestadorImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginRight: 16,
  },
  prestadorImage: {
    width: '100%',
    height: '100%',
  },
  prestadorImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#90CAF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prestadorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  prestadorNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  tipoContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tipoBadge: {
    fontSize: 12,
    color: '#FFF',
    backgroundColor: '#4285F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  prestadorEspecialidad: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#757575',
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

export default PrestaDetailsScreen;
