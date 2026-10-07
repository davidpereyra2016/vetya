import logger from '../utils/logger';
import { create } from 'zustand';
import { pagoService } from '../services/api';

/**
 * Store para manejar el estado de pagos con Mercado Pago (Prestador)
 * Los prestadores consultan el estado de pagos asociados a sus servicios
 */
const usePagoStore = create((set, get) => ({
  // ============================================
  // 📊 Estado
  // ============================================
  pagos: [],
  pagoActual: null,
  estadisticas: null,
  cashDebtInfo: null,
  isLoading: false,
  error: null,

  // ============================================
  // 🔷 Acciones de Consulta de Pagos
  // ============================================

  /**
   * Consultar estado de un pago específico
   * Los prestadores pueden ver el estado del pago de un servicio
   */
  consultarEstadoPago: async (paymentId) => {
    set({ isLoading: true, error: null });
    
    try {

      const result = await pagoService.consultarEstadoPago(paymentId);
      
      if (result.success) {
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        logger.error('❌ Store (Prestador): Error al consultar estado:', result.error);
        set({ error: result.error, isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error('❌ Store (Prestador): Excepción al consultar estado:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener todos los pagos del prestador
   * Lista de pagos donde el prestador es el destinatario
   */
  obtenerMisPagos: async () => {
    set({ isLoading: true, error: null });
    
    try {

      const result = await pagoService.obtenerMisPagos();
      
      if (result.success) {
        
        set({ 
          pagos: result.data.pagos || [],
          estadisticas: result.data.estadisticas || null,
          cashDebtInfo: result.data.estadisticas
            ? {
                cashDebt: result.data.estadisticas.deudaEfectivo || 0,
                canAcceptCash: result.data.estadisticas.canAcceptCash !== false,
                payment: result.data.estadisticas.cashDebtPayment || {},
              }
            : null,
          isLoading: false 
        });
        return { success: true, data: result.data };
      } else {
        logger.error('❌ Store (Prestador): Error al obtener pagos:', result.error);
        set({ error: result.error, isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error('❌ Store (Prestador): Excepción al obtener pagos:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener pagos por referencia (emergencia o cita específica)
   * Útil para ver el pago asociado a un servicio específico
   */
  obtenerPagosPorReferencia: async (tipo, id) => {
    set({ isLoading: true, error: null });
    
    try {

      const result = await pagoService.obtenerPagosPorReferencia(tipo, id);
      
      if (result.success) {
        
        // Si hay pagos, establecer el primero como pago actual
        if (result.data && result.data.length > 0) {
          set({ 
            pagoActual: result.data[0],
            isLoading: false 
          });
        } else {
          set({ 
            pagoActual: null,
            isLoading: false 
          });
        }
        
        return { success: true, data: result.data };
      } else {
        logger.error('❌ Store (Prestador): Error al obtener pagos por referencia:', result.error);
        set({ error: result.error, isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error('❌ Store (Prestador): Excepción al obtener pagos por referencia:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Limpiar el pago actual del estado
   */
  limpiarPagoActual: () => {
    set({ pagoActual: null });
  },

  /**
   * Limpiar errores del estado
   */
  limpiarError: () => {
    set({ error: null });
  },

  /**
   * Resetear todo el estado del store
   */
  resetStore: () => {
    set({
      pagos: [],
      pagoActual: null,
      estadisticas: null,
      cashDebtInfo: null,
      isLoading: false,
      error: null
    });
  }
}));

export default usePagoStore;
