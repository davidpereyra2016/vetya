import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  Modal,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import useEmergencyStore from '../../store/useEmergencyStore';
import usePagoStore from '../../store/usePagoStore';

const EmergencyDetailScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [loadingPago, setLoadingPago] = useState(false);
  const [pagoInfo, setPagoInfo] = useState(null);
  
  // Obtenemos las emergencias del store - ACTUALIZADO para cargar todas incluyendo historial
  const { activeEmergencies, loadAllEmergencies, isLoading, error } = useEmergencyStore();
  
  // Store de pagos
  const { crearPreferencia, capturarPago, obtenerPagosPorReferencia } = usePagoStore();
  
  // Estado local para organizar las emergencias
  const [emergencies, setEmergencies] = useState({
    active: [],
    history: []
  });

  // Cargar emergencias al montar el componente
  useEffect(() => {
    loadEmergencias();
  }, []);

  // Función para cargar las emergencias (activas + historial)
  const loadEmergencias = async () => {
    const result = await loadAllEmergencies();
    if (result) {
      processEmergencies(result);
    }
  };

  // Procesar las emergencias para separarlas en activas e historial
  const processEmergencies = (emergenciesData) => {
    const active = [];
    const history = [];
    
    // Separar las emergencias según su estado
    emergenciesData.forEach(emergency => {
      // Formatear la fecha y hora
      const fecha = new Date(emergency.fechaSolicitud);
      const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Formatear la hora
      const horaFormateada = fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Procesar la emergencia
      const processedEmergency = {
        id: emergency._id,
        date: fechaFormateada,
        time: horaFormateada,
        type: 'Emergencia veterinaria',
        petName: emergency.mascota?.nombre || 'No especificada',
        vetName: emergency.veterinario?.nombre || 'No asignado',
        status: emergency.estado,
        address: emergency.direccion?.direccionCompleta || 'Tu ubicación',
        description: emergency.descripcion || '',
        images: emergency.imagenes || [],
        createdAt: emergency.fechaSolicitud,
        lastUpdate: emergency.ultimaActualizacion,
        originalData: emergency // Guardamos los datos originales para referencia
      };
      
      // Clasificar según estado
      // Activas: en proceso o pendientes de atención
      if (['Solicitada', 'Asignada', 'Confirmada', 'En camino', 'En atención'].includes(emergency.estado)) {
        active.push(processedEmergency);
      } 
      // Historial: completadas o canceladas
      else if (['Atendida', 'Cancelada', 'Expirada'].includes(emergency.estado)) {
        history.push(processedEmergency);
      }
    });
    
    // Ordenar por fecha (más reciente primero)
    active.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setEmergencies({ active, history });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Solicitada':
        return '#FFC107'; // Amarillo
      case 'Asignada':
        return '#2196F3'; // Azul
      case 'Confirmada':
        return '#4CAF50'; // Verde
      case 'En camino':
        return '#9C27B0'; // Morado
      case 'En atención':
        return '#FF5722'; // Naranja
      case 'Atendida':
        return '#43A047'; // Verde oscuro - Completada exitosamente
      case 'Cancelada':
        return '#F44336'; // Rojo
      case 'Expirada':
        return '#795548'; // Marrón
      default:
        return '#1E88E5'; // Azul por defecto
    }
  };

  const getStatusLabel = (status) => {
    // Ya están en español, así que devolvemos el mismo estado
    return status;
  };

  // Función para cargar información de pago de una emergencia
  const loadPaymentInfo = async (emergencyId) => {
    try {
      setLoadingPago(true);
      const result = await obtenerPagosPorReferencia('Emergencia', emergencyId);
      if (result.success && result.data && result.data.length > 0) {
        setPagoInfo(result.data[0]);
      } else {
        setPagoInfo(null);
      }
    } catch (error) {
      console.error('Error al cargar pago:', error);
      setPagoInfo(null);
    } finally {
      setLoadingPago(false);
    }
  };

  // Función para manejar el pago con Mercado Pago
  const handlePagar = async () => {
    if (!selectedEmergency) return;
    
    // Verificar si ya existe una preferencia de pago
    if (pagoInfo && pagoInfo.mercadoPago?.initPoint) {
      // Ya existe una preferencia, abrir el link de pago
      Alert.alert(
        'Pagar con Mercado Pago',
        'Se abrirá Mercado Pago para completar el pago del servicio.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Continuar',
            onPress: async () => {
              try {
                const url = pagoInfo.mercadoPago.initPoint;
                const canOpen = await Linking.canOpenURL(url);
                
                if (canOpen) {
                  await Linking.openURL(url);
                  // Informar al usuario
                  Alert.alert(
                    'Pago en Proceso',
                    'Una vez completado el pago en Mercado Pago, el estado se actualizará automáticamente.',
                    [{ text: 'OK', onPress: () => setModalVisible(false) }]
                  );
                } else {
                  Alert.alert('Error', 'No se pudo abrir el link de pago');
                }
              } catch (error) {
                console.error('Error al abrir Mercado Pago:', error);
                Alert.alert('Error', 'Ocurrió un error al abrir Mercado Pago');
              }
            }
          }
        ]
      );
    } else {
      // No hay preferencia, informar que se está procesando
      Alert.alert(
        'Procesando',
        'La preferencia de pago se está generando. Por favor, recarga los detalles en unos momentos.',
        [{ text: 'OK' }]
      );
    }
  };

  // Función para confirmar servicio completado y capturar pago
  const handleConfirmarServicio = async () => {
    if (!pagoInfo || !pagoInfo._id) {
      Alert.alert('Error', 'No se encontró información del pago');
      return;
    }
    
    Alert.alert(
      'Confirmar Servicio',
      '¿Confirmas que el servicio fue completado satisfactoriamente? El pago será procesado.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, confirmar',
          onPress: async () => {
            setLoadingPago(true);
            
            const result = await capturarPago(pagoInfo._id);
            
            setLoadingPago(false);
            
            if (result.success) {
              Alert.alert(
                'Pago Procesado',
                'El pago ha sido procesado exitosamente. ¡Gracias por usar nuestros servicios!',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setModalVisible(false);
                      loadEmergencias(); // Recargar emergencias
                    }
                  }
                ]
              );
            } else {
              Alert.alert('Error', result.error || 'No se pudo capturar el pago');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.appointmentCard} 
      onPress={() => {
        setSelectedEmergency(item);
        loadPaymentInfo(item.id); // Cargar info de pago
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
        {(['Solicitada', 'Asignada', 'Confirmada', 'En camino', 'En atención'].includes(item.status)) && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              setSelectedEmergency(item);
              setModalVisible(true); // Abre el modal
            }}
          >
            <Text style={styles.cancelButtonText}>Ver detalles</Text>
          </TouchableOpacity>
        )}
        {(['Atendida', 'Cancelada', 'Expirada'].includes(item.status)) && (
          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={() => {
              setSelectedEmergency(item);
              setModalVisible(true); // Abre el modal
            }}
          >
            <Text style={styles.reviewButtonText}>Ver detalles</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // NOTA: Anteriormente esto era `const EmergencyDetailsModal = () => (...)` (un componente
  // creado dentro del render). En cada `setState` (p.ej. `setLoadingPago`, `setPagoInfo`)
  // React trataba al componente como uno nuevo y desmontaba/remontaba el Modal mientras
  // estaba animando, lo que congelaba la app al abrir el detalle.
  // Ahora es simplemente JSX guardado en una variable -> sin remounts -> sin freeze.
  const emergencyDetailsModal = (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles de la Emergencia</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedEmergency && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.statusContainer}>
                <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedEmergency.status) }]}>
                  <Text style={styles.modalStatusText}>{getStatusLabel(selectedEmergency.status)}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Fecha y Hora</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedEmergency.date}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedEmergency.time}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Servicio</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="medkit" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedEmergency.type}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Mascota</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="paw" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedEmergency.petName}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Veterinario</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedEmergency.vetName}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Ubicación</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedEmergency.address}</Text>
                </View>
              </View>
              
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Descripción</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="document-text" size={20} color="#1E88E5" />
                  <Text style={styles.infoText}>{selectedEmergency.description || 'Sin descripción'}</Text>
                </View>
              </View>
              
              {/* Sección de Pago con Mercado Pago */}
              {(['En camino', 'En atención'].includes(selectedEmergency.status)) && 
               selectedEmergency.originalData?.metodoPago === 'MercadoPago' && (
                <View style={styles.paymentSection}>
                  <Text style={styles.infoSectionTitle}>Pago del Servicio</Text>
                  
                  {loadingPago ? (
                    <ActivityIndicator size="small" color="#1E88E5" style={{ marginVertical: 10 }} />
                  ) : pagoInfo && ['Pagado', 'Capturado', 'Completado'].includes(pagoInfo.estado) ? (
                    <View style={styles.paymentInfoContainer}>
                      <View style={styles.infoRow}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.paymentStatusText}>✅ Pago completado</Text>
                      </View>
                      <Text style={styles.paymentNote}>
                        El pago ha sido procesado exitosamente con Mercado Pago.
                      </Text>
                    </View>
                  ) : pagoInfo && pagoInfo.estado === 'Pendiente' ? (
                    <View>
                      <View style={styles.paymentInfoContainer}>
                        <View style={styles.infoRow}>
                          <Ionicons name="time-outline" size={20} color="#FF9800" />
                          <Text style={styles.paymentStatusText}>⏳ Pago pendiente</Text>
                        </View>
                        <Text style={styles.paymentNote}>
                          El pago aún no ha sido completado. Presiona el botón para continuar.
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.payButton}
                        onPress={handlePagar}
                        disabled={loadingPago}
                      >
                        <Ionicons name="card" size={20} color="#fff" />
                        <Text style={styles.payButtonText}>Pagar con Mercado Pago</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.paymentInfoContainer}>
                      <View style={styles.infoRow}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>Cargando información de pago...</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              {/* Método de pago Efectivo */}
              {(['En camino', 'En atención'].includes(selectedEmergency.status)) && 
               selectedEmergency.originalData?.metodoPago === 'Efectivo' && (
                <View style={styles.paymentSection}>
                  <Text style={styles.infoSectionTitle}>Método de Pago</Text>
                  <View style={styles.paymentInfoContainer}>
                    <View style={styles.infoRow}>
                      <Ionicons name="cash-outline" size={20} color="#4CAF50" />
                      <Text style={styles.paymentStatusText}>💵 Pago en Efectivo</Text>
                    </View>
                    <Text style={styles.paymentNote}>
                      Pagarás al veterinario cuando complete el servicio.
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Botón para confirmar servicio completado */}
              {selectedEmergency.status === 'En atención' && pagoInfo && pagoInfo.estado === 'Pagado' && (
                <View style={styles.paymentSection}>
                  <Text style={styles.infoSectionTitle}>Confirmar Servicio</Text>
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={handleConfirmarServicio}
                    disabled={loadingPago}
                  >
                    {loadingPago ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.confirmButtonText}>Confirmar Servicio Completado</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.paymentNote}>
                    Al confirmar, se procesará el pago del servicio.
                  </Text>
                </View>
              )}
              
              {/* {(['Solicitada', 'Asignada', 'Confirmada', 'En camino', 'Iniciada'].includes(selectedEmergency.status)) 
              && (
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.modalCancelButton]}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('EmergencyDetail', { emergencyId: selectedEmergency.id });
                    }}
                  >
                    <Text style={styles.modalCancelButtonText}>Ver detalles completos</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {(['Completada', 'Cancelada', 'Expirada'].includes(selectedEmergency.status)) && (
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.modalActionButton}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('EmergencyDetail', { emergencyId: selectedEmergency.id });
                    }}
                  >
                    <Text style={styles.modalActionButtonText}>Ver detalles completos</Text>
                  </TouchableOpacity>
                </View>
              )} */}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Emergencias</Text>
        <TouchableOpacity 
          style={styles.newAppointmentButton}
          onPress={() => navigation.navigate('EmergencyForm')}
        >
          <Text style={styles.newAppointmentButtonText}>Nueva</Text>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Activas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Cargando emergencias...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={80} color="#F44336" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Error al cargar emergencias</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => loadEmergencias()}
          >
            <Text style={styles.emptyButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : emergencies[activeTab === 'active' ? 'active' : 'history'].length > 0 ? (
        <FlatList
          data={emergencies[activeTab === 'active' ? 'active' : 'history']}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={loadEmergencias}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="medkit" size={80} color="#1E88E5" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            {activeTab === 'active' 
              ? 'No tienes emergencias activas' 
              : 'No tienes historial de emergencias'
            }
          </Text>
          {activeTab === 'active' && (
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('EmergencyForm')}
            >
              <Text style={styles.emptyButtonText}>Solicitar emergencia</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {emergencyDetailsModal}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  newAppointmentButton: {
    backgroundColor: '#1E88E5',//Color del botón
    flexDirection: 'row',//Organiza el contenido horizontalmente
    alignItems: 'center',//Centra el texto verticalmente
    paddingVertical: 8,//Aumenta el padding vertical
    paddingHorizontal: 15,//Aumenta el padding horizontal
    borderRadius: 20,//Radio de la esquina
    elevation: 4,//Eleva el botón
    shadowColor: '#FF0000',//Color de la sombra rojo
    shadowOffset: { width: 0, height: 2 },//Posición de la sombra
    shadowOpacity: 0.6,//Opacidad de la sombra
    shadowRadius: 3,//Radio de la sombra
  },
  newAppointmentButtonText: {
    color: '#fff',//Color del texto
    fontWeight: 'bold',//Peso del texto
    marginRight: 5,//Margen derecho
  },
  tabsContainer: {
    flexDirection: 'row',//Organiza el contenido horizontalmente
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  paymentSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  paymentInfoContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  paymentStatusText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  payButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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

export default EmergencyDetailScreen;
