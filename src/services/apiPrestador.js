import axios from './api';

/**
 * Servicio para manejar las operaciones relacionadas con prestadores
 */
const prestadorService = {
  /**
   * Obtener información del prestador a través del ID de usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Datos del prestador o error
   */
  getByUserId: async (userId) => {
    try {
      const response = await axios.get(`/prestadores/usuario/${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener prestador:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener información del prestador'
      };
    }
  },

  /**
   * Actualizar el precio de emergencia del prestador
   * @param {string} prestadorId - ID del prestador
   * @param {number} precioEmergencia - Precio del servicio de emergencia
   * @param {boolean} disponibleEmergencias - Si el prestador está disponible para emergencias
   * @returns {Promise<Object>} Resultado de la operación
   */
  actualizarPrecioEmergencia: async (prestadorId, precioEmergencia, disponibleEmergencias) => {
    try {
      const response = await axios.patch(`/prestadores/${prestadorId}/precio-emergencia`, {
        precioEmergencia,
        disponibleEmergencias
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al actualizar precio emergencia:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar precio de emergencia'
      };
    }
  }
};

export default prestadorService;
