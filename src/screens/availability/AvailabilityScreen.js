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
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, globalStyles } from '../../styles/globalStyles';
import { prestadorService } from '../../services/api';
import useAuthStore from '../../store/useAuthStore';

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '18:00';

export default function AvailabilityScreen({ navigation }) {
  // Estado del usuario y prestador
  const user = useAuthStore(state => state.user);
  const prestadorId = user?.prestador?._id;
  
  // Estados para gestionar horarios y servicios
  const [generalSchedule, setGeneralSchedule] = useState([]);
  const [userServices, setUserServices] = useState([]);
  
  // Estados para la interfaz
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('general'); // 'general' o 'services'
  
  // Estados para modales y edición
  const [editDayModalVisible, setEditDayModalVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [currentDay, setCurrentDay] = useState(null); // Día seleccionado (0-6)
  const [isDayOpen, setIsDayOpen] = useState(true); // Si el día tiene horario o está cerrado
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME); // Hora de apertura
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME); // Hora de cierre
  const [timeType, setTimeType] = useState('start'); // 'start' o 'end' (para el selector de tiempo)
  
  // Efecto para cargar datos al iniciar la pantalla
  useEffect(() => {
    if (prestadorId) {
      loadPrestadorData();
    } else {
      setLoading(false);
    }
  }, [prestadorId]);

  // Cargar datos del prestador (horarios y servicios)
  const loadPrestadorData = async () => {
    try {
      setLoading(true);
      const prestadorData = await prestadorService.getPrestadorById(prestadorId);
      
      // Cargar horario general
      if (prestadorData?.horarios && prestadorData.horarios.length > 0) {
        setGeneralSchedule(prestadorData.horarios);
      } else {
        // Crear horario por defecto para días laborales (L-V 9:00-18:00)
        const defaultSchedule = [
          { dia: 1, apertura: "09:00", cierre: "18:00" }, // Lunes
          { dia: 2, apertura: "09:00", cierre: "18:00" }, // Martes
          { dia: 3, apertura: "09:00", cierre: "18:00" }, // Miércoles
          { dia: 4, apertura: "09:00", cierre: "18:00" }, // Jueves
          { dia: 5, apertura: "09:00", cierre: "18:00" }, // Viernes
        ];
        setGeneralSchedule(defaultSchedule);
      }
      
      // Cargar servicios del prestador
      if (prestadorData?.servicios && prestadorData.servicios.length > 0) {
        setUserServices(prestadorData.servicios);
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

  // Guardar el horario general en el backend
  const saveGeneralSchedule = async () => {
    if (!prestadorId) {
      Alert.alert('Error', 'No se pudo identificar el prestador');
      return;
    }
    
    try {
      setSaving(true);
      await prestadorService.updatePrestador(prestadorId, { horarios: generalSchedule });
      Alert.alert('Guardado', 'Tus horarios se actualizaron correctamente');
      setSaving(false);
    } catch (error) {
      console.error('Error al guardar horario general:', error);
      Alert.alert(
        'Error', 
        'No se pudo guardar la información. Intenta nuevamente más tarde.'
      );
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
  
  // Función para guardar cambios en el horario
  const handleSaveSchedule = () => {
    // Actualizar el horario general
    const updatedSchedule = [...generalSchedule];
    
    if (isDayOpen) {
      // Validar que la hora de cierre sea posterior a la apertura
      const startParts = startTime.split(':').map(Number);
      const endParts = endTime.split(':').map(Number);
      
      if (startParts[0] > endParts[0] || 
         (startParts[0] === endParts[0] && startParts[1] >= endParts[1])) {
        Alert.alert(
          'Horario inválido', 
          'La hora de cierre debe ser posterior a la hora de apertura'
        );
        return;
      }
      
      // Buscar si ya existe un horario para este día
      const existingIndex = updatedSchedule.findIndex(s => s.dia === currentDay);
      
      if (existingIndex >= 0) {
        // Actualizar horario existente
        updatedSchedule[existingIndex] = {
          dia: currentDay,
          apertura: startTime,
          cierre: endTime
        };
      } else {
        // Agregar nuevo horario
        updatedSchedule.push({
          dia: currentDay,
          apertura: startTime,
          cierre: endTime
        });
      }
    } else {
      // Eliminar el horario para este día si existe
      const existingIndex = updatedSchedule.findIndex(s => s.dia === currentDay);
      if (existingIndex >= 0) {
        updatedSchedule.splice(existingIndex, 1);
      }
    }
    
    setGeneralSchedule(updatedSchedule);
    setEditDayModalVisible(false);
  };
  
  // Verificar si un día tiene horario configurado
  const isDayConfigured = (dayNumber) => {
    return generalSchedule.some(schedule => schedule.dia === dayNumber);
  };
  
  // Obtener el horario para un día específico
  const getScheduleForDay = (dayNumber) => {
    return generalSchedule.find(schedule => schedule.dia === dayNumber);
  };
  
  // Convierte un horario en texto legible (ej: "09:00 - 18:00")
  const formatScheduleTime = (schedule) => {
    if (!schedule || !schedule.apertura || !schedule.cierre) return 'Cerrado';
    return `${schedule.apertura} - ${schedule.cierre}`;
  };

  // Renderizar pantalla de carga
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 15, fontSize: 16, color: COLORS.grey }}>Cargando horarios...</Text>
      </SafeAreaView>
    );
  }

  // Renderizar pantalla principal
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar style="light" />
      
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
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
          onPress={() => setCurrentTab('services')}
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
                          setIsDayOpen(true);
                          setStartTime(daySchedule.apertura);
                          setEndTime(daySchedule.cierre);
                        } else {
                          setIsDayOpen(false);
                          setStartTime(DEFAULT_START_TIME);
                          setEndTime(DEFAULT_END_TIME);
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
            {/* Mensaje de funcionalidad en desarrollo */}
            <View style={styles.featureComingSoonContainer}>
              <Text style={{ color: COLORS.grey }}>
                <Ionicons name="build-outline" size={56} color={COLORS.grey} />
              </Text>
              <Text style={styles.featureComingSoonTitle}>Próximamente</Text>
              <Text style={styles.featureComingSoonText}>
                Pronto podrás configurar horarios específicos para cada tipo de servicio que ofreces, permitiendo una mayor flexibilidad en tu agenda.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Panel de edición para horario del día (visible solo cuando se selecciona un día) */}
      {editDayModalVisible && (
        <View style={styles.dayEditorOverlay}>
          <View style={styles.dayEditorContainer}>
            {/* Encabezado */}
            <View style={styles.dayEditorHeader}>
              <Text style={styles.dayEditorTitle}>
                Horario: {currentDay !== null ? getDayName(currentDay) : ''}
              </Text>
              <TouchableOpacity onPress={() => setEditDayModalVisible(false)}>
                <Text style={{ color: COLORS.primary }}>
                  <Ionicons name="close" size={24} color={COLORS.dark} />
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Cuerpo */}
            <View style={styles.dayEditorBody}>
              {/* Switch para activar/desactivar el día */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Atención disponible</Text>
                <Switch
                  value={isDayOpen}
                  onValueChange={(value) => setIsDayOpen(value)}
                  trackColor={{ false: '#D1D1D1', true: COLORS.primary + '70' }}
                  thumbColor={isDayOpen ? COLORS.primary : '#F5F5F5'}
                />
              </View>
              
              {/* Selector de horario (solo visible si el día está activado) */}
              {isDayOpen && (
                <>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Hora de apertura</Text>
                    <TouchableOpacity 
                      style={styles.timeInput}
                      onPress={() => {
                        setTimeType('start');
                        setTimePickerVisible(true);
                      }}
                    >
                      <Text style={styles.timeText}>{startTime}
                        <Ionicons name="time-outline" size={20} color={COLORS.grey} />
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Hora de cierre</Text>
                    <TouchableOpacity 
                      style={styles.timeInput}
                      onPress={() => {
                        setTimeType('end');
                        setTimePickerVisible(true);
                      }}
                    >
                      <Text style={styles.timeText}>{endTime}
                        <Ionicons name="time-outline" size={20} color={COLORS.grey} />
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
      )}
      
      {/* Modal para selector de tiempo */}
      <Modal
        visible={timePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTimePickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ width: '100%' }}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Seleccionar hora de {timeType === 'start' ? 'apertura' : 'cierre'}
                    </Text>
                    <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                      <Text style={{ color: COLORS.grey }}>
                        <Ionicons name="close" size={24} color={COLORS.grey} />
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.timePickerBody}>
                    <FlatList
                      data={getTimeOptions()}
                      keyExtractor={(item) => item}
                      renderItem={({item}) => {
                        const isSelected = (timeType === 'start' && item === startTime) || 
                                          (timeType === 'end' && item === endTime);
                        
                        return (
                          <TouchableOpacity
                            style={[styles.timeOption, isSelected && styles.timeOptionSelected]}
                            onPress={() => {
                              if (timeType === 'start') {
                                setStartTime(item);
                              } else {
                                setEndTime(item);
                              }
                              setTimePickerVisible(false);
                            }}
                          >
                            <Text 
                              style={[styles.timeOptionText, isSelected && styles.timeOptionTextSelected]}
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                      showsVerticalScrollIndicator={true}
                      initialScrollIndex={getTimeOptions().findIndex(t => {
                        return timeType === 'start' ? t === startTime : t === endTime;
                      })}
                      getItemLayout={(data, index) => ({
                        length: 50,
                        offset: 50 * index,
                        index,
                      })}
                    />
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

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

  // Vista de servicios (próximamente)
  serviceTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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