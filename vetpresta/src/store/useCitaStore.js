import { create } from 'zustand';
import citaService from '../services/citaService';

/**
 * Store para gestionar el estado de las citas y prestadores usando Zustand
 */
const useCitaStore = create((set, get) => ({
  // Estado inicial
  availableDates: [],
  availableTimes: [],
  availableVets: [],
  availableServices: [],
  userAppointments: [],
  providerTypes: [],
  selectedProviderType: null,
  providersByType: [],
  selectedProvider: null,
  isLoading: false,
  error: null,
  
  // Estado para citas del prestador
  providerCitas: {
    pendientes: [],
    confirmadas: [],
    completadas: [],
    canceladas: []
  },
  dashboardSummary: null,

  // Obtener todas las fechas disponibles
  fetchAvailableDates: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getAvailableDates();
      if (result.success) {
        set({ availableDates: result.data, isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener fechas disponibles';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Obtener todos los horarios disponibles para una fecha
  fetchAvailableTimes: async (dateId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getAvailableTimes(dateId);
      if (result.success) {
        set({ availableTimes: result.data, isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener horarios disponibles';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Obtener todos los veterinarios disponibles
  fetchAvailableVets: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getAvailableVets();
      if (result.success) {
        set({ availableVets: result.data, isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener veterinarios disponibles';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Obtener todos los servicios disponibles
  fetchAvailableServices: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getAvailableServices();
      if (result.success) {
        set({ availableServices: result.data, isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener servicios disponibles';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Crear una nueva cita
  createAppointment: async (appointmentData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.createAppointment(appointmentData);
      if (result.success) {
        // Actualizar la lista de citas del usuario
        set(state => ({
          userAppointments: [...state.userAppointments, result.data],
          isLoading: false
        }));
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al crear la cita';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Limpiar errores
  clearErrors: () => set({ error: null }),

  // Obtener todos los tipos de prestadores disponibles
  fetchProviderTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getProviderTypes();
      if (result.success) {
        set({ providerTypes: result.data, isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener tipos de prestadores';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Establecer el tipo de prestador seleccionado
  setSelectedProviderType: (providerType) => {
    set({ 
      selectedProviderType: providerType,
      providersByType: [],
      selectedProvider: null
    });
    return { success: true };
  },

  // Obtener prestadores por tipo
  fetchProvidersByType: async (typeId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getProvidersByType(typeId);
      if (result.success) {
        set({ providersByType: result.data, isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener prestadores por tipo';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Establecer el prestador seleccionado
  setSelectedProvider: (provider) => {
    set({ selectedProvider: provider });
    return { success: true };
  },

  // Reset del estado de citas
  resetCitaState: () => set({
    availableDates: [],
    availableTimes: [],
    availableVets: [],
    availableServices: [],
    providerTypes: [],
    selectedProviderType: null,
    providersByType: [],
    selectedProvider: null,
    isLoading: false,
    error: null,
    providerCitas: {
      pendientes: [],
      confirmadas: [],
      completadas: [],
      canceladas: []
    },
    dashboardSummary: null
  }),
  
  /**
   * Obtiene las citas de un prestador filtradas por estado
   * @param {string} prestadorId - ID del prestador
   * @param {string} estado - Estado de las citas (Pendiente, Confirmada, Completada, Cancelada)
   * @returns {Promise<Object>} - Resultado de la operación
   */
  fetchProviderCitas: async (prestadorId, estado) => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getCitasByProvider(prestadorId, estado);
      
      if (result.success) {
        // Actualizar el estado correspondiente
        if (estado) {
          // Para actualizaciones de una sola categoría, usa el objeto completo
          set(state => {
            const updatedProviderCitas = {...state.providerCitas};
            
            // Mapear el estado a la propiedad correspondiente
            let estadoKey;
            switch(estado) {
              case 'Pendiente':
                estadoKey = 'pendientes';
                break;
              case 'Confirmada':
                estadoKey = 'confirmadas';
                break;
              case 'Completada':
                estadoKey = 'completadas';
                break;
              case 'Cancelada':
                estadoKey = 'canceladas';
                break;
              default:
                estadoKey = estado.toLowerCase() + 's';
            }
            updatedProviderCitas[estadoKey] = result.data;
            
            return { 
              providerCitas: updatedProviderCitas,
              isLoading: false 
            };
          });
        } else {
          // Si no hay estado, organizar las citas por estado
          const citasPorEstado = {
            pendientes: result.data.filter(c => c.estado === 'Pendiente'),
            confirmadas: result.data.filter(c => c.estado === 'Confirmada'),
            completadas: result.data.filter(c => c.estado === 'Completada'),
            canceladas: result.data.filter(c => c.estado === 'Cancelada')
          };
          
          set({ 
            providerCitas: citasPorEstado, 
            isLoading: false 
          });
        }
        
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Actualiza el estado de una cita (Confirmar, Completar, Cancelar)
   * @param {string} prestadorId - ID del prestador
   * @param {string} citaId - ID de la cita
   * @param {string} estado - Nuevo estado (Confirmada, Completada, Cancelada)
   * @returns {Promise<Object>} - Resultado de la operación
   */
  updateCitaStatus: async (prestadorId, citaId, estado) => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.updateCitaStatus(prestadorId, citaId, estado);
      if (result.success) {
        // Actualizar el estado local (eliminar de TODAS las listas y agregar a la nueva)
        set(state => {
          const updatedProviderCitas = {...state.providerCitas};
          let citaToMove = null;
          
          // Buscar la cita en TODAS las listas (no depender de estadoAnterior)
          // Primero buscar en pendientes
          citaToMove = updatedProviderCitas.pendientes.find(c => c._id === citaId);
          if (citaToMove) {
            updatedProviderCitas.pendientes = updatedProviderCitas.pendientes.filter(c => c._id !== citaId);
          }
          
          // Si no está en pendientes, buscar en confirmadas
          if (!citaToMove) {
            citaToMove = updatedProviderCitas.confirmadas.find(c => c._id === citaId);
            if (citaToMove) {
              updatedProviderCitas.confirmadas = updatedProviderCitas.confirmadas.filter(c => c._id !== citaId);
            }
          }
          
          // Si no está en confirmadas, buscar en completadas (por si acaso)
          if (!citaToMove) {
            citaToMove = updatedProviderCitas.completadas.find(c => c._id === citaId);
            if (citaToMove) {
              updatedProviderCitas.completadas = updatedProviderCitas.completadas.filter(c => c._id !== citaId);
            }
          }
          
          // Si no está en completadas, buscar en canceladas (por si acaso)
          if (!citaToMove) {
            citaToMove = updatedProviderCitas.canceladas.find(c => c._id === citaId);
            if (citaToMove) {
              updatedProviderCitas.canceladas = updatedProviderCitas.canceladas.filter(c => c._id !== citaId);
            }
          }
          
          // Si encontramos la cita, la añadimos a la nueva lista con su estado actualizado
          if (citaToMove) {
            const updatedCita = {...citaToMove, estado};
            
            // Añadir a la lista correspondiente según el nuevo estado
            switch (estado) {
              case 'Confirmada':
                updatedProviderCitas.confirmadas = [...updatedProviderCitas.confirmadas, updatedCita];
                break;
              case 'Completada':
                updatedProviderCitas.completadas = [...updatedProviderCitas.completadas, updatedCita];
                break;
              case 'Cancelada':
                updatedProviderCitas.canceladas = [...updatedProviderCitas.canceladas, updatedCita];
                break;
              default:
                break;
            }
          }
          
          return {
            providerCitas: updatedProviderCitas,
            isLoading: false
          };
        });
        
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al actualizar estado de cita';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  /**
   * Obtiene resumen de citas para el dashboard del prestador
   * @param {string} prestadorId - ID del prestador
   * @returns {Promise<Object>} - Resultado de la operación
   */
  fetchDashboardSummary: async (prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getDashboardSummary(prestadorId);
      if (result.success) {
        set({ dashboardSummary: result.data, isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener resumen del dashboard';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }
}));

export default useCitaStore;
