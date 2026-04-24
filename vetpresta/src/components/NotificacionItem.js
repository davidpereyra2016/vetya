import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente que muestra una notificación individual
 * @param {Object} item Objeto de notificación a mostrar
 * @param {Function} onRead Función para marcar como leída
 * @param {Function} onDelete Función para eliminar
 */
const NotificacionItem = ({ item, onRead, onDelete }) => {
  const navigation = useNavigation();
  
  // Formatear la fecha de la notificación
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const fechaObj = new Date(fecha);
    return format(fechaObj, "d 'de' MMMM 'a las' HH:mm", { locale: es });
  };
  
  // Manejar la acción de la notificación
  const handleAction = () => {
    // Marcar como leída si no lo está
    if (!item.leida && onRead) {
      onRead(item._id);
    }
    
    // Realizar acción según el tipo de notificación
    if (item.accion === 'confirmar_emergencia' && item.datos?.emergenciaId) {
      navigation.navigate('ConfirmarEmergencia', { 
        emergenciaId: item.datos.emergenciaId,
        notificacionId: item._id
      });
    } else if (item.tipo === 'emergencia_asignada' && item.datos?.emergenciaId) {
      navigation.navigate('EmergencyDetails', { 
        emergencyId: item.datos.emergenciaId,
        fromNotification: true
      });
    } else if (['cita_solicitada', 'cita_confirmada', 'cita_cancelada', 'cita_completada', 'cita_reprogramada', 'Cita'].includes(item.tipo)) {
      navigation.navigate('MainTabs', { screen: 'Citas' });
    } else {
      navigation.navigate('Notificaciones');
    }
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, !item.leida && styles.noLeida]} 
      onPress={handleAction}
    >
      {/* Indicador de no leída */}
      {!item.leida && (
        <View style={styles.indicadorNoLeida} />
      )}
      
      {/* Icono según tipo */}
      <View style={styles.iconoContainer}>
        {item.tipo === 'emergencia_asignada' ? (
          <Ionicons name="medical" size={24} color="#e74c3c" />
        ) : ['cita_solicitada', 'cita_confirmada', 'cita_cancelada', 'cita_completada', 'cita_reprogramada', 'Cita'].includes(item.tipo) ? (
          <Ionicons name="calendar" size={24} color="#1E88E5" />
        ) : item.tipo === 'valoracion_nueva' ? (
          <Ionicons name="star" size={24} color="#f59e0b" />
        ) : item.tipo === 'mensaje_nuevo' ? (
          <Ionicons name="chatbubble-ellipses" size={24} color="#3498db" />
        ) : (
          <Ionicons name="notifications" size={24} color="#7f8c8d" />
        )}
      </View>
      
      {/* Contenido principal */}
      <View style={styles.contenido}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.mensaje}>{item.mensaje}</Text>
        <Text style={styles.fecha}>{formatearFecha(item.fechaEnvio)}</Text>
      </View>
      
      {/* Opciones */}
      <TouchableOpacity 
        style={styles.botonEliminar}
        onPress={() => onDelete && onDelete(item._id)}
      >
        <Ionicons name="trash-outline" size={20} color="#7f8c8d" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  noLeida: {
    backgroundColor: '#f8f9fe',
    borderLeftWidth: 3,
    borderLeftColor: '#5469d4',
  },
  indicadorNoLeida: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5469d4',
  },
  iconoContainer: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  contenido: {
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2d3748',
  },
  mensaje: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 5,
    lineHeight: 20,
  },
  fecha: {
    fontSize: 12,
    color: '#a0aec0',
  },
  botonEliminar: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
});

export default NotificacionItem;
