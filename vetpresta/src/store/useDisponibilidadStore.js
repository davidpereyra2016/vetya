import { create } from 'zustand';
import { disponibilidadService } from '../services/apiDisponibilidad';

// Store para manejar el estado de disponibilidad del prestador
const useDisponibilidadStore = create((set, get) => ({
  // Estado inicial
  disponibilidadGeneral: null,
  disponibilidadServicios: {}, // Mapa de servicioId -> disponibilidad
  disponibilidadEmergencias: {
    disponible: false,
    precio: 0
  },
  slotsDisponibles: [], // Para una fecha específica
  isLoading: false,
  error: null,
  
  // Obtener la disponibilidad general del prestador
  getDisponibilidadGeneral: async (prestadorId) => {
    if (!prestadorId) {
      console.log('No se proporcionó ID del prestador');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const result = await disponibilidadService.getDisponibilidadPrestador(prestadorId);
      
      if (result.success) {
        console.log('Disponibilidad general obtenida correctamente');
        set({ 
          disponibilidadGeneral: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error obteniendo disponibilidad general:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Excepción obteniendo disponibilidad general:', error);
      set({ 
        error: "Error al obtener disponibilidad general",
        isLoading: false
      });
      return null;
    }
  },
  
  // Obtener la disponibilidad para un servicio específico
  getDisponibilidadServicio: async (prestadorId, servicioId) => {
    if (!prestadorId || !servicioId) {
      console.log('No se proporcionaron IDs necesarios');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const result = await disponibilidadService.getDisponibilidadServicio(prestadorId, servicioId);
      
      if (result.success) {
        console.log('Disponibilidad de servicio obtenida correctamente store');
        
        // Actualizar el mapa de disponibilidad por servicio
        const disponibilidadServicios = { ...get().disponibilidadServicios };
        disponibilidadServicios[servicioId] = result.data;
        
        set({ 
          disponibilidadServicios,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error obteniendo disponibilidad de servicio:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Excepción obteniendo disponibilidad de servicio:', error);
      set({ 
        error: "Error al obtener disponibilidad de servicio",
        isLoading: false
      });
      return null;
    }
  },
  
  // Configurar o actualizar la disponibilidad para un servicio específico
  configurarDisponibilidadServicio: async (prestadorId, servicioId, disponibilidadData) => {
    if (!prestadorId || !servicioId) {
      console.log('No se proporcionaron IDs necesarios');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const result = await disponibilidadService.configurarDisponibilidadServicio(
        prestadorId, 
        servicioId, 
        disponibilidadData
      );
      
      if (result.success) {
        console.log('Disponibilidad de servicio configurada correctamente');
        
        // Actualizar el mapa de disponibilidad por servicio
        const disponibilidadServicios = { ...get().disponibilidadServicios };
        disponibilidadServicios[servicioId] = result.data;
        
        set({ 
          disponibilidadServicios,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error configurando disponibilidad de servicio:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Excepción configurando disponibilidad de servicio:', error);
      set({ 
        error: "Error al configurar disponibilidad de servicio",
        isLoading: false
      });
      return null;
    }
  },
  
  // Configurar o actualizar la disponibilidad general del prestador
  configurarDisponibilidadGeneral: async (prestadorId, disponibilidadData) => {
    if (!prestadorId) {
      console.log('No se proporcionó ID del prestador');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const result = await disponibilidadService.configurarDisponibilidadGeneral(prestadorId, disponibilidadData);
      
      if (result.success) {
        console.log('Disponibilidad general configurada correctamente');
        set({ 
          disponibilidadGeneral: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error configurando disponibilidad general:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Excepción configurando disponibilidad general:', error);
      set({ 
        error: "Error al configurar disponibilidad general",
        isLoading: false
      });
      return null;
    }
  },
  
  // Agregar fecha especial a la disponibilidad
  agregarFechaEspecial: async (prestadorId, servicioId, fechaEspecialData) => {
    if (!prestadorId) {
      console.log('No se proporcionó ID del prestador');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const result = await disponibilidadService.agregarFechaEspecial(
        prestadorId, 
        servicioId, 
        fechaEspecialData
      );
      
      if (result.success) {
        console.log('Fecha especial agregada correctamente');
        
        // Si es para un servicio específico, actualizamos ese servicio
        if (servicioId) {
          // Actualizar el mapa de disponibilidad por servicio
          const disponibilidadServicios = { ...get().disponibilidadServicios };
          if (disponibilidadServicios[servicioId]) {
            // Agregar la nueva fecha especial a la lista existente
            disponibilidadServicios[servicioId].fechasEspeciales = [
              ...disponibilidadServicios[servicioId].fechasEspeciales || [],
              result.data
            ];
            
            set({ disponibilidadServicios });
          }
        } else {
          // Es para la disponibilidad general, actualizar ese objeto
          const disponibilidadGeneral = { ...get().disponibilidadGeneral };
          if (disponibilidadGeneral) {
            disponibilidadGeneral.fechasEspeciales = [
              ...disponibilidadGeneral.fechasEspeciales || [],
              result.data
            ];
            
            set({ disponibilidadGeneral });
          }
        }
        
        set({ isLoading: false });
        return result.data;
      } else {
        console.log('Error agregando fecha especial:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Excepción agregando fecha especial:', error);
      set({ 
        error: "Error al agregar fecha especial",
        isLoading: false
      });
      return null;
    }
  },
  
  // Eliminar fecha especial
  eliminarFechaEspecial: async (prestadorId, servicioId, fechaEspecialId) => {
    if (!prestadorId || !fechaEspecialId) {
      console.log('No se proporcionaron IDs necesarios');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const result = await disponibilidadService.eliminarFechaEspecial(
        prestadorId, 
        servicioId, 
        fechaEspecialId
      );
      
      if (result.success) {
        console.log('Fecha especial eliminada correctamente');
        
        // Si es para un servicio específico, actualizamos ese servicio
        if (servicioId) {
          // Actualizar el mapa de disponibilidad por servicio
          const disponibilidadServicios = { ...get().disponibilidadServicios };
          if (disponibilidadServicios[servicioId]) {
            // Filtrar la fecha especial eliminada
            disponibilidadServicios[servicioId].fechasEspeciales = 
              (disponibilidadServicios[servicioId].fechasEspeciales || [])
                .filter(fe => fe._id !== fechaEspecialId);
            
            set({ disponibilidadServicios });
          }
        } else {
          // Es para la disponibilidad general, actualizar ese objeto
          const disponibilidadGeneral = { ...get().disponibilidadGeneral };
          if (disponibilidadGeneral) {
            disponibilidadGeneral.fechasEspeciales = 
              (disponibilidadGeneral.fechasEspeciales || [])
                .filter(fe => fe._id !== fechaEspecialId);
            
            set({ disponibilidadGeneral });
          }
        }
        
        set({ isLoading: false });
        return true;
      } else {
        console.log('Error eliminando fecha especial:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      console.log('Excepción eliminando fecha especial:', error);
      set({ 
        error: "Error al eliminar fecha especial",
        isLoading: false
      });
      return false;
    }
  },
  
  // Obtener slots disponibles para una fecha específica
  getSlotsDisponibles: async (prestadorId, servicioId, fecha) => {
    if (!prestadorId || !servicioId || !fecha) {
      console.log('No se proporcionaron datos necesarios');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const result = await disponibilidadService.getSlotsDisponibles(prestadorId, servicioId, fecha);
      
      if (result.success) {
        console.log('Slots disponibles obtenidos correctamente:', result.data.length);
        set({ 
          slotsDisponibles: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error obteniendo slots disponibles:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      console.log('Excepción obteniendo slots disponibles:', error);
      set({ 
        error: "Error al obtener slots disponibles",
        isLoading: false,
        slotsDisponibles: []
      });
      return [];
    }
  },
  
  // Actualizar disponibilidad para emergencias
  actualizarDisponibilidadEmergencias: async (prestadorId, disponible, precio) => {
    if (!prestadorId) {
      console.log('No se proporcionó ID del prestador');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const result = await disponibilidadService.actualizarDisponibilidadEmergencias(
        prestadorId, 
        disponible, 
        precio
      );
      
      if (result.success) {
        console.log('Disponibilidad de emergencias actualizada correctamente');
        set({ 
          disponibilidadEmergencias: {
            disponible,
            precio
          },
          isLoading: false
        });
        return result.data;
      } else {
        console.log('Error actualizando disponibilidad de emergencias:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.log('Excepción actualizando disponibilidad de emergencias:', error);
      set({ 
        error: "Error al actualizar disponibilidad de emergencias",
        isLoading: false
      });
      return null;
    }
  },
  
  // Limpiar errores
  clearError: () => set({ error: null }),
  
  // Restablecer el estado
  reset: () => set({
    disponibilidadGeneral: null,
    disponibilidadServicios: {},
    disponibilidadEmergencias: {
      disponible: false,
      precio: 0
    },
    slotsDisponibles: [],
    isLoading: false,
    error: null
  })
}));

export default useDisponibilidadStore;
