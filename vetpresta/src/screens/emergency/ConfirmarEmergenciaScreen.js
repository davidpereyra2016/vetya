import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigation, useRoute } from '@react-navigation/native';
import useNotificacionStore from '../../store/useNotificacionStore';
import axios from '../../config/axios';

/**
 * Pantalla para confirmar o rechazar una emergencia asignada
 */
const ConfirmarEmergenciaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { emergenciaId, notificacionId } = route.params || {};
  
  const { markAsRead } = useNotificacionStore();
  
  const [emergencia, setEmergencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const clienteNombre = emergencia?.usuario?.username || emergencia?.usuario?.nombre || emergencia?.usuario?.email || 'No disponible';
  const mascotaNombre = emergencia?.mascotaInfo?.nombre || emergencia?.mascota?.nombre || emergencia?.otroAnimal?.descripcionAnimal || 'No disponible';
  const fechaSolicitud = emergencia?.fechaSolicitud || emergencia?.createdAt || null;
  
  // Cargar datos de la emergencia
  useEffect(() => {
    if (emergenciaId) {
      loadEmergencia();
      // Marcar la notificación como leída
      if (notificacionId) {
        markAsRead(notificacionId);
      }
    } else {
      setError('ID de emergencia no proporcionado');
      setLoading(false);
    }
  }, [emergenciaId]);
  
  // Cargar datos de la emergencia desde la API
  const loadEmergencia = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/emergencias/${emergenciaId}`);
      setEmergencia(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar emergencia:', error);
      setError('Error al cargar los datos de la emergencia');
      setLoading(false);
    }
  };
  
  // Confirmar emergencia
  const confirmarEmergencia = async () => {
    try {
      setProcesando(true);
      // Actualizar el estado de la emergencia a "Asignada"
      const response = await axios.patch(`/emergencias/${emergenciaId}/confirmacion-veterinario`, {
        confirmado: true
      });
      
      setProcesando(false);
      
      // Mostrar mensaje de éxito
      Alert.alert(
        "Emergencia confirmada",
        "Has aceptado atender esta emergencia. Dirígete lo antes posible al lugar indicado.",
        [{ text: "OK", onPress: () => navigation.navigate('EmergencyDetails', { emergencyId: emergenciaId, emergency: response.data?.emergencia || response.data }) }]
      );
    } catch (error) {
      console.error('Error al confirmar emergencia:', error);
      setProcesando(false);
      Alert.alert(
        "Error",
        "No se pudo confirmar la emergencia. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    }
  };
  
  // Rechazar emergencia
  const rechazarEmergencia = async () => {
    try {
      setProcesando(true);
      // Actualizar el estado de la emergencia rechazándola
      const response = await axios.patch(`/emergencias/${emergenciaId}/confirmacion-veterinario`, {
        confirmado: false
      });
      
      setProcesando(false);
      
      // Mostrar mensaje de éxito
      Alert.alert(
        "Emergencia rechazada",
        "Has rechazado esta emergencia. Se buscará otro veterinario disponible.",
        [{ text: "OK", onPress: () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MainTabs', { screen: 'Inicio' });
          }
        }}]
      );
    } catch (error) {
      console.error('Error al rechazar emergencia:', error);
      setProcesando(false);
      Alert.alert(
        "Error",
        "No se pudo rechazar la emergencia. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    }
  };
  
  // Preguntar antes de rechazar
  const confirmarRechazo = () => {
    Alert.alert(
      "Rechazar emergencia",
      "¿Estás seguro de que deseas rechazar esta emergencia?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Rechazar", onPress: rechazarEmergencia, style: "destructive" }
      ]
    );
  };
  
  // Formatear la fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return format(new Date(fecha), "d 'de' MMMM 'a las' HH:mm", { locale: es });
  };
  
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#5469d4" />
        <Text style={styles.loadingText}>Cargando información de la emergencia...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={70} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEmergencia}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!emergencia) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="medical-outline" size={70} color="#ccc" />
        <Text style={styles.emptyText}>No se encontró información de la emergencia</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MainTabs', { screen: 'Inicio' });
          }
        }}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergencia médica</Text>
        <View style={styles.estadoBadge}>
          <Text style={styles.estadoText}>
            {emergencia.estado || 'Solicitada'}
          </Text>
        </View>
      </View>
      
      {/* Información del cliente y mascota */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Información del cliente</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={20} color="#718096" />
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValor}>
              {clienteNombre}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="paw-outline" size={20} color="#718096" />
            <Text style={styles.infoLabel}>Mascota:</Text>
            <Text style={styles.infoValor}>
              {mascotaNombre}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#718096" />
            <Text style={styles.infoLabel}>Solicitada:</Text>
            <Text style={styles.infoValor}>
              {formatearFecha(fechaSolicitud)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Detalles de la emergencia */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Detalles de la emergencia</Text>
        <View style={styles.emergenciaDetalle}>
          <View style={styles.tipoEmergenciaContainer}>
            <Ionicons name="medkit" size={24} color="#e53e3e" />
            <Text style={styles.tipoEmergencia}>{emergencia.tipoEmergencia}</Text>
          </View>
          
          <Text style={styles.descripcion}>
            {emergencia.descripcion || 'Sin descripción adicional'}
          </Text>
          
          {emergencia.imagenes && emergencia.imagenes.length > 0 && (
            <View style={styles.imagenesContainer}>
              {emergencia.imagenes.map((img, index) => (
                <Image 
                  key={index} 
                  source={{ uri: img }} 
                  style={styles.imagen} 
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
        </View>
      </View>
      
      {/* Ubicación */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Ubicación</Text>
        <View style={styles.ubicacionContainer}>
          <Ionicons name="location-outline" size={24} color="#4299e1" />
          <View style={styles.direccionContainer}>
            <Text style={styles.direccion}>
              {emergencia.ubicacion?.direccion || 'Dirección no disponible'}
            </Text>
            <Text style={styles.referencia}>
              {emergencia.ubicacion?.referencia || ''}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Botones de acción */}
      <View style={styles.botonesContainer}>
        <TouchableOpacity 
          style={[styles.boton, styles.botonRechazar]}
          onPress={confirmarRechazo}
          disabled={procesando}
        >
          <Ionicons name="close-circle-outline" size={20} color="#fff" />
          <Text style={styles.botonTexto}>Rechazar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.boton, styles.botonConfirmar]}
          onPress={confirmarEmergencia}
          disabled={procesando}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.botonTexto}>Confirmar</Text>
        </TouchableOpacity>
      </View>
      
      {procesando && (
        <View style={styles.procesandoOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.procesandoTexto}>Procesando...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a5568',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#e53e3e',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#5469d4',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#5469d4',
    borderRadius: 4,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  estadoBadge: {
    backgroundColor: '#ebf8ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  estadoText: {
    color: '#3182ce',
    fontWeight: '500',
    fontSize: 12,
  },
  seccion: {
    backgroundColor: '#fff',
    marginTop: 15,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
  },
  infoContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 6,
    padding: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    marginLeft: 8,
    marginRight: 5,
  },
  infoValor: {
    fontSize: 14,
    color: '#2d3748',
    flex: 1,
  },
  emergenciaDetalle: {
    backgroundColor: '#f7fafc',
    borderRadius: 6,
    padding: 12,
  },
  tipoEmergenciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipoEmergencia: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginLeft: 8,
  },
  descripcion: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  imagenesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imagen: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 6,
  },
  ubicacionContainer: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    borderRadius: 6,
    padding: 12,
  },
  direccionContainer: {
    flex: 1,
    marginLeft: 10,
  },
  direccion: {
    fontSize: 14,
    color: '#2d3748',
    marginBottom: 5,
  },
  referencia: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
  },
  botonRechazar: {
    backgroundColor: '#e53e3e',
  },
  botonConfirmar: {
    backgroundColor: '#38a169',
  },
  botonTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  procesandoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  procesandoTexto: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default ConfirmarEmergenciaScreen;
