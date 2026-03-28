import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Utilidades para facilitar el manejo de notificaciones
 * compatible con las limitaciones de Expo Go
 */

// Configuración básica de notificaciones
export const configurarNotificaciones = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

// Verificar si estamos en Expo Go
export const isExpoGo = Constants.appOwnership === 'expo';

// Verificar si las notificaciones push están disponibles en este entorno
export const areRemoteNotificationsAvailable = () => {
  return Device.isDevice && !isExpoGo;
};

// Registrar para notificaciones push (solo funcionará en development build)
export const registrarParaNotificaciones = async () => {
  try {
    // Si estamos en Expo Go, mostrar advertencia
    if (isExpoGo) {
      console.warn(
        'Las notificaciones push remotas no están disponibles en Expo Go desde SDK 53. ' +
        'Use un development build para acceder a esta funcionalidad.'
      );
    }

    // Verificar si el dispositivo es real
    if (!Device.isDevice) {
      console.log('Las notificaciones push requieren un dispositivo físico');
      return { success: false, message: 'Dispositivo no compatible', token: null };
    }

    // Verificar si ya tenemos permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Si no tenemos permisos, solicitarlos
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Si aún no tenemos permisos, no podemos continuar
    if (finalStatus !== 'granted') {
      console.log('No se obtuvieron permisos para las notificaciones push');
      return { success: false, message: 'Permisos denegados', token: null };
    }

    // ProjectId para desarrollo (esto debería estar en un archivo de configuración)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'vetya-app-development';

    // Intentar obtener token, capturando errores específicos
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      return { 
        success: true, 
        token: tokenData.data,
        isExpoGo: isExpoGo
      };
    } catch (tokenError) {
      console.error('Error específico al obtener token:', tokenError);
      
      // Manejar específicamente el error de Expo Go
      if (isExpoGo) {
        return { 
          success: false, 
          message: 'Las notificaciones push no están disponibles en Expo Go', 
          isExpoGo: true,
          token: null
        };
      }
      
      return { 
        success: false, 
        message: tokenError.message || 'Error al obtener token', 
        token: null
      };
    }
  } catch (error) {
    console.error('Error general en notificaciones:', error);
    return { success: false, message: error.message, token: null };
  }
};

// Enviar notificación local (funciona en Expo Go)
export const enviarNotificacionLocal = async (titulo, cuerpo, datos = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      data: datos,
    },
    trigger: null, // Inmediato
  });
  return true;
};

// Agregar listener para notificaciones recibidas
export const agregarListenerNotificacionRecibida = (manejador) => {
  return Notifications.addNotificationReceivedListener(manejador);
};

// Agregar listener para respuesta a notificaciones
export const agregarListenerRespuestaNotificacion = (manejador) => {
  return Notifications.addNotificationResponseReceivedListener(manejador);
};

export default {
  configurarNotificaciones,
  registrarParaNotificaciones,
  enviarNotificacionLocal,
  agregarListenerNotificacionRecibida,
  agregarListenerRespuestaNotificacion,
  isExpoGo,
  areRemoteNotificationsAvailable
};
