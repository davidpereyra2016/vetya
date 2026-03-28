import axiosInstance from '../config/axios';

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
      const response = await axiosInstance.get(`/prestadores/usuario/${userId}`);
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
      const response = await axiosInstance.patch(`/prestadores/${prestadorId}/precio-emergencia`, {
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
  },

  //cantidad de emergencias del prestador (veterinario)
  getCantidadEmergencias: async () => {
    try {
      const response = await axiosInstance.get('/emergencias/cantidad-emergencias');
      // Debug: ver respuesta cruda
      console.log('Respuesta cruda del backend:', response); 
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener la cantidad de emergencias:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener la cantidad de emergencias'
      };
    }
  },
};

export default prestadorService;
