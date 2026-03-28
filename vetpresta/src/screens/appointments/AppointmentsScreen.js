import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import globalStyles, { COLORS, SIZES, SHADOWS } from '../../styles/globalStyles';
import useAuthStore from '../../store/useAuthStore';
import useCitaStore from '../../store/useCitaStore';

// --- Componente para el estado de la cita ---
const AppointmentStatus = ({ estado }) => {
    let statusStyle, statusTextStyle, statusText;

    switch(estado) {
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
        statusText = 'Pendiente';
    }

    return (
      <View style={[styles.statusBadge, statusStyle]}>
        <Text style={[styles.statusText, statusTextStyle]}>{statusText}</Text>
      </View>
    );
};


// --- Componente para renderizar cada item de la lista de citas ---
const AppointmentItem = ({ item, onConfirm, onComplete, onReject }) => {
  const { mascota, usuario, fecha, horaInicio, servicio, estado } = item;
  
  // URL de imagen por defecto
  const petImage = mascota?.imagen || 'https://placehold.co/100x100/E3F2FD/333?text=Mascota';

  return (
    <View style={styles.appointmentCard}>
      {/* Cabecera de la tarjeta */}
      <View style={styles.cardHeader}>
        <Text style={styles.serviceName}>{servicio?.nombre || 'Servicio no especificado'}</Text>
        <AppointmentStatus estado={estado} />
      </View>

      {/* Fecha y Hora */}
      <View style={styles.dateTimeContainer}>
        <View style={styles.dateTimeItem}>
            <Ionicons name="calendar" size={18} color={COLORS.primary} />
            <Text style={styles.dateTimeText}>
                {new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
        </View>
        <View style={styles.dateTimeItem}>
            <Ionicons name="time" size={18} color={COLORS.primary} />
            <Text style={styles.dateTimeText}>{horaInicio}</Text>
        </View>
      </View>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Información de la Mascota */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Mascota</Text>
        <View style={styles.infoRow}>
            <Image source={{ uri: petImage }} style={styles.petAvatar} />
            <View>
                <Text style={styles.petName}>{mascota?.nombre || 'Nombre no disponible'}</Text>
                <Text style={styles.petBreed}>{mascota?.raza || 'Raza no especificada'}</Text>
            </View>
        </View>
      </View>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Información del Cliente */}
       <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <View style={styles.infoRow}>
          {usuario?.profilePicture ? (
            <Image source={{ uri: usuario.profilePicture }} style={styles.clientAvatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={44} color={COLORS.grey} style={{marginRight: 10}} />
          )}
           <View>
             <Text style={styles.clientName}>{usuario?.username || 'Nombre no disponible'}</Text>
             <Text style={styles.clientContact}>{usuario?.telefono || 'Teléfono no disponible'}</Text>
             <Text style={styles.clientContact}>{usuario?.email || usuario?.username || 'Email no disponible'}</Text>
           </View>
        </View>
      </View>
      
      {/* Botones de Acción */}
      {(estado === 'Pendiente' || estado === 'Confirmada') && (
        <View style={styles.actionButtonsContainer}>
            {estado === 'Pendiente' && (
                <>
                    <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => onReject(item)}>
                        <Text style={styles.rejectButtonText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={() => onConfirm(item)}>
                        <Text style={styles.confirmButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                </>
            )}
            {estado === 'Confirmada' && (
                <TouchableOpacity style={[styles.actionButton, styles.completeButton]} onPress={() => onComplete(item)}>
                    <Text style={styles.completeButtonText}>Marcar como Completada</Text>
                </TouchableOpacity>
            )}
        </View>
      )}
    </View>
  );
};

const AppointmentsScreen = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);

  const provider = useAuthStore(state => state.provider);
  const { providerCitas, isLoading, fetchProviderCitas, updateCitaStatus } = useCitaStore();

  const loadAppointments = useCallback(async () => {
    if (!provider?._id) return;
    await Promise.all([
      fetchProviderCitas(provider._id, 'Pendiente'),
      fetchProviderCitas(provider._id, 'Confirmada'),
      fetchProviderCitas(provider._id, 'Completada'),
      fetchProviderCitas(provider._id, 'Cancelada'),
    ]);
  }, [provider, fetchProviderCitas]);

  useFocusEffect(useCallback(() => { 
    loadAppointments();
  }, [loadAppointments]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAppointments();
    } finally {
      setRefreshing(false);
    }
  }, [loadAppointments]);

  const handleAction = async (cita, nuevoEstado, accionTexto) => {
    if (!provider?._id) {
      Alert.alert('Error', 'No se pudo identificar tu perfil de prestador.');
      return;
    }

    Alert.alert(
      `${accionTexto} Cita`,
      `¿Estás seguro de que quieres ${accionTexto.toLowerCase()} esta cita?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: accionTexto,
          onPress: async () => {
            // Validar si el estado es 'Cancelada' para la acción de rechazar
            const finalState = nuevoEstado === 'Cancelada' ? 'Cancelada' : nuevoEstado;
            const result = await updateCitaStatus(provider._id, cita._id, finalState);
            if (result.success) {
              Alert.alert('Éxito', `La cita ha sido ${finalState.toLowerCase()} con éxito.`);
            } else {
              Alert.alert('Error', result.error || 'No se pudo actualizar la cita.');
            }
          },
        },
      ]
    );
  };

  const renderContent = () => {
    const dataMap = {
      pending: providerCitas.pendientes,
      upcoming: providerCitas.confirmadas,
      past: providerCitas.completadas,
      cancelled: providerCitas.canceladas,
    };
    const data = dataMap[activeTab] || [];

    if (isLoading && !refreshing && data.length === 0) {
      return <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />;
    }

    if (data.length === 0) {
      const emptyMessages = {
        pending: {
          icon: 'calendar-outline',
          title: 'No hay citas pendientes',
          message: 'Las nuevas solicitudes de cita aparecerán aquí'
        },
        upcoming: {
          icon: 'checkmark-circle-outline',
          title: 'No hay citas próximas',
          message: 'Las citas confirmadas aparecerán aquí'
        },
        past: {
          icon: 'time-outline',
          title: 'No hay citas completadas',
          message: 'Tu historial de citas aparecerá aquí'
        },
        cancelled: {
          icon: 'close-circle-outline',
          title: 'No hay citas canceladas',
          message: 'Las citas canceladas aparecerán aquí'
        }
      };
      
      const emptyState = emptyMessages[activeTab] || emptyMessages.pending;
      
      return (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          <View style={styles.emptyIconContainer}>
            <Ionicons name={emptyState.icon} size={64} color={COLORS.lightGrey} />
          </View>
          <Text style={styles.emptyTitle}>{emptyState.title}</Text>
          <Text style={styles.emptyText}>{emptyState.message}</Text>
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => (
          <AppointmentItem
            item={item}
            onConfirm={(cita) => handleAction(cita, 'Confirmada', 'Confirmar')}
            onReject={(cita) => handleAction(cita, 'Cancelada', 'Rechazar')}
            onComplete={(cita) => handleAction(cita, 'Completada', 'Completar')}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 15 }}
      />
    );
  };
  
  const Tab = ({name, label, count, activeTab, setActiveTab}) => (
    <TouchableOpacity
        style={[styles.tab, activeTab === name && styles.activeTab]}
        onPress={() => setActiveTab(name)}>
        <Text style={[styles.tabText, activeTab === name && styles.activeTabText]}>{`${label} (${count})`}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar style="light" />
      
      {/* Header con diseño moderno */}
      <View style={globalStyles.header}>
        <View style={globalStyles.headerContent}>
          <Text style={globalStyles.headerTitle}>Mis Citas</Text>
          <View style={styles.headerBadge}>
            <Ionicons name="calendar" size={24} color={COLORS.white} />
          </View>
        </View>
      </View>

      {/* Tabs con scroll horizontal */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollContainer}
        contentContainerStyle={styles.tabContainer}
      >
        <Tab name="pending" label="Pendientes" count={providerCitas.pendientes.length} activeTab={activeTab} setActiveTab={setActiveTab} />
        <Tab name="upcoming" label="Próximas" count={providerCitas.confirmadas.length} activeTab={activeTab} setActiveTab={setActiveTab} />
        <Tab name="past" label="Pasadas" count={providerCitas.completadas.length} activeTab={activeTab} setActiveTab={setActiveTab} />
        <Tab name="cancelled" label="Canceladas" count={providerCitas.canceladas.length} activeTab={activeTab} setActiveTab={setActiveTab} />
      </ScrollView>

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Header Badge
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tab Styles
  tabScrollContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 50,
  },
  tabContainer: { 
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: SIZES.medium,
    gap: 8,
    alignItems: 'center',
  },
  tab: { 
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  activeTab: { 
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  tabText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.grey,
  },
  activeTabText: { 
    color: COLORS.white,
  },
  // Loading & Empty States
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: SIZES.xlarge,
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: SIZES.large,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
  emptyText: { 
    fontSize: 14, 
    color: COLORS.grey,
    textAlign: 'center',
  },
  // Appointment Card
  appointmentCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 12, 
    padding: SIZES.medium,
    marginHorizontal: SIZES.medium,
    marginBottom: SIZES.medium,
    ...SHADOWS.medium,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SIZES.small,
  },
  serviceName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: COLORS.dark,
    flex: 1,
  },
  // Status Badge
  statusBadge: {
    paddingHorizontal: SIZES.small,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: SIZES.small,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Date & Time
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.small,
    flexWrap: 'wrap',
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.medium,
    marginBottom: SIZES.base,
  },
  dateTimeText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: SIZES.base,
  },
  // Separator
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.small,
  },
  // Section
  sectionContainer: {
    marginBottom: SIZES.base,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.grey,
    marginBottom: SIZES.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: SIZES.small,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  petBreed: {
    fontSize: 13,
    color: COLORS.grey,
    marginTop: 2,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  clientContact: {
    fontSize: 13,
    color: COLORS.grey,
    marginTop: 2,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: SIZES.small,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  // Action Buttons
  actionButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: SIZES.medium,
    paddingTop: SIZES.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SIZES.small,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: SIZES.small,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  rejectButton: {
    backgroundColor: COLORS.accent + '15',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  rejectButtonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  completeButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  // Status Styles
  confirmedStatus: { 
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  confirmedStatusText: { 
    color: COLORS.success,
  },
  pendingStatus: { 
    backgroundColor: COLORS.warning + '20',
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  pendingStatusText: { 
    color: COLORS.warning,
  },
  completedStatus: { 
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  completedStatusText: { 
    color: COLORS.primary,
  },
  canceledStatus: { 
    backgroundColor: COLORS.accent + '20',
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  canceledStatusText: { 
    color: COLORS.accent,
  },
});

export default AppointmentsScreen;
