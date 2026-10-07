import logger from '../utils/logger';
import { create } from 'zustand';
import { prestadorService } from '../services/api';
import prestadorServicePrestador from '../services/apiPrestador';
import * as Location from 'expo-location';

// Log para verificar que prestadorServicePrestador está definido correctamente

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
      const result = await prestadorService.getByUserId(userId);
      
      if (result.success) {
        
        set({ 
          prestador: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
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
      const result = await prestadorService.getById(prestadorId);
      
      if (result.success) {
        set({ 
          prestador: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
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
      // SI SE ESTÁ ACTIVANDO LA DISPONIBILIDAD, OBTENER UBICACIÓN GPS PRIMERO
      let ubicacionActualizada = null;
      
      if (disponibleEmergencias === true) {
        
        // Solicitar permisos de ubicación
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          set({ 
            error: "Se necesitan permisos de ubicación para estar disponible para emergencias",
            isLoading: false 
          });
          return null;
        }
        
        // Obtener ubicación actual con alta precisión
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        const { latitude, longitude } = location.coords;
        
        // Enviar ubicación al backend ANTES de activar disponibilidad
        const ubicacionResult = await prestadorService.actualizarUbicacion(
          prestador._id,
          latitude,
          longitude
        );
        
        if (ubicacionResult.success) {
          ubicacionActualizada = { lat: latitude, lng: longitude };
        } else {
          logger.error('❌ Error al guardar ubicación:', ubicacionResult.error);
          // No bloquear, pero registrar el error
        }
      }
      
      // Actualizar disponibilidad y precio en el backend
      const result = await prestadorService.actualizarPrecioEmergencia(
        prestador._id,
        precioEmergencia,
        disponibleEmergencias
      );
      
      if (result.success) {
        // Actualizar los valores en el estado local
        const updatedPrestador = {
          ...prestador,
          precioEmergencia: precioEmergencia !== undefined ? precioEmergencia : prestador.precioEmergencia,
          disponibleEmergencias: disponibleEmergencias !== undefined ? disponibleEmergencias : prestador.disponibleEmergencias,
          ubicacionActual: ubicacionActualizada ? {
            coordenadas: ubicacionActualizada,
            ultimaActualizacion: new Date()
          } : (disponibleEmergencias === false ? undefined : prestador.ubicacionActual)
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
      set({ 
        error: "Error al actualizar la configuración de emergencias: " + (error.message || error),
        isLoading: false
      });
      return null;
    }
  },
  //cantidad de emergencias del prestador (veterinario)
  getCantidadEmergencias: async () => {
    const { prestador } = get();

    if (!prestador || !prestador._id) {
      set({ error: "No hay perfil de prestador cargado" });
      return null;
    }
    
    // Validar que el prestador sea veterinario
    if (prestador.tipo !== 'Veterinario') {
      set({ error: "Solo los veterinarios pueden obtener la cantidad de emergencias" });
      return null;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const result = await prestadorServicePrestador.getCantidadEmergencias();
      
      if (result.success) {
        set({ 
          prestador: {
            ...prestador,
            cantidadEmergencias: result.data.cantidad,
            cantidadEmergenciasAtendidas: result.data.cantidadAtendidas
          },
          isLoading: false
        });
        return result.data;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      set({ 
        error: "Error al obtener la cantidad de emergencias",
        isLoading: false
      });
      return null;
    }
  }
}));

export default usePrestadorStore;
