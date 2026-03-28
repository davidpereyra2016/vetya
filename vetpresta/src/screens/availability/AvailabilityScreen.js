import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import EditTimeModal from './EditTimeModal';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../styles/globalStyles';
import { prestadorService } from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import useDisponibilidadStore from '../../store/useDisponibilidadStore';
import useServiceStore from '../../store/useServiceStore';
import usePrestadorStore from '../../store/usePrestadorStore';

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '18:00';

export default function AvailabilityScreen({ navigation }) {
  // Ref para controlar si el componente está montado
  const isMounted = React.useRef(true);
  
  // Estado del usuario y prestador - obtener directamente del store de autenticación
  const provider = useAuthStore(state => state.provider);
  
  // Estado del prestador - usando useState local para controlar los re-renders
  const [prestadorId, setPrestadorId] = useState(null);
  
  // Obtener el ID del prestador al inicio, igual que en ServicesScreen
  useEffect(() => {
    if (provider) {
      // Usar el ID correcto (puede venir como id o _id dependiendo de la fuente)
      const providerId = provider._id || provider.id;
      
      if (providerId) {
        console.log('AvailabilityScreen - Usando ID de prestador del provider:', providerId);
        setPrestadorId(providerId);
        // Cargar detalles completos del prestador
        loadPrestadorDetails(providerId);
      } else {
        console.log('AvailabilityScreen - Provider sin ID válido:', provider);
      }
    } else {
      console.log('AvailabilityScreen - No hay provider en el store de autenticación');
    }
  }, [provider]);
  
  // Función para cargar los detalles completos del prestador (similar a ServicesScreen)
  const loadPrestadorDetails = async (providerId) => {
    try {
      if (!providerId) {
        console.log('loadPrestadorDetails - ID de prestador no proporcionado');
        return;
      }
      
      console.log('loadPrestadorDetails - Cargando detalles del prestador ID:', providerId);
      
      // Cargar detalles del prestador usando el store
      const result = await usePrestadorStore.getState().loadPrestadorById(providerId);
      
      if (result) {
        console.log('loadPrestadorDetails - Detalles del prestador cargados correctamente');
        // Una vez cargado el prestador en el store, podemos cargar sus datos de disponibilidad
        await loadPrestadorData(providerId);
      } else {
        console.log('loadPrestadorDetails - No se pudieron cargar los detalles del prestador');
        setLoading(false);
      }
    } catch (error) {
      console.error('loadPrestadorDetails - Error al cargar detalles:', error);
      setLoading(false);
    }
  };
  
  // Efecto para cleanup al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Acceder al store de disponibilidad
  const { 
    disponibilidadGeneral, 
    disponibilidadServicios,
    disponibilidadEmergencias,
    isLoading: disponibilidadLoading, 
    error: disponibilidadError,
    getDisponibilidadGeneral,
    getDisponibilidadServicio,
    configurarDisponibilidadGeneral,
    configurarDisponibilidadServicio,
    agregarFechaEspecial,
    eliminarFechaEspecial,
    actualizarDisponibilidadEmergencias,
    clearError
  } = useDisponibilidadStore();
  
  // Acceder al store de servicios
  const { 
    services, 
    getProviderServices,
    isLoading: servicesLoading
  } = useServiceStore();
  
  // Estados para gestionar horarios y servicios
  const [generalSchedule, setGeneralSchedule] = useState([]);
  const [userServices, setUserServices] = useState([]);
  
  // Estados para emergencias
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [emergencyPrice, setEmergencyPrice] = useState(0);
  
  // Estados para fechas especiales
  const [specialDates, setSpecialDates] = useState([]);
  const [specialDateModalVisible, setSpecialDateModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateAvailable, setIsDateAvailable] = useState(true);
  const [specialDateHours, setSpecialDateHours] = useState([{inicio: '09:00', fin: '18:00'}]);
  
  // Estados para la interfaz
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('general'); // 'general', 'services', 'emergency' o 'special'
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  
  // Estados para configuración de horarios por servicio
  const [serviceScheduleConfig, setServiceScheduleConfig] = useState(null);
  const [serviceScheduleConfigChanged, setServiceScheduleConfigChanged] = useState(false);
  const [originalServiceScheduleConfig, setOriginalServiceScheduleConfig] = useState(null);
  
  // Días de la semana para la interfaz
  const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Estados para modales y edición
  const [editDayModalVisible, setEditDayModalVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timeType, setTimeType] = useState('morningStart'); // Para identificar qué horario se está editando
  const [currentTimeValue, setCurrentTimeValue] = useState('08:00');
  const [timePickerTitle, setTimePickerTitle] = useState('Seleccionar hora');
  const [currentDay, setCurrentDay] = useState(1); // 1 = Lunes por defecto
  const [isMorningOpen, setIsMorningOpen] = useState(true);
  const [isEveningOpen, setIsEveningOpen] = useState(true);
  const [morningStartTime, setMorningStartTime] = useState('08:00');
  const [morningEndTime, setMorningEndTime] = useState('12:00');
  const [eveningStartTime, setEveningStartTime] = useState('16:00');
  const [eveningEndTime, setEveningEndTime] = useState('20:00');
  const [editMode, setEditMode] = useState('general');

  // Función para manejar la selección de tiempo desde el modal
  const handleTimeSelected = (newTime) => {
    switch (timeType) {
      case 'morningStart':
        setMorningStartTime(newTime);
        break;
      case 'morningEnd':
        setMorningEndTime(newTime);
        break;
      case 'eveningStart':
        setEveningStartTime(newTime);
        break;
      case 'eveningEnd':
        setEveningEndTime(newTime);
        break;
      default:
        console.warn('Tipo de tiempo desconocido:', timeType);
    }
    setTimePickerVisible(false); // Ocultar el modal después de seleccionar
  };
  
  // Ya no necesitamos este useEffect porque ahora usamos el ID del provider directamente
  // y loadPrestadorDetails se llama desde el useEffect que observa provider

  // Cargar datos del prestador (horarios, servicios y disponibilidad)
  const loadPrestadorData = async (targetPrestadorId = null) => {
    // Usar el ID proporcionado o el del estado
    const idToUse = targetPrestadorId || prestadorId;
    
    console.log('loadPrestadorData - Usando ID de prestador:', idToUse);
    
    if (!idToUse) {
      console.log('loadPrestadorData - No hay ID de prestador disponible');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Obtener servicios del prestador usando el store de servicios
      console.log('loadPrestadorData - Obteniendo servicios para prestador ID:', idToUse);
      const servicesData = await getProviderServices(idToUse);
      if (servicesData) {
        setUserServices(servicesData);
      }
      
      // 2. Obtener datos básicos del prestador
      console.log('loadPrestadorData - Obteniendo datos básicos del prestador ID:', idToUse);
      const prestadorResult = await prestadorService.getById(idToUse);
      const prestadorData = prestadorResult?.success ? prestadorResult.data : null;
      console.log('loadPrestadorData - Datos básicos obtenidos:', prestadorData ? 'Sí' : 'No');
      
      // NOTA: El API de disponibilidad aún no está implementada en el backend, por lo que
      // en lugar de intentar obtener datos de disponibilidad, usaremos los horarios
      // del prestador directamente
      
      // Si hay horarios en los datos del prestador, usarlos
      if (prestadorData?.horarios && prestadorData.horarios.length > 0) {
        console.log('loadPrestadorData - Usando horarios del objeto prestador');
        setGeneralSchedule(prestadorData.horarios);
      } 
      // Si no hay horarios, crear horario por defecto
      else {
        // Crear horario por defecto para días laborales (L-V con turnos mañana y tarde-noche)
        const defaultSchedule = [
          { 
            dia: 1, 
            manana: { activo: true, apertura: "08:00", cierre: "12:00" },
            tarde: { activo: true, apertura: "16:00", cierre: "20:00" }
          }, // Lunes
          { 
            dia: 2, 
            manana: { activo: true, apertura: "08:00", cierre: "12:00" },
            tarde: { activo: true, apertura: "16:00", cierre: "20:00" }
          }, // Martes
          { 
            dia: 3, 
            manana: { activo: true, apertura: "08:00", cierre: "12:00" },
            tarde: { activo: true, apertura: "16:00", cierre: "20:00" }
          }, // Miércoles
          { 
            dia: 4, 
            manana: { activo: true, apertura: "08:00", cierre: "12:00" },
            tarde: { activo: true, apertura: "16:00", cierre: "20:00" }
          }, // Jueves
          { 
            dia: 5, 
            manana: { activo: true, apertura: "08:00", cierre: "12:00" },
            tarde: { activo: true, apertura: "16:00", cierre: "20:00" }
          }, // Viernes
        ];
        setGeneralSchedule(defaultSchedule);
      }
      
      // 4. Configurar datos de disponibilidad para emergencias desde el objeto prestador
      if (prestadorData?.disponibleEmergencias !== undefined) {
        setEmergencyAvailable(prestadorData.disponibleEmergencias);
        console.log('loadPrestadorData - Disponibilidad para emergencias:', prestadorData.disponibleEmergencias);
      }
      if (prestadorData?.precioEmergencia !== undefined) {
        setEmergencyPrice(prestadorData.precioEmergencia);
        console.log('loadPrestadorData - Precio de emergencia:', prestadorData.precioEmergencia);
      }
      
      // 5. Las fechas especiales no están disponibles sin la API de disponibilidad
      // Cuando se implemente el backend, se podrán cargar aquí
      setSpecialDates([]);
      
      // 6. Si es un veterinario, asegurarnos de que se respete el radio de privacidad de 1km
      if (prestadorData?.tipo === 'Veterinario' && prestadorData?.radio !== undefined) {
        // Verificar que el radio sea al menos 1km para proteger la privacidad
        console.log('loadPrestadorData - Radio de atención para veterinario:', prestadorData.radio, 'km');
        if (prestadorData.radio < 1) {
          console.log('loadPrestadorData - Ajustando radio a mínimo 1km para proteger privacidad');
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos del prestador:', error);
      Alert.alert(
        'Error de conexión', 
        'No se pudieron cargar los datos. Por favor, verifica tu conexión a internet.'
      );
      setLoading(false);
    }
  };

  // Guardar el horario general en el backend usando el store de disponibilidad
  const saveGeneralSchedule = async () => {
    // Usar el ID del prestador guardado en el estado local
    const idToUse = prestadorId;
    
    console.log('saveGeneralSchedule - Revisando ID de prestador:', idToUse || 'No disponible');
    
    if (!idToUse) {
      console.log('saveGeneralSchedule - No se encontró ID de prestador');
      Alert.alert('Error', 'No se pudo identificar el prestador. Por favor, intenta nuevamente.');
      return;
    }
    
    try {
      setSaving(true);
      console.log('saveGeneralSchedule - Guardando horarios para prestador ID:', idToUse);
      
      // Formatear horarios para la API con turnos mañana y tarde-noche
      const disponibilidadData = {
        horarioEspecifico: {
          activo: true,
          horarios: generalSchedule
        }
      };
      
      console.log('saveGeneralSchedule - Datos a enviar:', JSON.stringify(disponibilidadData));
      
      // El servicio de disponibilidad aún no está disponible en el backend, por lo que solo actualizaremos
      // los horarios directamente en el modelo de prestador por ahora
      console.log('saveGeneralSchedule - Actualizando horarios directamente en el modelo de prestador');
      
      // Usar la función update del prestadorService (no updatePrestador)
      const updateResult = await prestadorService.update(idToUse, {
        horarios: generalSchedule
      });
      console.log('saveGeneralSchedule - Respuesta de update:', updateResult.success ? 'Exitosa' : 'Fallida');
      
      if (updateResult.success) {
        Alert.alert('¡Horario guardado!', 'Tu horario de atención se ha actualizado correctamente.');
        
        // Si es un veterinario, recordar que mantenemos un radio de privacidad de 1km
        const { prestador } = usePrestadorStore.getState();
        if (prestador?.tipo === 'Veterinario') {
          console.log('saveGeneralSchedule - Manteniendo radio de privacidad de 1km para veterinario');
          // El radio de 1km se maneja en el backend, pero es bueno loggear para recordarlo
        }
      } else {
        console.log('saveGeneralSchedule - Error al guardar:', updateResult.error);
        Alert.alert('Error', updateResult.error || 'No se pudo guardar el horario. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('saveGeneralSchedule - Error al guardar horario:', error);
      Alert.alert('Error', 'Ocurrió un problema al guardar los cambios. Verifica tu conexión.');
    } finally {
      setSaving(false);
    }
  };
  
  // Guardar la configuración de disponibilidad para emergencias
  const saveEmergencyAvailability = async () => {
    if (!prestadorId) {
      Alert.alert('Error', 'No se pudo identificar el prestador');
      return;
    }
    
    try {
      setSaving(true);
      
      console.log('Actualizando disponibilidad para emergencias:', {
        disponible: emergencyAvailable,
        precio: emergencyPrice
      });
      
      // Usar el store de disponibilidad para actualizar
      const response = await actualizarDisponibilidadEmergencias(
        prestadorId, 
        emergencyAvailable, 
        emergencyPrice
      );
      
      if (response) {
        Alert.alert(
          '¡Configuración guardada!', 
          `Tu disponibilidad para emergencias ha sido ${emergencyAvailable ? 'activada' : 'desactivada'}.`
        );
      } else {
        Alert.alert('Error', disponibilidadError || 'No se pudo guardar la configuración. Intenta nuevamente.');
        clearError(); // Limpiar error del store
      }
    } catch (error) {
      console.error('Error al guardar disponibilidad de emergencias:', error);
      Alert.alert('Error', 'Ocurrió un problema al guardar los cambios. Verifica tu conexión.');
    } finally {
      setSaving(false);
    }
  };

  // Genera opciones de horarios para el selector (formato 24h, intervalos de 15 min)
  const getTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };
  
  // Obtener el nombre del día en español a partir de su número (0=Domingo, 1=Lunes, ...)
  const getDayName = (day) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
  };
  
  // Formato legible para día de la semana (0=Domingo, 1=Lunes, etc.)
  const formatDayName = (dayNumber) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayNumber];
  };
  
  // Agregar o editar una fecha especial
  const handleSpecialDate = async () => {
    if (!prestadorId) {
      Alert.alert('Error', 'No se pudo identificar el prestador');
      return;
    }
    
    try {
      setSaving(true);
      
      // Formatear datos para la API
      const fechaEspecialData = {
        fecha: selectedDate,
        disponible: isDateAvailable,
        horarios: isDateAvailable ? specialDateHours : []
      };
      
      console.log('Guardando fecha especial:', fechaEspecialData);
      
      // Usar store de disponibilidad para guardar la fecha especial
      const servicioId = selectedServiceId || null;
      const response = await agregarFechaEspecial(prestadorId, servicioId, fechaEspecialData);
      
      if (response) {
        Alert.alert('¡Fecha especial guardada!', 'La configuración de la fecha especial ha sido guardada correctamente.');
        setSpecialDateModalVisible(false);
        
        // Añadir la nueva fecha a la lista local
        const newSpecialDate = {
          ...response,
          fecha: new Date(response.fecha) // Asegurar que es un objeto Date
        };
        
        setSpecialDates([...specialDates, newSpecialDate]);
      } else {
        Alert.alert('Error', disponibilidadError || 'No se pudo guardar la fecha especial. Intenta nuevamente.');
        clearError();
      }
    } catch (error) {
      console.error('Error al guardar fecha especial:', error);
      Alert.alert('Error', 'Ocurrió un problema al guardar los cambios. Verifica tu conexión.');
    } finally {
      setSaving(false);
    }
  };
  
  // Eliminar una fecha especial
  const handleDeleteSpecialDate = async (fechaEspecialId) => {
    if (!prestadorId || !fechaEspecialId) {
      Alert.alert('Error', 'No se pudo identificar la fecha especial');
      return;
    }
    
    try {
      setSaving(true);
      
      const servicioId = selectedServiceId || null;
      const response = await eliminarFechaEspecial(prestadorId, servicioId, fechaEspecialId);
      
      if (response) {
        Alert.alert('Fecha eliminada', 'La fecha especial ha sido eliminada correctamente.');
        
        // Eliminar la fecha de la lista local
        setSpecialDates(specialDates.filter(date => date._id !== fechaEspecialId));
      } else {
        Alert.alert('Error', disponibilidadError || 'No se pudo eliminar la fecha especial. Intenta nuevamente.');
        clearError();
      }
    } catch (error) {
      console.error('Error al eliminar fecha especial:', error);
      Alert.alert('Error', 'Ocurrió un problema al eliminar la fecha. Verifica tu conexión.');
    } finally {
      setSaving(false);
    }
  };
  
  // Formatear fecha para mostrar
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Función para guardar cambios en el horario con turnos mañana y tarde-noche
  const handleSaveSchedule = () => {
    // Validar horarios de mañana si está activo
    if (isMorningOpen) {
      const morningStartParts = morningStartTime.split(':').map(Number);
      const morningEndParts = morningEndTime.split(':').map(Number);
      
      if (morningStartParts[0] > morningEndParts[0] || 
         (morningStartParts[0] === morningEndParts[0] && morningStartParts[1] >= morningEndParts[1])) {
        Alert.alert(
          'Horario inválido', 
          'La hora de cierre del turno mañana debe ser posterior a la apertura'
        );
        return;
      }
    }
    
    // Validar horarios de tarde si está activo
    if (isEveningOpen) {
      const eveningStartParts = eveningStartTime.split(':').map(Number);
      const eveningEndParts = eveningEndTime.split(':').map(Number);
      
      if (eveningStartParts[0] > eveningEndParts[0] || 
         (eveningStartParts[0] === eveningEndParts[0] && eveningStartParts[1] >= eveningEndParts[1])) {
        Alert.alert(
          'Horario inválido', 
          'La hora de cierre del turno tarde debe ser posterior a la apertura'
        );
        return;
      }
    }
    
    // Crear nueva estructura de horario para el día
    const newSchedule = {
      dia: currentDay,
      manana: {
        activo: isMorningOpen,
        apertura: morningStartTime,
        cierre: morningEndTime,
        intervalo: 30 // Valor predeterminado
      },
      tarde: {
        activo: isEveningOpen,
        apertura: eveningStartTime,
        cierre: eveningEndTime,
        intervalo: 30 // Valor predeterminado
      }
    };
    
    // Determinar si estamos editando un horario general o de servicio específico
    if (editMode === 'service') {
      // Para horarios de servicio específico
      handleSaveServiceDay();
    } else {
      // Para horarios generales
      const updatedSchedule = [...generalSchedule];
      
      // Si ambos turnos están cerrados, eliminar el día
      if (!isMorningOpen && !isEveningOpen) {
        const existingIndex = updatedSchedule.findIndex(s => s.dia === currentDay);
        if (existingIndex >= 0) {
          updatedSchedule.splice(existingIndex, 1);
        }
      } else {
        // Buscar si ya existe un horario para este día
        const existingIndex = updatedSchedule.findIndex(s => s.dia === currentDay);
        
        if (existingIndex >= 0) {
          // Actualizar horario existente
          updatedSchedule[existingIndex] = newSchedule;
        } else {
          // Agregar nuevo horario
          updatedSchedule.push(newSchedule);
        }
      }
      
      setGeneralSchedule(updatedSchedule);
      setEditDayModalVisible(false);
    }
  };
  
  // Verificar si un día tiene horario configurado
  const isDayConfigured = (dayNumber) => {
    return generalSchedule.some(schedule => schedule.dia === dayNumber);
  };
  
  // Obtener el horario para un día específico
  const getScheduleForDay = (dayNumber) => {
    return generalSchedule.find(schedule => schedule.dia === dayNumber);
  };
  
  // Verificar si hay turno de mañana configurado
  const hasMorningShift = (schedule) => {
    return schedule && schedule.manana && schedule.manana.activo;
  };
  
  // Verificar si hay turno de tarde configurado
  const hasEveningShift = (schedule) => {
    return schedule && schedule.tarde && schedule.tarde.activo;
  };
  
  // Convierte un horario en texto legible incluyendo ambos turnos
  const formatScheduleTime = (schedule) => {
    if (!schedule) return 'Cerrado';
    
    const morning = hasMorningShift(schedule) ? 
      `${schedule.manana.apertura} - ${schedule.manana.cierre}` : null;
    
    const evening = hasEveningShift(schedule) ? 
      `${schedule.tarde.apertura} - ${schedule.tarde.cierre}` : null;
    
    if (morning && evening) {
      return `Mañana: ${morning}\nTarde: ${evening}`;
    } else if (morning) {
      return `Mañana: ${morning}`;
    } else if (evening) {
      return `Tarde: ${evening}`;
    } else {
      return 'Cerrado';
    }
  };
  
  // Funciones para manejar disponibilidad por servicio
  
  // Cargar la disponibilidad específica para un servicio
  const loadServiceAvailability = async (serviceId) => {
    if (!prestadorId || !serviceId) return;
    try {
      setLoading(true);
      console.log(`Obteniendo disponibilidad para prestador ID: ${prestadorId}, servicio ID: ${serviceId}`);
      
      // Usar directamente el store para obtener la disponibilidad del servicio
      // El store maneja internamente la comunicación con el backend
      const disponibilidadData = await getDisponibilidadServicio(prestadorId, serviceId);
      
      console.log('Datos recibidos del store:', disponibilidadData);
      
      // Si tenemos datos válidos desde el store (es un objeto con propiedades relevantes)
      if (disponibilidadData && typeof disponibilidadData === 'object' && 
          (disponibilidadData.prestador || disponibilidadData.servicio)) {
        
        console.log('Disponibilidad de servicio obtenida correctamente:', 
                   disponibilidadData.horarioEspecifico?.activo ? 'PERSONALIZADO' : 'USA HORARIO GENERAL');
        
        // Guardar la configuración en el estado local
        setServiceScheduleConfig(disponibilidadData);
        // Guardar una copia para comparar cambios
        setOriginalServiceScheduleConfig(JSON.parse(JSON.stringify(disponibilidadData)));
        setServiceScheduleConfigChanged(false);
      } else {
        console.log('No se encontró disponibilidad en el store, creando configuración inicial');
        
        // Crear una configuración inicial vacía
        const initialConfig = {
          prestador: prestadorId,
          servicio: serviceId,
          horarioEspecifico: {
            activo: false, // Por defecto no usa horario específico
            horarios: []
          },
          fechasEspeciales: []
        };
        
        setServiceScheduleConfig(initialConfig);
        setOriginalServiceScheduleConfig(JSON.parse(JSON.stringify(initialConfig)));
        setServiceScheduleConfigChanged(false);
      }
    } catch (error) {
      console.error('Error al cargar disponibilidad de servicio:', error);
      
      // Crear una estructura inicial para la disponibilidad del servicio en caso de error
      const initialConfig = {
        prestador: prestadorId,
        servicio: serviceId,
        horarioEspecifico: {
          activo: false,
          horarios: []
        },
        fechasEspeciales: []
      };
      
      setServiceScheduleConfig(initialConfig);
      setOriginalServiceScheduleConfig(JSON.parse(JSON.stringify(initialConfig)));
      setServiceScheduleConfigChanged(false);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Alternar entre usar horarios específicos o generales para un servicio
   * 
   * Esta función actualiza el estado local y guarda inmediatamente en la base de datos
   * cuando se activa o desactiva el switch de horarios personalizados.
   * 
   * TODO (Futuro): Añadir validación para verificar si hay citas agendadas antes de desactivar
   * un horario específico. Si hay citas programadas para un servicio con un horario específico,
   * se debería mostrar una advertencia o impedir la desactivación hasta resolver los conflictos.
   * 
   * @param {boolean} value - true para activar horario específico, false para usar horario general
   */
  const toggleUseSpecificSchedule = async (value) => {
    if (!serviceScheduleConfig || !selectedServiceId) return;
    
    // Log apropiado según el estado del switch
    if (value) {
      console.log('SWITCH ACTIVADO: Cambiando a horario personalizado para servicio:', selectedServiceId);
    } else {
      console.log('SWITCH DESACTIVADO: Volviendo a usar horario general para servicio:', selectedServiceId);
    }
    
    const updatedConfig = { ...serviceScheduleConfig };
    
    // Si no existe la propiedad horarioEspecifico, crearla
    if (!updatedConfig.horarioEspecifico) {
      updatedConfig.horarioEspecifico = { 
        activo: value, 
        horarios: value ? [...generalSchedule] : [] // Si se activa, copiar los horarios generales como base
      };
    } else {
      updatedConfig.horarioEspecifico.activo = value;
      // Si se activa y no hay horarios, usar los generales como base
      if (value && (!updatedConfig.horarioEspecifico.horarios || updatedConfig.horarioEspecifico.horarios.length === 0)) {
        updatedConfig.horarioEspecifico.horarios = [...generalSchedule];
      }
    }
    
    // Actualizar el estado local primero para reflejar el cambio inmediatamente en la UI
    setServiceScheduleConfig(updatedConfig);
    setServiceScheduleConfigChanged(true);
    
    // Guardar inmediatamente en la base de datos
    try {
      console.log('Guardando cambio de estado del switch en la base de datos...');
      setSaving(true);
      
      const dataToSave = {
        prestador: prestadorId,
        servicio: selectedServiceId,
        horarioEspecifico: updatedConfig.horarioEspecifico,
        fechasEspeciales: updatedConfig.fechasEspeciales || []
      };
      
      const result = await configurarDisponibilidadServicio(prestadorId, selectedServiceId, dataToSave);
      
      if ((result && result.prestador && result.servicio) || (result && result.success)) {
        console.log('Estado del switch guardado exitosamente en la base de datos');
        setServiceScheduleConfigChanged(false);
        setOriginalServiceScheduleConfig(JSON.parse(JSON.stringify(updatedConfig)));
      } else {
        console.error('Error al guardar estado del switch:', result?.error || 'Desconocido');
        Alert.alert('Error', 'No se pudo guardar el cambio de configuración.');
        
        // Revertir los cambios en la UI si hubo un error
        setServiceScheduleConfig(originalServiceScheduleConfig);
      }
    } catch (error) {
      console.error('Error al guardar estado del switch:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar la configuración.');
      
      // Revertir los cambios en la UI si hubo un error
      setServiceScheduleConfig(originalServiceScheduleConfig);
    } finally {
      setSaving(false);
    }
  };
  
  // Editar los horarios de un día específico para un servicio
  const handleEditServiceDay = (dayIndex) => {
    if (!serviceScheduleConfig || !serviceScheduleConfig.horarioEspecifico) return;
    
    // Buscar si ya existe configuración para este día
    const dayConfig = serviceScheduleConfig.horarioEspecifico.horarios?.find(h => h.dia === dayIndex);
    
    // Configurar para el editor de día
    setCurrentDay(dayIndex);
    setIsMorningOpen(dayConfig?.manana?.activo ?? true);
    setIsEveningOpen(dayConfig?.tarde?.activo ?? true);
    setMorningStartTime(dayConfig?.manana?.apertura ?? '08:00');
    setMorningEndTime(dayConfig?.manana?.cierre ?? '12:00');
    setEveningStartTime(dayConfig?.tarde?.apertura ?? '16:00');
    setEveningEndTime(dayConfig?.tarde?.cierre ?? '20:00');
    setEditMode('service'); // Para saber que estamos editando un horario de servicio
    
    setEditDayModalVisible(true);
  };
  
  // Guardar los horarios editados de un día para un servicio
  const handleSaveServiceDay = () => {
    if (!serviceScheduleConfig || !serviceScheduleConfig.horarioEspecifico) return;
    
    // Validar horarios igual que en handleSaveSchedule
    if (isMorningOpen) {
      const morningStartParts = morningStartTime.split(':').map(Number);
      const morningEndParts = morningEndTime.split(':').map(Number);
      
      if (morningStartParts[0] > morningEndParts[0] || 
         (morningStartParts[0] === morningEndParts[0] && morningStartParts[1] >= morningEndParts[1])) {
        Alert.alert(
          'Horario inválido', 
          'La hora de cierre del turno mañana debe ser posterior a la apertura'
        );
        return;
      }
    }
    
    if (isEveningOpen) {
      const eveningStartParts = eveningStartTime.split(':').map(Number);
      const eveningEndParts = eveningEndTime.split(':').map(Number);
      
      if (eveningStartParts[0] > eveningEndParts[0] || 
         (eveningStartParts[0] === eveningEndParts[0] && eveningStartParts[1] >= eveningEndParts[1])) {
        Alert.alert(
          'Horario inválido', 
          'La hora de cierre del turno tarde debe ser posterior a la apertura'
        );
        return;
      }
    }
    
    // Actualizar la configuración del servicio
    const updatedConfig = { ...serviceScheduleConfig };
    let updatedSchedule = [...(updatedConfig.horarioEspecifico.horarios || [])];
    
    // Si ambos turnos están cerrados, eliminar el día
    if (!isMorningOpen && !isEveningOpen) {
      const existingIndex = updatedSchedule.findIndex(s => s.dia === currentDay);
      if (existingIndex >= 0) {
        updatedSchedule.splice(existingIndex, 1);
      }
    } else {
      const existingIndex = updatedSchedule.findIndex(s => s.dia === currentDay);
      
      const newSchedule = {
        dia: currentDay,
        manana: {
          activo: isMorningOpen,
          apertura: morningStartTime,
          cierre: morningEndTime,
          intervalo: 30 // Valor por defecto
        },
        tarde: {
          activo: isEveningOpen,
          apertura: eveningStartTime,
          cierre: eveningEndTime,
          intervalo: 30 // Valor por defecto
        }
      };
      
      if (existingIndex >= 0) {
        updatedSchedule[existingIndex] = newSchedule;
      } else {
        updatedSchedule.push(newSchedule);
      }
    }
    
    updatedConfig.horarioEspecifico.horarios = updatedSchedule;
    setServiceScheduleConfig(updatedConfig);
    setServiceScheduleConfigChanged(true);
    setEditDayModalVisible(false);
  };
  
  const saveServiceSchedule = async () => {
    if (!prestadorId || !selectedServiceId || !serviceScheduleConfig) return;
    
    try {
      setSaving(true);
      console.log('Guardando disponibilidad para servicio:', selectedServiceId);
      
      const dataToSave = {
        prestador: prestadorId,
        servicio: selectedServiceId,
        horarioEspecifico: serviceScheduleConfig.horarioEspecifico || {
          activo: false,
          horarios: []
        },
        fechasEspeciales: serviceScheduleConfig.fechasEspeciales || []
      };
      
      console.log('Datos a guardar:', JSON.stringify(dataToSave));
      
      const result = await configurarDisponibilidadServicio(prestadorId, selectedServiceId, dataToSave);
      
      if (result && result.prestador && result.servicio && result.horarioEspecifico) {
        console.log('Disponibilidad guardada correctamente');
        setServiceScheduleConfigChanged(false);
        setOriginalServiceScheduleConfig(JSON.parse(JSON.stringify(serviceScheduleConfig)));
        Alert.alert('Éxito', 'Horarios del servicio actualizados correctamente');
      } 
      else if (result && result.success) {
        console.log('Disponibilidad guardada correctamente (resultado explícito)');
        setServiceScheduleConfigChanged(false);
        setOriginalServiceScheduleConfig(JSON.parse(JSON.stringify(serviceScheduleConfig)));
        Alert.alert('Éxito', 'Horarios del servicio actualizados correctamente');
      } 
      else {
        console.log('Error al guardar disponibilidad:', result?.error || 'Desconocido');
        Alert.alert('Error', `No se pudieron guardar los horarios: ${result?.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al guardar disponibilidad de servicio:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar los horarios del servicio.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 15, fontSize: 16, color: COLORS.grey }}>Cargando horarios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar style="light" />
      
      {/* Cabecera */}
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'Perfil' });
            }
          }}
          style={styles.backButton}
        >
          <Text style={{ color: COLORS.white }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disponibilidad</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Selector de pestañas: General/Por Servicio */}
      <View style={styles.tabSelector}>
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'general' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('general')}
        >
          <Text style={{ color: currentTab === 'general' ? COLORS.primary : COLORS.grey }}>
            <Ionicons 
              name="time-outline" 
              size={18} 
              color={currentTab === 'general' ? COLORS.primary : COLORS.grey} 
            />
          </Text>
          <Text style={[styles.tabText, currentTab === 'general' && styles.tabTextActive]}>
            General
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'services' && styles.tabButtonActive]}
          onPress={() => {
            setCurrentTab('services');
            if (services.length === 0 && prestadorId) {
              getProviderServices(prestadorId);
            }
          }}
        >
          <Text style={{ color: currentTab === 'services' ? COLORS.primary : COLORS.grey }}>
            <Ionicons 
              name="briefcase-outline" 
              size={18} 
              color={currentTab === 'services' ? COLORS.primary : COLORS.grey} 
            />
          </Text>
          <Text style={[styles.tabText, currentTab === 'services' && styles.tabTextActive]}>
            Por Servicio
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.container}>
        {/* Vista de horario general */}
        {currentTab === 'general' && (
          <>
            {/* Tarjeta de información */}
            <View style={styles.infoCard}>
              <Text style={{ color: COLORS.primary }}>
                <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
              </Text>
              <Text style={styles.infoText}>
                Define tu horario general de atención. Estos horarios se aplican a todos tus servicios a menos que configures algo específico.
              </Text>
            </View>
            
            {/* Contenedor de horario general */}
            <View style={styles.scheduleContainer}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleTitle}>Horario semanal</Text>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={saveGeneralSchedule}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.daysList}>
                {Array.isArray(generalSchedule) && [0, 1, 2, 3, 4, 5, 6].map(day => {
                  const daySchedule = getScheduleForDay(day);
                  const dayHasSchedule = isDayConfigured(day);
                  
                  return (
                    <TouchableOpacity 
                      key={day}
                      style={styles.dayRow}
                      onPress={() => {
                        setCurrentDay(day);
                        
                        if (dayHasSchedule) {
                          if (daySchedule.manana) {
                            setIsMorningOpen(daySchedule.manana.activo);
                            setMorningStartTime(daySchedule.manana.apertura);
                            setMorningEndTime(daySchedule.manana.cierre);
                          } else {
                            setIsMorningOpen(false);
                            setMorningStartTime('08:00');
                            setMorningEndTime('12:00');
                          }
                          
                          if (daySchedule.tarde) {
                            setIsEveningOpen(daySchedule.tarde.activo);
                            setEveningStartTime(daySchedule.tarde.apertura);
                            setEveningEndTime(daySchedule.tarde.cierre);
                          } else {
                            setIsEveningOpen(false);
                            setEveningStartTime('16:00');
                            setEveningEndTime('20:00');
                          }
                        } else {
                          setIsMorningOpen(true);
                          setMorningStartTime('08:00');
                          setMorningEndTime('12:00');
                          setIsEveningOpen(true);
                          setEveningStartTime('16:00');
                          setEveningEndTime('20:00');
                        }
                        
                        setEditDayModalVisible(true);
                      }}
                    >
                      <View style={styles.dayNameContainer}>
                        <Text style={styles.dayName}>{getDayName(day)}</Text>
                      </View>
                      
                      <View style={styles.dayScheduleContainer}>
                        {dayHasSchedule ? (
                          <Text style={styles.dayScheduleText}>
                            {formatScheduleTime(daySchedule)}
                          </Text>
                        ) : (
                          <Text style={styles.dayClosed}>Cerrado</Text>
                        )}
                      </View>
                      
                      <View style={styles.dayActionContainer}>
                        <Text style={{ color: '#BBBBBB' }}>
                          <Ionicons 
                            name="chevron-forward-outline" 
                            size={20} 
                            color="#BBBBBB" 
                          />
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* Sección de duración de servicios */}
            <View style={styles.durationSection}>
              <View style={styles.sectionHeader}>
                <Text style={{ color: COLORS.primary }}>
                  <Ionicons name="timer-outline" size={20} color={COLORS.primary} />
                </Text>
                <Text style={styles.sectionTitle}>Duración de servicios</Text>
              </View>
              
              <Text style={styles.sectionDescription}>
                Define el tiempo promedio que dura cada uno de tus servicios para una mejor gestión de citas
              </Text>
              
              {Array.isArray(userServices) && userServices.length > 0 ? (
                <View style={styles.servicesList}>
                  {userServices.slice(0, 4).map(service => (
                    <View key={service._id} style={styles.serviceItem}>
                      <View style={styles.serviceDot} />
                      <Text style={styles.serviceName}>{service.nombre}</Text>
                      <Text style={styles.serviceDuration}>{service.duracion || 30} min</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noServicesText}>
                  No has agregado servicios aún
                </Text>
              )}
              
              <TouchableOpacity 
                style={styles.manageServicesButton}
                onPress={() => navigation.navigate('Services')}
              >
                <Text style={styles.manageServicesText}>Administrar servicios</Text>
                <Text style={{ color: COLORS.primary }}>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Sección de fechas especiales (próximamente) */}
            <View style={styles.specialDatesSection}>
              <View style={styles.sectionHeader}>
                <Text style={{ color: COLORS.grey }}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.grey} />
                </Text>
                <Text style={styles.sectionTitle}>Fechas especiales</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Próximamente</Text>
                </View>
              </View>
              
              <Text style={styles.sectionDescription}>
                Establece horarios especiales para fechas específicas como feriados o vacaciones
              </Text>
            </View>
          </>
        )}
        
        {/* Vista de horarios por servicio */}
        {currentTab === 'services' && (
          <View style={styles.serviceTabContainer}>
            {servicesLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 20}} />
            ) : services && services.length > 0 ? (
              <>
        <Text style={styles.sectionTitle}>Configurar horarios específicos por servicio</Text>
        
        {/* Selector de servicios - Horizontal */}
        <View style={styles.serviceSelectorContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.serviceScrollContent}
          >
            {services.map((service) => (
              <Pressable 
                key={service._id}
                style={({pressed}) => [
                  styles.serviceCard,
                  selectedServiceId === service._id && styles.selectedServiceCard,
                  pressed && styles.serviceCardPressed
                ]}
                onPress={() => {
                  setSelectedServiceId(service._id);
                  loadServiceAvailability(service._id);
                }}
              >
                <View style={[styles.serviceIconContainer, {backgroundColor: service.color || COLORS.primary}]}>
                  <Ionicons 
                    name={service.icono || "calendar-outline"} 
                    size={20} 
                    color="#FFF" 
                  />
                </View>
                <Text style={styles.serviceCardTitle}>{service.nombre}</Text>
                <Text style={styles.serviceCardDuration}>{service.duracion || 30} min</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        {selectedServiceId ? (
          <View style={styles.serviceConfigContainer}>
            {/* Encabezado de configuración */}
            <View style={styles.serviceConfigHeader}>
              <Text style={styles.serviceConfigTitle}>
                Horario para {services.find(s => s._id === selectedServiceId)?.nombre}
              </Text>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>
                  {serviceScheduleConfig?.horarioEspecifico?.activo ? 'Personalizado' : 'Usar horario general'}
                </Text>
                <Switch
                  value={serviceScheduleConfig?.horarioEspecifico?.activo || false}
                  onValueChange={toggleUseSpecificSchedule}
                  trackColor={{ false: COLORS.lightGrey, true: `${COLORS.primary}80` }}
                  thumbColor={serviceScheduleConfig?.horarioEspecifico?.activo ? COLORS.primary : '#f4f3f4'}
                />
              </View>
            </View>
            
            {serviceScheduleConfig?.horarioEspecifico?.activo ? (
              <>
                {/* Selector de días */}
                <View style={styles.weekDaysContainer}>
                  {DIAS_SEMANA.map((dia, index) => {
                    const diaConfig = serviceScheduleConfig?.horarioEspecifico?.horarios?.find(h => h.dia === index);
                    const isConfigured = !!diaConfig;
                    
                    return (
                      <Pressable
                        key={`day-${index}`}
                        style={({pressed}) => [
                          styles.dayCard,
                          isConfigured && styles.dayCardConfigured,
                          pressed && styles.dayCardPressed
                        ]}
                        onPress={() => handleEditServiceDay(index)}
                      >
                        <Text style={[
                          styles.dayName,
                          isConfigured && styles.dayNameConfigured
                        ]}>
                          {dia.substring(0, 3)}
                        </Text>
                        {isConfigured ? (
                          <View style={styles.daySchedule}>
                            {diaConfig.manana?.activo && (
                              <Text style={styles.dayScheduleText}>
                                {diaConfig.manana.apertura}-{diaConfig.manana.cierre}
                              </Text>
                            )}
                            {diaConfig.tarde?.activo && (
                              <Text style={styles.dayScheduleText}>
                                {diaConfig.tarde.apertura}-{diaConfig.tarde.cierre}
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Text style={styles.dayClosedText}>-</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
                
                {/* Botón de guardar */}
                <Pressable
                  style={({pressed}) => [
                    styles.saveButton,
                    pressed && styles.saveButtonPressed,
                    !serviceScheduleConfigChanged && styles.saveButtonDisabled
                  ]}
                  onPress={saveServiceSchedule}
                  disabled={!serviceScheduleConfigChanged || saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar cambios</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Este servicio está usando el horario general de atención. 
                  Activa el interruptor para configurar un horario específico.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.selectServicePrompt}>
            <Ionicons name="arrow-up" size={24} color={COLORS.primary} />
            <Text style={styles.selectServiceText}>Selecciona un servicio para configurar su horario</Text>
          </View>
        )}
      </>
    ) : (
      <View style={styles.noServicesContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.primary} />
        <Text style={styles.noServicesTitle}>No tienes servicios registrados</Text>
        <Text style={styles.noServicesText}>Agrega servicios para poder configurar horarios específicos</Text>
        <Pressable
          style={({pressed}) => [
            styles.addServiceButton,
            pressed && styles.addServiceButtonPressed
          ]}
          onPress={() => navigation.navigate('ServicesScreen')}
        >
          <Text style={styles.addServiceButtonText}>Agregar servicios</Text>
        </Pressable>
      </View>
    )}
  </View>
)}
      </ScrollView>
      
      {/* Modal de edición de día */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editDayModalVisible}
        onRequestClose={() => setEditDayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Editar {DIAS_SEMANA[currentDay]}
                {editMode === 'service' && services.find(s => s._id === selectedServiceId) ? 
                  ` - ${services.find(s => s._id === selectedServiceId).nombre}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setEditDayModalVisible(false)}>
                <Text style={{ color: COLORS.grey }}>
                  <Ionicons name="close" size={24} color={COLORS.grey} />
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Cuerpo */}
            <View style={styles.dayEditorBody}>
              {/* Sección de turno mañana */}
              <View style={styles.shiftSection}>
                <Text style={styles.shiftTitle}>Turno Mañana</Text>
                
                {/* Switch para activar/desactivar el turno mañana */}
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Atención disponible</Text>
                  <Switch
                    value={isMorningOpen}
                    onValueChange={(value) => setIsMorningOpen(value)}
                    trackColor={{ false: '#D1D1D1', true: COLORS.primary + '70' }}
                    thumbColor={isMorningOpen ? COLORS.primary : '#F5F5F5'}
                  />
                </View>
                
                {/* Selector de horario para turno mañana */}
                {isMorningOpen && (
                  <>
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>Hora de apertura</Text>
                      <TouchableOpacity 
                        style={styles.timeInput}
                        onPress={() => {
                          setTimeType('morningStart');
                          setCurrentTimeValue(morningStartTime);
                          setTimePickerTitle('Hora de apertura (mañana)');
                          setTimePickerVisible(true);
                        }}
                      >
                        <Text style={styles.timeText}>{morningStartTime}
                          <Ionicons name="time-outline" size={20} color={COLORS.grey} />
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>Hora de cierre</Text>
                      <TouchableOpacity 
                        style={styles.timeInput}
                        onPress={() => {
                          setTimeType('morningEnd');
                          setCurrentTimeValue(morningEndTime);
                          setTimePickerTitle('Hora de cierre (mañana)');
                          setTimePickerVisible(true);
                        }}
                      >
                        <Text style={styles.timeText}>{morningEndTime}
                          <Ionicons name="time-outline" size={20} color={COLORS.grey} />
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
              
              {/* Separador */}
              <View style={styles.separator} />
              
              {/* Sección de turno tarde-noche */}
              <View style={styles.shiftSection}>
                <Text style={styles.shiftTitle}>Turno Tarde-Noche</Text>
                
                {/* Switch para activar/desactivar el turno tarde */}
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Atención disponible</Text>
                  <Switch
                    value={isEveningOpen}
                    onValueChange={(value) => setIsEveningOpen(value)}
                    trackColor={{ false: '#D1D1D1', true: COLORS.primary + '70' }}
                    thumbColor={isEveningOpen ? COLORS.primary : '#F5F5F5'}
                  />
                </View>
                
                {/* Selector de horario para turno tarde */}
                {isEveningOpen && (
                  <>
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>Hora de apertura</Text>
                      <TouchableOpacity 
                        style={styles.timeInput}
                        onPress={() => {
                          setTimeType('eveningStart');
                          setCurrentTimeValue(eveningStartTime);
                          setTimePickerTitle('Hora de apertura (tarde)');
                          setTimePickerVisible(true);
                        }}
                      >
                        <Text style={styles.timeText}>{eveningStartTime}
                          <Ionicons name="time-outline" size={20} color={COLORS.grey} />
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.timeRow}>
                      <Text style={styles.timeLabel}>Hora de cierre</Text>
                      <TouchableOpacity 
                        style={styles.timeInput}
                        onPress={() => {
                          setTimeType('eveningEnd');
                          setCurrentTimeValue(eveningEndTime);
                          setTimePickerTitle('Hora de cierre (tarde)');
                          setTimePickerVisible(true);
                        }}
                      >
                        <Text style={styles.timeText}>{eveningEndTime}
                          <Ionicons name="time-outline" size={20} color={COLORS.grey} />
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
            
            {/* Pie */}
            <View style={styles.dayEditorFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setEditDayModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.confirmButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal para selector de tiempo usando EditTimeModal.js */}
      <EditTimeModal
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)} 
        timeValue={currentTimeValue} 
        onTimeChange={handleTimeSelected} 
        title={timePickerTitle} 
      />

    </SafeAreaView>
  );
}
//no modificar los estilos.
const styles = StyleSheet.create({
  // Cabecera
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  
  // Selector de pestañas
  tabSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    color: COLORS.grey,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Contenedor principal
  container: {
    padding: 20,
    paddingBottom: 50,
  },
  
  // Tarjeta de información
  infoCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },

  // Contenedor de horario
  scheduleContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 14,
  },
  // Mensajes informativos
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 8,
    lineHeight: 20,
  },
  selectServicePrompt: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
  },
  selectServiceText: {
    fontSize: 14,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Lista de días
  daysList: {
    marginTop: 10,
  },
  dayRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayNameContainer: {
    width: 100,
  },
  dayName: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  dayScheduleContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  dayScheduleText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  dayClosed: {
    fontSize: 14,
    color: '#F44336',
  },
  dayActionContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sección de duración
  durationSection: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 15,
    lineHeight: 20,
  },
  servicesList: {
    marginBottom: 15,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },

  // --- Estilos del Panel de Edición de Días ---
  dayEditorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dayEditorContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8, // Mayor elevación para mejorar visibilidad en Android
  },
  dayEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 15,
    marginBottom: 15,
  },
  dayEditorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  dayEditorBody: {
    marginBottom: 15,
  },
  dayEditorFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15, // Espaciado vertical consistente
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 10, // Espacio antes del siguiente elemento o selectores de tiempo
  },
  switchLabel: {
    fontSize: 16,
    color: COLORS.dark,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    // No se necesita marginBottom si es el último o el pie del modal lo maneja
  },
  timeLabel: {
    fontSize: 16,
    color: COLORS.dark,
    marginRight: 10, // Espacio entre la etiqueta y el input de tiempo
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    marginVertical: 5,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.dark,
    marginRight: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Alinear botones a la derecha
    paddingTop: 20, // Espacio sobre el pie del modal
    marginTop: 15, // Espacio adicional si el contenido de arriba es corto
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10, // Espacio a la derecha del botón Cancelar
  },
  cancelButtonText: {
    color: COLORS.grey, // Usar color del tema para texto gris
    fontWeight: '500',
    fontSize: 15,
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: COLORS.primary, // Usar color primario del tema
    borderRadius: 8,
  },
  confirmButtonText: {
    color: COLORS.white, // Usar color del tema para texto blanco
    fontWeight: 'bold',
    fontSize: 15,
  },
  serviceDuration: {
    fontSize: 14,
    color: COLORS.grey,
    fontWeight: '500',
  },
  noServicesText: {
    fontSize: 14,
    color: COLORS.grey,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  manageServicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 5,
  },
  manageServicesText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 5,
  },

  // Sección de fechas especiales
  specialDatesSection: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    opacity: 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  comingSoonBadge: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  comingSoonText: {
    fontSize: 10,
    color: COLORS.grey,
    fontWeight: '500',
  },

  // Contenedor principal de la pestaña de servicios
  serviceTabContainer: {
    flex: 1,
    padding: 16,
  },
  featureComingSoonContainer: {
    alignItems: 'center',
    padding: 20,
  },
  featureComingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.grey,
    marginTop: 15,
    marginBottom: 10,
  },
  featureComingSoonText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Estilos para modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333333',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  timeLabel: {
    fontSize: 15,
    color: '#333333',
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 16,
    color: '#333333',
    marginRight: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  cancelButtonText: {
    color: COLORS.grey,
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // Selector de tiempo
  timePickerBody: {
    maxHeight: 300,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  
  // Estilos para pestaña de disponibilidad por servicio
  serviceTabContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  // Selector de servicios
  serviceSelectorContainer: {
    marginBottom: 20,
  },
  serviceScrollContent: {
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginVertical: 15, 
  },
  serviceCard: {
    width: 140,
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedServiceCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#F5F9FF',
  },
  serviceCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  serviceCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  serviceCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  serviceCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceCardDuration: {
    fontSize: 12,
    color: COLORS.grey,
    textAlign: 'center',
  },
  serviceConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceConfigTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 5,
  },
  serviceCategory: {
    fontSize: 12,
    color: COLORS.grey,
  },
  serviceScheduleContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  serviceScheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  specificScheduleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  // Contenedor de configuración de servicio
  serviceConfigContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 15,
    flex: 1,
    color: COLORS.dark,
  },
  daysContainer: {
    marginTop: 15,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dayName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
  },
  daySchedule: {
    fontSize: 13,
    color: COLORS.grey,
    marginTop: 3,
  },
  noServicesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  noServicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 15,
    marginBottom: 10,
  },
  noServicesText: {
    fontSize: 15,
    color: COLORS.grey,
    textAlign: 'center',
    marginBottom: 20,
  },
  addServiceButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addServiceButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 5,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  saveButtonContainer: {
    marginTop: 20,
    alignSelf: 'flex-end',
  },
  configHint: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.grey,
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  // Estilos para el selector de tiempo
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeOptionSelected: {
    backgroundColor: COLORS.primary + '15',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});