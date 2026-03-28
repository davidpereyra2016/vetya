import { create } from 'zustand';
import valoracionService from '../services/valoracionService';

/**
 * Store para gestionar el estado de las valoraciones usando Zustand
 * Sigue el patrón de useCitaStore.js
 */
const useValoracionStore = create((set, get) => ({
  // Estado inicial
  valoraciones: [],
  estadisticas: {
    promedio: 0,
    total: 0,
    distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  },
  isLoading: false,
  error: null,

  /**
   * Calcular estadísticas de valoraciones
   * @param {Array} valoraciones - Array de valoraciones
   * @returns {Object} Estadísticas calculadas
   */
  calcularEstadisticas: (valoraciones) => {
    if (!valoraciones || valoraciones.length === 0) {
      return {
        promedio: 0,
        total: 0,
        distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    let suma = 0;
    const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    valoraciones.forEach(val => {
      suma += val.calificacion;
      distribucion[val.calificacion]++;
    });

    const promedio = suma / valoraciones.length;

    return {
      promedio: parseFloat(promedio.toFixed(1)),
      total: valoraciones.length,
      distribucion
    };
  },

  /**
   * Obtener valoraciones de un prestador
   * @param {string} prestadorId - ID del prestador
   * @returns {Promise<Object>} Resultado de la operación
   */
  fetchValoraciones: async (prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionService.getValoracionesPrestador(prestadorId);
      
      if (result.success) {
        const estadisticas = get().calcularEstadisticas(result.data);
        
        set({ 
          valoraciones: result.data,
          estadisticas,
          isLoading: false 
        });
        
        return { success: true, data: result.data, estadisticas };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener valoraciones';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Crear una nueva valoración
   * @param {Object} valoracionData - Datos de la valoración
   * @returns {Promise<Object>} Resultado de la operación
   */
  crearValoracion: async (valoracionData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionService.crearValoracion(valoracionData);
      
      if (result.success) {
        // Agregar la nueva valoración al estado
        set(state => ({
          valoraciones: [...state.valoraciones, result.data],
          isLoading: false
        }));
        
        // Recalcular estadísticas
        const nuevasValoraciones = [...get().valoraciones];
        const estadisticas = get().calcularEstadisticas(nuevasValoraciones);
        set({ estadisticas });
        
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
   * Verificar si puede valorar a un prestador
   * @param {string} prestadorId - ID del prestador
   * @returns {Promise<Object>} Resultado de la operación
   */
  verificarPuedeValorar: async (prestadorId) => {
    try {
      const result = await valoracionService.puedeValorar(prestadorId);
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Error al verificar si puede valorar' 
      };
    }
  },

  /**
   * Obtener valoraciones del usuario autenticado
   * @returns {Promise<Object>} Resultado de la operación
   */
  fetchMisValoraciones: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await valoracionService.getMisValoraciones();
      
      if (result.success) {
        set({ isLoading: false });
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
   * Limpiar errores
   */
  clearError: () => set({ error: null }),

  /**
   * Reset del estado de valoraciones
   */
  reset: () => set({
    valoraciones: [],
    estadisticas: {
      promedio: 0,
      total: 0,
      distribucion: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    },
    isLoading: false,
    error: null
  })
}));

export default useValoracionStore;
