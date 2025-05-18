import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/globalStyles';
import useAuthStore from '../../store/useAuthStore';

const AppointmentsScreen = ({ navigation }) => {
  // Estados para gestionar diferentes tipos de citas
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'upcoming', 'past'
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Obtener el usuario del store
  const user = useAuthStore(state => state.user);
  
  // Cargar citas al iniciar
  useEffect(() => {
    loadAppointments();
  }, []);
  
  // Función para cargar las citas desde el backend
  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      // En una implementación real, aquí llamaríamos a la API
      // Por ahora, cargaremos datos de ejemplo
      
      // Simular una llamada a la API
      setTimeout(() => {
        setPendingAppointments([
          {
            id: 'cita1',
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
            id: 'cita2',
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
        
        setUpcomingAppointments([
          {
            id: 'cita3',
            usuarioNombre: 'Carlos López',
            mascotaNombre: 'Michi',
            tipoMascota: 'Gato',
            raza: 'Común europeo',
            servicio: 'Vacunación',
            fechaHora: '21/05/2025 15:30',
            motivo: 'Vacuna antirrábica',
            estado: 'confirmada',
            ubicacion: 'Clínica',
            direccion: ''
          },
          {
            id: 'cita4',
            usuarioNombre: 'Laura Gómez',
            mascotaNombre: 'Rocky',
            tipoMascota: 'Perro',
            raza: 'Bulldog',
            servicio: 'Control',
            fechaHora: '22/05/2025 11:00',
            motivo: 'Control mensual',
            estado: 'confirmada',
            ubicacion: 'Domicilio',
            direccion: 'Av. Santa Fe 1200, CABA'
          }
        ]);
        
        setPastAppointments([
          {
            id: 'cita5',
            usuarioNombre: 'María Fernández',
            mascotaNombre: 'Pelusa',
            tipoMascota: 'Gato',
            servicio: 'Consulta',
            fechaHora: '10/05/2025 09:00',
            motivo: 'Problema digestivo',
            estado: 'completada',
            ubicacion: 'Clínica',
            direccion: ''
          },
          {
            id: 'cita6',
            usuarioNombre: 'Roberto Sánchez',
            mascotaNombre: 'Max',
            tipoMascota: 'Perro',
            servicio: 'Desparasitación',
            fechaHora: '05/05/2025 17:00',
            motivo: 'Desparasitación trimestral',
            estado: 'completada',
            ubicacion: 'Domicilio',
            direccion: 'Calle Libertad 500, CABA'
          }
        ]);
        
        setLoading(false);
        setRefreshing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al cargar citas:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'No pudimos cargar las citas. Intenta nuevamente.');
    }
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
            
            // Eliminar de pendientes
            setPendingAppointments(
              pendingAppointments.filter(item => item.id !== appointment.id)
            );
            
            // Añadir a próximas (con estado actualizado)
            const confirmedAppointment = {
              ...appointment,
              estado: 'confirmada'
            };
            setUpcomingAppointments([...upcomingAppointments, confirmedAppointment]);
            
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
            
            // Mostrar mensaje de éxito
            Alert.alert('Cita rechazada', 'La cita ha sido rechazada.');
          },
        },
      ]
    );
  };
  
  // Función para cancelar una cita confirmada
  const handleCancelAppointment = (appointment) => {
    Alert.alert(
      'Cancelar Cita',
      `¿Estás seguro de cancelar la cita con ${appointment.usuarioNombre}?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => {
            // Aquí iría la lógica para cancelar la cita en el backend
            // Por ahora, actualizamos el estado local
            setUpcomingAppointments(
              upcomingAppointments.filter(item => item.id !== appointment.id)
            );
            
            // Mostrar mensaje de éxito
            Alert.alert('Cita cancelada', 'La cita ha sido cancelada exitosamente.');
          },
        },
      ]
    );
  };
  
  // Función para ver detalles de una cita
  const handleViewAppointmentDetails = (appointment) => {
    navigation.navigate('AppointmentDetails', { appointment });
  };
  
  // Función para refrescar los datos
  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };
  
  // Renderizar cada cita pendiente
  const renderPendingAppointment = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.usuarioNombre}</Text>
            <View style={styles.petInfo}>
              <Ionicons name="paw-outline" size={14} color={COLORS.grey} />
              <Text style={styles.petName}>{item.mascotaNombre} ({item.tipoMascota})</Text>
            </View>
          </View>
        </View>
        <View style={styles.serviceBadge}>
          <Text style={styles.serviceBadgeText}>{item.servicio}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.appointmentRow}>
          <View style={styles.appointmentDetail}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.detailText}>{item.fechaHora}</Text>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.detailText}>{item.ubicacion}</Text>
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
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectAppointment(item)}
        >
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.confirmButton]}
          onPress={() => handleConfirmAppointment(item)}
        >
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Renderizar cada cita confirmada o pasada
  const renderAppointmentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => handleViewAppointmentDetails(item)}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.usuarioNombre}</Text>
            <View style={styles.petInfo}>
              <Ionicons name="paw-outline" size={14} color={COLORS.grey} />
              <Text style={styles.petName}>{item.mascotaNombre} ({item.tipoMascota})</Text>
            </View>
          </View>
        </View>
        <View style={styles.serviceBadge}>
          <Text style={styles.serviceBadgeText}>{item.servicio}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.appointmentRow}>
          <View style={styles.appointmentDetail}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.detailText}>{item.fechaHora}</Text>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.detailText}>{item.ubicacion}</Text>
          </View>
        </View>
        
        {item.motivo && (
          <View style={styles.motiveContainer}>
            <Text style={styles.motiveLabel}>Motivo:</Text>
            <Text style={styles.motiveText}>{item.motivo}</Text>
          </View>
        )}
      </View>
      
      {activeTab === 'upcoming' && (
        <View style={styles.appointmentActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelAppointment(item)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleViewAppointmentDetails(item)}
          >
            <Text style={styles.viewButtonText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
  
  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando citas...</Text>
        </View>
      );
    }
    
    if (activeTab === 'pending') {
      return pendingAppointments.length > 0 ? (
        <FlatList
          data={pendingAppointments}
          renderItem={renderPendingAppointment}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="calendar" size={70} color="#DDD" />
          <Text style={styles.emptyStateText}>No tienes citas pendientes por confirmar</Text>
        </View>
      );
    } else if (activeTab === 'upcoming') {
      return upcomingAppointments.length > 0 ? (
        <FlatList
          data={upcomingAppointments}
          renderItem={({item}) => renderAppointmentItem({item})}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="calendar" size={70} color="#DDD" />
          <Text style={styles.emptyStateText}>No tienes citas próximas confirmadas</Text>
        </View>
      );
    } else {
      return pastAppointments.length > 0 ? (
        <FlatList
          data={pastAppointments}
          renderItem={({item}) => renderAppointmentItem({item})}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="calendar" size={70} color="#DDD" />
          <Text style={styles.emptyStateText}>No tienes historial de citas</Text>
        </View>
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Citas</Text>
      </View>
      
      {/* Pestañas de navegación */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' ? styles.activeTab : null]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' ? styles.activeTabText : null]}>
            Pendientes
          </Text>
          {pendingAppointments.length > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{pendingAppointments.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' ? styles.activeTab : null]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' ? styles.activeTabText : null]}>
            Próximas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' ? styles.activeTab : null]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' ? styles.activeTabText : null]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Contenido principal */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.grey,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  badgeContainer: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.grey,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.grey,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    padding: 15,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  petName: {
    fontSize: 14,
    color: COLORS.grey,
    marginLeft: 5,
  },
  serviceBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  serviceBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentDetails: {
    marginVertical: 10,
  },
  appointmentRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.grey,
    marginLeft: 5,
  },
  motiveContainer: {
    marginTop: 5,
  },
  motiveLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  motiveText: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 3,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  rejectButton: {
    backgroundColor: COLORS.accentLight,
  },
  rejectButtonText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: COLORS.accentLight,
  },
  cancelButtonText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  viewButton: {
    backgroundColor: COLORS.primaryLight,
  },
  viewButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  confirmedStatus: {
    backgroundColor: '#E3F2FD',
  },
  pendingStatus: {
    backgroundColor: '#FFF8E1',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default AppointmentsScreen;
