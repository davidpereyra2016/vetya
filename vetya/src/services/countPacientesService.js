import axios from '../config/axios';

/**
 * Servicios para obtener estadísticas de pacientes atendidos por prestadores de servicios
 */
const countPacientesService = {
  /**
   * Obtiene el conteo de pacientes únicos atendidos por un prestador
   * @param {string} prestadorId - ID del prestador
   * @returns {Promise<Object>} Resultado de la operación con el total de pacientes
   */
  getTotalPacientes: async (prestadorId) => {
    try {
      const response = await axios.get(`/pacientes/prestador/${prestadorId}`);
      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener el conteo de pacientes atendidos' 
      };
    }
  }
};

export default countPacientesService;
