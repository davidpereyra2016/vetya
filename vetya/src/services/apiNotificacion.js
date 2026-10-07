import axios from '../config/axios';

/**
 * Servicio para manejar las notificaciones en la aplicación Vetya (cliente)
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
      const response = await axios.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener notificaciones'
      };
    }
  },

  // Obtener conteo de notificaciones no leídas
  getUnreadCount: async () => {
    try {
      const response = await axios.get('/notificaciones/conteo');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener conteo',
        data: { conteo: 0 }
      };
    }
  },

  // Marcar una notificación como leída
  markAsRead: async (notificacionId) => {
    try {
      const response = await axios.patch(`/notificaciones/${notificacionId}/leer`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al marcar notificación como leída'
      };
    }
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: async () => {
    try {
      const response = await axios.patch('/notificaciones/leer-todas');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al marcar notificaciones'
      };
    }
  },

  // Eliminar una notificación
  delete: async (notificacionId) => {
    try {
      const response = await axios.delete(`/notificaciones/${notificacionId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar notificación'
      };
    }
  },

  // Registrar token de dispositivo para notificaciones push
  registerDeviceToken: async (token) => {
    try {
      const response = await axios.post('/users/device-token', { deviceToken: token });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al registrar token de dispositivo'
      };
    }
  },

  // Eliminar token de dispositivo (logout)
  removeDeviceToken: async () => {
    try {
      const response = await axios.delete('/users/device-token');
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
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar token de dispositivo'
      };
    }
  }
};

export default notificacionService;
