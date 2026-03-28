import { create } from 'zustand';
import countPacientesService from '../services/countPacientesService';

/**
 * Store para gestionar el estado del conteo de pacientes usando Zustand
 */
const useCountPacientesStore = create((set, get) => ({
  // Estado inicial
  totalPacientes: 0,
  desglosePacientes: {
    citas: 0,
    emergencias: 0
  },
  isLoading: false,
  error: null,

  /**
   * Obtiene el total de pacientes atendidos por un prestador
   * @param {string} prestadorId - ID del prestador
   */
  fetchTotalPacientes: async (prestadorId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await countPacientesService.getTotalPacientes(prestadorId);
      
      if (result.success) {
        set({ 
          totalPacientes: result.data.totalPacientes,
          desglosePacientes: result.data.desglose || { citas: 0, emergencias: 0 },
          isLoading: false 
        });
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener conteo de pacientes';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  /**
   * Resetea el estado a los valores iniciales
   */
  resetState: () => {
    set({
      totalPacientes: 0,
      desglosePacientes: { citas: 0, emergencias: 0 },
      isLoading: false,
      error: null
    });
  }
}));

export default useCountPacientesStore;
