import axios from 'axios';

/**
 * Servicio para manejar todas las llamadas a la API relacionadas con servicios
 * Cada función devuelve un objeto con { success, data, error }
 */

export const servicioService = {
  // Obtener todos los servicios disponibles
  getAll: async () => {
    try {
      const response = await axios.get('/servicios');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios'
      };
    }
  },
  
  // Obtener servicios predefinidos del catálogo por tipo de prestador
  getCatalogServices: async (tipoPrestador) => {
    try {
      console.log(`Obteniendo catálogo de servicios para tipo:`, tipoPrestador);
      const response = await axios.get(`/catalogo/servicios/${tipoPrestador}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener catálogo de servicios:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener catálogo de servicios'
      };
    }
  },
  
  // Obtener servicios de un prestador específico
  getProviderServices: async (prestadorId) => {
    try {
      console.log(`Obteniendo servicios del prestador ID:`, prestadorId);
      const response = await axios.get(`/prestadores/${prestadorId}/servicios`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener servicios del prestador:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios del prestador'
      };
    }
  },
  
  // Obtener servicios disponibles por tipo de prestador
  getByProviderType: async (tipoPrestador) => {
    try {
      console.log(`Obteniendo servicios disponibles para tipo:`, tipoPrestador);
      const response = await axios.get(`/catalogo/servicios/${tipoPrestador}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener servicios disponibles:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios disponibles'
      };
    }
  },
  
  // Añadir un servicio del catálogo al prestador
  addServiceFromCatalog: async (prestadorId, servicioId, datos) => {
    try {
      console.log(`Añadiendo servicio ${servicioId} al prestador ${prestadorId}`);
      const response = await axios.post(`/prestadores/${prestadorId}/servicios`, {
        servicioId,
        ...datos
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al añadir servicio:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al añadir servicio'
      };
    }
  },
  
  // Método que utiliza el store para añadir servicios (alias para compatibilidad)
  addToProvider: async (prestadorId, serviceData) => {
    try {
      console.log(`Añadiendo servicio al prestador ${prestadorId}:`, serviceData);
      const response = await axios.post(`/prestadores/${prestadorId}/servicios`, serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al añadir servicio:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al añadir servicio'
      };
    }
  },
  
  // Obtener un servicio por ID
  getById: async (id) => {
    try {
      const response = await axios.get(`/servicios/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicio'
      };
    }
  },

  // Crear un nuevo servicio personalizado
  create: async (prestadorId, serviceData) => {
    try {
      const response = await axios.post(`/prestadores/${prestadorId}/servicios`, serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear servicio'
      };
    }
  },

  // Actualizar un servicio
  update: async (prestadorId, servicioId, serviceData) => {
    try {
      const response = await axios.put(`/prestadores/${prestadorId}/servicios/${servicioId}`, serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar servicio'
      };
    }
  },
  
  // Actualizar servicio del prestador (alias para compatibilidad con el store)
  updateProviderService: async (prestadorId, servicioId, serviceData) => {
    try {
      console.log(`Actualizando servicio ${servicioId} del prestador ${prestadorId}:`, serviceData);
      const response = await axios.put(`/prestadores/${prestadorId}/servicios/${servicioId}`, serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al actualizar servicio:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar servicio'
      };
    }
  },

  // Eliminar un servicio
  delete: async (prestadorId, servicioId) => {
    try {
      const response = await axios.delete(`/prestadores/${prestadorId}/servicios/${servicioId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar servicio'
      };
    }
  },
  
  // Activar/desactivar un servicio
  toggleActive: async (prestadorId, servicioId, isActive) => {
    try {
      const response = await axios.patch(`/prestadores/${prestadorId}/servicios/${servicioId}/estado`, {
        activo: isActive
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al cambiar estado del servicio'
      };
    }
  }
};

// Ya exportamos el servicio como una exportación nombrada
