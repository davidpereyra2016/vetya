import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import notificacionService from './apiNotificacion';
import useNotificacionStore from '../store/useNotificacionStore';

/**
 * Configuración de las notificaciones usando Expo Notifications
 * Esta configuración se debe realizar antes de solicitar permisos o registrar handlers
 */
export const configurePushNotifications = () => {
  // Configurar cómo se muestran las notificaciones cuando la app está en primer plano
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, // Mostrar alerta incluso si la app está abierta
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

/**
 * Solicita permisos para enviar notificaciones push
 * @returns {Promise<boolean>} Promesa que resuelve a true si se otorgaron permisos
 */
export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    console.log('Las notificaciones push requieren un dispositivo físico');
    return false;
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
    return false;
  }

  return true;
};

/**
 * Registra el token del dispositivo en el servidor
 * @returns {Promise<string|null>} Promesa que resuelve al token o null si no se pudo obtener
 */
export const registerForPushNotifications = async () => {
  try {
    // Primero solicitar permisos
    const permissionGranted = await requestNotificationPermissions();
    if (!permissionGranted) {
      return null;
    }

    // Verificar si estamos en Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    // Si estamos en Expo Go, mostrar advertencia y usar un projectId temporal para desarrollo
    if (isExpoGo) {
      console.warn('NOTA: Las notificaciones push remotas no funcionan en Expo Go desde SDK 53. Considera usar un development build.');
    }
    
    // Obtener token de Expo Notifications
    // Usar un projectId estático para desarrollo y el projectId de configuración para producción
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'vetya-app-development';
    
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

    // Registrar en el servidor
    if (token.data) {
      // Si obtenemos token, intentar registrarlo en el servidor
      await notificacionService.registerDeviceToken(token.data);
      console.log('Expo Push Token registrado:', token.data);
      return token.data;
    }

    } catch (error) {
      console.error('Error al registrar para notificaciones push:', error);
      if (isExpoGo) {
        console.log('Este error es esperado en Expo Go. Para notificaciones completas, usa un development build.');
      }
      return null;
    }
  } catch (outerError) {
    console.error('Error al registrar para notificaciones push:', outerError);
    return null;
  }
};

/**
 * Envía una notificación local (solo para pruebas en desarrollo)
 * @param {string} title Título de la notificación
 * @param {string} body Cuerpo de la notificación
 * @param {Object} data Datos adicionales para la notificación
 */
export const sendLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Inmediato
  });
};

/**
 * Configura un listener para notificaciones recibidas
 * @param {Function} handler Función que maneja la notificación recibida
 * @returns {Function} Función para eliminar el listener
 */
export const addNotificationReceivedListener = (handler) => {
  return Notifications.addNotificationReceivedListener(handler);
};

/**
 * Configura un listener para notificaciones respondidas por el usuario
 * @param {Function} handler Función que maneja la notificación respondida
 * @returns {Function} Función para eliminar el listener
 */
export const addNotificationResponseReceivedListener = (handler) => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};

/**
 * Maneja las notificaciones recibidas cuando la app está en primer plano
 * @param {Object} notification Objeto de notificación recibida
 */
export const handleNotificationReceived = (notification) => {
  const data = notification.request.content.data;
  
  // Actualizar conteo de notificaciones no leídas
  if (useNotificacionStore.getState().updateUnreadCount) {
    useNotificacionStore.getState().updateUnreadCount();
  }
  
  console.log('Notificación recibida en primer plano:', data);
};

/**
 * Maneja las respuestas a notificaciones (cuando el usuario toca una notificación)
 * @param {Object} response Objeto de respuesta a la notificación
 */
export const handleNotificationResponse = (response) => {
  const data = response.notification.request.content.data;
  
  console.log('📱 Procesando respuesta a notificación:', data);
  
  // Lógica para navegar a diferentes pantallas según el tipo de notificación
  // La navegación debe hacerse desde un componente con acceso al contexto de navegación
  // Almacenamos la acción para procesarla en el componente adecuado
  
  switch (data.tipo) {
    case 'Emergencia':
    case 'emergencia_asignada':
      global.pendingNotificationAction = {
        action: 'navigateToConfirmarEmergencia',
        params: {
          emergenciaId: data.emergenciaId || data.enlaceId,
          notificacionId: data.notificacionId
        }
      };
      break;
      
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
    case 'cita_completada':
      global.pendingNotificationAction = {
        action: 'navigateToAppointments',
        params: {
          citaId: data.citaId || data.enlaceId,
          notificacionId: data.notificacionId
        }
      };
      break;

    case 'valoracion_nueva':
      global.pendingNotificationAction = {
        action: 'navigateToNotificaciones',
        params: {
          notificacionId: data.notificacionId
        }
      };
      break;
      
    default:
      // Para otros tipos, navegar a la pantalla de notificaciones
      global.pendingNotificationAction = {
        action: 'navigateToNotificaciones',
        params: {
          notificacionId: data.notificacionId
        }
      };
      break;
  }
  
  console.log('✅ Acción pendiente configurada:', global.pendingNotificationAction);
};

/**
 * Obtiene el número de badge actual
 * @returns {Promise<number>} Número actual de badge
 */
export const getBadgeCount = async () => {
  return await Notifications.getBadgeCountAsync();
};

/**
 * Establece el número de badge
 * @param {number} count Número a establecer
 */
export const setBadgeCount = async (count) => {
  return await Notifications.setBadgeCountAsync(count);
};

export default {
  configurePushNotifications,
  requestNotificationPermissions,
  registerForPushNotifications,
  sendLocalNotification,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  handleNotificationReceived,
  handleNotificationResponse,
  getBadgeCount,
  setBadgeCount
};
