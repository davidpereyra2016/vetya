import axios from 'axios';
// import { API_URL } from '../config';

/**
 * Servicio para gestionar las consultas generales con prestadores de servicios
 */
const consultaGeneralService = {
  /**
   * Obtiene todos los prestadores que ofrecen servicio de consulta general
   * @returns {Promise<Array>} Lista de prestadores que ofrecen consulta general
   */
  getPrestadoresConsultaGeneral: async () => {
    try {
      const response = await axios.get(`/citas/prestadores/consulta-general`);
      return response.data; // Devuelve directamente los datos
    } catch (error) {
      console.error('Error al obtener prestadores:', error);
      throw error; // Lanza el error para que lo capture el store
    }
  },

  /**
   * Obtiene la disponibilidad de un prestador para consulta general
   * @param {string} prestadorId ID del prestador
   * @returns {Promise<Array>} Lista de fechas y horarios disponibles
   */
  getDisponibilidadPrestador: async (prestadorId) => {
    try {
      const response = await axios.get(`/citas/prestadores/${prestadorId}/disponibilidad`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener disponibilidad:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva consulta general
   * @param {Object} consultaData Datos de la consulta general
   * @returns {Promise<Object>} Resultado de la operación
   */
  crearConsultaGeneral: async (consultaData) => {
    try {
      const response = await axios.post(`/citas`, consultaData);
      return response.data;
    } catch (error) {
      console.error('Error al crear consulta:', error);
      throw error;
    }
  }
};

export default consultaGeneralService;
