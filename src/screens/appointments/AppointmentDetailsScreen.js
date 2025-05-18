import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/globalStyles';

const AppointmentDetailsScreen = ({ navigation, route }) => {
  const { appointment } = route.params;
  
  // Estado para controlar la visualización de opciones adicionales
  const [showOptions, setShowOptions] = useState(false);
  
  // Función para manejar la cancelación de una cita
  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancelar Cita',
      '¿Estás seguro de que quieres cancelar esta cita? Esta acción no se puede deshacer.',
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
            Alert.alert(
              'Cita cancelada',
              'La cita ha sido cancelada correctamente.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          },
        },
      ]
    );
  };
  
  // Función para completar una cita (marcarla como realizada)
  const handleCompleteAppointment = () => {
    Alert.alert(
      'Completar Cita',
      '¿Confirmas que esta cita ya ha sido realizada?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí, completar',
          onPress: () => {
            // Aquí iría la lógica para marcar la cita como completada en el backend
            Alert.alert(
              'Cita completada',
              'La cita ha sido marcada como completada.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          },
        },
      ]
    );
  };
  
  // Función para reprogramar una cita
  const handleRescheduleAppointment = () => {
    // Aquí navegaríamos a una pantalla para reprogramar la cita
    Alert.alert('Función en desarrollo', 'Esta funcionalidad estará disponible próximamente.');
  };
  
  // Renderizar el estado de la cita con un color adecuado
  const renderAppointmentStatus = () => {
    let statusColor = COLORS.primary;
    let statusText = 'Confirmada';
    
    switch(appointment.estado) {
      case 'pendiente':
        statusColor = COLORS.warning;
        statusText = 'Pendiente';
        break;
      case 'confirmada':
        statusColor = COLORS.primary;
        statusText = 'Confirmada';
        break;
      case 'cancelada':
        statusColor = COLORS.accent;
        statusText = 'Cancelada';
        break;
      case 'completada':
        statusColor = COLORS.success;
        statusText = 'Completada';
        break;
      default:
        statusColor = COLORS.primary;
        statusText = 'Confirmada';
    }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Cabecera */}
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
          <Text style={styles.headerTitle}>Detalles de la Cita</Text>
          <TouchableOpacity 
            style={styles.optionsButton}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Text>
              <Ionicons name="ellipsis-vertical" size={24} color={COLORS.white} />
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Menú desplegable de opciones */}
      {showOptions && (
        <View style={styles.optionsMenu}>
          {appointment.estado === 'confirmada' && (
            <>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleCompleteAppointment}
              >
                <Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
                </Text>
                <Text style={styles.optionText}>Marcar como completada</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleRescheduleAppointment}
              >
                <Text>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                </Text>
                <Text style={styles.optionText}>Reprogramar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleCancelAppointment}
              >
                <Text>
                  <Ionicons name="close-circle-outline" size={20} color={COLORS.accent} />
                </Text>
                <Text style={styles.optionText}>Cancelar cita</Text>
              </TouchableOpacity>
            </>
          )}
          
          {appointment.estado === 'pendiente' && (
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handleCancelAppointment}
            >
              <Text>
                <Ionicons name="close-circle-outline" size={20} color={COLORS.accent} />
              </Text>
              <Text style={styles.optionText}>Rechazar cita</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.content}>
        {/* Información principal de la cita */}
        <View style={styles.appointmentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.serviceName}>{appointment.servicio}</Text>
            {renderAppointmentStatus()}
          </View>
          
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Text>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
              </Text>
              <Text style={styles.dateTimeText}>
                {appointment.fechaHora.split(' ')[0]}
              </Text>
            </View>
            
            <View style={styles.dateTimeItem}>
              <Text>
                <Ionicons name="time" size={20} color={COLORS.primary} />
              </Text>
              <Text style={styles.dateTimeText}>
                {appointment.fechaHora.split(' ')[1]}
              </Text>
            </View>
          </View>
          
          <View style={styles.locationContainer}>
            <Text>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </Text>
            <Text style={styles.locationText}>
              {appointment.ubicacion === 'Domicilio' 
                ? `Domicilio: ${appointment.direccion || 'No especificado'}`
                : 'En clínica'
              }
            </Text>
          </View>
        </View>
        
        {/* Información del cliente y mascota */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          
          <View style={styles.clientInfo}>
            <View style={styles.avatarContainer}>
              <Text>
                <Ionicons name="person-circle" size={60} color={COLORS.primary} />
              </Text>
            </View>
            
            <View style={styles.clientDetails}>
              <Text style={styles.clientName}>{appointment.usuarioNombre}</Text>
              
              <View style={styles.infoItem}>
                <Text>
                  <Ionicons name="call-outline" size={16} color={COLORS.grey} />
                </Text>
                <Text style={styles.infoText}>+54 11 1234-5678</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text>
                  <Ionicons name="mail-outline" size={16} color={COLORS.grey} />
                </Text>
                <Text style={styles.infoText}>cliente@ejemplo.com</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Información de la mascota */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información de la Mascota</Text>
          
          <View style={styles.petInfo}>
            <View style={styles.petAvatar}>
              <Text>
                <Ionicons 
                  name={appointment.tipoMascota === 'Perro' ? 'paw' : 'logo-octocat'} 
                  size={50} 
                  color={COLORS.primary} 
                />
              </Text>
            </View>
            
            <View style={styles.petDetails}>
              <Text style={styles.petName}>{appointment.mascotaNombre}</Text>
              
              <View style={styles.petDetailRow}>
                <View style={styles.petDetail}>
                  <Text style={styles.petDetailLabel}>Tipo:</Text>
                  <Text style={styles.petDetailValue}>{appointment.tipoMascota}</Text>
                </View>
                
                {appointment.raza && (
                  <View style={styles.petDetail}>
                    <Text style={styles.petDetailLabel}>Raza:</Text>
                    <Text style={styles.petDetailValue}>{appointment.raza}</Text>
                  </View>
                )}
              </View>
              
              {appointment.edad && (
                <View style={styles.petDetailRow}>
                  <View style={styles.petDetail}>
                    <Text style={styles.petDetailLabel}>Edad:</Text>
                    <Text style={styles.petDetailValue}>{appointment.edad}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Motivo de la consulta */}
        {appointment.motivo && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Motivo de la Consulta</Text>
            <Text style={styles.motiveText}>{appointment.motivo}</Text>
          </View>
        )}
      </View>
      
      {/* Botones de acción según el estado - Ahora fuera del ScrollView */}
      {appointment.estado === 'pendiente' && (
        <View style={styles.footerContainer}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleCancelAppointment}
            >
              <Text style={styles.rejectButtonText}>Rechazar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => {
                // Lógica para confirmar
                Alert.alert(
                  'Confirmar Cita',
                  '¿Deseas confirmar esta cita?',
                  [
                    {
                      text: 'Cancelar',
                      style: 'cancel',
                    },
                    {
                      text: 'Confirmar',
                      onPress: () => {
                        Alert.alert('Cita confirmada', 'La cita ha sido confirmada con éxito');
                        navigation.goBack();
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.confirmButtonText}>Confirmar Cita</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {appointment.estado === 'confirmada' && (
        <View style={styles.footerContainer}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelAppointment}
            >
              <Text style={styles.cancelButtonText}>Cancelar Cita</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleCompleteAppointment}
            >
              <Text style={styles.completeButtonText}>Marcar como Completada</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  optionsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  optionText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.dark,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  appointmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.dark,
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: COLORS.dark,
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.grey,
    marginLeft: 8,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  petDetailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  petDetail: {
    flexDirection: 'row',
    marginRight: 20,
  },
  petDetailLabel: {
    fontSize: 14,
    color: COLORS.grey,
    marginRight: 5,
  },
  petDetailValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  motiveText: {
    fontSize: 16,
    color: COLORS.dark,
    lineHeight: 22,
  },
  footerContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  rejectButtonText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 16,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  completeButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AppointmentDetailsScreen;
