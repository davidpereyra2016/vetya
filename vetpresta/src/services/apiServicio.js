import axios from '../config/axios';

/**
 * Servicio para manejar todas las llamadas a la API relacionadas con servicios
 * Cada función devuelve un objeto con { success, data, error }
 * IMPORTANTE: Usa la instancia configurada de axios que incluye automáticamente
 * el token de autenticación en todas las peticiones
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
      const response = await axios.get(`/catalogo/servicios/${tipoPrestador}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener catálogo de servicios'
      };
    }
  },
  
  // Obtener todos los servicios de un prestador específico (activos e inactivos)
  getProviderServices: async (prestadorId) => {
    try {
      const response = await axios.get(`/prestadores/${prestadorId}/servicios`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios del prestador'
      };
    }
  },
  
  // Obtener servicios activos de un prestador específico
  getActiveProviderServices: async (prestadorId) => {
    try {
      const response = await axios.get(`/prestadores/${prestadorId}/servicios/activo`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios activos del prestador'
      };
    }
  },
  
  // Obtener servicios inactivos de un prestador específico
  getInactiveProviderServices: async (prestadorId) => {
    try {
      const response = await axios.get(`/prestadores/${prestadorId}/servicios/desactivado`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios inactivos del prestador'
      };
    }
  },
  
  // Obtener servicios disponibles por tipo de prestador
  getByProviderType: async (tipoPrestador) => {
    try {
      const response = await axios.get(`/catalogo/servicios/${tipoPrestador}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios disponibles'
      };
    }
  },
  
  // Añadir un servicio del catálogo al prestador
  addServiceFromCatalog: async (prestadorId, servicioId, datos) => {
    try {
      const response = await axios.post(`/prestadores/${prestadorId}/servicios`, {
        servicioId,
        ...datos
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al añadir servicio'
      };
    }
  },
  
  // Método que utiliza el store para añadir servicios (alias para compatibilidad)
  addToProvider: async (prestadorId, serviceData) => {
    try {
      const response = await axios.post(`/prestadores/${prestadorId}/servicios`, serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
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
