import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Platform,
  ActivityIndicator,
  Modal,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useCitaStore from '../../store/useCitaStore';
import usePagoStore from '../../store/usePagoStore';
import citaService from '../../services/citaService';

const CitaConfirmacionScreen = ({ navigation, route }) => {
  const { appointmentData, pet, provider, service, date, time, location, reason } = route.params || {};
  
  // Estados para manejar el pago
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Efectivo');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  
  // Stores
  const { crearPreferencia } = usePagoStore();
  const { createAppointment } = useCitaStore();
  
  // Si no hay datos de appointment, mostrar mensaje de error
  if (!appointmentData) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#F44336" />
          <Text style={styles.errorText}>No se pudo cargar la información de la cita</Text>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Inicio' })}
          >
            <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Función para volver a la pantalla principal
  const handleGoHome = () => {
    // Navegamos a la tab de inicio usando navegación anidada
    navigation.navigate('MainTabs', { screen: 'Inicio' });
  };

  // Función para confirmar cita con efectivo
  const handleEfectivoPayment = async () => {
    if (!appointmentData) {
      Alert.alert('Error', 'No se puede confirmar la cita sin información');
      return;
    }

    try {
      setProcessingPayment(true);
      
      console.log('🔄 Creando cita con pago en efectivo...');
      
      // 1. Crear la cita en la base de datos
      const citaResult = await createAppointment(appointmentData);
      
      if (!citaResult.success) {
        Alert.alert('Error', citaResult.error || 'No se pudo crear la cita');
        return;
      }
      
      const nuevaCita = citaResult.data;
      console.log('✅ Cita creada:', nuevaCita._id);
      
      // 2. Confirmar la cita con método de pago efectivo
      const confirmResult = await citaService.confirmarCitaConPago(
        nuevaCita.prestador._id,
        nuevaCita._id,
        'Efectivo'
      );
      
      if (confirmResult.success) {
        console.log('✅ Cita confirmada con pago en efectivo');
        Alert.alert(
          'Cita Confirmada',
          'Tu cita ha sido confirmada. Recuerda pagar en efectivo al momento de la consulta.',
          [{ text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Citas' }) }]
        );
      } else {
        Alert.alert('Error', confirmResult.error || 'No se pudo confirmar la cita');
      }
    } catch (error) {
      console.error('❌ Error al confirmar cita con efectivo:', error);
      Alert.alert('Error', 'Ocurrió un problema al confirmar la cita. Intenta nuevamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Función para procesar el pago con Mercado Pago
  const handleMercadoPagoPayment = async () => {
    if (!appointmentData) {
      Alert.alert('Error', 'No se puede procesar el pago sin información de la cita');
      return;
    }

    try {
      setProcessingPayment(true);
      
      console.log('🔄 Creando cita para pago con Mercado Pago...');
      
      // 1. Crear la cita en la base de datos (estado: Pendiente)
      const citaResult = await createAppointment(appointmentData);
      
      if (!citaResult.success) {
        Alert.alert('Error', citaResult.error || 'No se pudo crear la cita');
        return;
      }
      
      const nuevaCita = citaResult.data;
      console.log('✅ Cita creada:', nuevaCita._id);
      setCreatedAppointment(nuevaCita);
      
      // 2. Crear preferencia de pago
      // La cita se confirmará automáticamente cuando Mercado Pago notifique el pago exitoso
      const result = await crearPreferencia(
        null, // emergenciaId
        nuevaCita._id, // citaId
        nuevaCita.servicio?.precio || service?.precio || 5000, // monto
        `Cita veterinaria - ${nuevaCita.servicio?.nombre || service?.nombre || 'Consulta general'}`
      );
      
      console.log('📦 Resultado de crearPreferencia:', result);
      
      if (result.success && result.initPoint) {
        console.log('✅ Preferencia creada, redirigiendo a Mercado Pago');
        console.log('🔗 Init Point:', result.initPoint);
        
        Alert.alert(
          'Proceder al Pago',
          'Serás redirigido a Mercado Pago para completar el pago. La cita se confirmará automáticamente cuando el pago sea exitoso.',
          [
            {
              text: 'Ir a Mercado Pago',
              onPress: async () => {
                try {
                  console.log('🔗 Abriendo Mercado Pago:', result.initPoint);
                  
                  // Abrir Mercado Pago en el navegador
                  const supported = await Linking.canOpenURL(result.initPoint);
                  
                  if (supported) {
                    await Linking.openURL(result.initPoint);
                    
                    // Navegar a la pantalla de citas mientras el usuario paga
                    Alert.alert(
                      'Redirigido a Mercado Pago',
                      'Completa el pago en la página de Mercado Pago. Tu cita se confirmará automáticamente cuando el pago sea exitoso.',
                      [{ text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Citas' }) }]
                    );
                  } else {
                    Alert.alert('Error', 'No se puede abrir la página de pago');
                  }
                } catch (error) {
                  console.error('❌ Error al abrir Mercado Pago:', error);
                  Alert.alert('Error', 'No se pudo abrir la página de pago. Intenta nuevamente.');
                }
              }
            },
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                console.log('❌ Usuario canceló el pago');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo procesar el pago con Mercado Pago');
      }
    } catch (error) {
      console.error('❌ Error al procesar pago con Mercado Pago:', error);
      Alert.alert('Error', 'Ocurrió un problema al procesar el pago. Intenta nuevamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Función para ver la cita agendada
  const handleViewAppointment = () => {
    // Navegamos a la tab de citas usando navegación anidada
    navigation.navigate('MainTabs', { screen: 'Citas' });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Confirmación de Cita</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.confirmationBox}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          
          <Text style={styles.confirmationTitle}>¡Casi listo!</Text>
          <Text style={styles.confirmationMessage}>
            Revisa los detalles de tu cita y selecciona el método de pago para confirmar tu reserva.
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Detalles de la Cita</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Fecha:</Text>
            <Text style={styles.detailValue}>
              {date?.displayDate || (date?.date ? new Date(date.date).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Fecha no especificada')}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Hora:</Text>
            <Text style={styles.detailValue}>{time?.time || 'Hora no especificada'} - {time?.endTime || ''}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="medkit" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Servicio:</Text>
            <Text style={styles.detailValue}>{service?.nombre || 'Servicio no especificado'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="paw" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Mascota:</Text>
            <Text style={styles.detailValue}>
              {pet?.nombre || 'Mascota no especificada'}
              {pet?.raza && ` (${pet.raza})`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="person" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Prestador:</Text>
            <Text style={styles.detailValue}>{provider?.nombre || 'Prestador no especificado'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Ubicación:</Text>
            <Text style={styles.detailValue}>{location?.label || 'No especificada'}</Text>
          </View>
          
          {reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>Motivo de la consulta:</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          )}
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Estado:</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#FFC107' }]}>
              <Text style={styles.statusText}>Pendiente de Pago</Text>
            </View>
          </View>
          
          {/* Sección de método de pago */}
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Método de Pago</Text>
            <Text style={styles.paymentSubtitle}>Selecciona cómo deseas pagar el servicio</Text>
            
            <TouchableOpacity 
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'Efectivo' && styles.paymentOptionSelected
              ]}
              onPress={() => setSelectedPaymentMethod('Efectivo')}
            >
              <View style={styles.paymentOptionContent}>
                <Ionicons 
                  name="cash-outline" 
                  size={28} 
                  color={selectedPaymentMethod === 'Efectivo' ? '#1E88E5' : '#666'} 
                />
                <View style={styles.paymentOptionText}>
                  <Text style={[
                    styles.paymentOptionTitle,
                    selectedPaymentMethod === 'Efectivo' && styles.paymentOptionTitleSelected
                  ]}>Efectivo</Text>
                  <Text style={styles.paymentOptionDescription}>
                    Pagas al veterinario en la consulta
                  </Text>
                </View>
              </View>
              {selectedPaymentMethod === 'Efectivo' && (
                <Ionicons name="checkmark-circle" size={24} color="#1E88E5" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'MercadoPago' && styles.paymentOptionSelected
              ]}
              onPress={() => setSelectedPaymentMethod('MercadoPago')}
            >
              <View style={styles.paymentOptionContent}>
                <Ionicons 
                  name="card-outline" 
                  size={28} 
                  color={selectedPaymentMethod === 'MercadoPago' ? '#1E88E5' : '#666'} 
                />
                <View style={styles.paymentOptionText}>
                  <Text style={[
                    styles.paymentOptionTitle,
                    selectedPaymentMethod === 'MercadoPago' && styles.paymentOptionTitleSelected
                  ]}>Mercado Pago</Text>
                  <Text style={styles.paymentOptionDescription}>
                    Pago seguro con tarjeta o saldo
                  </Text>
                </View>
              </View>
              {selectedPaymentMethod === 'MercadoPago' && (
                <Ionicons name="checkmark-circle" size={24} color="#1E88E5" />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleGoHome}
            >
              <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                selectedPaymentMethod === 'MercadoPago' ? styles.mercadoPagoButton : styles.secondaryButton
              ]}
              onPress={selectedPaymentMethod === 'MercadoPago' ? handleMercadoPagoPayment : handleEfectivoPayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[
                  selectedPaymentMethod === 'MercadoPago' ? styles.mercadoPagoButtonText : styles.secondaryButtonText
                ]}>
                  {selectedPaymentMethod === 'MercadoPago' ? 'Pagar con Mercado Pago' : 'Confirmar Cita'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,//Radio de la esquina inferior izquierda
    borderBottomRightRadius: 30,//Radio de la esquina inferior derecha
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  confirmationBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  successIconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  reasonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 16,
    color: '#555',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    lineHeight: 22,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 5,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 100,
  },
  statusBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  paymentSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  paymentOption: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentOptionSelected: {
    borderColor: '#1E88E5',
    backgroundColor: '#E3F2FD',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: 15,
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  paymentOptionTitleSelected: {
    color: '#1E88E5',
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  mercadoPagoButton: {
    backgroundColor: '#00B0FF',
  },
  mercadoPagoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionsContainer: {
    marginTop: 10,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#1E88E5',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#E3F2FD',
  },
  secondaryButtonText: {
    color: '#1E88E5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default CitaConfirmacionScreen;
