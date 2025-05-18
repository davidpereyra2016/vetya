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
            <Text>
              <Ionicons name="person-circle" size={40} color={COLORS.primary} />
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.usuarioNombre}</Text>
            <View style={styles.petInfo}>
              <Text>
                <Ionicons name="paw-outline" size={14} color={COLORS.grey} />
              </Text>
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
            <Text>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            </Text>
            <Text style={styles.detailText}>{item.fechaHora}</Text>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Text>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            </Text>
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
            <Text>
              <Ionicons name="person-circle" size={40} color={COLORS.primary} />
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.usuarioNombre}</Text>
            <View style={styles.petInfo}>
              <Text>
                <Ionicons name="paw-outline" size={14} color={COLORS.grey} />
              </Text>
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
            <Text>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            </Text>
            <Text style={styles.detailText}>{item.fechaHora}</Text>
          </View>
          
          <View style={styles.appointmentDetail}>
            <Text>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            </Text>
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
          <Text>
            <Ionicons name="calendar" size={70} color="#DDD" />
          </Text>
          <Text style={styles.emptyStateText}>No tienes citas pendientes por confirmar</Text>
        </View>
      );
    } else if (activeTab === 'upcoming') {
      return upcomingAppointments.length > 0 ? (
        <FlatList
          data={upcomingAppointments}
          renderItem={({item}) => renderAppointmentItem({item, type: 'upcoming'})}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text>
            <Ionicons name="calendar" size={70} color="#DDD" />
          </Text>
          <Text style={styles.emptyStateText}>No tienes citas próximas confirmadas</Text>
        </View>
      );
    } else {
      return pastAppointments.length > 0 ? (
        <FlatList
          data={pastAppointments}
          renderItem={({item}) => renderAppointmentItem({item, type: 'past'})}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text>
            <Ionicons name="calendar" size={70} color="#DDD" />
          </Text>
          <Text style={styles.emptyStateText}>No tienes citas pasadas en tu historial</Text>
        </View>
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Encabezado principal */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Citas</Text>
          <View style={{width: 24}} /> {/* Elemento vacío para equilibrar el layout */}
        </View>
      </View>
      
      {/* Pestañas de navegación mejoradas */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity 
            style={[styles.categoryItem, activeTab === 'pending' && styles.activeCategoryItem]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.categoryText, activeTab === 'pending' && styles.activeCategoryText]}>
              Por confirmar {pendingAppointments.length > 0 && `(${pendingAppointments.length})`}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.categoryItem, activeTab === 'upcoming' && styles.activeCategoryItem]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.categoryText, activeTab === 'upcoming' && styles.activeCategoryText]}>
              Próximas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.categoryItem, activeTab === 'past' && styles.activeCategoryItem]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.categoryText, activeTab === 'past' && styles.activeCategoryText]}>
              Historial
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Contenido principal - Sin ScrollView envolvente para evitar listas anidadas */}
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
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 10,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 5,
  },
  categoryContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tabsScrollContent: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeCategoryItem: {
    backgroundColor: COLORS.primary + '20',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  appointmentsList: {
    padding: 15,
  },
  listContainer: {
    paddingVertical: 10,
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  userDetails: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 2,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  petName: {
    fontSize: 14,
    color: COLORS.grey,
    marginLeft: 4,
  },
  serviceBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  serviceBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    marginBottom: 15,
  },
  appointmentRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 6,
  },
  motiveContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  motiveLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  motiveText: {
    fontSize: 14,
    color: COLORS.grey,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: COLORS.accent,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  rejectButtonText: {
    color: '#F44336',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#E3F2FD',
  },
  viewButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default AppointmentsScreen;
