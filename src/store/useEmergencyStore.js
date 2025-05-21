import { create } from 'zustand';
import { emergenciaService, veterinarioService } from '../services/api';

/**
 * Store para manejar el estado de emergencias y veterinarios disponibles
 */
const useEmergencyStore = create((set, get) => ({
  // Estado
  availableVets: [],
  activeEmergencies: [],
  selectedEmergency: null,
  isLoading: false,
  error: null,
  
  // Restablecer el estado
  reset: () => {
    set({
      availableVets: [],
      activeEmergencies: [],
      selectedEmergency: null,
      isLoading: false,
      error: null
    });
  },
  
  // Cargar veterinarios disponibles para emergencias
  loadAvailableVets: async () => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Obteniendo veterinarios disponibles para emergencias...');
      const result = await veterinarioService.getAvailableForEmergencies();
      
      if (result.success) {
        console.log(`Se encontraron ${result.data.length} veterinarios disponibles`);
        set({ 
          availableVets: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error al cargar veterinarios disponibles:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      console.log('Error al cargar veterinarios:', error);
      set({ 
        error: "Error al cargar veterinarios disponibles",
        isLoading: false
      });
      return [];
    }
  },
  
  // Cargar emergencias activas del usuario
  loadActiveEmergencies: async () => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Obteniendo emergencias activas del usuario...');
      const result = await emergenciaService.getActiveEmergencies();
      
      if (result.success) {
        console.log(`Se encontraron ${result.data.length} emergencias activas`);
        set({ 
          activeEmergencies: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error al cargar emergencias activas:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      console.log('Error al cargar emergencias:', error);
      set({ 
        error: "Error al cargar emergencias activas",
        isLoading: false
      });
      return [];
    }
  },
  
  // Crear una nueva emergencia
  createEmergency: async (emergencyData, images = []) => {
    set({ isLoading: true, error: null });
    
    try {
      // Si hay imágenes, subirlas primero
      let imageUrls = [];
      if (images && images.length > 0) {
        console.log(`Subiendo ${images.length} imágenes para la emergencia...`);
        const uploadResult = await emergenciaService.uploadEmergencyImages(images);
        
        if (uploadResult.success) {
          imageUrls = uploadResult.data.urls;
          console.log('Imágenes subidas correctamente:', imageUrls);
        } else {
          console.log('Error al subir imágenes:', uploadResult.error);
          set({ 
            error: uploadResult.error,
            isLoading: false
          });
          return { success: false, error: uploadResult.error };
        }
      }
      
      // Crear la emergencia con las URLs de las imágenes
      const dataToSend = {
        ...emergencyData,
        imagenes: imageUrls
      };
      
      console.log('Creando nueva solicitud de emergencia:', dataToSend);
      const result = await emergenciaService.create(dataToSend);
      
      if (result.success) {
        console.log('Emergencia creada correctamente:', result.data);
        
        // Agregar la nueva emergencia a la lista de emergencias activas
        set(state => ({ 
          selectedEmergency: result.data,
          activeEmergencies: [...state.activeEmergencies, result.data],
          isLoading: false
        }));
        
        return { success: true, data: result.data };
      } else {
        console.log('Error al crear emergencia:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.log('Error al crear emergencia:', error);
      set({ 
        error: "Error al crear solicitud de emergencia",
        isLoading: false
      });
      return { success: false, error: "Error al crear solicitud de emergencia" };
    }
  },
  
  // Cancelar una emergencia
  cancelEmergency: async (emergencyId) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Cancelando emergencia ID:', emergencyId);
      const result = await emergenciaService.cancelEmergency(emergencyId);
      
      if (result.success) {
        console.log('Emergencia cancelada correctamente');
        
        // Actualizar el estado de la emergencia en la lista
        set(state => ({ 
          activeEmergencies: state.activeEmergencies.map(em => 
            em._id === emergencyId 
              ? { ...em, estado: 'Cancelada' } 
              : em
          ),
          isLoading: false
        }));
        
        // Si la emergencia cancelada es la seleccionada, actualizar su estado
        if (get().selectedEmergency && get().selectedEmergency._id === emergencyId) {
          set(state => ({
            selectedEmergency: { ...state.selectedEmergency, estado: 'Cancelada' }
          }));
        }
        
        return { success: true };
      } else {
        console.log('Error al cancelar emergencia:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.log('Error al cancelar emergencia:', error);
      set({ 
        error: "Error al cancelar la emergencia",
        isLoading: false
      });
      return { success: false, error: "Error al cancelar la emergencia" };
    }
  },
  
  // Seleccionar una emergencia específica
  setSelectedEmergency: (emergency) => {
    set({ selectedEmergency: emergency });
  }
}));

export default useEmergencyStore;
