import { create } from 'zustand';
import { emergenciaService } from '../services/api';
import logger from '../utils/logger';

const getEmergencyId = (emergency) => emergency?._id || emergency?.id;

/**
 * Store para gestionar el estado de las emergencias para prestadores veterinarios
 * Solo los prestadores de tipo 'Veterinario' pueden ver y gestionar emergencias
 */
const useEmergencyStore = create((set, get) => ({
  // Estado inicial
  emergencies: [],
  emergencias: [],
  activeEmergencies: [],
  currentEmergency: null,
  emergenciaActual: null,
  availableForEmergencies: false,
  isLoading: false,
  error: null,

  setEmergencias: (emergencias = []) => set({
    emergencias,
    emergencies: emergencias,
    availableForEmergencies: false
  }),

  // Obtener todas las solicitudes de emergencia asignadas al veterinario
  fetchEmergencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await emergenciaService.getVeterinarianEmergencies();
      if (response.success) {
        set({
          emergencies: response.data,
          emergencias: response.data,
          isLoading: false
        });
        return { success: true, data: response.data };
      } else {
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al obtener las emergencias';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Obtener emergencias cercanas disponibles para aceptar
  fetchNearbyEmergencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await emergenciaService.getNearbyEmergencies();
      if (response.success) {
        set({
          activeEmergencies: response.data,
          isLoading: false
        });
        return { success: true, data: response.data };
      } else {
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al obtener emergencias cercanas';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Cargar emergencias activas del usuario
  loadActiveEmergencies: async () => {
    set({ isLoading: true, error: null });

    try {
      logger.debug('Obteniendo emergencias activas...');
      const result = await emergenciaService.getActiveEmergencies();

      if (result.success) {
        logger.debug(`Se encontraron ${result.data.length} emergencias activas`);

        // Verificar si hay emergencias en estado "Solicitada" que puedan haber expirado
        const emergenciasActualizadas = [...result.data];
        let cambiosRealizados = false;

        for (let i = 0; i < emergenciasActualizadas.length; i++) {
          const emergencia = emergenciasActualizadas[i];
          if (emergencia.estado === 'Solicitada') {
            // Verificar si la emergencia ha expirado (5 minutos desde la solicitud)
            const expiraEn = emergencia.expiraEn ? new Date(emergencia.expiraEn) :
                            new Date(new Date(emergencia.fechaSolicitud).getTime() + 5 * 60 * 1000);

            if (new Date() > expiraEn) {
              logger.debug(`Emergencia ${emergencia._id} expirada`);
              // La emergencia ha expirado, actualizar estado en el backend
              const verifyResult = await emergenciaService.checkEmergencyExpiration(emergencia._id);
              if (verifyResult.success && verifyResult.data.emergencia.estado === 'Cancelada') {
                // Si se canceló automáticamente, actualizar en nuestra lista local
                emergenciasActualizadas[i] = verifyResult.data.emergencia;
                cambiosRealizados = true;
              }
            }
          }
        }

        // Si se realizaron cambios, filtrar emergencias canceladas/expiradas
        const emergenciasFiltradas = cambiosRealizados ?
          emergenciasActualizadas.filter(e => e.estado !== 'Cancelada') : emergenciasActualizadas;

        set({
          activeEmergencies: emergenciasFiltradas,
          isLoading: false
        });
        return emergenciasFiltradas;
      } else {
        logger.warn('Error al cargar emergencias activas:', result.error);
        set({
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      logger.warn('Error al cargar emergencias activas:', error);
      set({
        error: "Error al cargar emergencias activas",
        isLoading: false
      });
      return [];
    }
  },

  // Verificar si una emergencia ha expirado
  checkEmergencyExpiration: async (emergencyId) => {
    try {
      const result = await emergenciaService.checkEmergencyExpiration(emergencyId);
      if (result.success) {
        // Si la emergencia ha expirado y se ha cancelado automáticamente
        if (result.data.emergencia.estado === 'Cancelada') {
          // Actualizar el estado local para reflejar la cancelación
          set(state => ({
            activeEmergencies: state.activeEmergencies.filter(e => e._id !== emergencyId)
          }));
        }
        return result.data;
      } else {
        logger.warn('Error al verificar expiracion:', result.error);
        return {
          tiempoRestante: 0,
          expirada: false,
          error: result.error
        };
      }
    } catch (error) {
      logger.warn('Error al verificar expiracion:', error);
      return {
        tiempoRestante: 0,
        expirada: false,
        error: 'Error al verificar expiración'
      };
    }
  },

  // Obtener detalles de una emergencia específica
  fetchEmergencyById: async (emergencyId) => {
    set({ isLoading: true, error: null });
    try {
      const serviceFn = emergenciaService.getById || emergenciaService.getEmergencyDetails;
      const response = await serviceFn(emergencyId);
      if (response.success) {
        set({
          currentEmergency: response.data,
          emergenciaActual: response.data,
          isLoading: false
        });
        return { success: true, data: response.data };
      } else {
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al obtener los detalles de la emergencia';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Aceptar una solicitud de emergencia
  updateEmergencyLocation: (emergencyId, latitude, longitude) =>
    emergenciaService.updateEmergencyLocation(emergencyId, latitude, longitude),

  acceptEmergency: async (emergencyId, acceptData = undefined) => {
    logger.debug('[STORE] Iniciando aceptacion de emergencia:', emergencyId);
    set({ isLoading: true, error: null });
    try {
      const response = await emergenciaService.acceptEmergency(emergencyId, acceptData);
      logger.debug('[STORE] Respuesta recibida:', {
        success: response.success,
        tienePreferencia: !!response.data?.preferenciaMP,
        metodoPago: response.data?.emergenciaActualizada?.metodoPago
      });

      if (response.success) {
        // Actualizar el estado de la emergencia a "Aceptada" en la lista local
        set(state => ({
          activeEmergencies: state.activeEmergencies.filter(e => e._id !== emergencyId),
          emergencies: [...state.emergencies.filter(e => getEmergencyId(e) !== emergencyId), response.data],
          emergencias: [...state.emergencias.filter(e => getEmergencyId(e) !== emergencyId), response.data],
          isLoading: false
        }));
        logger.debug('[STORE] Emergencia aceptada y estado actualizado');
        return { success: true, data: response.data };
      } else {
        logger.warn('[STORE] Error en respuesta:', response.error);
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al aceptar la emergencia';
      logger.error('[STORE] Excepcion al aceptar emergencia:', errorMessage);
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Rechazar una solicitud de emergencia
  rejectEmergency: async (emergencyId, motivo = undefined) => {
    set({ isLoading: true, error: null });
    try {
      const response = await emergenciaService.rejectEmergency(emergencyId, motivo);
      if (response.success) {
        // Eliminar la emergencia rechazada de la lista local
        set(state => ({
          activeEmergencies: state.activeEmergencies.filter(e => e._id !== emergencyId),
          isLoading: false
        }));
        return { success: true };
      } else {
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al rechazar la emergencia';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchEmergenciesByPrestador: async (prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const serviceFn = emergenciaService.getByPrestador || emergenciaService.getVeterinarianEmergencies;
      const response = await serviceFn(prestadorId);
      if (response.success) {
        set({
          emergencies: response.data,
          emergencias: response.data,
          isLoading: false
        });
        return { success: true, data: response.data };
      }

      set({ isLoading: false, error: response.error });
      return { success: false, error: response.error };
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener emergencias';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  updateEmergencyStatus: async (emergencyId, estado, payload = undefined) => {
    set({ isLoading: true, error: null });
    try {
      const serviceFn = emergenciaService.updateStatus || emergenciaService.setEmergencyStatus;
      const response = payload === undefined
        ? await serviceFn(emergencyId, estado)
        : await serviceFn(emergencyId, estado, payload);
      if (response.success) {
        set(state => ({
          emergencies: state.emergencies.map(e => getEmergencyId(e) === emergencyId ? { ...e, estado } : e),
          emergencias: state.emergencias.map(e => getEmergencyId(e) === emergencyId ? { ...e, estado } : e),
          currentEmergency: getEmergencyId(state.currentEmergency) === emergencyId
            ? { ...state.currentEmergency, estado }
            : state.currentEmergency,
          emergenciaActual: getEmergencyId(state.emergenciaActual) === emergencyId
            ? { ...state.emergenciaActual, estado }
            : state.emergenciaActual,
          isLoading: false
        }));
        return { success: true, data: response.data };
      }

      set({ isLoading: false, error: response.error });
      return { success: false, error: response.error };
    } catch (error) {
      const errorMessage = error.message || 'Error al actualizar emergencia';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  toggleAvailability: () => {
    set(state => ({ availableForEmergencies: !state.availableForEmergencies }));
  },

  // Marcar emergencia como "En camino"
  setEmergencyOnWay: async (emergencyId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await emergenciaService.setEmergencyStatus(emergencyId, 'En camino');
      if (response.success) {
        // Actualizar el estado de la emergencia en la lista local
        set(state => ({
          emergencies: state.emergencies.map(e =>
            e._id === emergencyId ? {...e, estado: 'En camino'} : e
          ),
          emergencias: state.emergencias.map(e =>
            e._id === emergencyId ? {...e, estado: 'En camino'} : e
          ),
          currentEmergency: state.currentEmergency?._id === emergencyId
            ? {...state.currentEmergency, estado: 'En camino'}
            : state.currentEmergency,
          emergenciaActual: state.emergenciaActual?._id === emergencyId
            ? {...state.emergenciaActual, estado: 'En camino'}
            : state.emergenciaActual,
          isLoading: false
        }));
        return { success: true, data: response.data };
      } else {
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar el estado de la emergencia';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Marcar emergencia como "Atendida"
  completeEmergency: async (emergencyId) => {
    logger.debug('[Store] completeEmergency iniciado con ID:', emergencyId);
    set({ isLoading: true, error: null });
    try {
      logger.debug('[Store] Llamando a emergenciaService.setEmergencyStatus');
      const response = await emergenciaService.setEmergencyStatus(emergencyId, 'Atendida');
      logger.debug('[Store] Respuesta de setEmergencyStatus:', response);

      if (response.success) {
        logger.debug('[Store] Actualizacion exitosa, actualizando estado local');
        // Actualizar el estado de la emergencia en la lista local
        set(state => ({
          emergencies: state.emergencies.map(e =>
            e._id === emergencyId ? {...e, estado: 'Atendida'} : e
          ),
          emergencias: state.emergencias.map(e =>
            e._id === emergencyId ? {...e, estado: 'Atendida'} : e
          ),
          currentEmergency: state.currentEmergency?._id === emergencyId
            ? {...state.currentEmergency, estado: 'Atendida'}
            : state.currentEmergency,
          emergenciaActual: state.emergenciaActual?._id === emergencyId
            ? {...state.emergenciaActual, estado: 'Atendida'}
            : state.emergenciaActual,
          isLoading: false
        }));
        return { success: true, data: response.data };
      } else {
        logger.warn('[Store] Error en respuesta:', response.error);
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      logger.error('[Store] Excepcion en completeEmergency:', error);
      const errorMessage = error.response?.data?.message || 'Error al completar la emergencia';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Limpiar el estado
  clearCurrentEmergency: () => {
    set({ currentEmergency: null, emergenciaActual: null });
  },

  applySocketEmergencyUpdate: (emergency) => {
    if (!emergency) return;

    const emergencyId = getEmergencyId(emergency);
    if (!emergencyId) return;

    set(state => {
      const mergeList = (items) => {
        const exists = items.some(item => getEmergencyId(item) === emergencyId);
        return exists
          ? items.map(item => getEmergencyId(item) === emergencyId ? { ...item, ...emergency } : item)
          : [emergency, ...items];
      };

      return {
        emergencies: mergeList(state.emergencies),
        emergencias: mergeList(state.emergencias),
        activeEmergencies: mergeList(state.activeEmergencies),
        currentEmergency: getEmergencyId(state.currentEmergency) === emergencyId
          ? { ...state.currentEmergency, ...emergency }
          : state.currentEmergency,
        emergenciaActual: getEmergencyId(state.emergenciaActual) === emergencyId
          ? { ...state.emergenciaActual, ...emergency }
          : state.emergenciaActual,
      };
    });
  },

  // Limpiar error
  clearError: () => {
    set({ error: null });
  }
}));

export default useEmergencyStore;
