import logger from '../utils/logger';
import axios from '../config/axios';

/**
 * Servicio para manejar las valoraciones de prestadores
 * Sigue el patrón de citaService.js
 */
const valoracionService = {
  /**
   * Obtener todas las valoraciones de un prestador
   * @param {string} prestadorId - ID del prestador
   * @returns {Promise<Object>} Resultado de la operación
   */
  getValoracionesPrestador: async (prestadorId) => {
    try {
      const response = await axios.get(`/valoraciones/prestador/${prestadorId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('❌ Error al obtener valoraciones:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener valoraciones'
      };
    }
  },

  /**
   * Crear una nueva valoración
   * @param {Object} valoracionData - Datos de la valoración
   * @returns {Promise<Object>} Resultado de la operación
   */
  crearValoracion: async (valoracionData) => {
    try {
      const response = await axios.post('/valoraciones', valoracionData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('❌ Error al crear valoración:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear valoración'
      };
    }
  },

  /**
   * Verificar si el usuario puede valorar a un prestador
   * @param {string} prestadorId - ID del prestador
   * @returns {Promise<Object>} Resultado de la operación
   */
  puedeValorar: async (prestadorId) => {
    try {
      const response = await axios.get(`/valoraciones/puede-valorar/${prestadorId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('❌ Error al verificar si puede valorar:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al verificar si puede valorar'
      };
    }
  },

  /**
   * Obtener las valoraciones hechas por el usuario autenticado
   * @returns {Promise<Object>} Resultado de la operación
   */
  getMisValoraciones: async () => {
    try {
      const response = await axios.get('/valoraciones/mis-valoraciones');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('❌ Error al obtener mis valoraciones:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener mis valoraciones'
      };
    }
  }
};

export default valoracionService;
