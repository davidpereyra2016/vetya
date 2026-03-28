// usePrestadoresStore.js - Store para gestionar el estado de prestadores
import { create } from 'zustand';
import * as prestadoresService from '../services/prestadoresService';

const usePrestadoresStore = create((set, get) => ({
  // Estado inicial
  prestadores: [],
  prestadoresDestacados: [],
  prestadorCercanos: [],
  prestadorActual: null,
  isLoading: false,
  error: null,

  // Acciones
  
  /**
   * Obtiene todos los prestadores
   */
  fetchAllPrestadores: async () => {
    set({ isLoading: true, error: null });
    try {
      const prestadores = await prestadoresService.getAllPrestadores();
      set({ prestadores, isLoading: false });
      return prestadores;
    } catch (error) {
      console.error('Error en fetchAllPrestadores:', error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  /**
   * Obtiene prestadores destacados (de todos los tipos)
   * @param {number} limit - Límite de prestadores a obtener (por defecto 4)
   */
  fetchPrestadoresDestacados: async (limit = 4) => {
    set({ isLoading: true, error: null });
    try {
      const destacados = await prestadoresService.getFeaturedPrestadores(limit);
      
      // Aseguramos un mínimo de 3 prestadores o el máximo disponible
      const prestadoresDestacados = destacados.length > 0 
        ? destacados.slice(0, Math.max(3, Math.min(limit, destacados.length)))
        : [];
      
      set({ prestadoresDestacados, isLoading: false });
      return prestadoresDestacados;
    } catch (error) {
      console.error('Error en fetchPrestadoresDestacados:', error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  /**
   * Obtiene un prestador específico por su ID
   * @param {string} id - ID del prestador
   */
  fetchPrestadorById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const prestador = await prestadoresService.getPrestadorById(id);
      set({ prestadorActual: prestador, isLoading: false });
      return prestador;
    } catch (error) {
      console.error(`Error al obtener prestador ${id}:`, error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  /**
   * Obtiene prestadores cercanos basados en coordenadas
   * @param {Object} coords - Coordenadas {latitude, longitude}
   * @param {number} radio - Radio de búsqueda en km
   */
  fetchPrestadoresCercanos: async (coords, radio = 10) => {
    set({ isLoading: true, error: null });
    try {
      const cercanos = await prestadoresService.getNearbyPrestadores(coords, radio);
      set({ prestadorCercanos: cercanos, isLoading: false });
      return cercanos;
    } catch (error) {
      console.error('Error al obtener prestadores cercanos:', error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  /**
   * Obtiene prestadores de tipo específico
   * @param {string} tipo - Tipo de prestador ('Veterinario', 'Centro Veterinario', etc)
   */
  fetchPrestadoresPorTipo: async (tipo) => {
    set({ isLoading: true, error: null });
    try {
      const response = await prestadoresService.getAllPrestadores({ tipo });
      set({ prestadores: response, isLoading: false });
      return response;
    } catch (error) {
      console.error(`Error al obtener prestadores de tipo ${tipo}:`, error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  /**
   * Obtiene todos los veterinarios disponibles
   * @returns {Promise<Array>} Lista de veterinarios
   */
  fetchVeterinariosDisponibles: async () => {
    set({ isLoading: true, error: null });
    try {
      const veterinarios = await prestadoresService.getAllVeterinarios();
      set({ prestadores: veterinarios, isLoading: false });
      return veterinarios;
    } catch (error) {
      console.error('Error al obtener veterinarios disponibles:', error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  /**
   * Obtiene estadísticas de un prestador (valoraciones, pacientes atendidos)
   * @param {string} id - ID del prestador
   */
  fetchPrestadorStats: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const stats = await prestadoresService.getPrestadorStats(id);
      
      // Actualizamos el prestador actual si existe en el estado
      const { prestadorActual } = get();
      if (prestadorActual && prestadorActual._id === id) {
        set({
          prestadorActual: {
            ...prestadorActual,
            stats
          }
        });
      }
      
      set({ isLoading: false });
      return stats;
    } catch (error) {
      console.error(`Error al obtener estadísticas del prestador ${id}:`, error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  // Limpiar el estado
  clearPrestadores: () => {
    set({
      prestadores: [],
      prestadoresDestacados: [],
      prestadorCercanos: [],
      prestadorActual: null,
      error: null
    });
  }
}));

export default usePrestadoresStore;
