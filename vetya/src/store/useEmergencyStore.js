import { create } from 'zustand';
import { emergenciaService, veterinarioService } from '../services/api';

const ACTIVE_EMERGENCY_STATES = ['Solicitada', 'Asignada', 'Confirmada', 'En camino', 'En atención'];

const getEmergencyId = (emergency) => emergency?._id || emergency?.id;

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
      const result = await veterinarioService.getAvailableForEmergencies();
      
      if (result.success) {
        set({ 
          availableVets: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      set({ 
        error: "Error al cargar veterinarios disponibles",
        isLoading: false
      });
      return [];
    }
  },
  
  // Cargar veterinarios disponibles con ubicación en tiempo real
  loadVetsWithLocation: async (clientLat, clientLng) => {
    set({ isLoading: true, error: null });
    
    console.log(' [STORE] Cargando vets con ubicación. Cliente:', { clientLat, clientLng });
    
    try {
      const result = await veterinarioService.getAvailableVetsWithLocation(clientLat, clientLng);
      
      if (result.success) {
        console.log(' [STORE] Vets recibidos del backend:', result.data?.length || 0);
        
        // Procesar los datos para formato amigable en el mapa, aplicando el radio de privacidad
        const processedVets = result.data.map(vet => {
          console.log('   [STORE] Procesando:', vet.nombre, '-> ubicacionActual:', vet.ubicacionActual?.coordenadas || 'SIN COORDENADAS');
          
          // Obtener distancia real desde la API
          const realDistanceKm = vet.distancia?.valor || 0;
          
          // Aplicar radio de privacidad (por defecto 1km)
          const privacyRadius = vet.radio || 1;
          
          // Asegurar que nunca se muestre una distancia menor a privacyRadius km
          // Si la distancia real es menor a privacyRadius, mostramos privacyRadius
          // Si es mayor, añadimos el radio de privacidad a la distancia real
          const adjustedDistanceKm = realDistanceKm < privacyRadius 
            ? privacyRadius 
            : realDistanceKm + privacyRadius;
          
          // Formatear la distancia para mostrar
          const displayDistance = adjustedDistanceKm < 1 
            ? '1.0 km'  // Garantiza un mínimo de 1km
            : `${adjustedDistanceKm.toFixed(1)} km`;
          
          // Calcular tiempo estimado basado en la distancia ajustada
          // Asumiendo velocidad promedio de 30 km/h en zonas urbanas
          // 30 km/h = 0.5 km/min
          const speedKmPerMin = 0.5; // 30 km/h ÷ 60 min
          const estimatedMinutes = Math.ceil(adjustedDistanceKm / speedKmPerMin);
          
          // Garantizar un tiempo mínimo de 2 minutos
          const displayMinutes = Math.max(estimatedMinutes, 2);
          const displayTime = `${displayMinutes} min`;

          const processed = {
            id: vet._id,
            name: vet.nombre,
            specialty: vet.especialidades?.join(', ') || 'Veterinario general',
            rating: vet.rating || 4.5,
            distance: displayDistance,
            distanceValue: adjustedDistanceKm,
            estimatedTime: displayTime,
            estimatedTimeValue: displayMinutes,
            price: vet.precioEmergencia || 0,
            image: vet.imagen || null,
            coordinate: vet.ubicacionActual?.coordenadas ? {
              latitude: vet.ubicacionActual.coordenadas.lat,
              longitude: vet.ubicacionActual.coordenadas.lng
            } : null,
            radio: privacyRadius,
            lastUpdate: vet.ubicacionActual?.ultimaActualizacion || new Date()
          };
          
          console.log('   [STORE] Vet procesado:', processed.name, '-> coordenadas:', processed.coordinate || 'NULL');
          return processed;
        });
        
        console.log(' [STORE] Total procesados:', processedVets.length);
        
        set({ 
          availableVets: processedVets,
          isLoading: false
        });
        return processedVets;
      } else {
        console.error(' [STORE] Error del backend:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      console.error(' [STORE] Error:', error);
      set({ 
        error: "Error al obtener veterinarios con ubicación",
        isLoading: false
      });
      return [];
    }
  },
  
  // Cargar emergencias activas del usuario
  loadActiveEmergencies: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await emergenciaService.getActiveEmergencies();
      
      if (result.success) {
        
        // Verificar si hay emergencias en estado "Solicitada" que puedan haber expirado
        const emergenciasActualizadas = [...result.data];
        let cambiosRealizados = false;
        
        for (let i = 0; i < emergenciasActualizadas.length; i++) {
          const emergencia = emergenciasActualizadas[i];
          let debeVerificarExpiracion = false;
          let fechaExpiracionRelevante = null;

          if (emergencia.estado === 'Solicitada' && emergencia.expiraEn) {
            fechaExpiracionRelevante = new Date(emergencia.expiraEn);
            if (new Date() > fechaExpiracionRelevante) {
              debeVerificarExpiracion = true;
            }
          } else if (emergencia.estado === 'Asignada' && emergencia.expiraRespuestaVetEn) {
            fechaExpiracionRelevante = new Date(emergencia.expiraRespuestaVetEn);
            if (new Date() > fechaExpiracionRelevante) {
              debeVerificarExpiracion = true;
            }
          }
          // Fallback si los campos de expiración no están pero deberían (poco probable con la lógica del backend)
          else if (emergencia.estado === 'Solicitada' && emergencia.fechaSolicitud) {
            fechaExpiracionRelevante = new Date(new Date(emergencia.fechaSolicitud).getTime() + 5 * 60 * 1000);
             if (new Date() > fechaExpiracionRelevante) debeVerificarExpiracion = true;
          } else if (emergencia.estado === 'Asignada' && emergencia.fechaAsignacion) {
            fechaExpiracionRelevante = new Date(new Date(emergencia.fechaAsignacion).getTime() + 5 * 60 * 1000);
            if (new Date() > fechaExpiracionRelevante) debeVerificarExpiracion = true;
          }

          if (debeVerificarExpiracion) {
            const verifyResult = await emergenciaService.checkEmergencyExpiration(emergencia._id);
            if (verifyResult.success && verifyResult.data && verifyResult.data.emergencia) {
              emergenciasActualizadas[i] = verifyResult.data.emergencia;
              cambiosRealizados = true;
            }
          }
        }
        
        // Si se realizaron cambios, filtrar emergencias canceladas/expiradas
        const emergenciasFiltradas = cambiosRealizados ? 
          emergenciasActualizadas.filter(e => e.estado !== 'Cancelada') : emergenciasActualizadas;
        
        set({ 
          activeEmergencies: emergenciasFiltradas,
          isLoading: false
        });
        return emergenciasFiltradas;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      set({ 
        error: "Error al cargar emergencias activas",
        isLoading: false
      });
      return [];
    }
  },

  // Cargar TODAS las emergencias del usuario (activas + historial)
  loadAllEmergencies: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await emergenciaService.getAllEmergencies();
      
      if (result.success) {
        // Devolver todas las emergencias sin filtrar
        set({ 
          activeEmergencies: result.data,
          isLoading: false
        });
        return result.data;
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      set({ 
        error: "Error al cargar emergencias",
        isLoading: false
      });
      return [];
    }
  },
  
  // Verificar si una emergencia ha expirado
  checkEmergencyExpiration: async (emergencyId) => {
    try {
      const result = await emergenciaService.checkEmergencyExpiration(emergencyId);
      if (result.success) {
        // Si la emergencia ha expirado y se ha cancelado automáticamente
        if (result.data.emergencia.estado === 'Cancelada') {
          // Actualizar el estado local para reflejar la cancelación
          set(state => ({
            activeEmergencies: state.activeEmergencies.filter(e => e._id !== emergencyId)
          }));
        }
        return result.data;
      } else {
        return {
          tiempoRestante: 0,
          expirada: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        tiempoRestante: 0,
        expirada: false,
        error: 'Error al verificar expiración'
      };
    }
  },
  
  // Crear una nueva emergencia
  createEmergency: async (emergencyData, images = []) => {
    set({ isLoading: true, error: null });
    
    try {
      // Si hay imágenes, subirlas primero
      let imageUrls = [];
      if (images && images.length > 0) {
        const uploadResult = await emergenciaService.uploadEmergencyImages(images);
        
        if (uploadResult.success) {
          imageUrls = uploadResult.data.urls;
        } else {
          set({ 
            error: uploadResult.error,
            isLoading: false
          });
          return { success: false, error: uploadResult.error };
        }
      }
      
      // Verificar si es una emergencia para otro animal o para mascota registrada
      const esOtroAnimal = emergencyData.emergencyMode === 'otroAnimal';
      
      // Preparar los datos según el tipo de emergencia
      const dataToSend = {
        // Datos comunes para ambos tipos
        descripcion: emergencyData.descripcion,
        tipoEmergencia: emergencyData.tipoEmergencia,
        nivelUrgencia: emergencyData.nivelUrgencia || 'Media',
        ubicacion: emergencyData.ubicacion,
        imagenes: imageUrls,
        // Indicador del tipo de emergencia
        esOtroAnimal: esOtroAnimal
      };
      
      // Añadir datos específicos según el tipo de emergencia
      if (esOtroAnimal) {
        // Para otro animal, añadimos los datos del animal no registrado
        dataToSend.otroAnimal = {
          tipo: emergencyData.otroAnimal?.tipo || 'Perro',
          descripcionAnimal: emergencyData.otroAnimal?.descripcionAnimal || '',
          condicion: emergencyData.otroAnimal?.condicion || '',
          ubicacionExacta: emergencyData.otroAnimal?.ubicacionExacta || ''
        };
      } else {
        // Para mascota registrada, incluimos el ID de la mascota
        if (!emergencyData.mascota) {
          const error = 'No se ha seleccionado una mascota';
          set({ error, isLoading: false });
          return { success: false, error };
        }
        dataToSend.mascota = emergencyData.mascota;
      }
      
      const result = await emergenciaService.create(dataToSend);
      
      if (result.success) {
        // Agregar la nueva emergencia a la lista de emergencias activas
        set(state => ({ 
          selectedEmergency: result.data,
          activeEmergencies: [...state.activeEmergencies, result.data],
          isLoading: false
        }));
        
        return { success: true, data: result.data };
      } else {
        set({ 
          error: result.error,
          isLoading: false
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
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
      const result = await emergenciaService.cancelEmergency(emergencyId);
      
      if (result.success) {
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
        set({ 
          error: result.error,
          isLoading: false
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
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
  },

  applySocketEmergencyUpdate: (emergency) => {
    if (!emergency) return get().activeEmergencies;

    const emergencyId = getEmergencyId(emergency);
    if (!emergencyId) return get().activeEmergencies;

    let nextActiveEmergencies = [];

    set(state => {
      const shouldRemainActive = ACTIVE_EMERGENCY_STATES.includes(emergency.estado);
      const exists = state.activeEmergencies.some(item => getEmergencyId(item) === emergencyId);

      if (shouldRemainActive) {
        nextActiveEmergencies = exists
          ? state.activeEmergencies.map(item =>
              getEmergencyId(item) === emergencyId ? { ...item, ...emergency } : item
            )
          : [emergency, ...state.activeEmergencies];
      } else {
        nextActiveEmergencies = state.activeEmergencies.filter(item => getEmergencyId(item) !== emergencyId);
      }

      return {
        activeEmergencies: nextActiveEmergencies,
        selectedEmergency: getEmergencyId(state.selectedEmergency) === emergencyId
          ? { ...state.selectedEmergency, ...emergency }
          : state.selectedEmergency,
      };
    });

    return nextActiveEmergencies;
  },
  
  // Asignar un veterinario a una emergencia existente
  assignVetToEmergency: async (emergencyId, vetId) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log(`Asignando veterinario ${vetId} a emergencia ${emergencyId}`);
      const response = await emergenciaService.assignVetToEmergency(emergencyId, vetId);
      
      if (response.success) {
        console.log('Veterinario asignado correctamente a la emergencia');
        
        // Actualizar la emergencia seleccionada con los datos del backend
        const updatedEmergencyData = response.data;
        if (get().selectedEmergency && get().selectedEmergency._id === emergencyId) {
          set(state => ({
            selectedEmergency: { ...state.selectedEmergency, ...updatedEmergencyData }
          }));
        }
        
        // Actualizar en la lista de emergencias activas
        set(state => ({
          activeEmergencies: state.activeEmergencies.map(em => 
            em._id === emergencyId 
              ? { ...em, ...updatedEmergencyData } 
              : em
          ),
          isLoading: false
        }));
        
        return { success: true, data: response.data };
      } else {
        console.log('Error al asignar veterinario:', response.error);
        set({ 
          error: response.error,
          isLoading: false
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error al asignar veterinario a emergencia:', error);
      set({ 
        error: "Error al asignar veterinario a la emergencia",
        isLoading: false
      });
      return { success: false, error: "Error al asignar veterinario a la emergencia" };
    }
  },
  
  // Confirmar la llegada del veterinario (por parte del cliente)
  confirmVetArrival: async (emergencyId, idempotencyKey) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log(`📦 [STORE] Confirmando llegada del veterinario a emergencia: ${emergencyId}`);
      const args = [emergencyId];
      if (idempotencyKey) args.push(idempotencyKey);

      const result = await emergenciaService.confirmVetArrival(...args);
      
      if (result.success) {
        console.log('✅ [STORE] Llegada del veterinario confirmada');
        
        // Verificar si se recibió preferencia MP o initPoint directo
        const preferenciaMP = result.data?.preferenciaMP;
        const initPoint = result.data?.initPoint || preferenciaMP?.initPoint;
        
        if (initPoint) {
          console.log('💳 [STORE] Preferencia MP recibida:', {
            preferenceId: preferenciaMP?.id || result.data?.preferenceId,
            initPoint: initPoint
          });
        }
        
        // Actualizar el estado de la emergencia en la lista
        set(state => ({ 
          activeEmergencies: state.activeEmergencies.map(em => 
            em._id === emergencyId 
              ? { 
                  ...em, 
                  estado: 'En atención', 
                  llegadaConfirmada: true,
                  preferenciaMP: preferenciaMP || em.preferenciaMP,
                  initPoint: initPoint || em.initPoint
                } 
              : em
          ),
          isLoading: false
        }));
        
        // Si la emergencia es la seleccionada, actualizar su estado
        if (get().selectedEmergency && get().selectedEmergency._id === emergencyId) {
          set(state => ({
            selectedEmergency: { 
              ...state.selectedEmergency, 
              estado: 'En atención',
              llegadaConfirmada: true,
              preferenciaMP: preferenciaMP || state.selectedEmergency.preferenciaMP,
              initPoint: initPoint || state.selectedEmergency.initPoint
            }
          }));
        }
        
        // Retornar con initPoint en nivel superior para fácil acceso
        return { 
          success: true, 
          data: result.data,
          initPoint: initPoint,
          tienePreferenciaMP: !!initPoint
        };
      } else {
        console.log('Error al confirmar llegada del veterinario:', result.error);
        set({ 
          error: result.error,
          isLoading: false
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error al confirmar llegada del veterinario:', error);
      set({ 
        error: "Error al confirmar la llegada del veterinario",
        isLoading: false
      });
      return { success: false, error: "Error al confirmar la llegada del veterinario" };
    }
  }
}));

export default useEmergencyStore;
