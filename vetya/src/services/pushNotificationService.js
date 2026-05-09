import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import notificacionService from './apiNotificacion';
import useEmergencyStore from '../store/useEmergencyStore';

const applyEmergencyNotificationUpdate = (data = {}) => {
  const emergenciaId = data.emergenciaId || data.enlaceId || data.datos?.emergenciaId;
  const estado = data.datos?.estado || data.estado;

  if (!emergenciaId || !estado) return;

  const veterinarioNombre = data.datos?.veterinarioNombre || data.veterinarioNombre;
  const veterinarioRating = data.datos?.veterinarioRating ?? data.veterinarioRating;
  const emergencyUpdate = {
    _id: emergenciaId,
    estado,
  };

  if (veterinarioNombre) {
    emergencyUpdate.veterinario = {
      nombre: veterinarioNombre,
      rating: veterinarioRating || 0,
    };
  }

  useEmergencyStore.getState().applySocketEmergencyUpdate(emergencyUpdate);
};

/**
 * Configuración de las notificaciones usando Expo Notifications
 * Se debe llamar antes de solicitar permisos o registrar handlers
 */
export const configurePushNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

/**
 * Solicita permisos para enviar notificaciones push
 * @returns {Promise<boolean>} true si se otorgaron permisos
 */
export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    console.log('Las notificaciones push requieren un dispositivo físico');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('No se obtuvieron permisos para las notificaciones push');
    return false;
  }

  // Configurar canal de notificaciones en Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E88E5',
    });

    await Notifications.setNotificationChannelAsync('emergency_channel', {
      name: 'Emergencias',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#F44336',
      sound: 'default',
    });
  }

  return true;
};

/**
 * Registra el token del dispositivo en el servidor
 * @returns {Promise<string|null>} token o null si no se pudo obtener
 */
export const registerForPushNotifications = async () => {
  try {
    const permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      return null;
    }

    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo) {
      console.log('⚠️ Las notificaciones push remotas no funcionan en Expo Go. Usa un development build.');
    }
    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'vetya-app-development';
    
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      if (token.data) {
        await notificacionService.registerDeviceToken(token.data);
        console.log('✅ Expo Push Token registrado:', token.data);
        return token.data;
      }
    } catch (error) {
      console.log('⚠️ Error al obtener push token:', error.message);
      if (isExpoGo) {
        console.log('Este error es esperado en Expo Go.');
      }
      return null;
    }
  } catch (outerError) {
    console.log('⚠️ Error al registrar para notificaciones push:', outerError.message);
    return null;
  }
};

/**
 * Maneja las notificaciones recibidas cuando la app está en primer plano
 * @param {Object} notification Objeto de notificación recibida
 */
export const handleNotificationReceived = (notification) => {
  const data = notification.request.content.data;
  console.log('🔔 Notificación recibida en primer plano:', data);

  if ([
    'Emergencia',
    'emergencia_asignada',
    'emergencia_confirmada',
    'emergencia_en_camino',
    'emergencia_atendida',
    'emergencia_cancelada'
  ].includes(data?.tipo)) {
    applyEmergencyNotificationUpdate(data);
  }
};

/**
 * Maneja las respuestas a notificaciones (cuando el usuario toca una notificación)
 * @param {Object} response Objeto de respuesta a la notificación
 */
export const handleNotificationResponse = (response) => {
  const data = response.notification.request.content.data;
  
  console.log('📱 Procesando respuesta a notificación:', data);
  
  switch (data.tipo) {
    case 'Emergencia':
    case 'emergencia_asignada':
    case 'emergencia_confirmada':
    case 'emergencia_en_camino':
    case 'emergencia_atendida':
      global.pendingNotificationAction = {
        action: 'navigateToEmergencyDetails',
        params: {
          emergenciaId: data.emergenciaId || data.enlaceId,
          notificacionId: data.notificacionId
        }
      };
      break;
      
    case 'Cita':
    case 'cita_solicitada':
    case 'cita_confirmada':
    case 'cita_cancelada':
    case 'cita_reprogramada':
      global.pendingNotificationAction = {
        action: 'navigateToAppointments',
        params: {
          citaId: data.citaId || data.enlaceId,
          notificacionId: data.notificacionId
        }
      };
      break;
      
    default:
      global.pendingNotificationAction = {
        action: 'navigateToHome',
        params: {
          notificacionId: data.notificacionId
        }
      };
      break;
  }
  
  console.log('✅ Acción pendiente configurada:', global.pendingNotificationAction);
};

/**
 * Configura un listener para notificaciones recibidas
 * @param {Function} handler Función que maneja la notificación recibida
 * @returns {Object} Suscripción para eliminar el listener
 */
export const addNotificationReceivedListener = (handler) => {
  return Notifications.addNotificationReceivedListener(handler);
};

/**
 * Configura un listener para notificaciones respondidas por el usuario
 * @param {Function} handler Función que maneja la notificación respondida
 * @returns {Object} Suscripción para eliminar el listener
 */
export const addNotificationResponseReceivedListener = (handler) => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};

/**
 * Obtiene el número de badge actual
 * @returns {Promise<number>}
 */
export const getBadgeCount = async () => {
  return await Notifications.getBadgeCountAsync();
};

/**
 * Establece el número de badge
 * @param {number} count
 */
export const setBadgeCount = async (count) => {
  return await Notifications.setBadgeCountAsync(count);
};

export default {
  configurePushNotifications,
  requestNotificationPermissions,
  registerForPushNotifications,
  handleNotificationReceived,
  handleNotificationResponse,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getBadgeCount,
  setBadgeCount
};
