import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useValidacionStore from '../../store/useValidacionStore';
import useAuthStore from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

const ValidationBlockScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  // Store de validación
  const {
    estadoValidacion,
    prestadorTipo,
    progreso,
    observacionesAdmin,
    fechaRechazo,
    isLoading,
    error,
    fetchEstadoValidacion,
    getEstadoMessage,
    clearError,
    startPolling,
    stopPolling
  } = useValidacionStore();

  // Store de auth
  const { logout } = useAuthStore();

  // Cargar estado al enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadValidationState();
    }, [])
  );

  // Verificar automáticamente si el prestador fue aprobado
  useEffect(() => {
    if (estadoValidacion === 'aprobado') {
      // Mostrar mensaje de éxito y redirigir
      Alert.alert(
        '¡Felicitaciones! 🎉',
        'Su cuenta ha sido aprobada. Ya puede acceder a todas las funcionalidades de la aplicación.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              // Navegar a la pantalla principal
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          }
        ],
        { cancelable: false }
      );
    }
  }, [estadoValidacion, navigation]);

  // Iniciar polling automático cuando está en revisión
  useEffect(() => {
    if (estadoValidacion === 'en_revision') {
      startPolling();
    }
    
    // Cleanup al desmontar el componente
    return () => {
      stopPolling();
    };
  }, [estadoValidacion, startPolling, stopPolling]);

  const loadValidationState = async () => {
    await fetchEstadoValidacion();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadValidationState();
    setRefreshing(false);
  };

  const handleNavigateToValidation = () => {
    navigation.navigate('ValidationDashboard');
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  const getEstadoInfo = () => {
    switch (estadoValidacion) {
      case 'pendiente_documentos':
        return {
          icon: 'document-text-outline',
          color: '#FF9500',
          title: 'Documentos Pendientes',
          message: 'Necesitas completar la carga de documentos para continuar con el proceso de validación.',
          canProceed: true,
          actionText: 'Completar Documentos'
        };
      case 'en_revision':
        return {
          icon: 'time-outline',
          color: '#007AFF',
          title: 'En Revisión',
          message: 'Tus documentos están siendo revisados por nuestro equipo. Te notificaremos cuando el proceso esté completo.',
          canProceed: false,
          actionText: 'Ver Estado'
        };
      case 'rechazado':
        return {
          icon: 'close-circle-outline',
          color: '#FF3B30',
          title: 'Solicitud Rechazada',
          message: 'Tu solicitud de validación ha sido rechazada. Revisa las observaciones y vuelve a intentarlo.',
          canProceed: true,
          actionText: 'Ver Detalles'
        };
      case 'requiere_correccion':
        return {
          icon: 'warning-outline',
          color: '#FF9500',
          title: 'Requiere Corrección',
          message: 'Algunos documentos necesitan ser corregidos. Revisa las observaciones y sube los documentos actualizados.',
          canProceed: true,
          actionText: 'Corregir Documentos'
        };
      default:
        return {
          icon: 'help-circle-outline',
          color: '#8E8E93',
          title: 'Estado Desconocido',
          message: 'No se pudo determinar el estado de tu validación. Por favor, contacta al soporte.',
          canProceed: false,
          actionText: 'Ver Estado'
        };
    }
  };

  const renderProgressInfo = () => {
    if (!progreso) return null;

    return (
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Progreso de Validación</Text>
        
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Ionicons name="document-outline" size={20} color="#666" />
            <Text style={styles.progressLabel}>Documentos</Text>
          </View>
          <Text style={styles.progressText}>
            {progreso.subidos}/{progreso.total} subidos
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progreso.porcentajeSubida}%` }]} />
        </View>

        {progreso.aprobados > 0 && (
          <Text style={styles.progressApproved}>
            {progreso.aprobados} documentos aprobados
          </Text>
        )}
      </View>
    );
  };

  const renderObservations = () => {
    if (!observacionesAdmin) return null;

    return (
      <View style={styles.observationsCard}>
        <View style={styles.observationsHeader}>
          <Ionicons name="chatbubble-outline" size={20} color="#FF9500" />
          <Text style={styles.observationsTitle}>Observaciones del Administrador</Text>
        </View>
        <Text style={styles.observationsText}>{observacionesAdmin}</Text>
      </View>
    );
  };

  const renderRejectionInfo = () => {
    if (estadoValidacion !== 'rechazado' || !fechaRechazo) return null;

    return (
      <View style={styles.rejectionCard}>
        <View style={styles.rejectionHeader}>
          <Ionicons name="information-circle-outline" size={20} color="#FF3B30" />
          <Text style={styles.rejectionTitle}>Información del Rechazo</Text>
        </View>
        <Text style={styles.rejectionDate}>
          Fecha de rechazo: {new Date(fechaRechazo).toLocaleDateString()}
        </Text>
        <Text style={styles.rejectionText}>
          Puedes volver a enviar tu solicitud corrigiendo los puntos señalados en las observaciones.
        </Text>
      </View>
    );
  };

  if (isLoading && !estadoValidacion) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Verificando estado de validación...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const estadoInfo = getEstadoInfo();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vetya Prestadores</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mainCard}>
          <View style={[styles.iconContainer, { backgroundColor: estadoInfo.color }]}>
            <Ionicons name={estadoInfo.icon} size={60} color="#FFF" />
          </View>

          <Text style={styles.statusTitle}>{estadoInfo.title}</Text>
          <Text style={styles.statusMessage}>{estadoInfo.message}</Text>

          {renderProgressInfo()}
          {renderObservations()}
          {renderRejectionInfo()}

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: estadoInfo.color }]}
              onPress={handleNavigateToValidation}
            >
              <Ionicons name="eye-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>{estadoInfo.actionText}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#666" />
              <Text style={styles.secondaryButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.helpCard}>
          <View style={styles.helpHeader}>
            <Ionicons name="help-circle-outline" size={20} color="#1E88E5" />
            <Text style={styles.helpTitle}>¿Necesitas Ayuda?</Text>
          </View>
          <Text style={styles.helpText}>
            Si tienes dudas sobre el proceso de validación o necesitas asistencia, 
            puedes contactar a nuestro equipo de soporte.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="mail-outline" size={16} color="#1E88E5" />
            <Text style={styles.helpButtonText}>Contactar Soporte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 45,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    flex: 1,
  },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1E88E5',
    borderRadius: 4,
  },
  progressApproved: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  observationsCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  observationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  observationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginLeft: 8,
  },
  observationsText: {
    fontSize: 16,
    color: '#856404',
    lineHeight: 22,
  },
  rejectionCard: {
    backgroundColor: '#FFE5E5',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721C24',
    marginLeft: 8,
  },
  rejectionDate: {
    fontSize: 14,
    color: '#721C24',
    marginBottom: 10,
    fontWeight: '600',
  },
  rejectionText: {
    fontSize: 16,
    color: '#721C24',
    lineHeight: 22,
  },
  actionsContainer: {
    width: '100%',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  helpCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  helpButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default ValidationBlockScreen;
