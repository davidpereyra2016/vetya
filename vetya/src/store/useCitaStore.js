import { create } from 'zustand';
import citaService from '../services/citaService';
import consultaGeneralService from '../services/consultaGeneralService'; // Import the service

/**
 * Store para gestionar el estado de las citas y prestadores usando Zustand
 */
const useCitaStore = create((set, get) => ({
  // Estado inicial
  disponibilidadPrestador: [], // Nuevo estado para almacenar disponibilidad del prestador
  availableDates: [],
  availableTimes: [],
  availableVets: [],
  availableServices: [],
  userAppointments: [],
  providerTypes: [],
  selectedProviderType: null,
  providersByType: [],
  selectedProvider: null,
  consultaGeneralProviders: [], // New state for providers offering general consultation
  isLoading: false,
  error: null,
  providerAvailability: [],

  // --- NUEVO ESTADO PARA CITAS ---
  upcomingAppointments: [],
  pastAppointments: [],

  /**
   * Obtiene todas las citas del usuario desde el backend y las clasifica.
   */
  fetchUserAppointments: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getUserAppointments();
      if (result.success) {
        const now = new Date();
        const upcoming = [];
        const past = [];

        result.data.forEach(cita => {
          // Clasifica como "próxima" si está pendiente o confirmada.
          if (cita.estado === 'Pendiente' || cita.estado === 'Confirmada') {
            upcoming.push(cita);
          } else {
            // El resto ('Completada', 'Cancelada') va al historial.
            past.push(cita);
          }
        });

        // Ordenar citas próximas por fecha ascendente
        upcoming.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        // Ordenar historial por fecha descendente
        past.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        set({
          upcomingAppointments: upcoming,
          pastAppointments: past,
          isLoading: false,
        });
        return { success: true };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener las citas del usuario';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Obtener prestadores de consulta general
  fetchConsultaGeneralProviders: async () => {
    set({ isLoading: true });
    const result = await citaService.getConsultaGeneralProviders();
    if (result.success) {
      set({ consultaGeneralProviders: result.data, isLoading: false });
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },
  // Obtener disponibilidad de un prestador
  fetchProviderAvailability: async (prestadorId, servicioId) => {
    set({ isLoading: true });
    const result = await citaService.getProviderAvailability(prestadorId, servicioId);
    if (result.success) {
      set({ providerAvailability: result.data, isLoading: false });
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },
  
  // Obtener horarios disponibles para una fecha, prestador y servicio específicos
  getAvailableTimeSlots: async (date, prestadorId, servicioId) => {
    set({ isLoading: true });
    const result = await citaService.getAvailableTimeSlots(date, prestadorId, servicioId);
    if (result.success) {
      set({ availableTimes: result.data, isLoading: false });
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },
  // Verificar slot específico
  verifySlotAvailability: async (prestadorId, servicioId, fecha, horaInicio) => {
    set({ isLoading: true });
    const result = await citaService.verifySlotAvailability(
      prestadorId,
      servicioId,
      fecha,
      horaInicio
    );
    set({ isLoading: false });
    return result;
  },

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
  fetchAvailableTimes: async (date, providerId, serviceId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getAvailableTimeSlots(date, providerId, serviceId);
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

  // Obtener todos los veterinarios
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

  // Obtener todos los servicios
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

  
  // Crear cita (actualizado)
  createAppointment: async (appointmentData) => {
    set({ isLoading: true });
    const result = await citaService.createAppointment(appointmentData);
    if (result.success) {
      set(state => ({
        userAppointments: [...state.userAppointments, result.data],
        isLoading: false
      }));
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },

  // Limpiar errores
  clearErrors: () => set({ error: null }),

  // Obtener todos los tipos de prestadores
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
  
  // Obtener servicios de un prestador específico
  getProviderServices: async (prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await citaService.getProviderServices(prestadorId);
      if (result.success) {
        set({ availableServices: result.data, isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener servicios del prestador';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  /**
   * Actualiza el estado de una cita específica.
   * @param {string} appointmentId - El ID de la cita a actualizar.
   * @param {string} newStatus - El nuevo estado ('Cancelada', 'Completada', etc.).
   */
  updateAppointmentStatus: async (appointmentId, newStatus) => {
    set({ isLoading: true });
    const result = await citaService.updateAppointmentStatus(appointmentId, newStatus);
    if (result.success) {
      // Refrescar la lista de citas para reflejar el cambio.
      await get().fetchUserAppointments();
      return { success: true, data: result.data };
    } else {
      set({ isLoading: false, error: result.error });
      return { success: false, error: result.error };
    }
  },

  reprogramAppointment: async (appointmentId, appointmentData) => {
    set({ isLoading: true, error: null });
    const result = await citaService.reprogramAppointment(appointmentId, appointmentData);
    if (result.success) {
      await get().fetchUserAppointments();
      return { success: true, data: result.data };
    }

    set({ isLoading: false, error: result.error });
    return { success: false, error: result.error };
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
    consultaGeneralProviders: [], 
    isLoading: false,
    error: null,
    upcomingAppointments: [], // También limpiar las citas
    pastAppointments: [],
  })
}));

export default useCitaStore;
