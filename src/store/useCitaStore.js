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
    error: null
  })
}));

export default useCitaStore;
