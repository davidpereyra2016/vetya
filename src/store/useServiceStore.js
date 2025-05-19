import { create } from 'zustand';
import { servicioService } from '../services/apiServicio';

// Store para manejar el estado de los servicios que ofrece el prestador
const useServiceStore = create((set, get) => ({
  // Estado inicial
  services: [],
  availableServices: [], // Servicios disponibles para agregar
  isLoading: false,
  error: null,
  
  // Obtener todos los servicios del prestador actual
  getProviderServices: async (providerId) => {
    if (!providerId) {
      console.log('No se proporcionó ID del prestador');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      console.log('Obteniendo servicios para el prestador:', providerId);
      const result = await servicioService.getProviderServices(providerId);
      
      if (result.success) {
        console.log('Servicios obtenidos correctamente:', result.data.length);
        set({ 
          services: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error obteniendo servicios:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Excepción obteniendo servicios:', error);
      set({ 
        error: "Error al obtener servicios del prestador",
        isLoading: false
      });
      return null;
    }
  },
  
  // Obtener servicios disponibles para agregar del catálogo
  getAvailableServices: async (providerType) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Obteniendo catálogo para tipo de prestador:', providerType);
      const result = await servicioService.getCatalogServices(providerType);
      
      if (result.success) {
        console.log('Catálogo obtenido correctamente:', result.data.length, 'servicios');
        set({ 
          availableServices: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error obteniendo catálogo:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Excepción obteniendo catálogo:', error);
      set({ 
        error: "Error al obtener servicios disponibles",
        isLoading: false
      });
      return null;
    }
  },
  
  // Agregar un servicio al prestador
  addServiceToProvider: async (providerId, serviceData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await servicioService.addToProvider(providerId, serviceData);
      
      if (result.success) {
        // Actualizar la lista de servicios
        const services = get().services;
        set({ 
          services: [...services, result.data],
          isLoading: false
        });
        return result.data;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({ 
        error: "Error al agregar servicio al prestador",
        isLoading: false
      });
      return null;
    }
  },
  
  // Actualizar un servicio del prestador
  updateProviderService: async (providerId, serviceId, serviceData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await servicioService.updateProviderService(providerId, serviceId, serviceData);
      
      if (result.success) {
        // Actualizar el servicio en la lista
        const services = get().services.map(service => 
          service.id === serviceId ? result.data : service
        );
        
        set({ 
          services,
          isLoading: false
        });
        return result.data;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({ 
        error: "Error al actualizar servicio",
        isLoading: false
      });
      return null;
    }
  },
  
  // Eliminar un servicio del prestador
  removeProviderService: async (providerId, serviceId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await servicioService.removeFromProvider(providerId, serviceId);
      
      if (result.success) {
        // Filtrar el servicio eliminado de la lista
        const services = get().services.filter(service => service.id !== serviceId);
        
        set({ 
          services,
          isLoading: false
        });
        return true;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      set({ 
        error: "Error al eliminar servicio",
        isLoading: false
      });
      return false;
    }
  },
  
  // Actualizar disponibilidad de un servicio
  updateServiceAvailability: async (providerId, serviceId, availabilityData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await servicioService.updateAvailability(providerId, serviceId, availabilityData);
      
      if (result.success) {
        set({ isLoading: false });
        return result.data;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({ 
        error: "Error al actualizar disponibilidad",
        isLoading: false
      });
      return null;
    }
  },
  
  // Limpiar errores
  clearError: () => set({ error: null })
}));

export default useServiceStore;
