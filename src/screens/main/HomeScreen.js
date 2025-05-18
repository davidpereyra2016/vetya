import React, { useState, useEffect } from 'react';
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
            <Ionicons name="person-circle" size={40} color="#1E88E5" />
          </View>
          <View>
            <Text style={styles.userName}>{item.usuarioNombre}</Text>
            <View style={styles.petInfo}>
              <Ionicons name="paw" size={14} color="#666" />
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
            <Ionicons name="calendar" size={16} color="#1E88E5" />
            <Text style={styles.appointmentDetailText}>{item.fechaHora}</Text>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Ionicons name="location" size={16} color="#1E88E5" />
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
            <Ionicons name="person-circle" size={40} color="#1E88E5" />
          </View>
          <View>
            <Text style={styles.userName}>{item.usuarioNombre}</Text>
            <View style={styles.petInfo}>
              <Ionicons name="paw" size={14} color="#666" />
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
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.appointmentUserName}>{item.usuarioNombre}</Text>
        </View>
        <View style={styles.petInfo}>
          <Ionicons name="paw" size={16} color="#666" />
          <Text style={styles.appointmentPetName}>{item.mascotaNombre} ({item.tipoMascota})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Encabezado y control de disponibilidad */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcome}>¡Bienvenido a VetPresta!</Text>
            <Text style={styles.providerName}>{provider?.nombre || user?.username || 'Prestador'}</Text>
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
              <Ionicons name="calendar" size={50} color="#ccc" />
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
