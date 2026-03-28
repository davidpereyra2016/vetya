import { create } from 'zustand';
import consultaGeneralService from '../services/consultaGeneralService';

/**
 * Store para gestionar el estado de las consultas generales usando Zustand
 */
const useConsultaGeneralStore = create((set, get) => ({
  // Estado
  prestadores: [],
  selectedPrestador: null,
  disponibilidad: [],
  selectedFecha: null,
  selectedHorario: null,
  isLoading: false,
  error: null,

  // Acciones
  fetchPrestadoresConsultaGeneral: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await consultaGeneralService.getPrestadoresConsultaGeneral();
      set({ 
        prestadores: Array.isArray(result) ? result : [], // Asegurar que es array
        isLoading: false 
      });
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al obtener prestadores';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  setSelectedPrestador: (prestador) => {
    set({ selectedPrestador: prestador });
    // Limpiamos la fecha y horario seleccionado cuando se cambia el prestador
    set({ selectedFecha: null, selectedHorario: null });
  },

  fetchDisponibilidadPrestador: async (prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await consultaGeneralService.getDisponibilidadPrestador(prestadorId);
      
      // Organizar las fechas por día para facilitar la visualización
      const fechasFormateadas = result.map(fecha => {
        const fechaObj = new Date(fecha.fecha);
        if (isNaN(fechaObj.getTime())) {
          console.error('Fecha inválida:', fecha.fecha);
          return null;
        }
        return {
          ...fecha,
          fecha: fechaObj,
          dia: fechaObj.getDate(),
          mes: fechaObj.toLocaleString('es-ES', { month: 'short' }),
          diaNombre: fechaObj.toLocaleString('es-ES', { weekday: 'short' }),
        };
      }).filter(Boolean); // Filtra fechas inválidas

      set({ 
        disponibilidad: fechasFormateadas, 
        isLoading: false 
      });
      return { success: true, data: fechasFormateadas };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al obtener disponibilidad del prestador';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  setSelectedFecha: (fecha) => {
    set({ selectedFecha: fecha });
    // Limpiamos el horario seleccionado cuando se cambia la fecha
    set({ selectedHorario: null });
  },

  setSelectedHorario: (horario) => {
    set({ selectedHorario: horario });
  },

  crearConsultaGeneral: async (consultaData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await consultaGeneralService.crearConsultaGeneral(consultaData);
      set({ isLoading: false });
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la consulta general';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  resetState: () => {
    set({
      selectedPrestador: null,
      disponibilidad: [],
      selectedFecha: null,
      selectedHorario: null,
      error: null
    });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export default useConsultaGeneralStore;
