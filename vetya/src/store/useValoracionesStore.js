import { create } from 'zustand';
import valoracionesService from '../services/valoracionesService';

/**
 * Store para gestionar el estado de las valoraciones y reseñas usando Zustand
 */
const useValoracionesStore = create((set, get) => ({
  // Estado inicial
  valoracionesPrestador: [],
  misValoraciones: [],
  estadisticasPrestador: {
    promedio: 0,
    total: 0,
    distribucion: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
  },
  puedeValorar: false,
  isLoading: false,
  error: null,

  /**
   * Obtiene todas las valoraciones de un prestador específico
   * @param {string} prestadorId - ID del prestador
   */
  fetchValoracionesByPrestador: async (prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionesService.getValoracionesByPrestador(prestadorId);
      if (result.success) {
        set({ 
          valoracionesPrestador: result.data,
          isLoading: false 
        });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener valoraciones del prestador';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Obtiene las valoraciones realizadas por el usuario autenticado
   */
  fetchMisValoraciones: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionesService.getMisValoraciones();
      if (result.success) {
        set({ 
          misValoraciones: result.data,
          isLoading: false 
        });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener mis valoraciones';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Verifica si el usuario puede valorar a un prestador específico
   * @param {string} prestadorId - ID del prestador
   */
  checkPuedeValorar: async (prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionesService.puedeValorar(prestadorId);
      if (result.success) {
        set({ 
          puedeValorar: result.puedeValorar,
          isLoading: false 
        });
        return { 
          success: true, 
          puedeValorar: result.puedeValorar,
          mensaje: result.mensaje
        };
      } else {
        set({ isLoading: false, error: result.error, puedeValorar: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al verificar si puede valorar';
      set({ isLoading: false, error: errorMessage, puedeValorar: false });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Obtiene estadísticas de valoraciones de un prestador
   * @param {string} prestadorId - ID del prestador
   */
  fetchEstadisticasPrestador: async (prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionesService.getEstadisticasPrestador(prestadorId);
      if (result.success) {
        set({ 
          estadisticasPrestador: result.data,
          isLoading: false 
        });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener estadísticas del prestador';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Crea una nueva valoración para un prestador
   * @param {Object} valoracionData - Datos de la valoración
   */
  crearValoracion: async (valoracionData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionesService.crearValoracion(valoracionData);
      if (result.success) {
        // Actualizar las valoraciones del prestador si estamos viendo ese prestador
        if (valoracionData.prestador) {
          await get().fetchValoracionesByPrestador(valoracionData.prestador);
          await get().fetchEstadisticasPrestador(valoracionData.prestador);
          // Actualizar el estado de si puede valorar (ya no podrá después de valorar)
          set({ puedeValorar: false });
        }
        
        // También actualizar mis valoraciones
        await get().fetchMisValoraciones();
        
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al crear valoración';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Actualiza una valoración existente
   * @param {string} valoracionId - ID de la valoración a actualizar
   * @param {Object} valoracionData - Datos a actualizar
   */
  actualizarValoracion: async (valoracionId, valoracionData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionesService.actualizarValoracion(valoracionId, valoracionData);
      if (result.success) {
        // Actualizar tanto mis valoraciones como las del prestador si corresponde
        await get().fetchMisValoraciones();
        
        // Buscar la valoración en mis valoraciones para conseguir el ID del prestador
        const valoracion = get().misValoraciones.find(v => v._id === valoracionId);
        if (valoracion && valoracion.prestador) {
          const prestadorId = typeof valoracion.prestador === 'object' 
            ? valoracion.prestador._id 
            : valoracion.prestador;
            
          await get().fetchValoracionesByPrestador(prestadorId);
          await get().fetchEstadisticasPrestador(prestadorId);
        }
        
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al actualizar valoración';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Elimina una valoración existente
   * @param {string} valoracionId - ID de la valoración a eliminar
   * @param {string} prestadorId - ID del prestador asociado a la valoración
   */
  eliminarValoracion: async (valoracionId, prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionesService.eliminarValoracion(valoracionId);
      if (result.success) {
        // Actualizar tanto mis valoraciones como las del prestador si corresponde
        await get().fetchMisValoraciones();
        
        if (prestadorId) {
          await get().fetchValoracionesByPrestador(prestadorId);
          await get().fetchEstadisticasPrestador(prestadorId);
          await get().checkPuedeValorar(prestadorId); // Verificar si ahora puede valorar
        }
        
        set({ isLoading: false });
        return { success: true };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al eliminar valoración';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Reporta una valoración como inadecuada
   * @param {string} valoracionId - ID de la valoración a reportar
   */
  reportarValoracion: async (valoracionId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionesService.reportarValoracion(valoracionId);
      if (result.success) {
        set({ isLoading: false });
        return { success: true };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al reportar valoración';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Limpiar errores
  clearErrors: () => set({ error: null }),

  // Reset del estado de valoraciones
  resetValoracionesState: () => set({
    valoracionesPrestador: [],
    misValoraciones: [],
    estadisticasPrestador: {
      promedio: 0,
      total: 0,
      distribucion: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    },
    puedeValorar: false,
    isLoading: false,
    error: null
  })
}));

export default useValoracionesStore;
