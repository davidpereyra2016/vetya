import axios from 'axios';

/**
 * Servicios para gestionar las valoraciones y reseñas de los prestadores de servicios
 */
const valoracionesService = {
  /**
   * Obtiene todas las valoraciones de un prestador de servicio
   * @param {string} prestadorId - ID del prestador
   * @returns {Promise<Object>} Resultado de la operación
   */
  getValoracionesByPrestador: async (prestadorId) => {
    try {
      const response = await axios.get(`/valoraciones/veterinario/${prestadorId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al obtener valoraciones del prestador:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener valoraciones del prestador' 
      };
    }
  },

  /**
   * Obtiene las valoraciones realizadas por el usuario autenticado
   * @returns {Promise<Object>} Resultado de la operación
   */
  getMisValoraciones: async () => {
    try {
      const response = await axios.get('/valoraciones/mis-valoraciones');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al obtener mis valoraciones:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener mis valoraciones' 
      };
    }
  },

  /**
   * Verifica si el usuario puede valorar a un prestador específico
   * @param {string} prestadorId - ID del prestador
   * @returns {Promise<Object>} Resultado con la información de si puede valorar
   */
  puedeValorar: async (prestadorId) => {
    try {
      const response = await axios.get(`/valoraciones/puede-valorar/${prestadorId}`);
      return { 
        success: true, 
        puedeValorar: response.data.puedeValorar,
        mensaje: response.data.mensaje
      };
    } catch (error) {
      console.error('Error al verificar si puede valorar:', error);
      return { 
        success: false, 
        puedeValorar: false,
        error: error.response?.data?.message || 'Error al verificar si puede valorar' 
      };
    }
  },

  /**
   * Crea una nueva valoración para un prestador de servicio
   * @param {Object} valoracionData - Datos de la valoración
   * @param {string} valoracionData.prestador - ID del prestador
   * @param {number} valoracionData.calificacion - Calificación (1-5)
   * @param {string} valoracionData.comentario - Comentario de la valoración
   * @param {string} valoracionData.mascota - ID de la mascota (opcional)
   * @param {string} valoracionData.cita - ID de la cita (opcional)
   * @param {string} valoracionData.emergencia - ID de la emergencia (opcional)
   * @param {string} valoracionData.tipoServicio - Tipo de servicio ('Consulta', 'Emergencia', 'Cita', 'Otro')
   * @returns {Promise<Object>} Resultado de la operación
   */
  crearValoracion: async (valoracionData) => {
    console.log('DEBUG - valoracionesService - Iniciando creación de valoración con datos:', valoracionData);
    try {
      if (!valoracionData.prestador || !valoracionData.calificacion) {
        console.log('DEBUG - valoracionesService - Validación fallida: falta prestador o calificación');
        return { 
          success: false, 
          error: 'El prestador y la calificación son obligatorios' 
        };
      }

      if (valoracionData.calificacion < 1 || valoracionData.calificacion > 5) {
        console.log(`DEBUG - valoracionesService - Validación fallida: calificación inválida (${valoracionData.calificacion})`);
        return { 
          success: false, 
          error: 'La calificación debe estar entre 1 y 5' 
        };
      }

      console.log('DEBUG - valoracionesService - Enviando solicitud POST a /valoraciones con payload:', valoracionData);
      const response = await axios.post('/valoraciones', valoracionData);
      console.log('DEBUG - valoracionesService - Respuesta exitosa del servidor:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('ERROR - valoracionesService - Error al crear valoración:', error);
      console.log('DEBUG - valoracionesService - Detalles de error:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        status: error.response?.status
      });
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al crear la valoración' 
      };
    }
  },

  /**
   * Actualiza una valoración existente
   * @param {string} valoracionId - ID de la valoración a actualizar
   * @param {Object} valoracionData - Datos a actualizar
   * @param {number} valoracionData.calificacion - Nueva calificación (1-5)
   * @param {string} valoracionData.comentario - Nuevo comentario
   * @returns {Promise<Object>} Resultado de la operación
   */
  actualizarValoracion: async (valoracionId, valoracionData) => {
    try {
      if (!valoracionId) {
        return { success: false, error: 'ID de valoración no válido' };
      }

      if (valoracionData.calificacion < 1 || valoracionData.calificacion > 5) {
        return { 
          success: false, 
          error: 'La calificación debe estar entre 1 y 5' 
        };
      }

      const response = await axios.put(`/valoraciones/${valoracionId}`, valoracionData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al actualizar valoración:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al actualizar la valoración' 
      };
    }
  },

  /**
   * Elimina una valoración existente
   * @param {string} valoracionId - ID de la valoración a eliminar
   * @returns {Promise<Object>} Resultado de la operación
   */
  eliminarValoracion: async (valoracionId) => {
    try {
      if (!valoracionId) {
        return { success: false, error: 'ID de valoración no válido' };
      }

      const response = await axios.delete(`/valoraciones/${valoracionId}`);
      return { success: true, mensaje: 'Valoración eliminada con éxito' };
    } catch (error) {
      console.error('Error al eliminar valoración:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al eliminar la valoración' 
      };
    }
  },

  /**
   * Reporta una valoración como inadecuada
   * @param {string} valoracionId - ID de la valoración a reportar
   * @returns {Promise<Object>} Resultado de la operación
   */
  reportarValoracion: async (valoracionId) => {
    try {
      if (!valoracionId) {
        return { success: false, error: 'ID de valoración no válido' };
      }

      const response = await axios.patch(`/valoraciones/${valoracionId}/reportar`);
      return { success: true, mensaje: 'Valoración reportada con éxito' };
    } catch (error) {
      console.error('Error al reportar valoración:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al reportar la valoración' 
      };
    }
  },

  /**
   * Obtiene estadísticas de valoraciones de un prestador de servicio
   * @param {string} prestadorId - ID del prestador
   * @returns {Promise<Object>} Resultado con las estadísticas
   */
  getEstadisticasPrestador: async (prestadorId) => {
    try {
      // Obtenemos todas las valoraciones del prestador
      const response = await valoracionesService.getValoracionesByPrestador(prestadorId);
      
      if (!response.success) {
        return response;
      }
      
      const valoraciones = response.data;
      
      // Si no hay valoraciones, devolvemos estadísticas vacías
      if (!valoraciones || valoraciones.length === 0) {
        return { 
          success: true, 
          data: {
            promedio: 0,
            total: 0,
            distribucion: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
          }
        };
      }
      
      // Calculamos estadísticas
      let suma = 0;
      const distribucion = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
      
      valoraciones.forEach(val => {
        suma += val.calificacion;
        distribucion[val.calificacion] = (distribucion[val.calificacion] || 0) + 1;
      });
      
      const promedio = suma / valoraciones.length;
      
      return { 
        success: true, 
        data: {
          promedio: parseFloat(promedio.toFixed(1)),
          total: valoraciones.length,
          distribucion
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del prestador:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener estadísticas del prestador' 
      };
    }
  }
};

export default valoracionesService;
