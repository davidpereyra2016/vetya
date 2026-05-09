import { create } from 'zustand';
import { emergenciaService } from '../services/api';

const getEmergencyId = (emergency) => emergency?._id || emergency?.id;

/**
 * Store para gestionar el estado de las emergencias para prestadores veterinarios
 * Solo los prestadores de tipo 'Veterinario' pueden ver y gestionar emergencias
 */
const useEmergencyStore = create((set, get) => ({
  // Estado inicial
  emergencies: [],
  activeEmergencies: [],
  currentEmergency: null,
  isLoading: false,
  error: null,
  
  // Obtener todas las solicitudes de emergencia asignadas al veterinario
  fetchEmergencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await emergenciaService.getVeterinarianEmergencies();
      if (response.success) {
        set({ 
          emergencies: response.data, 
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
      console.log('Obteniendo emergencias activas...');
      const result = await emergenciaService.getActiveEmergencies();
      
      if (result.success) {
        console.log(`Se encontraron ${result.data.length} emergencias activas`);
        
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
              console.log(`Emergencia ${emergencia._id} expirada`);
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
        console.log('Error al cargar emergencias activas:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      console.log('Error al cargar emergencias activas:', error);
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
        console.log('Error al verificar expiración:', result.error);
        return {
          tiempoRestante: 0,
          expirada: false,
          error: result.error
        };
      }
    } catch (error) {
      console.log('Error al verificar expiración:', error);
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
      const response = await emergenciaService.getEmergencyDetails(emergencyId);
      if (response.success) {
        set({ 
          currentEmergency: response.data, 
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
  acceptEmergency: async (emergencyId) => {
    console.log('📦 [STORE] Iniciando aceptación de emergencia:', emergencyId);
    set({ isLoading: true, error: null });
    try {
      const response = await emergenciaService.acceptEmergency(emergencyId);
      console.log('📦 [STORE] Respuesta recibida:', {
        success: response.success,
        tienePreferencia: !!response.data?.preferenciaMP,
        metodoPago: response.data?.emergenciaActualizada?.metodoPago
      });
      
      if (response.success) {
        // Actualizar el estado de la emergencia a "Aceptada" en la lista local
        set(state => ({
          activeEmergencies: state.activeEmergencies.filter(e => e._id !== emergencyId),
          emergencies: [...state.emergencies, response.data],
          isLoading: false
        }));
        console.log('✅ [STORE] Emergencia aceptada y estado actualizado');
        return { success: true, data: response.data };
      } else {
        console.error('❌ [STORE] Error en respuesta:', response.error);
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al aceptar la emergencia';
      console.error('❌ [STORE] Excepción al aceptar emergencia:', errorMessage);
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Rechazar una solicitud de emergencia
  rejectEmergency: async (emergencyId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await emergenciaService.rejectEmergency(emergencyId);
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
          currentEmergency: state.currentEmergency?._id === emergencyId 
            ? {...state.currentEmergency, estado: 'En camino'} 
            : state.currentEmergency,
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
    console.log('🟡 [Store] completeEmergency iniciado con ID:', emergencyId);
    set({ isLoading: true, error: null });
    try {
      console.log('🟡 [Store] Llamando a emergenciaService.setEmergencyStatus');
      const response = await emergenciaService.setEmergencyStatus(emergencyId, 'Atendida');
      console.log('🟡 [Store] Respuesta de setEmergencyStatus:', response);
      
      if (response.success) {
        console.log('🟡 [Store] ✅ Actualización exitosa, actualizando estado local');
        // Actualizar el estado de la emergencia en la lista local
        set(state => ({
          emergencies: state.emergencies.map(e => 
            e._id === emergencyId ? {...e, estado: 'Atendida'} : e
          ),
          currentEmergency: state.currentEmergency?._id === emergencyId 
            ? {...state.currentEmergency, estado: 'Atendida'} 
            : state.currentEmergency,
          isLoading: false
        }));
        return { success: true, data: response.data };
      } else {
        console.log('🟡 [Store] ❌ Error en respuesta:', response.error);
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('🟡 [Store] 💥 Excepción en completeEmergency:', error);
      const errorMessage = error.response?.data?.message || 'Error al completar la emergencia';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Limpiar el estado
  clearCurrentEmergency: () => {
    set({ currentEmergency: null });
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
        activeEmergencies: mergeList(state.activeEmergencies),
        currentEmergency: getEmergencyId(state.currentEmergency) === emergencyId
          ? { ...state.currentEmergency, ...emergency }
          : state.currentEmergency,
      };
    });
  },

  // Limpiar error
  clearError: () => {
    set({ error: null });
  }
}));

export default useEmergencyStore;
