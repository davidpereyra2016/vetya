import { create } from 'zustand';
import { prestadorService } from '../services/api';

/**
 * Store para manejar el estado del perfil de prestador
 */
const usePrestadorStore = create((set, get) => ({
  // Estado
  prestador: null,
  isLoading: false,
  error: null,
  
  // Restablecer el estado
  reset: () => {
    set({
      prestador: null,
      isLoading: false,
      error: null
    });
  },
  
  // Cargar el prestador a partir del ID de usuario
  loadPrestador: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Obteniendo prestador para usuario ID:', userId);
      const result = await prestadorService.getByUserId(userId);
      
      if (result.success) {
        console.log('Perfil de prestador cargado correctamente:', result.data._id);
        set({ 
          prestador: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error al cargar perfil de prestador:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Error al cargar prestador:', error);
      set({ 
        error: "Error al cargar información del prestador",
        isLoading: false
      });
      return null;
    }
  },
  
  // Cargar el prestador directamente por su ID
  loadPrestadorById: async (prestadorId) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Obteniendo prestador por ID directo:', prestadorId);
      const result = await prestadorService.getById(prestadorId);
      
      if (result.success) {
        console.log('Perfil de prestador cargado correctamente por ID:', result.data._id);
        set({ 
          prestador: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error al cargar perfil de prestador por ID:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Error al cargar prestador por ID:', error);
      set({ 
        error: "Error al cargar información del prestador",
        isLoading: false
      });
      return null;
    }
  },
  
  // Actualizar el precio de emergencia y disponibilidad
  updateEmergencySettings: async (precioEmergencia, disponibleEmergencias) => {
    const { prestador } = get();
    
    if (!prestador || !prestador._id) {
      set({ error: "No hay perfil de prestador cargado" });
      return null;
    }
    
    // Validar que el prestador sea veterinario
    if (prestador.tipo !== 'Veterinario') {
      set({ error: "Solo los veterinarios pueden configurar el precio de emergencia" });
      return null;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const result = await prestadorService.actualizarPrecioEmergencia(
        prestador._id,
        precioEmergencia,
        disponibleEmergencias
      );
      
      if (result.success) {
        // Actualizar los valores en el estado
        const updatedPrestador = {
          ...prestador,
          precioEmergencia: precioEmergencia !== undefined ? precioEmergencia : prestador.precioEmergencia,
          disponibleEmergencias: disponibleEmergencias !== undefined ? disponibleEmergencias : prestador.disponibleEmergencias
        };
        
        set({ 
          prestador: updatedPrestador,
          isLoading: false
        });
        
        return updatedPrestador;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Error al actualizar configuración de emergencias:', error);
      set({ 
        error: "Error al actualizar la configuración de emergencias",
        isLoading: false
      });
      return null;
    }
  }
}));

export default usePrestadorStore;
