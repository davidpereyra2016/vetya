import { create } from 'zustand';
import { pagoService } from '../services/api';

/**
 * Store para manejar el estado de pagos con Mercado Pago
 * Maneja la creación de preferencias, captura de pagos y consultas de estado
 */
const usePagoStore = create((set, get) => ({
  // ============================================
  // 📊 Estado
  // ============================================
  pagos: [],
  pagoActual: null,
  isLoading: false,
  error: null,

  // ============================================
  // 🔷 Acciones de Pagos
  // ============================================

  /**
   * Crear preferencia de pago en Mercado Pago
   * Se llama cuando el cliente quiere pagar una emergencia/cita
   */
  crearPreferencia: async (emergenciaId, citaId, monto, descripcion, idempotencyKey) => {
    set({ isLoading: true, error: null });
    
    try {
      // console.log('🔵 Store: Creando preferencia de pago...', {
      //   emergenciaId,
      //   citaId,
      //   monto
      // });

      const args = [emergenciaId, citaId, monto, descripcion];
      if (idempotencyKey) args.push(idempotencyKey);

      const result = await pagoService.crearPreferencia(...args);
      
      if (result.success) {
        // console.log('✅ Store: Preferencia creada exitosamente', result.data);
        
        set({ 
          pagoActual: result.data.pago,
          isLoading: false 
        });
        
        return {
          success: true,
          preferenceId: result.data.preferenceId,
          initPoint: result.data.initPoint,
          pago: result.data.pago
        };
      } else {
        console.error('❌ Store: Error al crear preferencia:', result.error);
        set({ error: result.error, isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Store: Excepción al crear preferencia:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Registrar un pago en efectivo (cita o emergencia).
   * Crea un Pago en estado "Pendiente" hasta que se complete el servicio.
   */
  crearPagoEfectivo: async (emergenciaId, citaId, monto, descripcion, idempotencyKey) => {
    set({ isLoading: true, error: null });

    try {
      const args = [emergenciaId, citaId, monto, descripcion];
      if (idempotencyKey) args.push(idempotencyKey);

      const result = await pagoService.crearPagoEfectivo(...args);

      if (result.success) {
        set({
          pagoActual: result.data.pago,
          isLoading: false,
        });
        return { success: true, pago: result.data.pago };
      } else {
        console.error('❌ Store: Error al crear pago en efectivo:', result.error);
        set({ error: result.error, isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Store: Excepción al crear pago en efectivo:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Capturar pago cuando el servicio se completa
   * El cliente confirma que el servicio fue completado satisfactoriamente
   */
  capturarPago: async (pagoId) => {
    set({ isLoading: true, error: null });
    
    try {
      // console.log('🔵 Store: Capturando pago...', pagoId);

      const result = await pagoService.capturarPago(pagoId);
      
      if (result.success) {
        // console.log('✅ Store: Pago capturado exitosamente', result.data);
        
        set({ 
          pagoActual: result.data.pago,
          isLoading: false 
        });
        
        return { success: true, pago: result.data.pago };
      } else {
        console.error('❌ Store: Error al capturar pago:', result.error);
        set({ error: result.error, isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Store: Excepción al capturar pago:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Consultar estado de un pago específico
   */
  consultarEstadoPago: async (paymentId) => {
    set({ isLoading: true, error: null });
    
    try {
      // console.log('🔵 Store: Consultando estado del pago...', paymentId);

      const result = await pagoService.consultarEstadoPago(paymentId);
      
      if (result.success) {
        // console.log('✅ Store: Estado consultado:', result.data);
        set({ isLoading: false });
        return { success: true, data: result.data };
      } else {
        console.error('❌ Store: Error al consultar estado:', result.error);
        set({ error: result.error, isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Store: Excepción al consultar estado:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancelar un pago pendiente
   */
  cancelarPago: async (pagoId) => {
    set({ isLoading: true, error: null });
    
    try {
      // console.log('🔵 Store: Cancelando pago...', pagoId);

      const result = await pagoService.cancelarPago(pagoId);
      
      if (result.success) {
        // console.log('✅ Store: Pago cancelado exitosamente', result.data);
        
        set({ 
          pagoActual: null,
          isLoading: false 
        });
        
        return { success: true };
      } else {
        console.error('❌ Store: Error al cancelar pago:', result.error);
        set({ error: result.error, isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Store: Excepción al cancelar pago:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener todos los pagos del usuario
   */
  obtenerPagos: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // console.log('🔵 Store: Obteniendo pagos del usuario...');

      const result = await pagoService.obtenerPagos();
      
      if (result.success) {
        // console.log('✅ Store: Pagos obtenidos:', result.data.length);
        
        set({ 
          pagos: result.data,
          isLoading: false 
        });
      } else {
        console.error('❌ Store: Error al obtener pagos:', result.error);
        set({ error: result.error, isLoading: false });
      }
    } catch (error) {
      console.error('❌ Store: Excepción al obtener pagos:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  /**
   * Obtener pagos por referencia (emergencia o cita específica)
   */
  obtenerPagosPorReferencia: async (tipo, id) => {
    set({ isLoading: true, error: null });
    
    try {
      // console.log('🔵 Store: Obteniendo pagos por referencia...', { tipo, id });

      const result = await pagoService.obtenerPagosPorReferencia(tipo, id);
      
      if (result.success) {
        // console.log('✅ Store: Pagos encontrados:', result.data);
        
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
        console.error('❌ Store: Error al obtener pagos por referencia:', result.error);
        set({ error: result.error, isLoading: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Store: Excepción al obtener pagos por referencia:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Limpiar el pago actual del estado
   */
  limpiarPagoActual: () => {
    // console.log('🧹 Store: Limpiando pago actual');
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
    // console.log('🧹 Store: Reseteando store de pagos');
    set({
      pagos: [],
      pagoActual: null,
      isLoading: false,
      error: null
    });
  }
}));

export default usePagoStore;
