import axios from '../config/axios';

/**
 * Servicio para manejar todas las llamadas a la API relacionadas con disponibilidad
 * Cada función devuelve un objeto con { success, data, error }
 */

export const disponibilidadService = {
  // Obtener la disponibilidad de un prestador para un servicio específico
  getDisponibilidadServicio: async (prestadorId, servicioId) => {
    try {
      const response = await axios.get(`/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener disponibilidad'
      };
    }
  },

  // Obtener la disponibilidad general de un prestador
  getDisponibilidadPrestador: async (prestadorId) => {
    try {
      const response = await axios.get(`/disponibilidad/prestador/${prestadorId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener disponibilidad general'
      };
    }
  },

  // Configurar o actualizar la disponibilidad para un servicio específico
  getResumenDisponibilidadServicios: async (prestadorId) => {
    try {
      const response = await axios.get(`/disponibilidad/prestador/${prestadorId}/resumen-servicios`);
      return {
        success: true,
        data: response.data?.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener resumen de disponibilidad'
      };
    }
  },

  configurarDisponibilidadServicio: async (prestadorId, servicioId, disponibilidadData) => {
    try {
      
      const response = await axios.post(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}`, 
        disponibilidadData
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al configurar disponibilidad'
      };
    }
  },

  // Configurar o actualizar la disponibilidad general de un prestador
  configurarDisponibilidadGeneral: async (prestadorId, disponibilidadData) => {
    try {
      
      const response = await axios.post(
        `/disponibilidad/prestador/${prestadorId}`, 
        disponibilidadData
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al configurar disponibilidad general'
      };
    }
  },

  // Añadir fechas especiales a la disponibilidad
  agregarFechaEspecial: async (prestadorId, servicioId, fechaEspecialData) => {
    try {
      
      const response = await axios.post(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}/fecha-especial`, 
        fechaEspecialData
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al agregar fecha especial'
      };
    }
  },

  // Eliminar una fecha especial
  eliminarFechaEspecial: async (prestadorId, servicioId, fechaEspecialId) => {
    try {
      
      const response = await axios.delete(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}/fecha-especial/${fechaEspecialId}`
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar fecha especial'
      };
    }
  },

  // Verificar disponibilidad para una fecha y hora específicas
  verificarDisponibilidad: async (prestadorId, servicioId, fecha, hora) => {
    try {
      
      const response = await axios.get(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}/verificar`, 
        { params: { fecha, hora } }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al verificar disponibilidad'
      };
    }
  },

  // Obtener slots disponibles para una fecha específica
  getSlotsDisponibles: async (prestadorId, servicioId, fecha) => {
    try {
      
      const response = await axios.get(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}/slots`, 
        { params: { fecha } }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener slots disponibles'
      };
    }
  },
  
  // Actualizar disponibilidad para emergencias
  actualizarDisponibilidadEmergencias: async (prestadorId, disponibleEmergencias, precioEmergencia) => {
    try {
      
      const response = await axios.patch(
        `/prestadores/${prestadorId}/precio-emergencia`, 
        { disponibleEmergencias, precioEmergencia }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar disponibilidad de emergencias'
      };
    }
  }
};

// Ya exportamos el servicio como una exportación nombrada
