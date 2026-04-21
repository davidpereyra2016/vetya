import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  FlatList,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ServiceCard from '../../components/ServiceCard';
import BannerPublicitario from '../../components/BannerPublicitario';
import useEmergencyStore from '../../store/useEmergencyStore';
import useCitaStore from '../../store/useCitaStore';
import usePrestadoresStore from '../../store/usePrestadoresStore';
import useValoracionesStore from '../../store/useValoracionesStore';
import useCountPacientesStore from '../../store/useCountPacientesStore';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { emergenciaService } from '../../services/api';

const HomeScreen = ({ navigation }) => {
  // Estados para manejar la carga
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [availableVetsLoading, setAvailableVetsLoading] = useState(false);
  // Estado para controlar si hay una emergencia en progreso
  const [isEmergencyInProgress, setIsEmergencyInProgress] = useState(false);
  
  // Estado para seguimiento de veterinario en emergencias activas
  const [activeEmergencyVet, setActiveEmergencyVet] = useState(null);
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState('--');
  const [currentDistance, setCurrentDistance] = useState('--');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState('Solicitada');
  
  // Referencia al temporizador para actualización de ubicación
  const locationUpdateTimerRef = useRef(null);

  // Animaciones
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const section1Anim = useRef(new Animated.Value(0)).current;
  const section2Anim = useRef(new Animated.Value(0)).current;
  const section3Anim = useRef(new Animated.Value(0)).current;
  const statusBannerAnim = useRef(new Animated.Value(-50)).current;
  
  // Obtener veterinarios disponibles del store (solo para emergencias)
  const { availableVets, loadAvailableVets, activeEmergencies, loadActiveEmergencies, checkEmergencyExpiration, confirmVetArrival } = useEmergencyStore();
  
  // Obtener citas del usuario del store
  const { upcomingAppointments, fetchUserAppointments, userAppointments } = useCitaStore();
  
  // Obtener prestadores destacados de todos los tipos (nuevo store)
  const { 
    prestadores,
    prestadoresDestacados, 
    fetchPrestadoresDestacados,
    fetchAllPrestadores,
    isLoading: loadingPrestadores,
    error: prestadoresError 
  } = usePrestadoresStore();
  
  // Obtener valoraciones de prestadores
  const {
    valoracionesPrestador,
    estadisticasPrestador,
    fetchValoracionesByPrestador,
    fetchEstadisticasPrestador,
    isLoading: loadingValoraciones
  } = useValoracionesStore();
  
  // Obtener conteo de pacientes atendidos
  const {
    totalPacientes,
    fetchTotalPacientes,
    isLoading: loadingPacientes
  } = useCountPacientesStore();
  
  // Estado para almacenar prestadores con calificación > 4.5
  const [prestadoresDestacadosConStats, setPrestadoresDestacadosConStats] = useState([]);
  
  // Estados para almacenar estadísticas de prestadores y conteo de pacientes
  const [estadisticasPrestadores, setEstadisticasPrestadores] = useState({});
  const [countPacientes, setCountPacientes] = useState({});

  useEffect(() => {
    if (activeEmergencies && activeEmergencies.length > 0) {
      const hasActiveEmergency = activeEmergencies.some(
        (emergency) =>
          emergency.estado === 'Solicitada' ||
          emergency.estado === 'Asignada' ||
          emergency.estado === 'En camino'
          // emergency.estado === 'Confirmada' //añadir confirmada si se desea
      );
      setIsEmergencyInProgress(hasActiveEmergency);
    } else {
      setIsEmergencyInProgress(false);
    }
  }, [activeEmergencies]);
  
  // NOTA: La carga de estadísticas se hace en cargarEstadisticasYPacientesEnParalelo
  // llamado desde loadInitialData para evitar duplicación de requests

  // Datos de ejemplo para los servicios
  const services = [
    {
      id: 'emergencias', 
      title: 'Emergencias', 
      icon: 'alert-circle-outline', 
      color: '#F44336' 
    },
    // {
    //   id: '1',
    //   title: 'Consulta General',
    //   icon: 'medkit-outline', 
    //   color: '#1E88E5'
    // },
    {
      id: '2',
      title: 'Vacunación',
      icon: 'shield-checkmark-outline', 
      color: '#4CAF50'
      // #4CAF50
    },
    {
      id: '3',
      title: 'Mis Emergencias',
      icon: 'calendar-outline', 
      color: '#FF9800'
    },
    {
      id: 'citas',
      title: 'Mis Citas',
      icon: 'calendar-outline',
      color: '#9C27B0'
    },
    {
      id: 'mascotas',
      title: 'Mis Mascotas',
      icon: 'paw-outline',
      color: '#795548'
    }
  ];

  // Función para procesar emergencias activas y configurar actualizaciones
  const processActiveEmergencies = useCallback((emergencies) => {
    if (!emergencies || emergencies.length === 0) {
      // No hay emergencias activas, detener las actualizaciones
      if (locationUpdateTimerRef.current) {
        clearInterval(locationUpdateTimerRef.current);
        locationUpdateTimerRef.current = null;
      }
      setActiveEmergencyVet(null);
      setIsEmergencyInProgress(false);
      // Importante: evitar actualizaciones periódicas innecesarias
      return;
    }
    
    // Ordenar emergencias por fecha de solicitud (más reciente primero)
    const sortedEmergencies = [...emergencies].sort((a, b) => {
      const dateA = new Date(a.fechaSolicitud);
      const dateB = new Date(b.fechaSolicitud);
      return dateB - dateA; // Orden descendente (más reciente primero)
    });
    
    // Tomar la primera emergencia activa (la más reciente)
    const activeEmergency = sortedEmergencies[0];

    // Verificar si la emergencia tiene un veterinario asignado
    if (activeEmergency.veterinario || activeEmergency.veterinarioAsignado) {
      // El backend puede devolver el veterinario en 'veterinario' o 'veterinarioAsignado'
      const veterinario = activeEmergency.veterinario || activeEmergency.veterinarioAsignado;
      
      const vetData = {
        id: veterinario._id || veterinario.id,
        name: veterinario.nombre,
        // Manejar diferentes estructuras de datos para especialidades
        specialty: Array.isArray(veterinario.especialidad) 
          ? veterinario.especialidad.join(', ')
          : Array.isArray(veterinario.especialidades)
            ? veterinario.especialidades.join(', ')
            : typeof veterinario.especialidad === 'string'
              ? veterinario.especialidad
              : 'Veterinario general',
        rating: veterinario.rating || 4.5,
        image: veterinario.imagen,
        distance: activeEmergency.distancia?.texto || '--',
        estimatedTime: activeEmergency.tiempoEstimado?.texto || '--',
        emergencyId: activeEmergency._id,
        status: activeEmergency.estado
      };

      setActiveEmergencyVet(vetData);
      setEmergencyStatus(activeEmergency.estado);
      setCurrentDistance(activeEmergency.distancia?.texto || '--');
      setEstimatedArrivalTime(activeEmergency.tiempoEstimado?.texto || '--');

      // Iniciar actualizaciones periódicas
      startLocationUpdates(activeEmergency);
    } else {
      // Si no hay veterinario asignado, mostrar un estado pendiente
      setActiveEmergencyVet({
        emergencyId: activeEmergency._id,
        name: "Buscando veterinario...",
        specialty: "Se te notificará cuando un veterinario sea asignado.",
        status: activeEmergency.estado, // Usar el estado actual de la emergencia
        vetAssigned: false // Flag para la UI
      });
      setEmergencyStatus(activeEmergency.estado);
      // No iniciar actualizaciones de ubicación si no hay veterinario
      if (locationUpdateTimerRef.current) {
        clearInterval(locationUpdateTimerRef.current);
        locationUpdateTimerRef.current = null;
      }
    }
  }, []);

  // Función para iniciar actualizaciones periódicas de la ubicación
  const startLocationUpdates = useCallback((activeEmergency) => {
    // Solo iniciar actualizaciones si hay una emergencia válida
    if (!activeEmergency || !activeEmergency._id) {
      return;
    }
    
    // Detener cualquier temporizador existente
    if (locationUpdateTimerRef.current) {
      clearInterval(locationUpdateTimerRef.current);
      locationUpdateTimerRef.current = null;
    }

    // Realizar la primera actualización inmediatamente
    updateVetLocation(activeEmergency);

    // Configurar actualizaciones cada 30 segundos
    locationUpdateTimerRef.current = setInterval(() => {
      updateVetLocation(activeEmergency);
    }, 30000); // 30 segundos
    
    // Devolver una función de limpieza para useEffect
    return () => {
      if (locationUpdateTimerRef.current) {
        clearInterval(locationUpdateTimerRef.current);
        locationUpdateTimerRef.current = null;
      }
    };
  }, []);

  // Función para actualizar la ubicación del veterinario
  const updateVetLocation = async (activeEmergency) => {
    const emergencyId = typeof activeEmergency === 'string'
      ? activeEmergency
      : activeEmergency?._id || activeEmergency?.emergencyId;

    if (!emergencyId) return;

    setUpdatingLocation(true);
    try {
      const response = await emergenciaService.getVetLocationUpdate(emergencyId);
      const data = response.success ? response.data : null;

      if (data) {
        setCurrentDistance(data.distancia?.texto || '---');
        setEstimatedArrivalTime(data.tiempoEstimado?.texto || '---');
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error al actualizar ubicación del veterinario:', error);
    } finally {
      setUpdatingLocation(false);
    }
  };

  // Nueva función para cargar estadísticas y pacientes en paralelo (evita el problema N+1)
  const cargarEstadisticasYPacientesEnParalelo = useCallback(async (prestadoresList) => {
    if (!prestadoresList || prestadoresList.length === 0) return;
    
    try {
      
      // Crear objetos para almacenar resultados
      const nuevasEstadisticas = {};
      const nuevosPacientes = {};
      
      // Crear un array de promesas para estadísticas
      const estadisticasPromises = prestadoresList.map(async prestador => {
        try {
          const id = prestador._id;
          const result = await fetchEstadisticasPrestador(id);
          
          // Guardar resultado en el objeto
          if (result && result.success) {
            nuevasEstadisticas[id] = result.data;
          } else {
            nuevasEstadisticas[id] = { promedio: 0, total: 0 };
          }
        } catch (err) {
          console.error(`Error al cargar estadísticas para prestador ${prestador._id}:`, err);
        }
      });
      
      // Crear un array de promesas para pacientes
      const pacientesPromises = prestadoresList.map(async prestador => {
        try {
          const id = prestador._id;
          const result = await fetchTotalPacientes(id);
          
          // Guardar resultado en el objeto
          if (result && result.success) {
            nuevosPacientes[id] = result.data.totalPacientes || 0;
          } else {
            nuevosPacientes[id] = 0;
          }
        } catch (err) {
          console.error(`Error al cargar pacientes para prestador ${prestador._id}:`, err);
        }
      });
      
      // Ejecutar todas las promesas en paralelo
      await Promise.all([...estadisticasPromises, ...pacientesPromises]);
      
      // Actualizar los estados con los datos obtenidos
      setEstadisticasPrestadores(nuevasEstadisticas);
      setCountPacientes(nuevosPacientes);
      
      // Filtrar prestadores destacados con rating > 4.5
      const destacados = prestadoresList
        .filter(prestador => {
          const stats = nuevasEstadisticas[prestador._id];
          return stats && stats.promedio > 4.5;
        })
        .map(prestador => ({
          ...prestador,
          rating: nuevasEstadisticas[prestador._id]?.promedio || 0,
          totalValoraciones: nuevasEstadisticas[prestador._id]?.total || 0,
          pacientesAtendidos: nuevosPacientes[prestador._id] || 0
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, Math.max(3, Math.min(4, prestadoresList.length)));
      
      setPrestadoresDestacadosConStats(destacados);
    } catch (error) {
      console.error('Error en cargarEstadisticasYPacientesEnParalelo:', error);
    }
  }, [fetchEstadisticasPrestador, fetchTotalPacientes]);

  // Ref para evitar cargas duplicadas
  const isLoadingRef = useRef(false);
  const lastLoadTime = useRef(0);
  const MIN_LOAD_INTERVAL = 5000; // Mínimo 5 segundos entre cargas

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (locationUpdateTimerRef.current) {
        clearInterval(locationUpdateTimerRef.current);
        locationUpdateTimerRef.current = null;
      }
    };
  }, []);

  // Animación de entrada del banner principal (fadeInUp)
  useEffect(() => {
    Animated.timing(bannerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animación escalonada de secciones (stagger fadeInUp)
  useEffect(() => {
    Animated.stagger(
      150,
      [section1Anim, section2Anim, section3Anim].map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  // Animación de pulso en el ícono de emergencia activa
  useEffect(() => {
    let loop;
    if (isEmergencyInProgress) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [isEmergencyInProgress]);

  // Animación slide-in del banner de estado de emergencia
  useEffect(() => {
    if (activeEmergencyVet) {
      statusBannerAnim.setValue(-50);
      Animated.spring(statusBannerAnim, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [activeEmergencyVet?.status]);

  // Función para cargar datos iniciales de forma optimizada (paralelización donde sea posible)
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const availableVetsPromise = (async () => {
      setAvailableVetsLoading(true);
      try {
        return await loadAvailableVets();
      } catch (error) {
        console.error('Error al cargar veterinarios disponibles:', error?.message || error);
        return [];
      } finally {
        setAvailableVetsLoading(false);
      }
    })();

    try {
      // Iniciar en paralelo la carga de emergencias y prestadores
      const emergenciesPromise = loadActiveEmergencies();
      const prestadoresPromise = fetchAllPrestadores().catch(err => {
        console.error('Error al cargar prestadores:', err.message || err);
        return []; // Devolvemos array vacío en caso de error para no romper el flujo
      });

      // Esperar a que se carguen las emergencias (esto es crítico para la lógica de flujo)
      const emergenciesResult = await emergenciesPromise;

      // Esperar a que finalicen todas las demás operaciones paralelas
      const prestadores = await prestadoresPromise;
      await availableVetsPromise;
      
      // Procesar emergencias activas (si existen)
      if (emergenciesResult && emergenciesResult.length > 0) {
        processActiveEmergencies(emergenciesResult);
      } else {
        // No hay emergencias activas, detener temporizador y limpiar estado
        if (locationUpdateTimerRef.current) {
          clearInterval(locationUpdateTimerRef.current);
          locationUpdateTimerRef.current = null;
        }
        setActiveEmergencyVet(null);
        setIsEmergencyInProgress(false);
      }
      
      // Si hay prestadores, cargar sus estadísticas y pacientes en paralelo
      if (prestadores?.length > 0) {
        void cargarEstadisticasYPacientesEnParalelo(prestadores);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [loadAvailableVets, loadActiveEmergencies, processActiveEmergencies, fetchAllPrestadores, cargarEstadisticasYPacientesEnParalelo]);
  
  // Función para actualizar datos (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    // Resetear el tiempo de última carga para permitir refresh manual
    lastLoadTime.current = 0;
    setRefreshing(true);
    try {
      await loadInitialData();
      await fetchUserAppointments();
    } catch (error) {
      // Error silenciado
    } finally {
      setRefreshing(false);
    }
  }, [loadInitialData, fetchUserAppointments]);

  // Usar useFocusEffect para actualizar solo cuando la pantalla está en foco
  // Con protección contra cargas duplicadas
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Evitar cargas muy frecuentes (mínimo 5 segundos entre cargas)
      if (isLoadingRef.current || (now - lastLoadTime.current < MIN_LOAD_INTERVAL)) {
        return;
      }
      
      isLoadingRef.current = true;
      lastLoadTime.current = now;
      
      // Cargar datos de forma consolidada
      Promise.all([
        loadInitialData(),
        fetchUserAppointments()
      ]).finally(() => {
        isLoadingRef.current = false;
      });
      
      return () => {};
    }, [loadInitialData, fetchUserAppointments])
  );

  // Función para solicitar una emergencia
  const handleEmergencyRequest = async () => {
    if (isEmergencyInProgress) {
      Alert.alert(
        "Emergencia en curso",
        "Ya tienes una emergencia activa. Espera a que se resuelva antes de solicitar una nueva.",
        [{ text: "Entendido" }]
      );
      return;
    }
    navigation.navigate('EmergencyForm');
  };

  // Manejar la selección de servicio
  const handleServiceSelect = (service) => {
    if (service.id === 'emergencias') {
      handleEmergencyRequest();
    } else if (service.id === 'mascotas') {
      navigation.navigate('Pets');
    } else if (service.id === 'citas') {
      navigation.navigate('Appointments');
    } else {
      // Otros servicios
      navigation.navigate('ServiceDetails', { service });
    }
  };
  
  // Datos para la sección de prestadores destacados con rating > 4.5
  // Usamos los datos ya procesados con estadísticas y pacientes
  const featuredVets = prestadoresDestacadosConStats
    .filter(vet => vet && vet.nombre) // Solo prestadores con nombre
    .map(vet => {
      // Los datos ya incluyen rating, totalValoraciones y pacientesAtendidos
      // Agregar alias adicionales para compatibilidad con renderizado
      return {
        ...vet, // Mantener todas las propiedades originales
        id: vet._id,
        name: vet.nombre,
        image: vet.imagen, // Asegurar que imagen se mapee correctamente a image
        specialty: Array.isArray(vet.especialidad) 
          ? vet.especialidad.join(', ')
          : vet.especialidad || 'General',
        // Convertir especialidades a array para el componente
        especialidades: Array.isArray(vet.especialidades) 
          ? vet.especialidades 
          : Array.isArray(vet.especialidad)
            ? vet.especialidad
            : vet.especialidad ? [vet.especialidad] : ['General'],
        reviews: vet.totalValoraciones || 0,
        patients: vet.pacientesAtendidos || 0,
        experience: vet.añosExperiencia ? `${vet.añosExperiencia} años` : 'Experiencia variada',
        available: Boolean(vet.disponible)
      };
    });
    
  // Monitor de cambios en prestadores destacados
  useEffect(() => {
    // Monitoreo silencioso de cambios en prestadores destacados
  }, [featuredVets]);

  // Veterinarios disponibles para emergencias
  const availableVetsList = availableVets.length > 0 ? availableVets.filter(vet => vet.disponibleEmergencias).map(vet => ({
    // Mantener todas las propiedades originales
    ...vet,
    // Mantener retrocompatibilidad con propiedades nuevas
    id: vet._id || vet.id,
    name: vet.nombre || vet.name,
    specialty: vet.especialidad || 'General',
    rating: vet.rating || 4.5,
    distance: vet.distancia || '3 km',
    available: true,
    image: vet.imagen,
    // Asegurar que tenemos especialidades como array para evitar errores
    especialidades: Array.isArray(vet.especialidades) 
      ? vet.especialidades 
      : Array.isArray(vet.especialidad)
        ? vet.especialidad
        : vet.especialidad ? [vet.especialidad] : ['General']
  })) : [];

  const handleServicePress = (service) => {
    if (service.id === 'emergencias') { // Emergencias
      // Verificar si ya hay una emergencia activa
      if (isEmergencyInProgress) {
        Alert.alert(
          "Emergencia en curso",
          "Ya tienes una emergencia activa. Espera a que se resuelva antes de solicitar una nueva.",
          [{ text: "Entendido" }]
        );
        return;
      }
      navigation.navigate('EmergencyForm');
    } else if (service.id === '1') { // Consulta General
      navigation.navigate('ConsultaGeneral');
    } else if (service.id === 'citas') {
      navigation.navigate('Citas');
    } else if (service.id === 'mascotas') {
      navigation.navigate('Mascotas');
    } else if (service.id === '3') {
      navigation.navigate('MisEmergencias');
    }
  };

  // Función para manejar la selección de un veterinario
  const handleVetPress = (vet) => {
    // Navegar a la pantalla de detalle del veterinario
    navigation.navigate('VetDetail', { vet });
  };
  
  // Función para confirmar la llegada del veterinario
  const handleConfirmVetArrival = async (emergencyId) => {
    setIsLoading(true);
    try {
      // Llamar al store para confirmar la llegada
      const result = await confirmVetArrival(emergencyId);
      
      if (result.success) {
        // Actualizar el estado local
        setEmergencyStatus('En atención');
        // Actualizar el estado del veterinario activo
        setActiveEmergencyVet(prev => ({
          ...prev,
          status: 'En atención'
        }));
        
        // 💳 Redirigir a Mercado Pago si hay initPoint
        if (result.initPoint) {
          console.log('💳 Redirigiendo a Mercado Pago:', result.initPoint);
          
          Alert.alert(
            "Llegada confirmada",
            "El veterinario ha llegado. Ahora serás redirigido a Mercado Pago para completar el pago del servicio.",
            [
              {
                text: "Ir a pagar",
                onPress: async () => {
                  try {
                    const supported = await Linking.canOpenURL(result.initPoint);
                    if (supported) {
                      await Linking.openURL(result.initPoint);
                    } else {
                      Alert.alert(
                        "Error",
                        "No se pudo abrir Mercado Pago. Por favor, intenta nuevamente."
                      );
                    }
                  } catch (error) {
                    console.error('Error al abrir Mercado Pago:', error);
                    Alert.alert(
                      "Error",
                      "No se pudo abrir Mercado Pago. Por favor, intenta nuevamente."
                    );
                  }
                }
              },
              {
                text: "Más tarde",
                style: "cancel"
              }
            ]
          );
        } else {
          Alert.alert(
            "Llegada confirmada",
            "Has confirmado la llegada del veterinario. Ya puede comenzar la atención."
          );
        }
      } else {
        throw new Error(result.error || 'No se pudo confirmar la llegada');
      }
    } catch (error) {
      console.error('Error al confirmar llegada del veterinario:', error);
      Alert.alert(
        "Error",
        "No se pudo confirmar la llegada del veterinario. Intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar cada veterinario destacado
  const renderFeaturedVetItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.featuredVetCard}
      onPress={() => handleVetPress(item)}
    >
      <View style={styles.vetTopSection}>
        <View style={styles.vetImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.vetImage} />
          ) : (
            <View style={[styles.vetImagePlaceholder, { backgroundColor: item.available ? '#4CAF50' : '#FFA000' }]}>
              <Text>
                <Ionicons name="person" size={32} color="#fff" />
              </Text>
            </View>
          )}
          {item.available && (
            <View style={styles.statusBadge}>
              <Text>
                <Ionicons name="ellipse" size={10} color="#4CAF50" />
              </Text>
            </View>
          )}
        </View>
        <View style={styles.vetInfo}>
          <Text style={styles.vetName}>{item.name}</Text>
          <Text style={styles.vetSpecialty}>{item.specialty}</Text>
          <View style={styles.ratingContainer}>
            <Text>
              <Ionicons name="star" size={16} color="#FFC107" />
            </Text>
            <Text style={styles.ratingText}>{item.rating.toFixed(1)} ({item.reviews} reseñas)</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.vetDetailSection}>
        <View style={styles.vetDetailItem}>
          <Text>
            <Ionicons name="time-outline" size={14} color="#666" />
          </Text>
          <Text style={styles.vetDetailText}>{item.experience}</Text>
        </View>
        <View style={styles.vetDetailItem}>
          <Text>
            <Ionicons name="people-outline" size={14} color="#666" />
          </Text>
          <Text style={styles.vetDetailText}>{item.patients} pacientes</Text>
        </View>
      </View>
      
      <View style={styles.vetSpecialtiesContainer}>
        {item.especialidades && Array.isArray(item.especialidades) ? 
          item.especialidades.map((specialty, index) => (
            <View key={index} style={styles.specialtyBadge}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          )) : 
          <View style={styles.specialtyBadge}>
            <Text style={styles.specialtyText}>{item.specialty || 'Especialista'}</Text>
          </View>
        }
      </View>
    </TouchableOpacity>
  );

  // Renderizar cada veterinario disponible
  const renderAvailableVetItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.availableVetCard}
      onPress={() => handleVetPress(item)}
    >
      <View style={styles.vetStatusContainer}>
        <View style={styles.vetStatusIndicator} />
        <Text style={styles.vetStatusText}>{item.status}</Text>
      </View>
      
      <View style={styles.vetAvailableContent}>
        <View style={styles.vetImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.vetImage} />
          ) : (
            <View style={[styles.vetImagePlaceholder, { backgroundColor: '#4CAF50' }]}>
              <Text>
                <Ionicons name="person" size={32} color="#fff" />
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.vetInfo}>
          <Text style={styles.vetName}>{item.name}</Text>
          <Text style={styles.vetSpecialty}>{item.specialty}</Text>
          <View style={styles.ratingContainer}>
            <Text>
              <Ionicons name="star" size={16} color="#FFC107" />
            </Text>
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Banner principal */}
        <Animated.View style={[styles.banner, {
          opacity: bannerAnim,
          transform: [{ translateY: bannerAnim.interpolate({
            inputRange: [0, 1], outputRange: [24, 0]
          })}]
        }]}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>¡Bienvenido a VetYa!</Text>
            <Text style={styles.bannerSubtitle}>
              Cuidado veterinario profesional en la comodidad de tu hogar
            </Text>
            <TouchableOpacity 
              style={styles.bannerButton}
              onPress={() => navigation.navigate('AgendarCita')}
            >
              <Text style={styles.bannerButtonText}>Agendar cita</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bannerImageContainer}>
            <Image
              source={require('../../assets/logo/logoVetya.png')}
              style={styles.bannerLogo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* ─── BANNER PUBLICITARIO ADAPTADO AQUÍ ─── */}
        <BannerPublicitario />

        {/* Servicios */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nuestros servicios</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={services}
            renderItem={({ item }) => (
              <ServiceCard item={item} onPress={handleServicePress} />
            )}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesList}
          />
        </View>

        {/* Emergencia Activa - Solo se muestra si hay una emergencia en curso */}
        {activeEmergencyVet ? (
          <View style={styles.emergencyContainer}>
            <View style={styles.emergencyHeader}>
              <Text style={styles.emergencyTitle}>Emergencia en curso</Text>
              <Animated.View style={[styles.pulseIndicator, { transform: [{ scale: pulseAnim }] }]}>
                <Text>
                  <Ionicons name="alert-circle" size={24} color="#F44336" />
                </Text>
              </Animated.View>
            </View>
            
            {/* Mostrar el estado de la emergencia y el veterinario */}
            {/* Mensaje general si no hay veterinario asignado aún pero la emergencia está activa */}
            {activeEmergencyVet.vetAssigned === false && activeEmergencyVet.status !== 'Cancelada' && activeEmergencyVet.status !== 'Finalizada' && (
              <Animated.View style={[styles.statusBanner, { backgroundColor: '#FF9800', transform: [{ translateX: statusBannerAnim }] }]}>
                <Text>
                  <Ionicons name="hourglass-outline" size={16} color="#fff" />
                </Text>
                <Text style={styles.statusBannerText}>
                  {activeEmergencyVet.status === 'Solicitada' ? 'Solicitud enviada. Esperando asignación...' : 
                   activeEmergencyVet.status === 'Asignada' ? 'Veterinario asignado. Esperando confirmación...' : 
                   'Procesando emergencia...'}
                </Text>
              </Animated.View>
            )}

            {/* Banners específicos cuando el veterinario está asignado */}
            {activeEmergencyVet.vetAssigned !== false && activeEmergencyVet.status === 'Asignada' && (
              <Animated.View style={[styles.statusBanner, { backgroundColor: '#FFC107', transform: [{ translateX: statusBannerAnim }] }]}>
                <Text>
                  <Ionicons name="time-outline" size={16} color="#fff" />
                </Text>
                <Text style={styles.statusBannerText}>
                  Esperando confirmación del veterinario...
                </Text>
              </Animated.View>
            )}
            
            {activeEmergencyVet.status === 'En camino' && (
              <Animated.View style={[styles.statusBanner, { backgroundColor: '#4CAF50', transform: [{ translateX: statusBannerAnim }] }]}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.statusBannerText}>
                  ¡Veterinario aceptó la solicitud y está en camino!
                </Text>
              </Animated.View>
            )}
            
            {activeEmergencyVet.status === 'En atención' && (
              <Animated.View style={[styles.statusBanner, { backgroundColor: '#2196F3', transform: [{ translateX: statusBannerAnim }] }]}>
                <Ionicons name="medkit" size={16} color="#fff" />
                <Text style={styles.statusBannerText}>
                  El veterinario está atendiendo a tu mascota
                </Text>
              </Animated.View>
            )}
            
            {activeEmergencyVet.status === 'Confirmada' && (
              <Animated.View style={[styles.statusBanner, { backgroundColor: '#4CAF50', transform: [{ translateX: statusBannerAnim }] }]}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.statusBannerText}>
                  ¡Servicio confirmado! El veterinario confirmo la emergencia.
                </Text>
              </Animated.View>
            )}
            
            <View style={styles.emergencyContent}>
              <View style={styles.vetImageContainer}>
                <View style={[styles.vetImagePlaceholder, { backgroundColor: activeEmergencyVet.vetAssigned === false ? '#757575' : '#F44336' }]}>
                  <Text>
                    <Ionicons name={activeEmergencyVet.vetAssigned === false ? "hourglass-outline" : "person"} size={24} color="#fff" />
                  </Text>
                </View>
              </View>
              
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyVetName}>{activeEmergencyVet.name}</Text>
                <Text style={styles.emergencySpecialty}>{activeEmergencyVet.specialty}</Text>
                
                {/* Solo mostrar la ubicación si el veterinario ha aceptado y está asignado*/}
                {activeEmergencyVet.vetAssigned !== false && ['Asignada', 'Confirmada', 'En camino'].includes(activeEmergencyVet.status) ? (
                  <View style={styles.vetDistanceCard}>
                    <View style={styles.distanceHeader}>
                      <Text style={styles.distanceTitle}>Ubicación actual</Text>
                      <Text style={styles.distanceValue}>{currentDistance}</Text>
                    </View>
                    
                    <View style={styles.estimatedTimeContainer}>
                      <Ionicons name="time-outline" size={16} color="#616161" />
                      <Text style={styles.estimatedTimeText}>
                        Llegada estimada: {estimatedArrivalTime}
                      </Text>
                    </View>
                    
                    <Text style={styles.privacyNotice}>
                      * La ubicación mostrada tiene un radio de privacidad de 1km
                    </Text>
                    
                    <View style={styles.updateContainer}>
                      <Text style={styles.lastUpdatedText}>
                        {lastUpdated ? `Actualizado: ${lastUpdated.toLocaleTimeString()}` : 'Cargando...'}
                        {updatingLocation && ' · Actualizando...'}
                      </Text>
                      <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={() => activeEmergencyVet && updateVetLocation(activeEmergencyVet.emergencyId)}
                        disabled={updatingLocation}
                      >
                        <Text style={styles.refreshButtonText}>
                          <Text>
                  <Ionicons name="refresh" size={12} color="#4CAF50" />
                </Text>
                <Text style={styles.refreshButtonText}> Actualizar</Text>
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.pendingContainer}>
                    <ActivityIndicator size="small" color="#FFC107" />
                    <Text style={styles.pendingText}>Esperando respuesta del veterinario...</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Botón para confirmar llegada del veterinario - solo visible cuando está en camino */}
            {activeEmergencyVet.status === 'En camino' && (
              <TouchableOpacity 
                style={[styles.emergencyButton, styles.confirmButton]}
                onPress={() => handleConfirmVetArrival(activeEmergencyVet.emergencyId)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.emergencyButtonText}>Confirmar que el veterinario llegó</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.emergencyButton}
              onPress={() => navigation.navigate('MisEmergencias', { emergencyId: activeEmergencyVet.emergencyId })}
            >
              <Text style={styles.emergencyButtonText}>Ver detalles de la emergencia</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Próxima cita - solo se muestra si no hay emergencia activa */
          <>
            {(() => {
              // Renderizando sección de cita próxima
              // Control de citas próximas
              
              // Si no hay citas o el array no está inicializado
              if (!upcomingAppointments || upcomingAppointments.length === 0) {
                // No hay citas disponibles
                return null;
              }
              
              // Filtrar solo citas confirmadas
              const citasConfirmadas = upcomingAppointments.filter(cita => {
                // Evaluación de cita
                return cita.estado === 'Confirmada';
              });
              
              // Conteo de citas confirmadas
              
              // Si hay citas confirmadas, mostrar la tarjeta
              if (citasConfirmadas.length > 0) {
                return (
                  <View style={styles.appointmentContainer}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentTitle}>Tu próxima cita</Text>
                      <Text>
                        <Ionicons name="calendar" size={24} color="#1E88E5" />
                      </Text>
                    </View>
                    {/* Mostrar la primera cita confirmada */}
                    {(() => {
                      // Obtener la próxima cita confirmada
                      const proximaCita = citasConfirmadas
                        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];
                      
                      if (!proximaCita) return null;
                      
                      // Formatear la fecha
                      const fechaCita = new Date(proximaCita.fecha);
                      const fechaFormateada = format(fechaCita, "EEEE, d 'de' MMMM", { locale: es });
                      
                      return (
                        <View style={styles.appointmentContent}>
                          <View style={styles.appointmentInfo}>
                            <Text style={styles.appointmentDate}>{fechaFormateada}</Text>
                            <Text style={styles.appointmentTime}>
                              {proximaCita.horaInicio} - {proximaCita.horaFin}
                            </Text>
                            <Text style={styles.appointmentType}>{proximaCita.servicio?.nombre || 'Consulta'}</Text>
                            <Text style={styles.appointmentVet}>
                              {proximaCita.prestador?.nombre || proximaCita.prestadorNombre || 'Profesional asignado'}
                            </Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.appointmentButton}
                            onPress={() => navigation.navigate('Citas')}
                          >
                            <Text style={styles.appointmentButtonText}>Ver detalles</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })()}
                  </View>
                );
              } else {
                return null;
              }
            })()} 
          </>
        )}

        {/* Veterinarios disponibles ahora */}
        <Animated.View style={[styles.sectionContainer, {
          opacity: section1Anim,
          transform: [{ translateY: section1Anim.interpolate({
            inputRange: [0, 1], outputRange: [24, 0]
          })}]
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Veterinarios disponibles</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllVetsScreen', { filter: 'available' })}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {availableVetsLoading && availableVetsList.length === 0 ? (
            <ActivityIndicator size="large" color="#1E88E5" style={{marginVertical: 20}} />
          ) : (
            <FlatList
              data={availableVetsList}
              renderItem={renderAvailableVetItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vetsList}
              ListEmptyComponent={(
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="paw-outline" size={48} color="#F44336" />
                  </View>
                  <Text style={styles.emptyStateTitle}>
                    No hay veterinarios disponibles
                  </Text>
                  <Text style={styles.emptyStateText}>
                    En este momento no hay veterinarios disponibles para emergencias
                  </Text>
                </View>
              )}
            />
          )}
        </Animated.View>
        
        {/* Prestadores destacados */}
        <Animated.View style={[styles.sectionContainer, {
          opacity: section2Anim,
          transform: [{ translateY: section2Anim.interpolate({
            inputRange: [0, 1], outputRange: [24, 0]
          })}]
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prestadores destacados</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrestaDetailsScreen', { filter: 'featured' })}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredVets}
            renderItem={renderFeaturedVetItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vetsList}
            ListEmptyComponent={(
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="paw-outline" size={48} color="#F44336" />
                </View>
                <Text style={styles.emptyStateTitle}>
                  No hay prestadores destacados
                </Text>
                <Text style={styles.emptyStateText}>
                  Aún no hay prestadores con calificación destacada disponibles
                </Text>
              </View>
            )}
          />
        </Animated.View>

        {/* Consejos de salud */}
        <Animated.View style={[styles.sectionContainer, styles.lastSection, {
          opacity: section3Anim,
          transform: [{ translateY: section3Anim.interpolate({
            inputRange: [0, 1], outputRange: [24, 0]
          })}]
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consejos de salud</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HealthTips')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.tipCard}
            onPress={() => navigation.navigate('HealthTipDetail', {
              tip: {
                id: '1',
                title: 'Alimentación saludable para tu mascota',
                description: 'Aprende cómo mejorar la dieta de tu mascota para una vida larga y feliz con los mejores consejos nutricionales.',
                image: null,
                petType: 'dog',
                category: 'Nutrición',
                author: 'Dr. Carlos Rodríguez',
                date: '12 mayo, 2025',
                readTime: '5 min'
              }
            })}
          >
            <View style={styles.tipImageContainer}>
              <Text>
                <Ionicons name="nutrition" size={32} color="#1E88E5" />
              </Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>
                Alimentación saludable para tu mascota
              </Text>
              <Text style={styles.tipDescription}>
                Aprende cómo mejorar la dieta de tu mascota para una vida larga y feliz.
              </Text>
            </View>
            <Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tipCard, { marginTop: 15 }]}
            onPress={() => navigation.navigate('HealthTipDetail', {
              tip: {
                id: '2',
                title: 'Signos de alerta en la salud de tu mascota',
                description: 'Conoce los síntomas que indican que debes llevar a tu mascota al veterinario inmediatamente.',
                image: null,
                petType: 'cat',
                category: 'Cuidados Generales',
                author: 'Dra. María Gómez',
                date: '10 mayo, 2025',
                readTime: '4 min'
              }
            })}
          >
            <View style={styles.tipImageContainer}>
              <Text>
                <Ionicons name="alert-circle" size={32} color="#F44336" />
              </Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>
                Signos de alerta en la salud de tu mascota
              </Text>
              <Text style={styles.tipDescription}>
                Conoce los síntomas que indican que debes llevar a tu mascota al veterinario.
              </Text>
            </View>
            <Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  confirmButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  emergencyButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  emergencyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emergencyTimerText: {
    marginTop: 5,
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  // Estilos para el banner de estado
  statusBanner: {
    flexDirection: 'row',//Organiza el contenido horizontalmente
    alignItems: 'center',//Centra el contenido verticalmente
    paddingVertical: 8,//Aumenta el padding vertical
    paddingHorizontal: 12,//Aumenta el padding horizontal
    marginBottom: 10,//Margen inferior
    borderRadius: 4,//Radio de la esquina
    width: '100%',//Ancho del contenedor
  },
  statusBannerText: {
    color: '#fff',
    marginLeft: 8,//Margen izquierdo
    fontWeight: '500',//Peso del texto
    fontSize: 14,//Tamaño del texto
  },
  pendingContainer: {
    flexDirection: 'row',//Organiza el contenido horizontalmente
    alignItems: 'center',//Centra el contenido verticalmente
    paddingVertical: 12,//Aumenta el padding vertical
    paddingHorizontal: 12,//Aumenta el padding horizontal
    backgroundColor: '#FFF9C4',//Color de fondo
    borderRadius: 6,//Radio de la esquina
    marginTop: 8,//Margen superior
  },
  pendingText: {
    marginLeft: 10,//Margen izquierdo
    color: '#FF8F00',//Color del texto
    fontSize: 14,//Tamaño del texto
    fontWeight: '500',//Peso del texto
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  banner: {
    backgroundColor: '#1E88E5',//Color azul
    paddingVertical: 25,//Espacio vertical
    paddingHorizontal: 20,//Espacio horizontal
    borderBottomLeftRadius: 30,//Radio de la esquina inferior izquierda
    borderBottomRightRadius: 30,//Radio de la esquina inferior derecha
    flexDirection: 'row',//Distribución de los elementos
    overflow: 'hidden',//Ocultar el contenido que excede el tamaño del contenedor
  },
  bannerContent: {
    flex: 3,//Proporción del espacio
  },
  bannerImageContainer: {
    flex: 1,//Proporción del espacio
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerLogo: {
    width: 100,
    height: 100,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginBottom: 15,
  },
  bannerButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  emergencyButtonDisabled: {
    backgroundColor: '#cccccc', // Gris para deshabilitado
  },
  emergencyButtonTextDisabled: {
    color: '#666666', // Texto gris oscuro para deshabilitado
  },
  sectionContainer: {
    padding: 20,
  },
  lastSection: {
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  servicesList: {
    paddingRight: 10,
  },
  appointmentContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  appointmentVet: {
    fontSize: 14,
    color: '#666',
  },
  appointmentButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  appointmentButtonText: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  vetsList: {
    paddingRight: 10,
    paddingBottom: 10,
  },
  // Estilos para veterinarios destacados
  featuredVetCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    marginBottom: 5,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  
  // Estilos para la tarjeta de emergencia activa
  emergencyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
  },
  pulseIndicator: {
    // Se puede agregar una animación de pulso aquí si es necesario
  },
  emergencyContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  vetImageContainer: {
    marginRight: 12,
  },
  vetImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  vetImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyVetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  emergencySpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  emergencyButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  emergencyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Estilos para la tarjeta de distancia del veterinario
  vetDistanceCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distanceTitle: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '500',
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  estimatedTimeText: {
    fontSize: 14,
    color: '#616161',
    marginLeft: 5,
  },
  privacyNotice: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  updateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    marginTop: 8,
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  vetTopSection: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  vetImageContainer: {
    marginRight: 10,
    position: 'relative',
  },
  vetImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  vetSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  vetDetailSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 10,
  },
  vetDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vetDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  vetSpecialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  specialtyText: {
    fontSize: 11,
    color: '#1E88E5',
    fontWeight: '500',
  },
  // Estilos para veterinarios disponibles
  availableVetCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    marginBottom: 5,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  vetStatusContainer: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 5,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vetStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  vetStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  vetAvailableContent: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipImageContainer: {
    marginRight: 15,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tipDescription: {
    fontSize: 12,
    color: '#888',
  },
  emptyStateCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    minWidth: 280,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HomeScreen;
