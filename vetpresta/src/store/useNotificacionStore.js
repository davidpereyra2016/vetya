import { create } from 'zustand';
import { notificacionService } from '../services/apiNotificacion';

/**
 * Store para manejar el estado de notificaciones
 * Proporciona métodos para cargar, marcar como leídas y eliminar notificaciones
 */
const useNotificacionStore = create((set, get) => ({
  // Estado
  notificaciones: [],
  notificacionesNoLeidas: [],
  conteoNoLeidas: 0,
  isLoading: false,
  error: null,
  
  // Restablecer el estado
  reset: () => {
    set({
      notificaciones: [],
      notificacionesNoLeidas: [],
      conteoNoLeidas: 0,
      isLoading: false,
      error: null
    });
  },
  
  // Cargar todas las notificaciones
  loadNotificaciones: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificacionService.getAll();
      
      if (result.success) {
        // Ordenar por fecha, más recientes primero
        const sortedNotificaciones = result.data.sort((a, b) => {
          return new Date(b.fechaEnvio) - new Date(a.fechaEnvio);
        });
        
        // Filtrar no leídas
        const noLeidas = sortedNotificaciones.filter(n => !n.leida);
        
        set({ 
          notificaciones: sortedNotificaciones,
          notificacionesNoLeidas: noLeidas,
          conteoNoLeidas: noLeidas.length,
          isLoading: false
        });
        
        return sortedNotificaciones;
      } else {
        console.log('Error al cargar notificaciones:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      console.log('Error al cargar notificaciones:', error);
      set({ 
        error: "Error al cargar notificaciones",
        isLoading: false
      });
      return [];
    }
  },
  
  // Cargar solo las notificaciones no leídas
  loadUnreadNotificaciones: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificacionService.getAll(false); // false = no leídas
      
      if (result.success) {
        // Ordenar por fecha, más recientes primero
        const sortedNotificaciones = result.data.sort((a, b) => {
          return new Date(b.fechaEnvio) - new Date(a.fechaEnvio);
        });
        
        set({ 
          notificacionesNoLeidas: sortedNotificaciones,
          conteoNoLeidas: sortedNotificaciones.length,
          isLoading: false
        });
        
        return sortedNotificaciones;
      } else {
        console.log('Error al cargar notificaciones no leídas:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      console.log('Error al cargar notificaciones no leídas:', error);
      set({ 
        error: "Error al cargar notificaciones no leídas",
        isLoading: false
      });
      return [];
    }
  },
  
  // Actualizar conteo de notificaciones no leídas
  updateUnreadCount: async () => {
    try {
      const result = await notificacionService.getUnreadCount();
      
      if (result.success) {
        set({ conteoNoLeidas: result.data.conteo });
        return result.data.conteo;
      } else {
        console.log('Error al obtener conteo de notificaciones:', result.error);
        return 0;
      }
    } catch (error) {
      console.log('Error al obtener conteo de notificaciones:', error);
      return 0;
    }
  },
  
  // Marcar una notificación como leída
  markAsRead: async (notificacionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificacionService.markAsRead(notificacionId);
      
      if (result.success) {
        // Actualizar estado local
        const { notificaciones, notificacionesNoLeidas } = get();
        
        // Actualizar en la lista completa
        const updatedNotificaciones = notificaciones.map(n => 
          n._id === notificacionId ? { ...n, leida: true, fechaLectura: new Date() } : n
        );
        
        // Filtrar de la lista de no leídas
        const updatedNoLeidas = notificacionesNoLeidas.filter(n => n._id !== notificacionId);
        
        set({ 
          notificaciones: updatedNotificaciones,
          notificacionesNoLeidas: updatedNoLeidas,
          conteoNoLeidas: updatedNoLeidas.length,
          isLoading: false
        });
        
        return { success: true };
      } else {
        console.log('Error al marcar notificación como leída:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.log('Error al marcar notificación como leída:', error);
      set({ 
        error: "Error al marcar notificación como leída",
        isLoading: false
      });
      return { success: false, error: "Error al marcar notificación como leída" };
    }
  },
  
  // Marcar todas las notificaciones como leídas
  markAllAsRead: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificacionService.markAllAsRead();
      
      if (result.success) {
        // Actualizar estado local
        const { notificaciones } = get();
        
        // Actualizar todas las notificaciones como leídas
        const updatedNotificaciones = notificaciones.map(n => 
          !n.leida ? { ...n, leida: true, fechaLectura: new Date() } : n
        );
        
        set({ 
          notificaciones: updatedNotificaciones,
          notificacionesNoLeidas: [],
          conteoNoLeidas: 0,
          isLoading: false
        });
        
        return { success: true };
      } else {
        console.log('Error al marcar todas las notificaciones como leídas:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.log('Error al marcar todas las notificaciones como leídas:', error);
      set({ 
        error: "Error al marcar todas las notificaciones como leídas",
        isLoading: false
      });
      return { success: false, error: "Error al marcar todas las notificaciones como leídas" };
    }
  },
  
  // Eliminar una notificación
  deleteNotification: async (notificacionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificacionService.delete(notificacionId);
      
      if (result.success) {
        // Actualizar estado local
        const { notificaciones, notificacionesNoLeidas } = get();
        
        // Filtrar de ambas listas
        const updatedNotificaciones = notificaciones.filter(n => n._id !== notificacionId);
        const updatedNoLeidas = notificacionesNoLeidas.filter(n => n._id !== notificacionId);
        
        set({ 
          notificaciones: updatedNotificaciones,
          notificacionesNoLeidas: updatedNoLeidas,
          conteoNoLeidas: updatedNoLeidas.length,
          isLoading: false
        });
        
        return { success: true };
      } else {
        console.log('Error al eliminar notificación:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.log('Error al eliminar notificación:', error);
      set({ 
        error: "Error al eliminar notificación",
        isLoading: false
      });
      return { success: false, error: "Error al eliminar notificación" };
    }
  },
  
  // Enviar notificación de emergencia a un prestador (veterinario)
  sendEmergencyNotification: async (emergenciaId, prestadorId, clienteNombre, mascotaNombre, tipoEmergencia) => {
    set({ isLoading: true, error: null });
    
    try {
      const data = {
        emergenciaId,
        prestadorId,
        clienteNombre,
        mascotaNombre,
        tipoEmergencia
      };
      
      const result = await notificacionService.sendEmergencyNotification(data);
      
      set({ isLoading: false });
      
      if (result.success) {
        return { 
          success: true, 
          data: result.data 
        };
      } else {
        console.log('Error al enviar notificación de emergencia:', result.error);
        set({ error: result.error });
        return { 
          success: false, 
          error: result.error 
        };
      }
    } catch (error) {
      console.log('Error al enviar notificación de emergencia:', error);
      set({ 
        error: "Error al enviar notificación de emergencia",
        isLoading: false
      });
      return { 
        success: false, 
        error: "Error al enviar notificación de emergencia" 
      };
    }
  }
}));

export default useNotificacionStore;
