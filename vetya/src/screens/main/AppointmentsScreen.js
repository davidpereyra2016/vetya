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
  Alert,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useCitaStore from '../../store/useCitaStore';

// Helpers
const ensureString = (value, fallback = '') => {
  if (value === null || typeof value === 'undefined') return fallback;
  return String(value);
};

const PET_FALLBACK = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80';
const VET_FALLBACK = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80';

// Resuelve la imagen real del prestador: primero la foto de perfil subida por el
// usuario (User.profilePicture), luego la imagen del Prestador, y por último el fallback.
const resolvePrestadorImage = (prestador) => {
  if (!prestador) return VET_FALLBACK;
  return (
    prestador?.usuario?.profilePicture ||
    prestador?.profilePicture ||
    prestador?.imagen ||
    VET_FALLBACK
  );
};

const resolveMascotaImage = (mascota) => {
  if (!mascota) return null;
  return mascota?.imagen || mascota?.foto || null;
};

const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Próximamente';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return 'Próximamente'; }
};

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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmada':
        return { bg: '#E8F5E9', border: '#C8E6C9', dot: '#4CAF50', text: '#2E7D32' };
      case 'Pendiente':
        return { bg: '#FFF3E0', border: '#FFE0B2', dot: '#FF9800', text: '#E65100' };
      case 'Cancelada':
        return { bg: '#FFEBEE', border: '#FFCDD2', dot: '#F44336', text: '#C62828' };
      case 'Completada':
        return { bg: '#E3F2FD', border: '#BBDEFB', dot: '#1E88E5', text: '#1565C0' };
      default:
        return { bg: '#F5F5F5', border: '#E0E0E0', dot: '#757575', text: '#424242' };
    }
  };

  const getLocationIcon = (ubicacion) => (ubicacion === 'Domicilio' ? 'home-outline' : 'business-outline');

  const openDetails = (item) => {
    setSelectedAppointment(item);
    setModalVisible(true);
  };

  // ─── TARJETA: PRÓXIMA ───
  const renderUpcoming = ({ item }) => {
    const estado = ensureString(item.estado, 'Pendiente');
    const st = getStatusStyle(estado);

    const prestadorNombre = ensureString(item.prestador?.nombre, 'Prestador');
    const prestadorImg = resolvePrestadorImage(item.prestador);
    const mascotaNombre = ensureString(item.mascota?.nombre, 'Mascota');
    const mascotaImg = resolveMascotaImage(item.mascota);
    const servicioNombre = ensureString(item.servicio?.nombre, 'Consulta');
    const ubicacion = ensureString(item.ubicacion, 'Clínica');
    const direccion = ensureString(item.direccion, '');

    return (
      <TouchableOpacity 
        style={styles.cardUpcoming}
        activeOpacity={0.9}
        onPress={() => openDetails(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
            <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
            <Text style={[styles.statusText, { color: st.text }]}>{estado}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.fecha)}</Text>
            <Text style={styles.timeText}>{`${ensureString(item.horaInicio, '--:--')} - ${ensureString(item.horaFin, '--:--')}`}</Text>
          </View>
        </View>

        <View style={styles.providerInfo}>
          <View style={styles.providerImgWrap}>
            <Image source={{ uri: prestadorImg }} style={styles.providerImg} />
          </View>
          <View style={styles.providerTexts}>
            <Text style={styles.providerName} numberOfLines={1}>{prestadorNombre}</Text>
            <View style={styles.locRow}>
              <Ionicons name={getLocationIcon(ubicacion)} size={12} color="#1E88E5" />
              <Text style={styles.providerAddress} numberOfLines={1}>
                {` ${ubicacion === 'Domicilio' ? 'A domicilio' : 'En clínica'}${direccion ? ' · ' + direccion : ''}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.petDetailsSection}>
          <View style={styles.petInfoRow}>
            <View style={styles.petAvatarWrap}>
              {mascotaImg ? (
                <Image source={{ uri: mascotaImg }} style={styles.petAvatarImg} />
              ) : (
                <View style={styles.petAvatarFallback}>
                  <Ionicons name="paw" size={14} color="#FFF" />
                </View>
              )}
            </View>
            <Text style={styles.petName} numberOfLines={1}>Para: {mascotaNombre}</Text>
          </View>
          <View style={styles.reasonBadge}>
            <Text style={styles.reasonText} numberOfLines={1}>{servicioNombre}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── TARJETA: HISTORIAL ───
  const renderPast = ({ item }) => {
    const estado = ensureString(item.estado, 'Completada');
    const isCancelled = estado === 'Cancelada';

    const cardBg = isCancelled ? '#FFF5F5' : '#F5F7FA';
    const cardBorder = isCancelled ? '#FFEBEE' : '#E0E0E0';
    const badgeBg = isCancelled ? '#FFEBEE' : '#E0E0E0';
    const badgeBorder = isCancelled ? '#FFCDD2' : 'transparent';
    const badgeText = isCancelled ? '#D32F2F' : '#666';
    const badgeIcon = isCancelled ? 'close-circle' : 'checkmark-done';

    const prestadorNombre = ensureString(item.prestador?.nombre, 'Prestador');
    const prestadorImg = resolvePrestadorImage(item.prestador);
    const mascotaNombre = ensureString(item.mascota?.nombre, 'Mascota');
    const servicioNombre = ensureString(item.servicio?.nombre, 'Consulta');
    const ubicacion = ensureString(item.ubicacion, 'Clínica');

    return (
      <TouchableOpacity 
        style={[styles.cardPast, { backgroundColor: cardBg, borderColor: cardBorder }]}
        activeOpacity={0.9}
        onPress={() => openDetails(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <Ionicons name={badgeIcon} size={12} color={badgeText} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: badgeText }]}>{estado.toUpperCase()}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateTextPast}>{formatDate(item.fecha)}</Text>
          </View>
        </View>

        <View style={styles.providerInfoPast}>
          <View style={styles.providerImgWrapPast}>
            <Image source={{ uri: prestadorImg }} style={styles.providerImg} />
          </View>
          <View style={styles.providerTexts}>
            <Text style={styles.providerNamePast} numberOfLines={1}>{prestadorNombre}</Text>
            <View style={styles.locRow}>
              <Ionicons name={getLocationIcon(ubicacion)} size={11} color="#888" />
              <Text style={styles.providerAddressPast} numberOfLines={1}>
                {` ${servicioNombre} · ${ubicacion === 'Domicilio' ? 'Domicilio' : 'En clínica'}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pastFooter}>
          <Text style={styles.pastPetText}>Mascota: {mascotaNombre}</Text>
          <TouchableOpacity style={styles.verDetallesBtn} onPress={() => openDetails(item)}>
            <Text style={styles.verDetallesText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── MODAL ───
  const AppointmentDetailsModal = () => {
    if (!selectedAppointment) return null;
    const item = selectedAppointment;
    const estado = ensureString(item.estado, 'Pendiente');
    const st = getStatusStyle(estado);
    const prestadorNombre = ensureString(item.prestador?.nombre, 'Prestador');
    const prestadorImg = resolvePrestadorImage(item.prestador);
    const mascotaNombre = ensureString(item.mascota?.nombre, 'Mascota');
    const servicioNombre = ensureString(item.servicio?.nombre, 'Consulta');
    const ubicacion = ensureString(item.ubicacion, 'Clínica');
    const direccion = ensureString(item.direccion, '');
    const canModify = estado === 'Pendiente' || estado === 'Confirmada';

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de la Cita</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={[styles.modalStatusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
                <Text style={[styles.statusText, { color: st.text }]}>{estado}</Text>
              </View>

              <View style={styles.modalInfoCard}>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="medical" size={20} color="#1E88E5" style={styles.modalIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Prestador</Text>
                    <Text style={styles.modalValue} numberOfLines={1}>{prestadorNombre}</Text>
                  </View>
                  <Image source={{ uri: prestadorImg }} style={styles.modalAvatarSmall} />
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="paw" size={20} color="#FF9800" style={styles.modalIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Mascota</Text>
                    <Text style={styles.modalValue}>{mascotaNombre}</Text>
                  </View>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="calendar" size={20} color="#4CAF50" style={styles.modalIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Fecha y Hora</Text>
                    <Text style={styles.modalValue}>
                      {formatDate(item.fecha)} · {ensureString(item.horaInicio, '--:--')} - {ensureString(item.horaFin, '--:--')}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="medkit" size={20} color="#9C27B0" style={styles.modalIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Servicio</Text>
                    <Text style={styles.modalValue}>{servicioNombre}</Text>
                  </View>
                </View>

                <View style={[styles.modalInfoRow, { borderBottomWidth: 0 }]}>
                  <Ionicons name={getLocationIcon(ubicacion)} size={20} color="#1E88E5" style={styles.modalIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Ubicación</Text>
                    <Text style={styles.modalValue}>
                      {ubicacion}{direccion ? ` · ${direccion}` : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {canModify && (
                <>
                  <TouchableOpacity 
                    style={styles.rescheduleButton}
                    onPress={() => handleRescheduleAppointment(item)}
                  >
                    <Ionicons name="calendar" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.rescheduleButtonText}>Reprogramar cita</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.cancelButtonModal}
                    onPress={() => handleCancelAppointment(item._id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
                    <Text style={styles.cancelButtonText}>Cancelar esta cita</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const dataToShow = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER estilo PetsScreen */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Mis Citas</Text>
          <TouchableOpacity 
            style={styles.headerAddButton}
            onPress={() => navigation.navigate('AgendarCita')}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Próximas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'past' && styles.tabBtnActive]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
              Historial
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTA */}
      <View style={styles.listContainer}>
        {isLoading && dataToShow.length === 0 ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.loadingText}>Cargando tus citas...</Text>
          </View>
        ) : (
          <FlatList
            data={dataToShow}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={activeTab === 'upcoming' ? renderUpcoming : renderPast}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name={activeTab === 'upcoming' ? "calendar-outline" : "time-outline"} size={60} color="#CFD8DC" />
                <Text style={styles.emptyText}>
                  {activeTab === 'upcoming' 
                    ? "No tienes citas programadas próximamente." 
                    : "Aún no tienes historial de citas."}
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
            }
          />
        )}
      </View>

      <AppointmentDetailsModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // ─── HEADER ───
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  headerAddButton: {
    width: 44, height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  headerSpacer: { width: 44 },

  // ─── TABS ───
  tabsWrapper: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    zIndex: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAECEF',
    borderRadius: 16,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: 'bold', color: '#888' },
  tabTextActive: { color: '#1E88E5' },

  // ─── LISTA ───
  listContainer: { flex: 1 },
  flatListContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    flexGrow: 1,
  },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666', fontWeight: '500' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  emptyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // ─── CARD: PRÓXIMA ───
  cardUpcoming: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateContainer: { alignItems: 'flex-end' },
  dateText: { fontSize: 14, fontWeight: '900', color: '#1E88E5' },
  timeText: { fontSize: 11, fontWeight: 'bold', color: '#757575', marginTop: 2 },

  providerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  providerImgWrap: {
    width: 54, height: 54,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  providerImg: { width: '100%', height: '100%' },
  providerTexts: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  providerAddress: { fontSize: 12, color: '#757575', fontWeight: '500', flexShrink: 1 },

  petDetailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
  },
  petInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  petAvatarWrap: {
    width: 28, height: 28,
    borderRadius: 14,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#B0BEC5',
  },
  petAvatarImg: { width: '100%', height: '100%' },
  petAvatarFallback: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#B0BEC5',
  },
  petName: { fontSize: 13, fontWeight: 'bold', color: '#555', flexShrink: 1 },
  reasonBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
    maxWidth: '45%',
  },
  reasonText: { fontSize: 11, fontWeight: 'bold', color: '#666' },

  // ─── CARD: HISTORIAL ───
  cardPast: {
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  dateTextPast: { fontSize: 13, fontWeight: 'bold', color: '#666' },
  providerInfoPast: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.85,
  },
  providerImgWrapPast: {
    width: 48, height: 48,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DADADA',
  },
  providerNamePast: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 2 },
  providerAddressPast: { fontSize: 12, color: '#888', fontWeight: '500', flexShrink: 1 },
  pastFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pastPetText: { fontSize: 12, fontWeight: 'bold', color: '#777' },
  verDetallesBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verDetallesText: { fontSize: 11, fontWeight: 'bold', color: '#555' },

  // ─── MODAL ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E88E5' },
  modalCloseBtn: { padding: 5 },
  modalScroll: { marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  modalInfoCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAECEF',
    marginBottom: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalIcon: { marginRight: 15 },
  modalLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  modalValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  modalAvatarSmall: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, borderColor: '#BBDEFB',
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  rescheduleButtonText: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },
  cancelButtonModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 15,
  },
  cancelButtonText: { fontSize: 15, fontWeight: 'bold', color: '#D32F2F' },
});

export default AppointmentsScreen;