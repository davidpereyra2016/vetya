import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/globalStyles';
import useAuthStore from '../../store/useAuthStore';
import useCitaStore from '../../store/useCitaStore';

// --- Componente para el estado de la cita ---
const AppointmentStatus = ({ estado }) => {
    let statusStyle, statusTextStyle, statusText;

    switch (estado) {
        case 'Pendiente':
            statusStyle = styles.pendingStatus;
            statusTextStyle = styles.pendingStatusText;
            statusText = 'Pendiente';
            break;
        case 'Confirmada':
            statusStyle = styles.confirmedStatus;
            statusTextStyle = styles.confirmedStatusText;
            statusText = 'Confirmada';
            break;
        case 'Completada':
            statusStyle = styles.completedStatus;
            statusTextStyle = styles.completedStatusText;
            statusText = 'Completada';
            break;
        case 'Cancelada':
            statusStyle = styles.canceledStatus;
            statusTextStyle = styles.canceledStatusText;
            statusText = 'Cancelada';
            break;
        default:
            statusStyle = styles.pendingStatus;
            statusTextStyle = styles.pendingStatusText;
            statusText = estado;
    }

    return (
        <View style={[styles.statusBadge, statusStyle]}>
            <Text style={[styles.statusText, statusTextStyle]}>{statusText}</Text>
        </View>
    );
};


const AppointmentDetailsScreen = ({ navigation, route }) => {
  const { appointment } = route.params;
  const { mascota, usuario, fecha, horaInicio, servicio, estado, motivo } = appointment;

  const provider = useAuthStore(state => state.provider);
  const { updateCitaStatus } = useCitaStore();

  const handleAction = async (nuevoEstado, accionTexto) => {
    Alert.alert(
      `${accionTexto} Cita`,
      `¿Estás seguro de que quieres ${accionTexto.toLowerCase()} esta cita?`,
      [
        { text: 'No, cancelar', style: 'cancel' },
        {
          text: `Sí, ${accionTexto.toLowerCase()}`,
          style: accionTexto === 'Rechazar' || accionTexto === 'Cancelar' ? 'destructive' : 'default',
          onPress: async () => {
            if (!provider?._id || !appointment?._id) {
              Alert.alert('Error', 'No se pudo realizar la acción. Faltan datos.');
              return;
            }
            const result = await updateCitaStatus(provider._id, appointment._id, nuevoEstado);
            if (result.success) {
              Alert.alert('Éxito', `La cita ha sido ${nuevoEstado.toLowerCase()}a con éxito.`);
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'Citas' });
              }
            } else {
              Alert.alert('Error', result.error || 'No se pudo actualizar la cita.');
            }
          },
        },
      ]
    );
  };

  const petImage = mascota?.imagen || 'https://placehold.co/100x100/E3F2FD/333?text=Mascota';
  const userImage = usuario?.profilePicture;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Cabecera */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'Citas' });
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalles de la Cita</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Información principal de la cita */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.serviceName}>{servicio?.nombre || 'Servicio no especificado'}</Text>
            <AppointmentStatus estado={estado} />
          </View>
          
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.dateTimeText}>
                {new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            
            <View style={styles.dateTimeItem}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.dateTimeText}>{horaInicio}</Text>
            </View>
          </View>
        </View>
        
        {/* Información del Cliente y Mascota */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cliente</Text>
           <View style={styles.infoRow}>
            {userImage ? (
                <Image source={{ uri: userImage }} style={styles.avatar} />
            ) : (
                <Ionicons name="person-circle-outline" size={50} color={COLORS.grey} style={styles.avatarIcon} />
            )}
            <View>
              <Text style={styles.infoName}>{usuario?.nombre || usuario?.username || 'Nombre no disponible'}</Text>
              <Text style={styles.infoContact}>{usuario?.telefono || 'Teléfono no disponible'}</Text>
              <Text style={styles.infoContact}>{usuario?.email || 'Email no disponible'}</Text>
            </View>
          </View>
        </View>
        
        {/* Información de la mascota */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mascota</Text>
          <View style={styles.infoRow}>
            <Image source={{ uri: petImage }} style={styles.avatar} />
            <View>
              <Text style={styles.infoName}>{mascota?.nombre || 'Nombre no disponible'}</Text>
              <Text style={styles.infoDetail}>
                {mascota?.tipo || 'Tipo no especificado'} - {mascota?.raza || 'Raza no especificada'}
              </Text>
              <Text style={styles.infoDetail}>Edad: {mascota?.edad || 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        {/* Motivo de la consulta */}
        {motivo && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Motivo de la Consulta</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{motivo}</Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Botones de acción fijos en el footer */}
      <View style={styles.footerContainer}>
        {estado === 'Pendiente' && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleAction('Cancelada', 'Rechazar')}>
              <Text style={styles.rejectButtonText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={() => handleAction('Confirmada', 'Confirmar')}>
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {estado === 'Confirmada' && (
          <View style={styles.actionButtonsContainer}>
             <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => handleAction('Cancelada', 'Cancelar')}>
                <Text style={styles.cancelButtonText}>Cancelar Cita</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.actionButton, styles.completeButton]} onPress={() => handleAction('Completada', 'Completar')}>
                <Text style={styles.completeButtonText}>Completar</Text>
             </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    padding: 15,
    paddingBottom: 100, // Espacio para el footer
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E3F2FD',
  },
  avatarIcon: {
      marginRight: 15,
  },
  infoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  infoContact: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 3,
  },
  infoDetail: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 3,
  },
  notesContainer: {
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 15,
    paddingBottom: 30, // Safe area for home indicator
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    elevation: 2,
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  rejectButtonText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#FFF1F0',
     borderWidth: 1,
    borderColor: COLORS.accent,
  },
  cancelButtonText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 16,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  completeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // --- Status Styles ---
  confirmedStatus: { backgroundColor: '#E8F5E9' },
  confirmedStatusText: { color: '#2E7D32' },
  pendingStatus: { backgroundColor: '#FFF8E1' },
  pendingStatusText: { color: '#FF8F00' },
  completedStatus: { backgroundColor: '#E3F2FD' },
  completedStatusText: { color: COLORS.primary },
  canceledStatus: { backgroundColor: '#FFEBEE' },
  canceledStatusText: { color: '#C62828' },
});

export default AppointmentDetailsScreen;
