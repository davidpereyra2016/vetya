import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const CitaConfirmacionScreen = ({ navigation, route }) => {
  const { pet, date, time, service, vet, location, reason } = route.params;

  // Función para volver a la pantalla principal
  const handleGoHome = () => {
    // Navegamos a la tab de inicio usando navegación anidada
    navigation.navigate('MainTabs', { screen: 'Inicio' });
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
          
          <Text style={styles.confirmationTitle}>¡Cita Agendada!</Text>
          <Text style={styles.confirmationMessage}>
            Tu cita ha sido registrada con éxito y está pendiente de aprobación por el veterinario. Te notificaremos cuando el veterinario confirme la cita.
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Detalles de la Cita</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Fecha:</Text>
            <Text style={styles.detailValue}>{date?.formattedDate}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Hora:</Text>
            <Text style={styles.detailValue}>{time?.time} hrs</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="medkit" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Servicio:</Text>
            <Text style={styles.detailValue}>{service?.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="paw" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Mascota:</Text>
            <Text style={styles.detailValue}>{pet?.name} ({pet?.breed})</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="person" size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Veterinario:</Text>
            <Text style={styles.detailValue}>{vet?.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name={location?.icon || "location"} size={22} color="#1E88E5" style={styles.detailIcon} />
            <Text style={styles.detailLabel}>Ubicación:</Text>
            <Text style={styles.detailValue}>{location?.type}</Text>
          </View>
          
          {reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>Motivo de la consulta:</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          )}
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Estado:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pendiente de aprobación</Text>
            </View>
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleGoHome}
            >
              <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleViewAppointment}
            >
              <Text style={styles.secondaryButtonText}>Ver Mis Citas</Text>
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
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
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
});

export default CitaConfirmacionScreen;
