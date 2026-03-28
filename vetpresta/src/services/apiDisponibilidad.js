import axios from '../config/axios';

/**
 * Servicio para manejar todas las llamadas a la API relacionadas con disponibilidad
 * Cada función devuelve un objeto con { success, data, error }
 */

export const disponibilidadService = {
  // Obtener la disponibilidad de un prestador para un servicio específico
  getDisponibilidadServicio: async (prestadorId, servicioId) => {
    try {
      console.log(`Obteniendo disponibilidad para prestador ID: ${prestadorId}, servicio ID: ${servicioId}`);
      const response = await axios.get(`/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener disponibilidad:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener disponibilidad'
      };
    }
  },

  // Obtener la disponibilidad general de un prestador
  getDisponibilidadPrestador: async (prestadorId) => {
    try {
      console.log(`Obteniendo disponibilidad general para prestador ID: ${prestadorId}`);
      const response = await axios.get(`/disponibilidad/prestador/${prestadorId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener disponibilidad general:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener disponibilidad general'
      };
    }
  },

  // Configurar o actualizar la disponibilidad para un servicio específico
  configurarDisponibilidadServicio: async (prestadorId, servicioId, disponibilidadData) => {
    try {
      console.log(`Configurando disponibilidad para prestador ID: ${prestadorId}, servicio ID: ${servicioId}`);
      console.log('Datos de disponibilidad:', disponibilidadData);
      
      const response = await axios.post(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}`, 
        disponibilidadData
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al configurar disponibilidad:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al configurar disponibilidad'
      };
    }
  },

  // Configurar o actualizar la disponibilidad general de un prestador
  configurarDisponibilidadGeneral: async (prestadorId, disponibilidadData) => {
    try {
      console.log(`Configurando disponibilidad general para prestador ID: ${prestadorId}`);
      console.log('Datos de disponibilidad general:', disponibilidadData);
      
      const response = await axios.post(
        `/disponibilidad/prestador/${prestadorId}`, 
        disponibilidadData
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al configurar disponibilidad general:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al configurar disponibilidad general'
      };
    }
  },

  // Añadir fechas especiales a la disponibilidad
  agregarFechaEspecial: async (prestadorId, servicioId, fechaEspecialData) => {
    try {
      console.log(`Agregando fecha especial para prestador ID: ${prestadorId}, servicio ID: ${servicioId}`);
      console.log('Datos de fecha especial:', fechaEspecialData);
      
      const response = await axios.post(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}/fecha-especial`, 
        fechaEspecialData
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al agregar fecha especial:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al agregar fecha especial'
      };
    }
  },

  // Eliminar una fecha especial
  eliminarFechaEspecial: async (prestadorId, servicioId, fechaEspecialId) => {
    try {
      console.log(`Eliminando fecha especial ID: ${fechaEspecialId}`);
      
      const response = await axios.delete(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}/fecha-especial/${fechaEspecialId}`
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al eliminar fecha especial:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar fecha especial'
      };
    }
  },

  // Verificar disponibilidad para una fecha y hora específicas
  verificarDisponibilidad: async (prestadorId, servicioId, fecha, hora) => {
    try {
      console.log(`Verificando disponibilidad para prestador ID: ${prestadorId}, servicio ID: ${servicioId}`);
      console.log(`Fecha: ${fecha}, Hora: ${hora}`);
      
      const response = await axios.get(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}/verificar`, 
        { params: { fecha, hora } }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al verificar disponibilidad:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al verificar disponibilidad'
      };
    }
  },

  // Obtener slots disponibles para una fecha específica
  getSlotsDisponibles: async (prestadorId, servicioId, fecha) => {
    try {
      console.log(`Obteniendo slots disponibles para prestador ID: ${prestadorId}, servicio ID: ${servicioId}, fecha: ${fecha}`);
      
      const response = await axios.get(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}/slots`, 
        { params: { fecha } }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener slots disponibles:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener slots disponibles'
      };
    }
  },
  
  // Actualizar disponibilidad para emergencias
  actualizarDisponibilidadEmergencias: async (prestadorId, disponibleEmergencias, precioEmergencia) => {
    try {
      console.log(`Actualizando disponibilidad de emergencias para prestador ID: ${prestadorId}`);
      console.log(`Disponible: ${disponibleEmergencias}, Precio: ${precioEmergencia}`);
      
      const response = await axios.patch(
        `/prestadores/${prestadorId}/precio-emergencia`, 
        { disponibleEmergencias, precioEmergencia }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al actualizar disponibilidad de emergencias:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar disponibilidad de emergencias'
      };
    }
  }
};

// Ya exportamos el servicio como una exportación nombrada
