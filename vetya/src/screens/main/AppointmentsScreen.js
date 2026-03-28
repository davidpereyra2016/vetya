import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useCitaStore from '../../store/useCitaStore';

const AppointmentsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Obteniendo datos y funciones del store de Zustand
  const {
    upcomingAppointments,
    pastAppointments,
    isLoading,
    fetchUserAppointments,
    updateAppointmentStatus
  } = useCitaStore();
  
  // useFocusEffect se ejecuta cada vez que la pantalla entra en foco
  useFocusEffect(
    useCallback(() => {
      console.log('Cargando citas...');
      fetchUserAppointments();
    }, [])
  );

  const handleCancelAppointment = (appointmentId) => {
    Alert.alert(
      "Confirmar cancelación",
      "¿Estás seguro de que quieres cancelar esta cita?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí, cancelar", 
          style: "destructive",
          onPress: async () => {
            const result = await updateAppointmentStatus(appointmentId, 'Cancelada');
            if (!result.success) {
              Alert.alert('Error', result.error || 'No se pudo cancelar la cita.');
            }
            if (modalVisible) {
                setModalVisible(false);
            }
          } 
        }
      ]
    );
  };

  const handleRescheduleAppointment = (appointment) => {
    // Aquí puedes navegar a la pantalla de agendar, pasando datos si es necesario
    setModalVisible(false);
    navigation.navigate('AgendarCita', {
      reschedulingAppointment: appointment 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmada': return '#4CAF50';
      case 'Pendiente': return '#FFC107';
      case 'Cancelada': return '#F44336';
      case 'Completada': return '#757575';
      default: return '#1E88E5';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.appointmentCard} 
      onPress={() => {
        setSelectedAppointment(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={18} color="#1E88E5" />
          <Text style={styles.dateText}>
            {new Date(item.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) }]}>
          <Text style={styles.statusText}>{item.estado}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{`${item.horaInicio} - ${item.horaFin}`}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="medkit-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.servicio?.nombre || 'Servicio no especificado'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="paw-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.mascota?.nombre || 'Mascota no especificada'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.prestador?.nombre || 'Prestador no especificado'}</Text>
        </View>
      </View>
      
      <View style={styles.buttonsContainer}>
        {activeTab === 'upcoming' && (
          <>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleRescheduleAppointment(item)}>
              <Text style={styles.actionButtonText}>Reprogramar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => handleCancelAppointment(item._id)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
        {activeTab === 'past' && (
          <TouchableOpacity style={styles.reviewButton} onPress={() => { setSelectedAppointment(item); setModalVisible(true); }}>
            <Text style={styles.reviewButtonText}>Ver detalles</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const AppointmentDetailsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles de la Cita</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedAppointment && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.statusContainer}>
                <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedAppointment.estado) }]}>
                  <Text style={styles.modalStatusText}>{selectedAppointment.estado}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Fecha y Hora</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{new Date(selectedAppointment.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{`${selectedAppointment.horaInicio} - ${selectedAppointment.horaFin}`}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Servicio</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="medkit" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.servicio?.nombre}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Mascota</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="paw" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.mascota?.nombre}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Prestador</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.prestador?.nombre}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Ubicación</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.ubicacion}</Text>
                </View>
              </View>
              
              {activeTab === 'upcoming' && (
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity style={styles.modalActionButton} onPress={() => handleRescheduleAppointment(selectedAppointment)}>
                    <Text style={styles.modalActionButtonText}>Reprogramar cita</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalActionButton, styles.modalCancelButton]} onPress={() => handleCancelAppointment(selectedAppointment._id)}>
                    <Text style={styles.modalCancelButtonText}>Cancelar cita</Text>
                  </TouchableOpacity>
                </View>
              )}
              
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const dataToShow = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Citas</Text>
        <TouchableOpacity 
          style={styles.newAppointmentButton}
          onPress={() => navigation.navigate('AgendarCita')}
        >
          <Text style={styles.newAppointmentButtonText}>Nueva cita</Text>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Próximas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading && dataToShow.length === 0 ? (
        <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.emptyText}>Cargando tus citas...</Text>
        </View>
      ) : dataToShow.length > 0 ? (
        <FlatList
          data={dataToShow}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar" size={80} color="#1E88E5" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            {activeTab === 'upcoming' 
              ? 'No tienes citas programadas' 
              : 'No tienes citas pasadas'
            }
          </Text>
          {activeTab === 'upcoming' && (
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AgendarCita')}
            >
              <Text style={styles.emptyButtonText}>Agendar cita</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <AppointmentDetailsModal />
    </View>
  );
};

// Los estilos no se modifican, tal como se solicitó.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  newAppointmentButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  newAppointmentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  activeTab: {
    borderBottomColor: '#1E88E5',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
    paddingTop: 5,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  actionButtonText: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: '500',
  },
  reviewButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  reviewButtonText: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalStatusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  modalStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  modalButtonsContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  modalActionButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    backgroundColor: '#F44336',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppointmentsScreen;