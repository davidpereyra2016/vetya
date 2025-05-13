import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  Modal,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const AppointmentsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Datos de ejemplo para las citas
  const appointments = {
    upcoming: [
      {
        id: '1',
        date: '15 de Mayo, 2025',
        time: '15:30 - 16:30',
        type: 'Consulta general',
        petName: 'Max',
        vetName: 'Dr. Carlos Rodríguez',
        status: 'confirmed',
        address: 'Tu domicilio',
      },
      {
        id: '2',
        date: '22 de Mayo, 2025',
        time: '10:00 - 11:00',
        type: 'Vacunación',
        petName: 'Luna',
        vetName: 'Dra. María Gómez',
        status: 'pending',
        address: 'Tu domicilio',
      },
    ],
    past: [
      {
        id: '3',
        date: '28 de Abril, 2025',
        time: '14:00 - 15:00',
        type: 'Consulta general',
        petName: 'Max',
        vetName: 'Dr. Juan Pérez',
        status: 'completed',
        address: 'Tu domicilio',
      },
      {
        id: '4',
        date: '15 de Abril, 2025',
        time: '16:00 - 17:00',
        type: 'Desparasitación',
        petName: 'Rocky',
        vetName: 'Dra. María Gómez',
        status: 'completed',
        address: 'Tu domicilio',
      },
      {
        id: '5',
        date: '2 de Abril, 2025',
        time: '09:30 - 10:30',
        type: 'Vacunación',
        petName: 'Luna',
        vetName: 'Dr. Carlos Rodríguez',
        status: 'completed',
        address: 'Tu domicilio',
      },
    ],
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#757575';
      default:
        return '#1E88E5';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
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
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="medkit-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="paw-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.petName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.vetName}</Text>
        </View>
      </View>
      
      <View style={styles.buttonsContainer}>
        {(item.status === 'confirmed' || item.status === 'pending') && activeTab === 'upcoming' && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Reprogramar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'completed' && (
          <TouchableOpacity style={styles.reviewButton}>
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
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedAppointment && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.statusContainer}>
                <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedAppointment.status) }]}>
                  <Text style={styles.modalStatusText}>{getStatusLabel(selectedAppointment.status)}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Fecha y Hora</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.date}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.time}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Servicio</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="medkit" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.type}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Mascota</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="paw" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.petName}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Veterinario</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.vetName}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Ubicación</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedAppointment.address}</Text>
                </View>
              </View>
              
              {(selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'pending') && (
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.modalActionButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalActionButtonText}>Reprogramar cita</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.modalCancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancelar cita</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {selectedAppointment.status === 'completed' && (
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.modalActionButton}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('AgendarCita');
                    }}
                  >
                    <Text style={styles.modalActionButtonText}>Agendar nueva cita</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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
      
      {appointments[activeTab].length > 0 ? (
        <FlatList
          data={appointments[activeTab]}
          renderItem={renderItem}
          keyExtractor={item => item.id}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  newAppointmentButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
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
