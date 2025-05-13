import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const ConsultaConfirmacionScreen = ({ navigation, route }) => {
  const { pet, date, time, vet, reason } = route.params || {};
  
  // Animaciones
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animaciones de entrada
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: false
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false
      })
    ]).start();
  }, []);
  
  // Mostrar la fecha formateada que ya viene procesada
  const formattedDate = () => {
    if (!date) return '';
    
    // Usar la fecha ya formateada que enviamos desde la pantalla anterior
    return date.formattedDate;
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.popToTop()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmación</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View 
          style={[
            styles.card, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          
          <Text style={styles.successTitle}>
            ¡Consulta Agendada!
          </Text>
          
          <Text style={styles.successMessage}>
            Tu consulta ha sido agendada exitosamente. Te enviaremos un recordatorio 24 horas antes.
          </Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="paw" size={22} color="#1E88E5" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Mascota</Text>
                <Text style={styles.detailValue}>{pet?.name} ({pet?.type})</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={22} color="#1E88E5" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Fecha</Text>
                <Text style={styles.detailValue}>{formattedDate()}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.detailItem}>
              <Ionicons name="time" size={22} color="#1E88E5" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Hora</Text>
                <Text style={styles.detailValue}>{time?.time} hrs.</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.detailItem}>
              <Ionicons name="person" size={22} color="#1E88E5" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Veterinario</Text>
                <Text style={styles.detailValue}>{vet?.name}</Text>
                <Text style={styles.detailSubvalue}>{vet?.specialty} • {vet?.rating} ★</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.detailItem}>
              <Ionicons name="medical" size={22} color="#1E88E5" style={styles.detailIcon} />
              <View style={{flex: 1}}>
                <Text style={styles.detailLabel}>Motivo</Text>
                <Text style={styles.detailValue}>{reason}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#1E88E5" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Si necesitas cambiar o cancelar tu cita, puedes hacerlo hasta 4 horas antes en la sección "Mis Citas".
            </Text>
          </View>
          
          <View style={styles.appointmentId}>
            <Text style={styles.appointmentIdLabel}>ID de Consulta:</Text>
            <Text style={styles.appointmentIdValue}>VET-{Math.floor(100000 + Math.random() * 900000)}</Text>
          </View>
        </Animated.View>
        
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.homeButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.appointmentsButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Citas' })}
        >
          <Text style={styles.appointmentsButtonText}>Ver Mis Citas</Text>
          <Ionicons name="arrow-forward" size={18} color="#1E88E5" style={styles.arrowIcon} />
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 20,
  },
  successIconContainer: {
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#F7F9FC',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  detailIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detailSubvalue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginVertical: 10,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    color: '#0D47A1',
    fontSize: 14,
    flex: 1,
  },
  appointmentId: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEEEE',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  appointmentIdLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  appointmentIdValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  homeButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  appointmentsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  appointmentsButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '500',
  },
  arrowIcon: {
    marginLeft: 8,
  }
});

export default ConsultaConfirmacionScreen;
