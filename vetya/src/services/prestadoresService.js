// prestadoresService.js - Servicio para comunicación con API de prestadores
import axios from '../config/axios';

/**
 * Obtiene lista de todos los prestadores (de cualquier tipo)
 * @param {Object} params - Parámetros opcionales de filtrado
 * @returns {Promise<Array>} Lista de prestadores
 */
export const getAllPrestadores = async (params = {}) => {
  try {
    const response = await axios.get('/prestadores', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener prestadores:', error);
    throw error;
  }
};

/**
 * Obtiene prestadores destacados (de cualquier tipo)
 * @param {number} limit - Límite de prestadores a obtener
 * @returns {Promise<Array>} Lista de prestadores destacados
 */
export const getFeaturedPrestadores = async (limit = 4) => {
  try {
    const response = await axios.get('/prestadores', { 
      params: { 
        destacado: true,
        limit
      } 
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener prestadores destacados:', error);
    throw error;
  }
};

/**
 * Obtiene un prestador por su ID
 * @param {string} id - ID del prestador
 * @returns {Promise<Object>} Datos del prestador
 */
export const getPrestadorById = async (id) => {
  try {
    const response = await axios.get(`/prestadores/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener prestador con ID ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene prestadores cercanos según ubicación
 * @param {Object} coords - Coordenadas {latitude, longitude}
 * @param {number} radius - Radio de búsqueda en km
 * @returns {Promise<Array>} Lista de prestadores cercanos
 */
export const getNearbyPrestadores = async (coords, radius = 10) => {
  try {
    const response = await axios.get('/prestadores/cercanos', {
      params: {
        lat: coords.latitude,
        lng: coords.longitude,
        radio: radius
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener prestadores cercanos:', error);
    throw error;
  }
};

/**
 * Obtiene todos los veterinarios (prestadores de tipo 'Veterinario')
 * @returns {Promise<Array>} Lista de veterinarios
 */
export const getAllVeterinarios = async () => {
  try {
    const response = await axios.get('/prestadores', {
      params: {
        tipo: 'Veterinario'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener veterinarios:', error);
    throw error;
  }
};

/**
 * Obtiene todos los centros veterinarios (prestadores de tipo 'Centro Veterinario')
 * @returns {Promise<Array>} Lista de centros veterinarios
 */
export const getAllCentrosVeterinarios = async () => {
  try {
    const response = await axios.get('/prestadores', {
      params: {
        tipo: 'Centro Veterinario'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener centros veterinarios:', error);
    throw error;
  }
};

/**
 * Obtiene valoraciones y estadísticas de un prestador
 * @param {string} id - ID del prestador
 * @returns {Promise<Object>} Estadísticas del prestador
 */
export const getPrestadorStats = async (id) => {
  try {
    const response = await axios.get(`/prestadores/${id}/stats`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener estadísticas del prestador ${id}:`, error);
    throw error;
  }
};

export default {
  getAllPrestadores,
  getFeaturedPrestadores,
  getPrestadorById,
  getNearbyPrestadores,
  getAllVeterinarios,
  getAllCentrosVeterinarios,
  getPrestadorStats
};
