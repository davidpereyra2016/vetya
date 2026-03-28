import axiosInstance from './axiosInstance';

/**
 * Servicio para manejar las notificaciones en la aplicación
 * Proporciona funciones para obtener, marcar como leídas y gestionar las notificaciones
 */
export const notificacionService = {
  // Obtener todas las notificaciones
  getAll: async (leidas) => {
    try {
      let url = '/notificaciones';
      if (leidas !== undefined) {
        url += `?leidas=${leidas}`;
      }
      const response = await axiosInstance.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener notificaciones'
      };
    }
  },

  // Obtener conteo de notificaciones no leídas
  getUnreadCount: async () => {
    try {
      const response = await axiosInstance.get('/notificaciones/conteo');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener conteo de notificaciones:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener conteo de notificaciones',
        data: { conteo: 0 } // Valor por defecto
      };
    }
  },

  // Marcar una notificación como leída
  markAsRead: async (notificacionId) => {
    try {
      const response = await axiosInstance.patch(`/notificaciones/${notificacionId}/leer`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al marcar notificación como leída'
      };
    }
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: async () => {
    try {
      const response = await axiosInstance.patch('/notificaciones/leer-todas');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al marcar notificaciones'
      };
    }
  },

  // Eliminar una notificación
  delete: async (notificacionId) => {
    try {
      const response = await axiosInstance.delete(`/notificaciones/${notificacionId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar notificación'
      };
    }
  },

  // Enviar notificación de emergencia a un prestador (veterinario)
  sendEmergencyNotification: async (data) => {
    try {
      const response = await axiosInstance.post('/notificaciones/emergencia-asignada', data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al enviar notificación de emergencia:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al enviar notificación de emergencia'
      };
    }
  },

  // Registrar token de dispositivo para notificaciones push
  registerDeviceToken: async (token) => {
    try {
      const response = await axiosInstance.post('/users/device-token', { deviceToken: token });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('⚠️ No se pudo registrar token de dispositivo:', error.response?.data?.message || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al registrar token de dispositivo'
      };
    }
  },

  // Eliminar token de dispositivo (logout)
  removeDeviceToken: async () => {
    try {
      const response = await axiosInstance.delete('/users/device-token', {
        skipTokenExpiredHandler: true
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      if (error.response?.status === 401) {
        return {
          success: true,
          data: null,
          ignoredUnauthorized: true
        };
      }
      console.error('Error al eliminar token de dispositivo:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar token de dispositivo'
      };
    }
  }
};

export default notificacionService;
