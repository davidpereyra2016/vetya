<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> e4ccb3e9d82b3e4202eea3a04659dece14a4b700
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView,
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Image,
  FlatList,
<<<<<<< HEAD
  Animated,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ServiceCard from '../../components/ServiceCard'; // Import the new component
import useEmergencyStore from '../../store/useEmergencyStore';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  // Estado para manejar la carga de datos
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Obtener veterinarios disponibles del store
  const { availableVets, loadAvailableVets, activeEmergencies, loadActiveEmergencies } = useEmergencyStore();
  // Datos de ejemplo para los servicios
  const services = [
=======
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  // Estado para el modo disponible/no disponible para emergencias
  const [availableForEmergencies, setAvailableForEmergencies] = useState(false);
  
  // Estado para el panel de estadísticas
  const [stats, setStats] = useState({
    emergenciasAtendidas: 12,
    citasHoy: 3,
    citasPendientes: 8,
    valoracionPromedio: 4.8
  });
  
  // Estado para citas pendientes por confirmar
  const [pendingAppointments, setPendingAppointments] = useState([
>>>>>>> e4ccb3e9d82b3e4202eea3a04659dece14a4b700
    {
      id: 'cita3',
      usuarioNombre: 'Ana María Rodríguez',
      mascotaNombre: 'Toby',
      tipoMascota: 'Perro',
      raza: 'Golden Retriever',
      edad: '5 años',
      servicio: 'Consulta general',
      fechaHora: '19/05/2025 10:00',
      motivo: 'Revisión por pérdida de apetito',
      estado: 'pendiente',
      ubicacion: 'Domicilio',
      direccion: 'Av. Corrientes 2500, CABA'
    },
    {
      id: 'cita4',
      usuarioNombre: 'Jorge Martínez',
      mascotaNombre: 'Luna',
      tipoMascota: 'Gato',
      raza: 'Siamés',
      edad: '2 años',
      servicio: 'Vacunación',
      fechaHora: '20/05/2025 16:15',
      motivo: 'Vacuna anual',
      estado: 'pendiente',
      ubicacion: 'Clínica',
      direccion: ''
    }
  ]);

<<<<<<< HEAD
  // Cargar datos cuando el componente se monta o cuando la pantalla obtiene el foco
  useEffect(() => {
    loadInitialData();
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
      return () => {};
    }, [])
  );
  
  // Función para cargar datos iniciales
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadAvailableVets(), loadActiveEmergencies()]);
    } catch (error) {
      console.log('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para actualizar datos (pull-to-refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadAvailableVets(), loadActiveEmergencies()]);
    } catch (error) {
      console.log('Error al actualizar datos:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Manejar la solicitud de emergencia
  const handleEmergencyRequest = () => {
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
  
  // Datos para la sección de veterinarios destacados (usar datos reales de la API si están disponibles)
  const featuredVets = availableVets.length > 0 ? availableVets.slice(0, 3).map(vet => ({
    id: vet._id,
    name: vet.nombre,
    specialty: vet.especialidad || 'Medicina general',
    rating: vet.rating || 4.5,
    experience: vet.experiencia || '5 años',
    patients: vet.pacientesAtendidos || 50,
    reviews: vet.resenas?.length || 10,
    available: vet.disponibleEmergencias,
    status: 'Destacado',
    specialties: vet.especialidades || ['Perros', 'Gatos'],
    image: vet.imagen
  })) : [
    {
      id: '1',
      name: 'Dr. Carlos Rodríguez',
      specialty: 'Medicina general',
      rating: 4.9,
      experience: '10 años',
      patients: 120,
      reviews: 48,
      available: true,
      status: 'Destacado',
      specialties: ['Perros', 'Gatos', 'Aves'],
      image: null // Usamos placeholder en vez de URL para evitar errores
    },
    {
      id: '2',
      name: 'Dra. María Gómez',
      specialty: 'Cirugía veterinaria',
      rating: 4.8,
      experience: '8 años',
      patients: 95,
      reviews: 36,
      available: true,
      status: 'Destacado',
      specialties: ['Perros', 'Gatos', 'Animales exóticos'],
      image: null
    },
    {
      id: '3',
      name: 'Dr. Juan Pérez',
      specialty: 'Dermatología animal',
      rating: 4.7,
      experience: '6 años',
      patients: 78,
      reviews: 29,
      available: false,
      status: 'Destacado',
      specialties: ['Perros', 'Gatos'],
      image: null
    },
  ];

  // Veterinarios disponibles para emergencias
  const availableVetsList = availableVets.length > 0 ? availableVets.filter(vet => vet.disponibleEmergencias).map(vet => ({
    id: vet._id,
    name: vet.nombre,
    specialty: vet.especialidad || 'Medicina general',
    rating: vet.rating || 4.5,
    distance: vet.distancia || '3 km',
    available: true,
    image: vet.imagen
  })) : [
    {
      id: '4',
      name: 'Dra. Lucía Hernández',
      specialty: 'Nutrición animal',
      rating: 4.6,
      experience: '5 años',
      patients: 64,
      reviews: 31,
      available: true,
      status: 'Disponible ahora',
      specialties: ['Perros', 'Gatos', 'Roedores'],
      image: null
    },
    {
      id: '5',
      name: 'Dr. Martín Díaz',
      specialty: 'Cardiología',
      rating: 4.9,
      experience: '12 años',
      patients: 150,
      reviews: 67,
      available: true,
      status: 'Disponible ahora',
      specialties: ['Perros', 'Gatos'],
      image: null
    },
    {
      id: '6',
      name: 'Dra. Sofía López',
      specialty: 'Oftalmología',
      rating: 4.7,
      experience: '7 años',
      patients: 85,
      reviews: 42,
      available: true,
      status: 'Disponible ahora',
      specialties: ['Perros', 'Gatos', 'Conejos'],
      image: null
    },
  ];

  const handleServicePress = (service) => {
    if (service.id === 'emergencias') { // Emergencias
      navigation.navigate('EmergencyForm');
    } else if (service.id === '1') { // Consulta General
      navigation.navigate('ConsultaGeneral');
    } else if (service.id === 'citas') {
      navigation.navigate('Citas');
    } else if (service.id === 'mascotas') {
      navigation.navigate('Mascotas');
    } else {
      // Para otros servicios podríamos mostrar un mensaje o navegar a otras pantallas
      console.log(`Servicio seleccionado: ${service.title}`);
=======
  // Estado para solicitudes de emergencia activas
  const [activeEmergencies, setActiveEmergencies] = useState([
    {
      id: 'em1',
      usuarioNombre: 'María García',
      mascotaNombre: 'Firulais',
      tipoMascota: 'Perro',
      descripcion: 'Dificultad para respirar y vómitos',
      ubicacion: 'Av. Rivadavia 3456, CABA',
      distancia: '2.3 km',
      tiempo: '12 min',
      estado: 'pendiente',
      fechaHora: new Date().toISOString(),
      urgencia: 'alta'
>>>>>>> e4ccb3e9d82b3e4202eea3a04659dece14a4b700
    }
  ]);

  // Estado para próximas citas programadas
  const [upcomingAppointments, setUpcomingAppointments] = useState([
    {
      id: 'cita1',
      usuarioNombre: 'Carlos López',
      mascotaNombre: 'Michi',
      tipoMascota: 'Gato',
      servicio: 'Vacunación',
      fechaHora: '16/05/2025 15:30',
      estado: 'confirmada'
    },
    {
      id: 'cita2',
      usuarioNombre: 'Laura Martínez',
      mascotaNombre: 'Rocky',
      tipoMascota: 'Perro',
      servicio: 'Control rutinario',
      fechaHora: '16/05/2025 17:00',
      estado: 'confirmada'
    },
    {
      id: 'cita3',
      usuarioNombre: 'Jorge Méndez',
      mascotaNombre: 'Pelusa',
      tipoMascota: 'Conejo',
      servicio: 'Desparasitación',
      fechaHora: '17/05/2025 10:15',
      estado: 'pendiente'
    }
  ]);

  // Estado para controlar el refreshing
  const [refreshing, setRefreshing] = useState(false);

  // Obtener información del prestador desde el store
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);

  // Función para cambiar disponibilidad
  const toggleAvailability = async () => {
    // Aquí iría la lógica para actualizar la disponibilidad en el backend
    setAvailableForEmergencies(!availableForEmergencies);
    
    // Mensaje para el usuario
    Alert.alert(
      !availableForEmergencies ? 'Modo Disponible' : 'Modo No Disponible',
      !availableForEmergencies 
        ? 'Ahora recibirás solicitudes de emergencias cercanas' 
        : 'Ya no recibirás solicitudes de emergencias',
      [{ text: 'Entendido' }]
    );
  };

  // Función para manejar la aceptación de una emergencia
  const handleAcceptEmergency = (emergency) => {
    Alert.alert(
      'Aceptar Emergencia',
      `¿Confirmas que atenderás la emergencia de ${emergency.mascotaNombre}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Aceptar',
          onPress: () => {
            // Aquí iría la lógica para aceptar la emergencia
            // Y navegar a la pantalla de detalles/mapa
            navigation.navigate('EmergencyDetails', { emergency });
          },
        },
      ]
    );
  };

  // Función para manejar el rechazo de una emergencia
  const handleRejectEmergency = (emergency) => {
    Alert.alert(
      'Rechazar Emergencia',
      '¿Estás seguro de rechazar esta solicitud?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => {
            // Aquí iría la lógica para rechazar la emergencia
            setActiveEmergencies(
              activeEmergencies.filter(item => item.id !== emergency.id)
            );
          },
        },
      ]
    );
  };

  // Función para manejar la selección de una cita
  const handleAppointmentPress = (appointment) => {
    navigation.navigate('AppointmentDetails', { appointment });
  };

  // Función para confirmar una cita pendiente
  const handleConfirmAppointment = (appointment) => {
    Alert.alert(
      'Confirmar Cita',
      `¿Confirmar cita con ${appointment.usuarioNombre} para ${appointment.mascotaNombre}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: () => {
            // Aquí iría la lógica para confirmar la cita en el backend
            // Por ahora, actualizamos el estado local
            setPendingAppointments(
              pendingAppointments.filter(item => item.id !== appointment.id)
            );
            
            // Actualizar las estadísticas
            setStats({
              ...stats,
              citasPendientes: stats.citasPendientes - 1
            });
            
            // Mostrar mensaje de éxito
            Alert.alert('Cita confirmada', 'La cita ha sido confirmada exitosamente.');
          },
        },
      ]
    );
  };

  // Función para rechazar una cita pendiente
  const handleRejectAppointment = (appointment) => {
    Alert.alert(
      'Rechazar Cita',
      `¿Estás seguro de rechazar la cita con ${appointment.usuarioNombre}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => {
            // Aquí iría la lógica para rechazar la cita en el backend
            // Por ahora, actualizamos el estado local
            setPendingAppointments(
              pendingAppointments.filter(item => item.id !== appointment.id)
            );
            
            // Actualizar las estadísticas
            setStats({
              ...stats,
              citasPendientes: stats.citasPendientes - 1
            });
            
            // Mostrar mensaje de éxito
            Alert.alert('Cita rechazada', 'La cita ha sido rechazada.');
          },
        },
      ]
    );
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // Aquí iría la lógica para recargar datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Renderizar cada cita pendiente por confirmar
  const renderPendingAppointment = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text>
              <Ionicons name="person-circle" size={40} color="#1E88E5" />
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.usuarioNombre}</Text>
            <View style={styles.petInfo}>
              <Text>
                <Ionicons name="paw" size={14} color="#666" />
              </Text>
              <Text style={styles.petName}>{item.mascotaNombre} ({item.tipoMascota})</Text>
            </View>
          </View>
        </View>
        <View style={[styles.appointmentBadge]}>
          <Text style={styles.appointmentBadgeText}>
            {item.servicio}
          </Text>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.appointmentRow}>
          <View style={styles.appointmentDetail}>
            <Text>
              <Ionicons name="calendar" size={16} color="#1E88E5" />
            </Text>
            <Text style={styles.appointmentDetailText}>{item.fechaHora}</Text>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Text>
              <Ionicons name="location" size={16} color="#1E88E5" />
            </Text>
            <Text style={styles.appointmentDetailText}>{item.ubicacion}</Text>
          </View>
        </View>

        {item.motivo && (
          <View style={styles.motiveContainer}>
            <Text style={styles.motiveLabel}>Motivo:</Text>
            <Text style={styles.motiveText}>{item.motivo}</Text>
          </View>
        )}
      </View>

      <View style={styles.appointmentActions}>
        <TouchableOpacity 
          style={[styles.appointmentButton, styles.rejectButton]}
          onPress={() => handleRejectAppointment(item)}
        >
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.appointmentButton, styles.confirmButton]}
          onPress={() => handleConfirmAppointment(item)}
        >
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar cada solicitud de emergencia
  const renderEmergencyItem = ({ item }) => (
    <View style={styles.emergencyCard}>
      <View style={styles.emergencyHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text>
              <Ionicons name="person-circle" size={40} color="#1E88E5" />
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.usuarioNombre}</Text>
            <View style={styles.petInfo}>
              <Text>
                <Ionicons name="paw" size={14} color="#666" />
              </Text>
              <Text style={styles.petName}>{item.mascotaNombre} ({item.tipoMascota})</Text>
            </View>
          </View>
        </View>
        <View style={[styles.urgencyBadge, 
          item.urgencia === 'alta' ? styles.highUrgency : 
          item.urgencia === 'media' ? styles.mediumUrgency : 
          styles.lowUrgency]}>
          <Text style={styles.urgencyText}>
            {item.urgencia === 'alta' ? 'URGENTE' : 
             item.urgencia === 'media' ? 'MEDIA' : 'BAJA'}
          </Text>
        </View>
      </View>

      <View style={styles.emergencyDetails}>
        <Text style={styles.emergencyDescription}>{item.descripcion}</Text>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={16} color="#F44336" />
          <Text style={styles.locationText}>{item.ubicacion}</Text>
        </View>
        
        <View style={styles.distanceTimeContainer}>
          <View style={styles.distanceTime}>
            <Ionicons name="navigate" size={14} color="#666" />
            <Text style={styles.distanceTimeText}>{item.distancia}</Text>
          </View>
          <View style={styles.distanceTime}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={styles.distanceTimeText}>{item.tiempo} en auto</Text>
          </View>
        </View>
      </View>

      <View style={styles.emergencyActions}>
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => handleRejectEmergency(item)}
        >
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptEmergency(item)}
        >
          <Text style={styles.acceptButtonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar cada cita programada
  const renderAppointmentItem = ({ item, onPress }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={onPress || (() => handleAppointmentPress(item))}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentService}>{item.servicio}</Text>
          <Text style={styles.appointmentDateTime}>{item.fechaHora}</Text>
        </View>
        <View style={[styles.statusBadge, 
          item.estado === 'confirmada' ? styles.confirmedStatus : styles.pendingStatus]}>
          <Text style={styles.statusText}>
            {item.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
          </Text>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.userInfo}>
          <Text>
            <Ionicons name="person" size={16} color="#666" />
          </Text>
          <Text style={styles.appointmentUserName}>{item.usuarioNombre}</Text>
        </View>
        <View style={styles.petInfo}>
          <Text>
            <Ionicons name="paw" size={16} color="#666" />
          </Text>
          <Text style={styles.appointmentPetName}>{item.mascotaNombre} ({item.tipoMascota})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
<<<<<<< HEAD
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
        <View style={styles.banner}>
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
            <Text>
              <Ionicons name="paw" size={100} color="#fff" style={{ opacity: 0.3 }} />
            </Text>
          </View>
        </View>

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

        {/* Próxima cita */}
        <View style={styles.appointmentContainer}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentTitle}>Tu próxima cita</Text>
            <Text>
              <Ionicons name="calendar" size={24} color="#1E88E5" />
            </Text>
          </View>
          <View style={styles.appointmentContent}>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentDate}>Miércoles, 15 de Mayo</Text>
              <Text style={styles.appointmentTime}>15:30 - 16:30</Text>
              <Text style={styles.appointmentType}>Consulta general</Text>
              <Text style={styles.appointmentVet}>Dr. Carlos Rodríguez</Text>
            </View>
            <TouchableOpacity style={styles.appointmentButton}>
              <Text style={styles.appointmentButtonText}>Ver detalles</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Veterinarios disponibles ahora */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Veterinarios disponibles</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllVetsScreen', { filter: 'available' })}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
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
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>
                    No hay veterinarios disponibles en este momento
                  </Text>
                </View>
              )}
            />
          )}
        </View>
        
        {/* Veterinarios destacados */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Veterinarios destacados</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllVetsScreen', { filter: 'featured' })}>
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
          />
        </View>

        {/* Consejos de salud */}
        <View style={[styles.sectionContainer, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consejos de salud</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HealthTips')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
=======
      
      {/* Encabezado y control de disponibilidad */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcome}>¡Bienvenido a VetPresta!</Text>
            <Text style={styles.providerName}>{provider?.nombre || user?.username || 'Prestador'}</Text>
>>>>>>> e4ccb3e9d82b3e4202eea3a04659dece14a4b700
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Ionicons name="person-circle" size={40} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.availabilityContainer}>
          <Text style={styles.availabilityTitle}>
            {availableForEmergencies ? 'Disponible para emergencias' : 'No disponible para emergencias'}
          </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={availableForEmergencies ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleAvailability}
            value={availableForEmergencies}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1E88E5"]}
          />
        }
      >
        {/* Estadísticas del prestador */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.emergenciasAtendidas}</Text>
            <Text style={styles.statLabel}>Emergencias</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.citasHoy}</Text>
            <Text style={styles.statLabel}>Citas hoy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.citasPendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Text style={styles.statValue}>{stats.valoracionPromedio}</Text>
              <Ionicons name="star" size={16} color="#FFC107" />
            </View>
            <Text style={styles.statLabel}>Valoración</Text>
          </View>
        </View>

        {/* Solicitudes de emergencia */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Solicitudes de Emergencia</Text>
            {activeEmergencies.length > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{activeEmergencies.length}</Text>
              </View>
            )}
          </View>
          
          {activeEmergencies.length > 0 ? (
            <FlatList
              data={activeEmergencies}
              renderItem={renderEmergencyItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="medical" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {availableForEmergencies 
                  ? 'No hay solicitudes de emergencia en este momento' 
                  : 'Activa tu disponibilidad para recibir solicitudes'}
              </Text>
            </View>
          )}
        </View>

        {/* Próximas citas */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximas Citas</Text>
            {upcomingAppointments.length > 0 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Appointments')}
              >
                <Text style={styles.viewAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {upcomingAppointments.length > 0 ? (
            <FlatList
              data={upcomingAppointments.slice(0, 2)} // Mostrar solo las 2 primeras
              renderItem={({item}) => renderAppointmentItem({item, onPress: () => 
                navigation.navigate('AppointmentDetails', {appointment: item})
              })}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text>
                <Ionicons name="calendar" size={50} color="#ccc" />
              </Text>
              <Text style={styles.emptyStateText}>No hay citas programadas próximamente</Text>
            </View>
          )}
        </View>
        
        {/* Botones de acceso rápido */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Services')}
          >
            <Text>
              <Ionicons name="list" size={24} color="#1E88E5" />
            </Text>
            <Text style={styles.quickActionText}>Mis Servicios</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Appointments')}
          >
            <Text>
              <Ionicons name="calendar" size={24} color="#1E88E5" />
            </Text>
            <Text style={styles.quickActionText}>Mis Citas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Availability')}
          >
            <Text>
              <Ionicons name="time" size={24} color="#4CAF50" />
            </Text>
            <Text style={styles.quickActionText}>Disponibilidad</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Reviews')}
          >
            <Text>
              <Ionicons name="star" size={24} color="#FFC107" />
            </Text>
            <Text style={styles.quickActionText}>Valoraciones</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
//no analizar solo en el caso de 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1E88E5',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  providerName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 5,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
  },
  availabilityTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E0E0E0',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  badgeContainer: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewAllButton: {
    padding: 5,
  },
  viewAllText: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: '500',
  },
  emergencyCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
    overflow: 'hidden',
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  petName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  highUrgency: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  mediumUrgency: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffecb3',
  },
  lowUrgency: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  emergencyDetails: {
    padding: 12,
  },
  emergencyDescription: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
    flex: 1,
  },
  distanceTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  distanceTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  distanceTimeText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  emergencyActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  rejectButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  acceptButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
  },
  rejectButtonText: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#1E88E5',
    fontSize: 15,
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    padding: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentDateTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  confirmedStatus: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  pendingStatus: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffecb3',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  appointmentUserName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  appointmentPetName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    color: '#777',
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  quickActionButton: {
    width: (width - 60) / 2,
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default HomeScreen;
