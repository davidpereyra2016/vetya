import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useValidacionStore from '../../store/useValidacionStore';
import useAuthStore from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

const ValidationDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Store de validación
  const {
    estadoValidacion,
    prestadorTipo,
    progreso,
    documentosRequeridos,
    observacionesAdmin,
    fechaAprobacion,
    fechaRechazo,
    isLoading,
    error,
    fetchEstadoValidacion,
    getEstadoMessage,
    getDocumentosConErrores,
    clearError,
    startPolling,
    stopPolling
  } = useValidacionStore();

  // Store de auth para obtener info del prestador
  const { provider } = useAuthStore();

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
              // Actualizar el estado del prestador en el store de auth
              // y navegar a la pantalla principal
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

  const handleNavigateToDocuments = () => {
    navigation.navigate('DocumentUpload');
  };

  const handleNavigateToAdditionalData = () => {
    navigation.navigate('AdditionalData');
  };

  const getEstadoColor = (estado) => {
    // Verificar si hay documentos rechazados
    const documentosConErrores = getDocumentosConErrores();
    const tieneDocumentosRechazados = documentosConErrores.length > 0;
    
    const colors = {
      'pendiente_documentos': '#FF9500',
      'en_revision': tieneDocumentosRechazados ? '#FF9500' : '#007AFF', // Naranja si hay rechazados
      'aprobado': '#34C759',
      'rechazado': '#FF3B30',
      'requiere_correccion': '#FF9500'
    };
    return colors[estado] || '#8E8E93';
  };

  const getEstadoIcon = (estado) => {
    // Verificar si hay documentos rechazados
    const documentosConErrores = getDocumentosConErrores();
    const tieneDocumentosRechazados = documentosConErrores.length > 0;
    
    const icons = {
      'pendiente_documentos': 'document-text-outline',
      'en_revision': tieneDocumentosRechazados ? 'warning-outline' : 'time-outline', // Warning si hay rechazados
      'aprobado': 'checkmark-circle-outline',
      'rechazado': 'close-circle-outline',
      'requiere_correccion': 'warning-outline'
    };
    return icons[estado] || 'help-circle-outline';
  };

  const renderEstadoCard = () => {
    if (!estadoValidacion) return null;

    const color = getEstadoColor(estadoValidacion);
    const icon = getEstadoIcon(estadoValidacion);
    const message = getEstadoMessage();

    return (
      <View style={[styles.estadoCard, { borderLeftColor: color }]}>
        <View style={styles.estadoHeader}>
          <Ionicons name={icon} size={24} color={color} />
          <Text style={[styles.estadoTitle, { color }]}>
            {estadoValidacion.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.estadoMessage}>{message}</Text>
        
        {fechaAprobacion && (
          <Text style={styles.fechaText}>
            Aprobado el: {new Date(fechaAprobacion).toLocaleDateString()}
          </Text>
        )}
        
        {fechaRechazo && (
          <Text style={styles.fechaText}>
            Rechazado el: {new Date(fechaRechazo).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  const renderProgresoCard = () => {
    if (!progreso) return null;

    return (
      <View style={styles.progresoCard}>
        <Text style={styles.cardTitle}>Progreso de Validación</Text>
        
        <View style={styles.progresoItem}>
          <Text style={styles.progresoLabel}>Documentos Subidos</Text>
          <View style={styles.progresoBarContainer}>
            <View style={[styles.progresoBar, { width: `${progreso.porcentajeSubida}%` }]} />
          </View>
          <Text style={styles.progresoText}>{progreso.subidos}/{progreso.total}</Text>
        </View>

        <View style={styles.progresoItem}>
          <Text style={styles.progresoLabel}>Documentos Aprobados</Text>
          <View style={styles.progresoBarContainer}>
            <View style={[styles.progresoBar, { width: `${progreso.porcentajeAprobacion}%`, backgroundColor: '#34C759' }]} />
          </View>
          <Text style={styles.progresoText}>{progreso.aprobados}/{progreso.total}</Text>
        </View>
      </View>
    );
  };

  const renderDocumentosRequeridos = () => {
    if (!documentosRequeridos || documentosRequeridos.length === 0) return null;

    return (
      <View style={styles.documentosCard}>
        <Text style={styles.cardTitle}>Documentos Requeridos</Text>
        <Text style={styles.cardSubtitle}>Para prestador tipo: {prestadorTipo}</Text>
        
        {documentosRequeridos.map((doc, index) => (
          <View key={index} style={styles.documentoItem}>
            <Ionicons name="document-outline" size={20} color="#666" />
            <Text style={styles.documentoText}>{doc}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDocumentosConErrores = () => {
    const documentosConErrores = getDocumentosConErrores();
    
    if (documentosConErrores.length === 0) return null;

    // Mapeo de nombres técnicos a nombres amigables
    const nombreDocumentos = {
      'cedula': 'Cédula de Identidad',
      'matricula': 'Matrícula Profesional',
      'titulo': 'Título Universitario',
      'constanciaConsejo': 'Constancia del Consejo Profesional',
      'certificadoEspecialidad': 'Certificado de Especialidad',
      'cuit': 'CUIT/CUIL',
      'habilitacion': 'Habilitación Municipal',
      'responsableTecnico': 'Documentos del Responsable Técnico'
    };

    return (
      <View style={styles.erroresCard}>
        <Text style={styles.cardTitle}>⚠️ Documentos Rechazados</Text>
        <Text style={styles.cardSubtitle}>
          Los siguientes documentos fueron rechazados y deben ser corregidos. 
          Puede volver a subirlos usando el botón "Subir Documentos".
        </Text>
        
        {documentosConErrores.map((doc, index) => (
          <View key={index} style={styles.errorItem}>
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
            <View style={styles.errorContent}>
              <Text style={styles.errorDocumento}>
                {nombreDocumentos[doc.tipo] || doc.tipo}
              </Text>
              <Text style={styles.errorObservacion}>
                {doc.observaciones || 'Documento rechazado. Por favor, revise y vuelva a subirlo.'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderObservacionesAdmin = () => {
    if (!observacionesAdmin) return null;

    return (
      <View style={styles.observacionesCard}>
        <Text style={styles.cardTitle}>Observaciones del Administrador</Text>
        <Text style={styles.observacionesText}>{observacionesAdmin}</Text>
      </View>
    );
  };

  const renderAcciones = () => {
    // Verificar si hay documentos rechazados que requieren corrección
    const documentosConErrores = getDocumentosConErrores();
    const tieneDocumentosRechazados = documentosConErrores.length > 0;
    
    const canUploadDocuments = estadoValidacion === 'pendiente_documentos' || 
                              estadoValidacion === 'requiere_correccion' ||
                              tieneDocumentosRechazados;
    
    return (
      <View style={styles.accionesCard}>
        <Text style={styles.cardTitle}>Acciones Disponibles</Text>
        
        <TouchableOpacity 
          style={[styles.accionButton, !canUploadDocuments && styles.accionButtonDisabled]}
          onPress={handleNavigateToDocuments}
          disabled={!canUploadDocuments}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={canUploadDocuments ? "#FFF" : "#999"} />
          <Text style={[styles.accionButtonText, !canUploadDocuments && styles.accionButtonTextDisabled]}>
            Subir Documentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.accionButtonSecondary}
          onPress={handleNavigateToAdditionalData}
        >
          <Ionicons name="person-outline" size={20} color="#1E88E5" />
          <Text style={styles.accionButtonSecondaryText}>
            Completar Datos Adicionales
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && !estadoValidacion) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Cargando estado de validación...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'Perfil' });
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estado de Validación</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}

        {renderEstadoCard()}
        {renderProgresoCard()}
        {renderDocumentosConErrores()}
        {renderObservacionesAdmin()}
        {renderDocumentosRequeridos()}
        {renderAcciones()}
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
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
  estadoCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estadoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  estadoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  estadoMessage: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  fechaText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  progresoCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  progresoItem: {
    marginBottom: 15,
  },
  progresoLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  progresoBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 5,
  },
  progresoBar: {
    height: '100%',
    backgroundColor: '#1E88E5',
    borderRadius: 4,
  },
  progresoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  documentosCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  documentoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  erroresCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  errorContent: {
    flex: 1,
    marginLeft: 10,
  },
  errorDocumento: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  errorObservacion: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  observacionesCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  observacionesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  accionesCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accionButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  accionButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  accionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  accionButtonTextDisabled: {
    color: '#999',
  },
  accionButtonSecondary: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  accionButtonSecondaryText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ValidationDashboardScreen;
