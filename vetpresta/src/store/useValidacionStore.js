import { create } from 'zustand';
import { validacionService } from '../services/api';
import useAuthStore from './useAuthStore';

/**
 * Store para gestionar el estado de validación de prestadores usando Zustand
 */
const useValidacionStore = create((set, get) => ({
  // Estado inicial
  estadoValidacion: null,
  prestadorTipo: null,
  progreso: {
    total: 0,
    subidos: 0,
    aprobados: 0,
    porcentajeSubida: 0,
    porcentajeAprobacion: 0
  },
  documentosRequeridos: [],
  datosAdicionales: {},
  documentos: {},
  observacionesAdmin: null,
  fechaEnvioDocumentos: null,
  fechaAprobacion: null,
  fechaRechazo: null,
  isLoading: false,
  error: null,
  uploadProgress: {},
  pollingInterval: null,

  // Acciones
  
  /**
   * Inicializar estado de validación desde el provider si ya está aprobado
   */
  initializeFromProvider: (provider) => {
    if (provider?.estadoValidacion === 'aprobado') {
      const { estadoValidacion } = get();
      // Solo inicializar si no tenemos estado o es diferente
      if (!estadoValidacion || estadoValidacion !== 'aprobado') {
        console.log('🚀 Inicializando estado de validación desde provider: aprobado');
        set({
          estadoValidacion: 'aprobado',
          prestadorTipo: provider.tipo || null,
          isLoading: false,
          error: null
        });
      }
    }
  },

  /**
   * Obtener el estado actual de validación del prestador
   */
  fetchEstadoValidacion: async (forceRefresh = false) => {
    const { estadoValidacion } = get();
    
    // ✅ OPTIMIZACIÓN: Si ya está aprobado y no es un refresh forzado, no hacer request
    if (estadoValidacion === 'aprobado' && !forceRefresh) {
      console.log('⚡ Validación ya aprobada, evitando request innecesario');
      return { success: true, data: { estadoValidacion: 'aprobado' } };
    }
    
    set({ isLoading: true, error: null });
    try {
      const result = await validacionService.getEstadoValidacion();
      
      if (result.success) {
        const newEstado = result.data.estadoValidacion;
        
        set({
          estadoValidacion: newEstado,
          prestadorTipo: result.data.prestadorTipo,
          progreso: result.data.progreso,
          documentosRequeridos: result.data.documentosRequeridos,
          datosAdicionales: result.data.datosAdicionales,
          documentos: result.data.documentos,
          observacionesAdmin: result.data.observacionesAdmin,
          fechaEnvioDocumentos: result.data.fechaEnvioDocumentos,
          fechaAprobacion: result.data.fechaAprobacion,
          fechaRechazo: result.data.fechaRechazo,
          isLoading: false
        });
        
        // Si el prestador fue aprobado, actualizar el estado en el store de auth
        if (newEstado === 'aprobado') {
          const authStore = useAuthStore.getState();
          if (authStore.provider && authStore.updateProvider) {
            authStore.updateProvider({
              ...authStore.provider,
              estadoValidacion: 'aprobado',
              verificado: true,
              activo: true
            });
          }
          // ✅ Detener cualquier polling activo cuando se aprueba
          get().stopPolling();
        }
        
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al obtener estado de validación';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Actualizar datos adicionales del prestador
   */
  updateDatosAdicionales: async (datos) => {
    set({ isLoading: true, error: null });
    try {
      const result = await validacionService.updateDatosAdicionales(datos);
      
      if (result.success) {
        set(state => ({
          datosAdicionales: { ...state.datosAdicionales, ...result.data.datosAdicionales },
          isLoading: false
        }));
        
        // Si se devolvieron datos del prestador, actualizar el store de auth
        if (result.data.prestador) {
          const { updateProvider } = require('./useAuthStore').default.getState();
          updateProvider(result.data.prestador);
        }
        
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al actualizar datos adicionales';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Subir documento de validación
   */
  subirDocumento: async (tipoDocumento, archivo, descripcion = '') => {
    set(state => ({
      uploadProgress: { ...state.uploadProgress, [tipoDocumento]: 0 },
      error: null
    }));

    try {
      const result = await validacionService.subirDocumento(
        tipoDocumento, 
        archivo, 
        descripcion,
        (progress) => {
          // Callback de progreso
          set(state => ({
            uploadProgress: { ...state.uploadProgress, [tipoDocumento]: progress }
          }));
        }
      );
      
      if (result.success) {
        // Actualizar el documento en el estado local
        set(state => ({
          documentos: {
            ...state.documentos,
            [tipoDocumento]: result.data.documento
          },
          progreso: result.data.progreso,
          estadoValidacion: result.data.estadoValidacion,
          uploadProgress: { ...state.uploadProgress, [tipoDocumento]: 100 }
        }));

        // Limpiar progreso después de un delay
        setTimeout(() => {
          set(state => {
            const newProgress = { ...state.uploadProgress };
            delete newProgress[tipoDocumento];
            return { uploadProgress: newProgress };
          });
        }, 2000);

        return { success: true, data: result.data };
      } else {
        set(state => {
          const newProgress = { ...state.uploadProgress };
          delete newProgress[tipoDocumento];
          return { uploadProgress: newProgress, error: result.error };
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al subir documento';
      set(state => {
        const newProgress = { ...state.uploadProgress };
        delete newProgress[tipoDocumento];
        return { uploadProgress: newProgress, error: errorMessage };
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Eliminar documento subido
   */
  eliminarDocumento: async (tipoDocumento, indice = null) => {
    set({ isLoading: true, error: null });
    try {
      const result = await validacionService.eliminarDocumento(tipoDocumento, indice);
      
      if (result.success) {
        // Actualizar el estado local
        set(state => {
          const newDocumentos = { ...state.documentos };
          
          if (tipoDocumento === 'documentosAdicionales' && indice !== null) {
            // Eliminar documento adicional específico
            if (newDocumentos.documentosAdicionales) {
              newDocumentos.documentosAdicionales.splice(indice, 1);
            }
          } else {
            // Eliminar documento específico
            delete newDocumentos[tipoDocumento];
          }
          
          return {
            documentos: newDocumentos,
            progreso: result.data.progreso,
            isLoading: false
          };
        });
        
        return { success: true, data: result.data };
      } else {
        set({ isLoading: false, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al eliminar documento';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Verificar si un documento específico está subido
   */
  isDocumentoSubido: (tipoDocumento) => {
    const { documentos } = get();
    return documentos[tipoDocumento] && documentos[tipoDocumento].url;
  },

  /**
   * Obtener el estado de un documento específico
   */
  getEstadoDocumento: (tipoDocumento) => {
    const { documentos } = get();
    const documento = documentos[tipoDocumento];
    if (!documento || !documento.url) return 'no_subido';
    return documento.estado || 'pendiente';
  },

  /**
   * Verificar si el prestador puede acceder a funcionalidades completas
   */
  canAccessFullFeatures: () => {
    const { estadoValidacion } = get();
    return estadoValidacion === 'aprobado';
  },

  /**
   * Obtener mensaje descriptivo del estado actual
   */
  getEstadoMessage: () => {
    const { estadoValidacion, getDocumentosConErrores } = get();
    const documentosConErrores = getDocumentosConErrores();
    const tieneDocumentosRechazados = documentosConErrores.length > 0;
    
    const messages = {
      'pendiente_documentos': 'Debe completar la carga de documentos requeridos para la validación.',
      'en_revision': tieneDocumentosRechazados 
        ? 'Algunos documentos fueron rechazados y requieren corrección. Revise los documentos rechazados y vuelva a subirlos.'
        : 'Sus documentos están siendo revisados por nuestro equipo. Recibirá una notificación cuando el proceso esté completo.',
      'aprobado': 'Su cuenta ha sido aprobada. Puede acceder a todas las funcionalidades.',
      'rechazado': 'Su solicitud ha sido rechazada. Contacte con soporte para más información.',
      'requiere_correccion': 'Algunos documentos requieren corrección. Revise las observaciones y vuelva a subirlos.'
    };
    
    return messages[estadoValidacion] || 'Estado de validación desconocido.';
  },

  /**
   * Obtener documentos que requieren corrección
   */
  getDocumentosConErrores: () => {
    const { documentos } = get();
    const documentosConErrores = [];
    
    Object.keys(documentos).forEach(tipoDoc => {
      const doc = documentos[tipoDoc];
      if (doc && doc.estado === 'rechazado') {
        documentosConErrores.push({
          tipo: tipoDoc,
          observaciones: doc.observaciones
        });
      }
    });
    
    return documentosConErrores;
  },

  /**
   * Limpiar errores
   */
  clearError: () => set({ error: null }),

  /**
   * Iniciar polling automático para verificar cambios de estado
   */
  startPolling: () => {
    const { pollingInterval, fetchEstadoValidacion, estadoValidacion } = get();
    
    // Solo hacer polling si está en revisión
    if (estadoValidacion === 'en_revision' && !pollingInterval) {
      const interval = setInterval(async () => {
        const { estadoValidacion: currentState } = get();
        
        // Solo continuar polling si sigue en revisión
        if (currentState === 'en_revision') {
          await fetchEstadoValidacion();
        } else {
          // Detener polling si cambió el estado
          get().stopPolling();
        }
      }, 30000); // Verificar cada 30 segundos
      
      set({ pollingInterval: interval });
    }
  },

  /**
   * Detener polling automático
   */
  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  /**
   * Reset del estado de validación
   */
  resetValidacionState: () => {
    const { stopPolling } = get();
    stopPolling();
    
    set({
      estadoValidacion: null,
      prestadorTipo: null,
      progreso: {
        total: 0,
        subidos: 0,
        aprobados: 0,
        porcentajeSubida: 0,
        porcentajeAprobacion: 0
      },
      documentosRequeridos: [],
      datosAdicionales: {},
      documentos: {},
      observacionesAdmin: null,
      fechaEnvioDocumentos: null,
      fechaAprobacion: null,
      fechaRechazo: null,
      isLoading: false,
      error: null,
      uploadProgress: {},
      pollingInterval: null
    });
  }
}));

export default useValidacionStore;
