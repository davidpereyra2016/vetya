import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Image,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import useEmergencyStore from '../../store/useEmergencyStore';
import { prestadorService } from '../../services/api';
import * as Location from 'expo-location';
import usePrestadorStore from '../../store/usePrestadorStore';
import useCitaStore from '../../store/useCitaStore';
import useValoracionStore from '../../store/useValoracionStore';
import ValidationStatusBanner from '../../components/ValidationStatusBanner';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {

  // Stores
  const { providerCitas, fetchProviderCitas } = useCitaStore();
  const { prestador } = usePrestadorStore();
  const { fetchValoraciones } = useValoracionStore();
  
  // Estados
  const [availableForEmergencies, setAvailableForEmergencies] = useState(false);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [isVeterinarian, setIsVeterinarian] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  
  // Estadísticas
  const [stats, setStats] = useState({
    emergenciasAtendidas: prestador?.cantidadEmergenciasAtendidas || 0,
    citasHoy: 0,
    citasPendientes: 0,
    valoracionPromedio: 4.8
  });
  
  // Emergencias y ubicación
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [loadingEmergencies, setLoadingEmergencies] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [, setIsUpdatingLocation] = useState(false);
  const [, setLocationError] = useState(null);
  
  // Referencias
  const locationUpdateTimerRef = useRef(null);
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);

  // Procesar y ordenar citas
  const upcomingAppointments = useMemo(() => {
    if (!providerCitas) return [];
    
    const allAppointments = [
      ...(providerCitas.pendientes || []),
      ...(providerCitas.confirmadas || [])
    ];
    
    // Ordenar por fecha y hora
    return allAppointments.sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.horaInicio}`);
      const dateB = new Date(`${b.fecha}T${b.horaInicio}`);
      return dateA - dateB;
    });
  }, [providerCitas]);

  // Función para cargar valoraciones del prestador usando el store
  const loadValoraciones = async () => {
    if (provider?._id) {
      const result = await fetchValoraciones(provider._id);
      
      if (result.success && result.estadisticas) {
       
        setStats(prev => ({
          ...prev,
          valoracionPromedio: result.estadisticas.promedio || 0
        }));
      } else {
        // console.log('⚠️ No se pudieron cargar valoraciones, usando valor por defecto');
      }
    }
  };

  // Actualizar estadísticas cuando cambian las citas
  useEffect(() => {
    if (prestador) {
      setStats(prev => ({
        ...prev,
        emergenciasAtendidas: prestador.cantidadEmergenciasAtendidas || 0
      }));
    }

    if (providerCitas) {
      // Obtener la fecha actual LOCAL (no UTC) en formato YYYY-MM-DD
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // console.log(`📅 Fecha LOCAL hoy: ${today}`);
      
      // Filtrar solo las citas confirmadas de HOY (fecha local)
      const citasConfirmadasHoy = providerCitas.confirmadas?.filter(app => {
        if (!app.fecha) return false;
        
        // Convertir la fecha de la cita a fecha local
        const citaDate = new Date(app.fecha);
        const citaLocalDate = `${citaDate.getFullYear()}-${String(citaDate.getMonth() + 1).padStart(2, '0')}-${String(citaDate.getDate()).padStart(2, '0')}`;
        
        const esHoy = citaLocalDate === today;
        // console.log(`  Cita: ${app.fecha} -> Local: ${citaLocalDate} -> Es hoy: ${esHoy}`);
        
        return esHoy;
      }).length || 0;
      
      // console.log(`✅ Total citas confirmadas HOY: ${citasConfirmadasHoy}`);

      setStats(prev => ({
        ...prev,
        citasHoy: citasConfirmadasHoy,
        citasPendientes: providerCitas.pendientes?.length || 0
      }));
    }
  }, [prestador, providerCitas]);
  
  // Cargar valoraciones cuando se monta el componente o cambia el provider
  useEffect(() => {
    if (provider?._id) {
      loadValoraciones();
    }
  }, [provider?._id]);

  // Cargar citas y datos iniciales
  // Función para cargar citas pendientes del prestador actual
  const loadPendingAppointments = async () => {
    // ✅ Usar provider._id para las citas, ya que es el prestador quien las recibe
    if (provider?._id) {
      setLoadingAppointments(true);
      try {
        await Promise.all([
          fetchProviderCitas(provider._id, 'Pendiente'),
          fetchProviderCitas(provider._id, 'Confirmada')
        ]);
      } catch (error) {
        console.error("Error cargando citas pendientes:", error);
      } finally {
        setLoadingAppointments(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        // ✅ Usar provider._id para las citas, ya que es el prestador quien las recibe
        if (provider?._id) {
          try {
            await loadPendingAppointments();

            if (isVeterinarian && provider._id) {
              await loadAssignedEmergencies();
            }

            if (provider._id) {
              await loadValoraciones();
            }
          } catch (error) {
            console.error("Error loading data:", error);
          }
        }
      };
      
      loadData();
    }, [provider?._id, isVeterinarian]) // ✅ Usar provider._id como dependencia
  );
  


  // Función para renderizar elementos de cita
  const renderAppointmentItem = ({ item, onPress }) => {
    // Extraer la hora de manera segura
    const hora = item.fechaHora ? item.fechaHora.split(' ')[1] : item.horaInicio;
    
    // console.log('Renderizando cita completa:', item);
    
    // Acceder a los datos anidados de forma segura (como en AppointmentDetailsScreen)
    const servicioNombre = typeof item.servicio === 'object' && item.servicio !== null
      ? item.servicio.nombre : (item.servicio || 'Servicio no especificado');
      
    const mascotaNombre = item.mascota?.nombre || item.mascotaNombre || 'Mascota';
    const mascotaTipo = item.mascota?.tipo || item.tipoMascota || 'No especificado';
    
    const usuarioNombre = item.usuario?.nombre || item.usuario?.username || 
                          item.usuarioNombre || 'Cliente';
    
    return (
    <TouchableOpacity 
      style={styles.appointmentCard} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentTime}>
          {hora}
        </Text>
        <View style={[
          styles.statusBadge,
          item.estado === 'Confirmada' ? styles.confirmedStatus : styles.pendingStatus
        ]}>
          <Text style={[
            styles.statusText,
            item.estado === 'Confirmada' ? styles.confirmedStatusText : styles.pendingStatusText
          ]}>
            {item.estado === 'Confirmada' ? 'Confirmada' : 'Pendiente'}
          </Text>
        </View>
      </View>
      
      <View style={styles.appointmentContent}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentTitle}>
            {servicioNombre}
          </Text>
          
          <View style={{flexDirection: 'row', marginBottom: 4}}>
            <Text style={{marginRight: 5}}>
              <Ionicons name="paw" size={14} color="#666" />
            </Text>
            <Text style={styles.appointmentSubtitle}>
              {mascotaNombre} ({mascotaTipo})
            </Text>
          </View>
          
          <View style={{flexDirection: 'row'}}>
            <Text style={{marginRight: 5}}>
              <Ionicons name="person" size={14} color="#666" />
            </Text>
            <Text style={styles.appointmentSubtitle}>
              {usuarioNombre}
            </Text>
          </View>
        </View>
        
        <View style={styles.appointmentActions}>
          <Text>
            <Ionicons name="chevron-forward" size={20} color="#1E88E5" />
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  }
  
  
  // Configuración inicial del prestador
  useEffect(() => {
    if (provider) {
      // console.log('📋 Configurando prestador:', provider.tipo, 'Disponible:', provider.disponibleEmergencias);
      setIsVeterinarian(provider.tipo === 'Veterinario');
      setAvailableForEmergencies(provider.disponibleEmergencias || false);
      
      // Solo verificar permisos si es veterinario, pero NO iniciar tracking aquí
      // El tracking se iniciará automáticamente en el useEffect de tracking
      if (provider.tipo === 'Veterinario' && provider.disponibleEmergencias) {
        checkLocationPermission();
      }
    }
  }, [provider?._id, provider?.tipo]);
  
  // Sincronizar estado local cuando cambie disponibleEmergencias en el provider (desde otra pantalla)
  useEffect(() => {
    if (provider?.disponibleEmergencias !== undefined) {
      setAvailableForEmergencies(provider.disponibleEmergencias);
    }
  }, [provider?.disponibleEmergencias]);
  
  // Efecto para iniciar o detener el seguimiento de ubicación según disponibilidad
  useEffect(() => {
    // console.log('🔄 useEffect tracking - Estado actual:', {
    //   isVeterinarian,
    //   availableForEmergencies,
    //   locationPermission
    // });
    
    // Detener tracking existente primero para evitar duplicados
    stopLocationTracking();
    
    // Verificar TODAS las condiciones antes de iniciar
    if (isVeterinarian && availableForEmergencies && locationPermission) {
      // console.log('✅ Todas las condiciones cumplidas, programando inicio de tracking...');
      // Pequeño delay para asegurar que el estado se actualizó
      const timer = setTimeout(() => {
        // Verificar nuevamente antes de iniciar (por si cambió durante el delay)
        if (availableForEmergencies) {
          startLocationTracking();
        } else {
          console.log('⚠️ Disponibilidad cambió durante delay, NO iniciando tracking');
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
        stopLocationTracking();
      };
    } else {
      console.log('❌ No se cumplen condiciones para tracking');
    }
    
    return () => {
      stopLocationTracking();
    };
  }, [isVeterinarian, availableForEmergencies, locationPermission]);
  
  // Solicitar y verificar permisos de ubicación
  const checkLocationPermission = async () => {
    try {
      // Verificar si ya tenemos permisos
      let { status } = await Location.getForegroundPermissionsAsync();
      
      // Si no tenemos permisos, solicitarlos
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }
      
      // Actualizar estado de permisos
      setLocationPermission(status === 'granted');
      setLocationError(status !== 'granted' ? 'Se requiere permiso de ubicación para el servicio de emergencias' : null);
      
      return status === 'granted';
    } catch (error) {
      console.error('Error al verificar permisos de ubicación:', error);
      setLocationPermission(false);
      setLocationError('Error al verificar permisos de ubicación');
      return false;
    }
  };
  
  // Iniciar seguimiento de ubicación periódico
  const startLocationTracking = async () => {
    try {
      // Verificar condiciones antes de iniciar
      if (!availableForEmergencies) {
        // console.log('⏸️ No iniciando tracking: no disponible para emergencias');
        return;
      }
      
      if (!isVeterinarian) {
        // console.log('⏸️ No iniciando tracking: no es veterinario');
        return;
      }
      
      if (!locationPermission) {
        // console.log('⚠️ No iniciando tracking: sin permisos de ubicación');
        return;
      }
      
      // Verificar si ya hay un temporizador activo y detenerlo
      if (locationUpdateTimerRef.current) {
        // console.log('🔄 Limpiando temporizador anterior...');
        clearInterval(locationUpdateTimerRef.current);
        locationUpdateTimerRef.current = null;
      }
      
      // console.log('🚀 Iniciando seguimiento de ubicación...');
      
      // Actualizar ubicación inmediatamente
      await updateCurrentLocation();
      
      // Configurar actualización periódica cada 5 minutos (300000 ms)
      // En producción, ajustar este intervalo según necesidades y consumo de batería
      locationUpdateTimerRef.current = setInterval(async () => {
        // Verificar estado antes de cada actualización
        if (availableForEmergencies && isVeterinarian && locationPermission) {
          await updateCurrentLocation();
        } else {
          // console.log('⏸️ Saltando actualización: condiciones no cumplidas');
          stopLocationTracking();
        }
      }, 300000); // 5 minutos
      
      // console.log('✅ Seguimiento de ubicación iniciado correctamente');
    } catch (error) {
      // console.error('❌ Error al iniciar seguimiento de ubicación:', error);
      setLocationError('Error al iniciar seguimiento de ubicación');
    }
  };
  
  // Detener seguimiento de ubicación
  const stopLocationTracking = () => {
    if (locationUpdateTimerRef.current) {
      // console.log('🛑 Deteniendo seguimiento de ubicación...');
      clearInterval(locationUpdateTimerRef.current);
      locationUpdateTimerRef.current = null;
      setIsUpdatingLocation(false);
      setLocationError(null); // Limpiar errores al detener
      // console.log('✅ Seguimiento de ubicación detenido correctamente');
    }
  };
  
  // Obtener ubicación actual y enviarla al servidor
  const updateCurrentLocation = async () => {
    // Verificación temprana: no intentar actualizar si no está disponible
    if (!availableForEmergencies) {
      // console.log('⏸️ No actualizando ubicación: prestador no disponible para emergencias');
      stopLocationTracking(); // Detener tracking por seguridad
      return;
    }
    
    if (!provider || !provider._id) {
      // console.error('❌ No se pudo identificar el prestador');
      return;
    }
    
    if (!isVeterinarian) {
      // console.log('⏸️ No actualizando ubicación: no es veterinario');
      return;
    }
    
    try {
      setIsUpdatingLocation(true);
      
      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // Esperar máximo 5 segundos
        distanceInterval: 0 // Obtener ubicación incluso si no hay movimiento
      });
      
      const { latitude, longitude } = location.coords;
      // console.log(`📍 Ubicación actual: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      
      // Verificar nuevamente antes de enviar (por si cambió durante la obtención de GPS)
      if (!availableForEmergencies) {
        // console.log('⏸️ Cancelando actualización: disponibilidad cambió durante obtención de GPS');
        return;
      }
      
      // Enviar ubicación al servidor
      const result = await prestadorService.actualizarUbicacion(
        provider._id,
        latitude,
        longitude
      );
      
      if (result.success) {
        // console.log('✅ Ubicación actualizada correctamente');
        setLocationError(null);
      } else {
        // Solo mostrar error si NO es por disponibilidad
        if (result.error && !result.error.includes('disponible')) {
          // console.error('❌ Error al actualizar ubicación:', result.error);
          setLocationError('Error al actualizar ubicación en el servidor');
        } else {
          // console.log('ℹ️ Actualización rechazada por disponibilidad (esto es normal)');
        }
      }
    } catch (error) {
      // Solo registrar errores reales, no los de disponibilidad
      if (error.response?.status === 400 && error.response?.data?.message?.includes('disponible')) {
        // console.log('ℹ️ Actualización de ubicación omitida: no disponible para emergencias');
      } else {
        // console.error('❌ Error al obtener/actualizar ubicación:', error.message || error);
        setLocationError('Error al obtener la ubicación actual');
      }
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Función para actualizar disponibilidad de emergencias en la base de datos
  const updateEmergencyAvailability = async (newStatus) => {
    if (!provider || !provider._id) {
      Alert.alert('Error', 'No se pudo identificar el prestador.');
      return false;
    }

    try {
      setIsUpdatingAvailability(true);
      
      // Obtener el precio de emergencia actual (o usar 0 si no hay)
      const precioEmergencia = provider.precioEmergencia || 0;
      
      // Llamar al servicio para actualizar en la base de datos
      const result = await prestadorService.actualizarPrecioEmergencia(
        provider._id, 
        precioEmergencia, 
        newStatus
      );
      
      if (result.success) {
        // console.log('✅ Disponibilidad actualizada en BD:', newStatus);
        
        // Recargar datos del prestador desde la BD para asegurar sincronización
        try {
          const providerData = await prestadorService.getById(provider._id);
          if (providerData.success && providerData.data) {
            // console.log('✅ Provider recargado desde BD. disponibleEmergencias:', providerData.data.disponibleEmergencias);
            // Actualizar el provider en el state global con datos frescos de la BD
            useAuthStore.getState().updateProvider(providerData.data);
            // Actualizar el state local con el valor real de la BD
            setAvailableForEmergencies(providerData.data.disponibleEmergencias || false);
          } else {
            // Fallback: actualizar solo la propiedad si falla la recarga
            useAuthStore.getState().updateProvider({ disponibleEmergencias: newStatus });
            setAvailableForEmergencies(newStatus);
          }
        } catch (error) {
          console.error('Error al recargar provider:', error);
          // Fallback: actualizar solo la propiedad
          useAuthStore.getState().updateProvider({ disponibleEmergencias: newStatus });
          setAvailableForEmergencies(newStatus);
        }
        
        return true;
      } else {
        Alert.alert('Error', result.error || 'Error al actualizar disponibilidad');
        return false;
      }
    } catch (error) {
      console.error('Error al actualizar disponibilidad:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar la disponibilidad');
      return false;
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  // Función para cambiar disponibilidad
  const toggleAvailability = async () => {
    if (!isVeterinarian) {
      Alert.alert(
        'No disponible', 
        'Solo los veterinarios pueden configurar la disponibilidad para emergencias.'
      );
      return;
    }
    
    // Nuevo estado de disponibilidad
    const newStatus = !availableForEmergencies;
    
    // Si se está activando la disponibilidad, verificar permisos de ubicación
    if (newStatus) {
      // Verificar permisos de ubicación
      const hasPermission = await checkLocationPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Permiso de ubicación requerido',
          'Para activar la disponibilidad para emergencias, debes permitir el acceso a tu ubicación. Esto es necesario para que los clientes puedan encontrarte en caso de emergencia.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Configurar permisos',
              onPress: async () => {
                await Location.requestForegroundPermissionsAsync();
                // Verificar nuevamente los permisos
                const granted = await checkLocationPermission();
                if (granted) {
                  // Si se otorgaron permisos, intentar activar la disponibilidad
                  const success = await updateEmergencyAvailability(true);
                  if (success) {
                    // Iniciar seguimiento de ubicación
                    startLocationTracking();
                  }
                }
              },
            },
          ]
        );
        return;
      }
    }
    
    // Actualizar en la base de datos
    const success = await updateEmergencyAvailability(newStatus);
    
    if (success) {
      // Mensaje para el usuario
      Alert.alert(
        newStatus ? 'Modo Disponible' : 'Modo No Disponible',
        newStatus 
          ? 'Ahora recibirás solicitudes de emergencias cercanas' 
          : 'Ya no recibirás solicitudes de emergencias',
        [{ text: 'Entendido' }]
      );
    }
  };

  // Función para cargar emergencias asignadas al veterinario (mejorada)
  const loadAssignedEmergencies = async () => {
    // Validar que sea veterinario y que tengamos un ID de prestador
    if (!isVeterinarian || !provider?._id) {
      console.log('No cargando emergencias: no es veterinario o falta ID de prestador');
      return;
    }
    
    try {
      setLoadingEmergencies(true);
      const { fetchEmergencies } = useEmergencyStore.getState();
      const result = await fetchEmergencies();
      
      if (result.success) {
        console.log(`📥 Emergencias recibidas del backend: ${result.data.length}`);
        
        // FILTRAR solo emergencias activas (excluir historial)
        // HomeScreen solo debe mostrar emergencias que se pueden aceptar/rechazar o están en proceso
        const emergenciasActivas = result.data.filter(emergency => 
          ['Solicitada', 'Asignada', 'Confirmada', 'En camino', 'En atención'].includes(emergency.estado)
        );
        
        console.log(`✅ Emergencias ACTIVAS filtradas para HomeScreen: ${emergenciasActivas.length}`);
        console.log(`   Estados: ${emergenciasActivas.map(e => e.estado).join(', ')}`);
        
        // Convertir los datos de la API al formato esperado por el componente
        const formattedEmergencies = emergenciasActivas.map(emergency => {
          // Construir ubicación legible
          let ubicacionTexto = 'Ubicación no disponible';
          if (emergency.ubicacion) {
            const ciudad = emergency.ubicacion.ciudad || '';
            const direccion = emergency.ubicacion.direccion || '';
            ubicacionTexto = [ciudad, direccion].filter(Boolean).join(', ') || 'Ubicación no disponible';
          }
          
          // Formatear distancia (viene calculada del backend)
          let distanciaTexto = 'Calculando...';
          if (emergency.distancia !== null && emergency.distancia !== undefined) {
            distanciaTexto = `${emergency.distancia.toFixed(1)} km`;
          }
          
          // Formatear tiempo estimado (viene calculado del backend)
          let tiempoTexto = 'Calculando...';
          if (emergency.tiempoEstimado !== null && emergency.tiempoEstimado !== undefined) {
            tiempoTexto = `${emergency.tiempoEstimado} min`;
          }
          
          return {
            id: emergency._id,
            usuarioNombre: emergency.usuario?.username || 'Cliente',
            usuarioFoto: emergency.usuario?.profilePicture || 'https://via.placeholder.com/50',
            mascotaNombre: emergency.mascotaInfo?.nombre || emergency.mascota?.nombre || 'Mascota',
            mascotaFoto: emergency.mascotaInfo?.imagen || emergency.mascota?.imagen || 'https://via.placeholder.com/50',
            tipoMascota: emergency.mascotaInfo?.tipo || emergency.mascota?.tipo || 'No especificado',
            descripcion: emergency.descripcion || 'Sin descripción',
            ubicacion: ubicacionTexto,
            distancia: distanciaTexto,
            tiempo: tiempoTexto,
            estado: emergency.estado || 'Asignada',
            fechaHora: emergency.fechaSolicitud || new Date().toISOString(),
            urgencia: emergency.nivelUrgencia?.toLowerCase() || 'media',
            original: emergency
          };
        });
        
        setActiveEmergencies(formattedEmergencies);
      } else {
        console.error('Error al cargar emergencias asignadas:', result.error);
        setActiveEmergencies([]); // Limpiar el estado en caso de error
      }
    } catch (error) {
      console.error('Error al obtener emergencias asignadas:', error);
      setActiveEmergencies([]); // Limpiar el estado en caso de error
    } finally {
      setLoadingEmergencies(false);
    }
  };
  
  // Eliminamos la función loadNearbyEmergencies redundante, ya que loadAssignedEmergencies hace lo mismo
  
  // Función para manejar la aceptación de una emergencia
  const handleAcceptEmergency = async (emergency) => {
    Alert.alert(
      'Aceptar Emergencia',
      `¿Confirmas que atenderás la emergencia de ${emergency.mascotaNombre}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Aceptar',
          onPress: async () => {
            try {
              // Usar el store para aceptar la emergencia
              const { acceptEmergency } = useEmergencyStore.getState();
              const result = await acceptEmergency(emergency.id);
              
              if (result.success) {
                // Remover de la lista de emergencias activas (actualización optimista)
                setActiveEmergencies(prev => prev.filter(e => e.id !== emergency.id));
                
                // Mostrar mensaje de éxito y luego recargar y navegar
                Alert.alert(
                  'Emergencia aceptada', 
                  'Has aceptado atender esta emergencia. Se te mostrará la ubicación y detalles del paciente.',
                  [
                    {
                      text: 'Ver detalles',
                      onPress: async () => {
                        try {
                          await loadAssignedEmergencies(); // Recargar para asegurar consistencia
                          // Navegar a la pantalla de detalles con los datos completos y actualizados
                          // Es importante que result.data sea la emergencia actualizada del backend
                          navigation.navigate('EmergencyDetails', { 
                            emergencyId: emergency.id, // o result.data._id si es más fiable
                            emergency: result.data 
                          });
                        } catch (loadError) {
                          console.error('Error al recargar emergencias después de aceptar:', loadError);
                          // Incluso si falla la recarga, intentar navegar con los datos disponibles
                          navigation.navigate('EmergencyDetails', { 
                            emergencyId: emergency.id,
                            emergency: result.data 
                          });
                        }
                      }
                    }
                  ]
                );
              } else { // Si result.success es false
                Alert.alert('Error', result.error || 'No se pudo aceptar la emergencia');
                // Si falló la aceptación, es buena idea recargar para ver el estado actual
                await loadAssignedEmergencies();
              }
            } catch (error) {
              console.error('Error al aceptar emergencia:', error);
              Alert.alert('Error', 'Ocurrió un error al procesar tu solicitud');
              // Considerar recargar también en caso de error general para mantener la UI consistente
              await loadAssignedEmergencies(); 
            }
          },
        },
      ]
    );
  };

  // Función para manejar el rechazo de una emergencia
  const handleRejectEmergency = async (emergency) => {
    Alert.alert(
      'Rechazar Emergencia',
      '¿Estás seguro de rechazar esta solicitud?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Usar el store para rechazar la emergencia
              const { rejectEmergency } = useEmergencyStore.getState();
              const result = await rejectEmergency(emergency.id);
              
              if (result.success) {
                // Remover de la lista de emergencias activas (actualización optimista)
                setActiveEmergencies(
                  activeEmergencies.filter(item => item.id !== emergency.id)
                );
                
                // Mostrar mensaje y luego recargar
                Alert.alert('Emergencia rechazada', 'Has rechazado esta solicitud de emergencia.');
                await loadAssignedEmergencies(); // Recargar para asegurar consistencia
              } else {
                Alert.alert('Error', result.error || 'No se pudo rechazar la emergencia');
                await loadAssignedEmergencies(); // Recargar para mantener la UI consistente
              }
            } catch (error) {
              console.error('Error al rechazar emergencia:', error);
              Alert.alert('Error', 'Ocurrió un error al procesar tu solicitud');
              await loadAssignedEmergencies(); // Recargar para mantener la UI consistente
            }
          },
        },
      ]
    );
  };

  // Función para manejar la selección de una cita
  const handleAppointmentPress = (appointment) => {
    navigation.navigate('AppointmentDetails', { appointment });
  };

  // Función para confirmar una cita pendiente
  const handleConfirmAppointment = (appointment) => {
    // Obtener información del usuario y mascota de forma segura
    const nombreUsuario = appointment.usuario?.nombre || appointment.usuario?.username || 
                          appointment.usuarioNombre || 'cliente';
    const nombreMascota = appointment.mascota?.nombre || appointment.mascotaNombre || 'mascota';
    
    Alert.alert(
      'Confirmar Cita',
      `¿Confirmar cita con ${nombreUsuario} para ${nombreMascota}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              // Mostrar indicador de carga
              setLoadingAppointments(true);
              
              // Llamar a la API real a través del store de citas
              const { updateCitaStatus } = useCitaStore.getState();
              const result = await updateCitaStatus(provider._id, appointment._id, 'Confirmada');
              
              if (result.success) {
                // Actualizar las citas después de la confirmación
                await loadPendingAppointments();

                // Mostrar mensaje de éxito
                Alert.alert('Cita confirmada', 'La cita ha sido confirmada exitosamente.');
              } else {
                Alert.alert('Error', result.error || 'No se pudo confirmar la cita');
              }
            } catch (error) {
              console.error('Error al confirmar cita:', error);
              Alert.alert('Error', 'Ocurrió un error al procesar tu solicitud');
            } finally {
              setLoadingAppointments(false);
            }
          },
        },
      ]
    );
  };

  // Función para rechazar una cita pendiente
  const handleRejectAppointment = (appointment) => {
    Alert.alert(
      'Rechazar Cita',
      `¿Estás seguro de rechazar la cita con ${appointment.usuarioNombre}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { updateCitaStatus } = useCitaStore.getState();
              const result = await updateCitaStatus(provider._id, appointment._id, 'Cancelada');

              if (result.success) {
                await loadPendingAppointments();
                Alert.alert('Cita rechazada', 'La cita ha sido rechazada.');
              } else {
                Alert.alert('Error', result.error || 'No se pudo rechazar la cita');
              }
            } catch (error) {
              console.error('Error al rechazar cita:', error);
              Alert.alert('Error', 'Ocurrió un error al procesar tu solicitud');
            }
          },
        },
      ]
    );
  };


  // Función para actualizar datos (pull-to-refresh)
  // Efecto para recargar emergencias cuando la pantalla obtiene el foco
  // Función para actualizar datos
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      if (provider && provider._id) {
          // Actualizar datos del prestador
          const result = await prestadorService.getById(provider._id);
          if (result.success && result.data) {
            useAuthStore.getState().updateProvider(result.data);
          }

          // Actualizar citas
          await loadPendingAppointments();
          
          // Actualizar valoraciones
          await loadValoraciones();

          // Actualizar emergencias si es veterinario
          if (isVeterinarian) {
            await loadAssignedEmergencies();
          }
          
          // Actualizar ubicación si es necesario
          if (isVeterinarian && availableForEmergencies && locationPermission) {
            await updateCurrentLocation();
          }
        }
      } catch (error) {
        console.error('Error al actualizar datos:', error);
      } finally {
        setRefreshing(false);
      }
  }, [provider, isVeterinarian, availableForEmergencies, locationPermission]);

  // Renderizar cada solicitud de emergencia
  const renderEmergencyItem = ({ item }) => {
    // Determinar si la emergencia ya está aceptada/confirmada
    // Incluye: Confirmada, Asignada (ya aceptada), En camino, En atención
    const isAccepted = ['Confirmada', 'Asignada', 'En camino', 'En atención', 'Aceptada', 'Llegando'].includes(item.estado);

    // Función para navegar al detalle de la emergencia
    const navigateToEmergencyDetail = () => {
      navigation.navigate('EmergencyDetails', { emergencyId: item.id });
    };

    return (
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: item.usuarioFoto }}
                style={styles.profileImage}
              />
            </View>
            <View>
              <Text style={styles.userName}>{item.usuarioNombre}</Text>
              <View style={styles.petInfo}>
                <Text style={{marginRight: 4}}>
                  <Ionicons name="paw" size={14} color="#666" />
                </Text>
                <Text style={styles.petName}>{item.mascotaNombre} ({item.tipoMascota})</Text>
              </View>
            </View>
          </View>
          <View style={[styles.urgencyBadge, 
            item.urgencia === 'alta' ? styles.highUrgency : 
            item.urgencia === 'media' ? styles.mediumUrgency : 
            styles.lowUrgency]}>
            <Text style={styles.urgencyText}>
              {item.urgencia === 'alta' ? 'URGENTE' : 
               item.urgencia === 'media' ? 'MEDIA' : 'BAJA'}
            </Text>
          </View>
        </View>

        <View style={styles.emergencyDetails}>
          <Text style={styles.emergencyDescription}>{item.descripcion}</Text>
          
          <View style={styles.locationContainer}>
            <Text style={{marginRight: 4}}>
              <Ionicons name="location" size={16} color="#F44336" />
            </Text>
            <Text style={styles.locationText}>{item.ubicacion}</Text>
          </View>
          
          <View style={styles.distanceTimeContainer}>
            <View style={styles.distanceTime}>
              <Text style={{marginRight: 4}}>
                <Ionicons name="navigate" size={14} color="#666" />
              </Text>
              <Text style={styles.distanceTimeText}>{item.distancia}</Text>
            </View>
            <View style={styles.distanceTime}>
              <Text style={{marginRight: 4}}>
                <Ionicons name="time" size={14} color="#666" />
              </Text>
              <Text style={styles.distanceTimeText}>{item.tiempo} en auto</Text>
            </View>
          </View>
        </View>

        <View style={styles.emergencyActions}>
          {isAccepted ? (
            // Si la emergencia ya está aceptada, mostrar un solo botón para ver detalles
            <>
              <View style={[styles.estadoBadge, 
                item.estado === 'Confirmada' && styles.estadoConfirmada,
                item.estado === 'Asignada' && styles.estadoAsignada,
                item.estado === 'En camino' && styles.estadoEnCamino,
                item.estado === 'En atención' && styles.estadoEnAtencion,
              ]}>
                <Text style={styles.estadoText}>{item.estado}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.acceptButton, { flex: 1 }]}
                onPress={navigateToEmergencyDetail}
              >
                <Text style={styles.acceptButtonText}>Ver detalles</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Si no está aceptada, mostrar los botones de aceptar y rechazar
            <>
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => handleRejectEmergency(item)}
              >
                <Text style={styles.rejectButtonText}>Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleAcceptEmergency(item)}
              >
                <Text style={styles.acceptButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusBarBackground}>
        <ExpoStatusBar 
          backgroundColor="transparent" //Color de la barra de estado
          barStyle="light-content" //Color del texto de la barra de estado
          translucent={true} //Transparencia de la barra de estado
        />
      </View>
      {/* Encabezado y control de disponibilidad */}
      {/* Header extendido */}
      <View style={[
        styles.header, 
        { 
          paddingTop: Platform.OS === 'ios' ? 50 : (RNStatusBar.currentHeight || 0) + 20,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          overflow: 'hidden' // Para que el borde redondeado funcione correctamente
          
        }
      ]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcome}>¡Bienvenido a VetPresta!</Text>
            <Text style={styles.providerName}>{provider?.nombre || user?.username || 'Prestador'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Perfil')}
          >
            {(provider?.profilePicture || user?.profilePicture) ? (
              <Image 
                source={{ uri: provider?.profilePicture || user?.profilePicture }} 
                style={styles.profileImage} 
                resizeMode="cover"
              />
            ) : (
              <Text>
                <Ionicons name="person-circle" size={40} color="#FFF" />
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Solo mostrar control de disponibilidad para veterinarios */}
        {isVeterinarian && (
          <View style={styles.availabilityContainer}>
            <Text style={styles.availabilityTitle}>
              {availableForEmergencies ? 'Disponible para emergencias' : 'No disponible para emergencias'}
            </Text>
            {isUpdatingAvailability ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={availableForEmergencies ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleAvailability}
                value={availableForEmergencies}
                disabled={isUpdatingAvailability}
              />
            )}
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1E88E5"]}
          />
        }
      >
        {/* Tarjeta de estadísticas con margen superior */}
        <View style={[styles.statsContainer, { marginTop: 10 }]}>
          {/* Estadística de Emergencias - SOLO PARA VETERINARIOS */}
          {isVeterinarian && (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.emergenciasAtendidas}</Text>
                <Text style={styles.statLabel}>Emergencias</Text>
              </View>
              <View style={styles.statDivider} />
            </>
          )}
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.citasHoy}</Text>
            <Text style={styles.statLabel}>Citas hoy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.citasPendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Text style={styles.statValue}>
                {stats.valoracionPromedio > 0 ? stats.valoracionPromedio.toFixed(1) : 'N/A'}
              </Text>
              {stats.valoracionPromedio > 0 && (
                <Text style={{marginLeft: 4}}>
                  <Ionicons name="star" size={16} color="#FFC107" />
                </Text>
              )}
            </View>
            <Text style={styles.statLabel}>Valoración</Text>
          </View>
        </View>

        {/* Banner de estado de validación */}
        <ValidationStatusBanner navigation={navigation} />

        {/* Emergencias asignadas - SOLO PARA VETERINARIOS */}
        {isVeterinarian && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergencias asignadas</Text>
              <TouchableOpacity 
                style={styles.viewAllButton} 
                onPress={() => navigation.navigate('EmergencyList')}
              >
                <Text style={{ marginRight: 4 }}>
                  <Ionicons name="list" size={16} color="#1E88E5" />
                </Text>
                <Text style={styles.viewAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            {loadingEmergencies ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E88E5" />
                <Text style={styles.loadingText}>Cargando emergencias...</Text>
              </View>
            ) : activeEmergencies.length > 0 ? (
              <FlatList
                data={activeEmergencies}
                renderItem={renderEmergencyItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text>
                  <Ionicons name="alert-circle" size={50} color="#ccc" />
                </Text>
                <Text style={styles.emptyStateText}>No hay emergencias asignadas</Text>
              </View>
            )}
          </View>
        )}

        {/* Próximas Citas - AHORA DINÁMICAS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximas Citas</Text>
            {upcomingAppointments.length > 0 && (
              <TouchableOpacity 
                style={styles.viewAllButton} 
                onPress={() => navigation.navigate('Appointments')}
              >
                <Text style={styles.viewAllText}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loadingAppointments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1E88E5" />
              <Text style={styles.loadingText}>Cargando citas...</Text>
            </View>
          ) : upcomingAppointments.length > 0 ? (
            <FlatList
              data={upcomingAppointments.slice(0, 3)}
              renderItem={({item}) => renderAppointmentItem({
                item, 
                onPress: () => navigation.navigate('AppointmentDetails', {appointment: item})
              })}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{height: 12}} />}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text>
                <Ionicons name="calendar-outline" size={50} color="#ccc" />
              </Text>
              <Text style={styles.emptyStateText}>No hay citas programadas</Text>
              <TouchableOpacity 
                style={[styles.quickActionButton, {width: '100%', marginTop: 15}]}
                onPress={() => navigation.navigate('Availability')}
              >
                <Text style={styles.quickActionText}>Configurar disponibilidad</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Botones de acceso rápido */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Services')}>
            <Text>
              <Ionicons name="list" size={24} color="#1E88E5" />
            </Text>
            <Text style={styles.quickActionText}>Mis Servicios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Appointments')}>
            <Text>
              <Ionicons name="calendar" size={24} color="#1E88E5" />
            </Text>
            <Text style={styles.quickActionText}>Mis Citas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Availability')}>
            <Text>
              <Ionicons name="time" size={24} color="#4CAF50" />
            </Text>
            <Text style={styles.quickActionText}>Disponibilidad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Reviews')}>
            <Text>
              <Ionicons name="star" size={24} color="#FFC107" />
            </Text>
            <Text style={styles.quickActionText}>Valoraciones</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// *** No analizar solo en el caso de modificar los estilos. ***
const styles = StyleSheet.create({

  statusBarBackground: {
    height: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0,
    backgroundColor: '#1E88E5',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1E88E5',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    overflow: 'hidden', // Para que el borde redondeado funcione correctamente
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  providerName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 5,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
  },
  availabilityTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E0E0E0',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeContainer: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5
  },
  viewAllText: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: '500',
  },
  emergencyCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
    overflow: 'hidden',
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  petName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 40,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  highUrgency: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  mediumUrgency: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffecb3',
  },
  lowUrgency: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  emergencyDetails: {
    padding: 12,
  },
  emergencyDescription: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
    flex: 1,
  },
  distanceTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  distanceTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  distanceTimeText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  emergencyActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  rejectButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  acceptButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
  },
  rejectButtonText: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#1E88E5',
    fontSize: 15,
    fontWeight: '600',
  },
  // Estilos para badge de estado de emergencia
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 10,
  },
  estadoConfirmada: {
    backgroundColor: '#FFF8E1',
  },
  estadoAsignada: {
    backgroundColor: '#E3F2FD',
  },
  estadoEnCamino: {
    backgroundColor: '#F3E5F5',
  },
  estadoEnAtencion: {
    backgroundColor: '#FFF3E0',
  },
  estadoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentCard: {
    backgroundColor: '#FFF',// Color de fondo de la tarjeta
    borderRadius: 12,// Radio de la tarjeta
    padding: 16,// Padding interno de la tarjeta
    marginBottom: 12,// Margen inferior de la tarjeta
    shadowColor: '#000',// Color de la sombra
    shadowOffset: { width: 0, height: 2 },// Offset de la sombra
    shadowOpacity: 0.08,// Opacidad de la sombra
    shadowRadius: 4,// Radio de la sombra
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5', // Color primario de tu app
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  appointmentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appointmentService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentDateTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E88E5',
  },
  appointmentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appointmentActions: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  confirmedStatus: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  pendingStatus: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffecb3',
  },
  confirmedStatusText: {
    color: '#1565C0',
  },
  pendingStatusText: {
    color: '#8D6E00',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  appointmentUserName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  appointmentPetName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    color: '#777',
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  quickActionButton: {
    width: (width - 60) / 2,
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default HomeScreen;
