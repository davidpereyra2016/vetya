import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  Image,
  FlatList,
  Alert,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import usePetStore from '../../store/usePetStore';
import useCitaStore from '../../store/useCitaStore';

// CAMBIO: Se actualizó el nombre del primer paso para mayor claridad.
const Stepper = ({ currentStep }) => {
  const steps = ['Prestador', 'Mascota', 'Fecha', 'Confirmar'];
  
  // Calculamos el ancho de la línea de progreso
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <View style={newStyles.stepperCard}>
      <View style={newStyles.stepperWrapper}>
        {/* Línea de fondo (Gris) */}
        <View style={newStyles.progressTrack} />
        {/* Línea de progreso (Azul/Verde) */}
        <View style={[newStyles.progressFill, { width: `${progressPercentage * 0.8}%` }]} />
        
        {/* Contenedor de los pasos */}
        <View style={newStyles.stepsContainer}>
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = currentStep > stepNumber;
            const isActive = currentStep === stepNumber;
            
            return (
              <View key={step} style={newStyles.stepNode}>
                <View style={[
                  newStyles.stepCircle,
                  isActive && newStyles.activeStepCircle,
                  isCompleted && newStyles.completedStepCircle,
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : (
                    <Text style={[
                      newStyles.stepNumber,
                      isActive && newStyles.activeStepText
                    ]}>{stepNumber}</Text>
                  )}
                </View>
                <Text style={[
                  newStyles.stepLabel,
                  isActive && newStyles.activeStepLabel,
                  isCompleted && newStyles.completedStepLabel
                ]}>{step}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};


const AgendarCitaScreen = ({ navigation, route }) => {
  // Estado para controlar el paso actual del formulario
  const [currentStep, setCurrentStep] = useState(1);

  // Estados del formulario
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para proveedores y servicios
  const [providerTypes, setProviderTypes] = useState([]);
  const [selectedProviderType, setSelectedProviderType] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const getLocationOptionsForService = () => {
    const modalidades = Array.isArray(selectedService?.modalidadAtencion)
      ? selectedService.modalidadAtencion
      : [];

    const normalized = modalidades.map((modalidad) =>
      modalidad === 'Clinica' ? 'Clínica' : modalidad
    );

    const optionsCatalog = {
      Domicilio: {
        id: 'domicilio',
        type: 'Domicilio',
        description: 'El profesional te visitará',
        icon: 'home-outline'
      },
      'Clínica': {
        id: 'clinica',
        type: 'Clínica',
        description: 'Asistirás a la clínica',
        icon: 'business-outline'
      }
    };

    const options = normalized
      .filter((modalidad) => optionsCatalog[modalidad])
      .map((modalidad) => optionsCatalog[modalidad]);

    return options.length > 0 ? options : [optionsCatalog['Clínica']];
  };

  // Animaciones y referencias
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  // Carga de datos inicial
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const { fetchPets } = usePetStore.getState();
        const petsResult = await fetchPets();
        if (petsResult.success) {
          setPets(petsResult.data.map(pet => ({ ...pet, id: pet._id })));
        } else {
          Alert.alert('Error', 'No se pudieron cargar tus mascotas');
        }

        const { fetchProviderTypes } = useCitaStore.getState();
        const typesResult = await fetchProviderTypes();
        if (typesResult.success) {
          setProviderTypes(typesResult.data);
        } else {
           Alert.alert('Error', 'No se pudieron cargar los tipos de prestadores');
        }
        
        const { fetchAvailableDates } = useCitaStore.getState();
        const datesResult = await fetchAvailableDates();
        if (datesResult.success) {
            setAvailableDates(datesResult.data);
        } else {
            console.error('Error al cargar fechas:', datesResult.error);
        }

      } catch (error) {
        Alert.alert('Error', 'Ocurrió un error al cargar los datos iniciales');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
    
    return () => {
      useCitaStore.getState().resetCitaState();
    };
  }, []);

  // Cargar horarios cuando cambian las dependencias
  useEffect(() => {
    if (selectedDate && selectedProvider && selectedService) {
      const loadAvailableTimes = async () => {
        setIsLoading(true);
        try {
          // Convertir el objeto Date a string en formato YYYY-MM-DD
          // El backend espera las fechas en este formato estándar
          const date = new Date(selectedDate.date);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          const result = await useCitaStore.getState().fetchAvailableTimes(
            dateStr,
            selectedProvider._id,
            selectedService._id
          );
          
          if (result.success) {
            setAvailableTimes(result.data);
          } else {
            setAvailableTimes([]);
          }
        } catch (error) {
          setAvailableTimes([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadAvailableTimes();
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, selectedProvider, selectedService]);

  const handleNextStep = () => {
    if (currentStep === 1 && (!selectedProviderType || !selectedProvider || !selectedService)) {
      Alert.alert('Paso incompleto', 'Por favor, selecciona tipo de servicio, prestador y el servicio específico.');
      return;
    }
    if (currentStep === 2 && !selectedPet) {
      Alert.alert('Paso incompleto', 'Por favor, selecciona una mascota.');
      return;
    }
    if (currentStep === 3 && (!selectedDate || !selectedTime)) {
      Alert.alert('Paso incompleto', 'Por favor, selecciona una fecha y hora.');
      return;
    }
    setCurrentStep(prev => prev + 1);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // CAMBIO: La lógica de selección ahora sigue el flujo correcto y dinámico.
  const handleSelectProviderType = async (type) => {
    setIsLoading(true);
    setSelectedProviderType(type);
    // Limpiar selecciones dependientes
    setSelectedProvider(null);
    setProviders([]);
    setSelectedService(null);
    setServices([]);
    setSelectedLocation(null);
    
    try {
      const { fetchProvidersByType } = useCitaStore.getState();
      // Se pasa directamente el nombre del tipo (ej: 'Veterinario')
      const result = await fetchProvidersByType(type.name); 
      if (result.success) {
        setProviders(result.data);
      } else {
        setProviders([]);
        Alert.alert('Error', 'No se pudieron cargar los prestadores para este tipo.');
      }
    } catch (error) {
        Alert.alert('Error', 'Ocurrió un error al cargar los prestadores');
    } finally {
      setIsLoading(false);
    }
  };
  const handleSelectProvider = async (provider) => {
    setIsLoading(true);
    setSelectedProvider(provider);
    // Limpiar selección de servicio
    setSelectedService(null);
    setServices([]);
    setSelectedLocation(null);
    try {
      const { getProviderServices } = useCitaStore.getState();
      const result = await getProviderServices(provider._id);
      if (result.success) {
        setServices(result.data);
      } else {
        setServices([]);
        Alert.alert('Error', 'No se pudieron cargar los servicios de este prestador.');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al cargar los servicios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const locationOptions = getLocationOptionsForService();

    if (!selectedService) {
      setSelectedLocation(null);
      return;
    }

    if (!selectedLocation) {
      if (locationOptions.length === 1) {
        setSelectedLocation(locationOptions[0]);
      }
      return;
    }

    const selectedStillValid = locationOptions.some((option) => option.type === selectedLocation.type);
    if (!selectedStillValid) {
      setSelectedLocation(locationOptions.length === 1 ? locationOptions[0] : null);
    }
  }, [selectedService]);
  
  // Función para preparar los datos de la cita y navegar a confirmación
  // NOTA: La cita NO se crea aquí, se crea cuando el usuario confirma el pago
  const handleScheduleAppointment = async () => {
    if (!selectedLocation || !reasonForVisit.trim()) {
      Alert.alert('Información requerida', 'Por favor, selecciona una ubicación y describe el motivo de la cita.');
      return;
    }
    
    setIsLoading(true);
    try {
      const selectedDateTime = new Date(selectedDate.date);
      const [hours, minutes] = selectedTime.time.split(':');
      selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Preparar los datos de la cita (sin crearla aún)
      const appointmentData = {
        mascota: selectedPet._id,
        prestador: selectedProvider._id,
        servicio: selectedService._id,
        fecha: selectedDateTime.toISOString(),
        horaInicio: selectedTime.time,
        horaFin: selectedTime.endTime,
        motivo: reasonForVisit,
        estado: 'Pendiente',
        ubicacion: selectedLocation.type
      };
      
      // Pasar los DATOS para crear la cita después de seleccionar método de pago
      navigation.navigate('CitaConfirmacion', {
        appointmentData: appointmentData,
        // Pasar datos serializables para mostrar en la UI
        pet: selectedPet,
        provider: selectedProvider,
        service: selectedService,
        date: {
          ...selectedDate,
          date: selectedDate.date.toISOString(), // Convertir Date a string
        },
        time: selectedTime,
        location: selectedLocation,
        reason: reasonForVisit
      });
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al preparar la cita');
    } finally {
      setIsLoading(false);
    }
  };


  // --- RENDER FUNCTIONS --- //

  const renderLoader = () => (
    <View style={newStyles.loaderContainer}>
      <ActivityIndicator size="large" color="#1E88E5" />
      <Text style={newStyles.loaderText}>Cargando...</Text>
    </View>
  );

  const renderSectionTitle = (title) => <Text style={newStyles.sectionTitle}>{title}</Text>;

  // Flujo: tipo prestador → prestador → servicio (diseño premium)
  const renderProviderSelectionStep = () => (
    <View>
      {/* 1. Tipo de prestador - chips horizontales */}
      {renderSectionTitle('Elige el tipo de prestador')}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={newStyles.hScroll} contentContainerStyle={newStyles.hScrollContent}>
        {providerTypes.map(type => {
          const isSelected = selectedProviderType?.id === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              activeOpacity={0.85}
              style={[newStyles.chip, isSelected ? newStyles.chipActive : newStyles.chipInactive]}
              onPress={() => handleSelectProviderType(type)}
            >
              <Ionicons name={type.icon} size={16} color={isSelected ? '#FFF' : '#666'} style={{ marginRight: 6 }} />
              <Text style={[newStyles.chipText, isSelected ? newStyles.chipTextActive : newStyles.chipTextInactive]}>{type.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading && !providers.length && selectedProviderType && renderLoader()}

      {/* 2. Prestador - tarjetas horizontales */}
      {selectedProviderType && providers.length > 0 && (
        <>
          {renderSectionTitle('Selecciona un prestador')}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={newStyles.hScroll} contentContainerStyle={newStyles.hScrollContent}>
            {providers.map(provider => {
              const isSelected = selectedProvider?._id === provider._id;
              const img = provider.usuario?.profilePicture || provider.imagen;
              return (
                <TouchableOpacity
                  key={provider._id}
                  activeOpacity={0.9}
                  style={[newStyles.prestadorCard, isSelected ? newStyles.prestadorCardActive : newStyles.prestadorCardInactive]}
                  onPress={() => handleSelectProvider(provider)}
                >
                  {isSelected && (
                    <View style={newStyles.checkIconTopRight}>
                      <Ionicons name="checkmark-circle" size={20} color="#1E88E5" />
                    </View>
                  )}
                  {img ? (
                    <Image source={{ uri: img }} style={newStyles.prestadorImg} />
                  ) : (
                    <View style={newStyles.logoPlaceholder}>
                      <Ionicons name="medical" size={24} color="#B0BEC5" />
                    </View>
                  )}
                  <Text style={newStyles.prestadorNombre} numberOfLines={1}>{provider.nombre}</Text>
                  {provider.rating ? (
                    <View style={newStyles.ratingBadge}>
                      <Ionicons name="star" size={10} color="#FFB300" style={{ marginRight: 2 }} />
                      <Text style={newStyles.ratingBadgeText}>{provider.rating}</Text>
                    </View>
                  ) : (
                    <Text style={newStyles.prestadorTipo} numberOfLines={1}>{provider.tipo || ''}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {isLoading && !services.length && selectedProvider && renderLoader()}

      {/* 3. Servicio - filas con precio y duración */}
      {selectedProvider && services.length > 0 && (
        <>
          {renderSectionTitle('Servicio a realizar')}
          {services.map(service => {
            const isSelected = selectedService?._id === service._id;
            return (
              <TouchableOpacity
                key={service._id}
                activeOpacity={0.9}
                style={[newStyles.servicioRow, isSelected ? newStyles.servicioRowActive : newStyles.servicioRowInactive]}
                onPress={() => setSelectedService(service)}
              >
                <View style={newStyles.servicioInfo}>
                  <View style={newStyles.servicioHeader}>
                    <Text style={[newStyles.servicioNombre, isSelected && { color: '#1E88E5' }]} numberOfLines={1}>{service.nombre}</Text>
                    <Text style={[newStyles.servicioPrecio, isSelected && { color: '#1E88E5' }]}>${service.precio || '0'}</Text>
                  </View>
                  <View style={newStyles.servicioFooter}>
                    <Ionicons name="time-outline" size={14} color={isSelected ? '#1E88E5' : '#999'} style={{ marginRight: 4 }} />
                    <Text style={newStyles.servicioTiempo}>{service.duracion || 30} min aprox.</Text>
                  </View>
                </View>
                <View style={[newStyles.radioOuter, isSelected && newStyles.radioOuterActive]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </View>
  );

  // Paso 2 - Mascota (grid 2 columnas)
  const renderPetStep = () => (
    <View>
      {renderSectionTitle('Selecciona tu mascota')}
      <View style={newStyles.gridContainer}>
        {pets.map(pet => {
          const isSelected = selectedPet?.id === pet.id;
          return (
            <TouchableOpacity
              key={pet.id}
              activeOpacity={0.9}
              style={[newStyles.mascotaCard, isSelected ? newStyles.mascotaCardActive : newStyles.mascotaCardInactive]}
              onPress={() => setSelectedPet(pet)}
            >
              {isSelected && (
                <View style={newStyles.checkIconTopRight}>
                  <Ionicons name="checkmark-circle" size={22} color="#1E88E5" />
                </View>
              )}
              {pet.imagen ? (
                <Image source={{ uri: pet.imagen }} style={newStyles.mascotaImg} />
              ) : (
                <View style={newStyles.mascotaImgPlaceholder}>
                  <Ionicons name="paw" size={28} color="#B0BEC5" />
                </View>
              )}
              <Text style={newStyles.mascotaNombre} numberOfLines={1}>{pet.nombre}</Text>
              <Text style={newStyles.mascotaTipo} numberOfLines={1}>
                {pet.tipo}{pet.raza ? ` · ${pet.raza}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Paso 3 - Fecha y hora
  const renderDateTimeStep = () => (
    <View>
      {renderSectionTitle('Elige una fecha')}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={newStyles.hScroll} contentContainerStyle={newStyles.hScrollContent}>
        {availableDates.map(item => {
          const isSelected = selectedDate?.id === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={[newStyles.fechaCard, isSelected ? newStyles.fechaCardActive : newStyles.fechaCardInactive]}
              onPress={() => setSelectedDate(item)}
            >
              <Text style={[newStyles.fechaDia, { color: isSelected ? '#BBDEFB' : '#999' }]}>{item.dayName.substring(0, 3)}</Text>
              <Text style={[newStyles.fechaNum, { color: isSelected ? '#FFF' : '#333' }]}>{item.day}</Text>
              <Text style={[newStyles.fechaMes, { color: isSelected ? '#BBDEFB' : '#999' }]}>{item.month.substring(0, 3)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading && selectedDate && renderLoader()}

      {selectedDate && !isLoading && (
        <>
          {renderSectionTitle('Elige un horario')}
          {availableTimes.length > 0 ? (
            <View style={newStyles.horasGrid}>
              {availableTimes.map(item => {
                const isSelected = selectedTime?.id === item.id;
                const isDisabled = !item.available;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    disabled={isDisabled}
                    style={[
                      newStyles.horaCard,
                      isSelected && newStyles.horaCardActive,
                      isDisabled && newStyles.horaCardDisabled,
                    ]}
                    onPress={() => setSelectedTime(item)}
                  >
                    <Text style={[
                      newStyles.horaText,
                      isSelected && newStyles.horaTextActive,
                      isDisabled && newStyles.horaTextDisabled,
                    ]}>{item.time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={newStyles.noDataText}>No hay horarios disponibles para la fecha y servicio seleccionados.</Text>
          )}
        </>
      )}
    </View>
  );

  // Paso 4 - Ubicación, motivo y resumen premium
  const renderDetailsStep = () => {
    const locationOptions = getLocationOptionsForService();
    const providerImg = selectedProvider?.usuario?.profilePicture || selectedProvider?.imagen;
    const petImg = selectedPet?.imagen;

    return (
      <View>
        {renderSectionTitle('¿Dónde será la cita?')}
        <View style={newStyles.ubicacionContainer}>
          {locationOptions.map(loc => {
            const isSelected = selectedLocation?.id === loc.id;
            return (
              <TouchableOpacity
                key={loc.id}
                activeOpacity={0.85}
                style={[
                  newStyles.ubiCard,
                  isSelected ? newStyles.ubiCardActive : newStyles.ubiCardInactive,
                  locationOptions.length === 1 && { width: '100%' },
                ]}
                onPress={() => setSelectedLocation(loc)}
              >
                <Ionicons name={loc.icon} size={28} color={isSelected ? '#1E88E5' : '#999'} style={{ marginBottom: 4 }} />
                <Text style={[newStyles.ubiText, { color: isSelected ? '#1E88E5' : '#666' }]}>{loc.type}</Text>
                <Text style={[newStyles.ubiSubText, isSelected && { color: '#1E88E5' }]} numberOfLines={2}>{loc.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedService?.modalidadAtencion?.length === 1 && (
          <Text style={newStyles.helperText}>
            Este servicio solo está disponible en {selectedService.modalidadAtencion[0]}.
          </Text>
        )}

        {renderSectionTitle('Motivo de la Cita')}
        <TextInput
          style={newStyles.textArea}
          placeholder="Describe brevemente el motivo de la visita (ej: control anual, vacuna, etc.)"
          placeholderTextColor="#999"
          multiline
          value={reasonForVisit}
          onChangeText={setReasonForVisit}
          textAlignVertical="top"
        />

        {/* RESUMEN DE LA CITA */}
        <View style={newStyles.resumenCard}>
          <Ionicons name="paw" size={140} color="rgba(255,255,255,0.08)" style={newStyles.resumenBgIcon} />
          <Text style={newStyles.resumenTitle}>RESUMEN DE TU CITA</Text>

          <View style={newStyles.resumenHeader}>
            <View style={[newStyles.resumenRow, { flex: 1, marginBottom: 0 }]}>
              <View style={newStyles.resumenIconBox}>
                <Ionicons name="medical" size={16} color="#FFF" />
              </View>
              <Text style={newStyles.resumenMainText} numberOfLines={1}>
                {selectedService?.nombre || 'Servicio no seleccionado'}
              </Text>
            </View>
            <Text style={newStyles.resumenPrice}>${selectedService?.precio || '0'}</Text>
          </View>

          <View style={newStyles.resumenRow}>
            <View style={newStyles.resumenIconBox}>
              {providerImg ? (
                <Image source={{ uri: providerImg }} style={newStyles.resumenMiniImg} />
              ) : (
                <Ionicons name="person" size={14} color="#FFF" />
              )}
            </View>
            <Text style={newStyles.resumenSubText} numberOfLines={1}>
              Con {selectedProvider?.nombre || '---'}
            </Text>
          </View>

          <View style={newStyles.resumenRow}>
            <View style={newStyles.resumenIconBox}>
              {petImg ? (
                <Image source={{ uri: petImg }} style={newStyles.resumenMiniImg} />
              ) : (
                <Ionicons name="paw" size={14} color="#FFF" />
              )}
            </View>
            <Text style={newStyles.resumenSubText} numberOfLines={1}>
              Para {selectedPet?.nombre || '---'}
            </Text>
          </View>

          <View style={newStyles.resumenRow}>
            <View style={newStyles.resumenIconBox}>
              <Ionicons name="calendar" size={16} color="#FFF" />
            </View>
            <Text style={newStyles.resumenSubText}>
              {selectedDate ? `${selectedDate.dayName.substring(0,3)} ${selectedDate.day} ${selectedDate.month.substring(0,3)}` : '---'} · {selectedTime?.time || '--:--'}
            </Text>
          </View>

          <View style={[newStyles.resumenRow, { marginBottom: 0 }]}>
            <View style={newStyles.resumenIconBox}>
              <Ionicons name={selectedLocation?.icon || 'location-outline'} size={16} color="#FFF" />
            </View>
            <Text style={newStyles.resumenSubText}>
              {selectedLocation?.type || '---'}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={newStyles.container}
    >
      <StatusBar style="light" />
      
      <View style={newStyles.header}>
        <View style={newStyles.headerTop}>
          <TouchableOpacity style={newStyles.headerBackButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={newStyles.headerTitle}>Agendar Cita</Text>
          <View style={newStyles.headerSpacer} />
        </View>
      </View>
      
      <Stepper currentStep={currentStep} />

      <ScrollView ref={scrollViewRef} contentContainerStyle={newStyles.content}>
        {currentStep === 1 && renderProviderSelectionStep()}
        {currentStep === 2 && renderPetStep()}
        {currentStep === 3 && renderDateTimeStep()}
        {currentStep === 4 && renderDetailsStep()}
      </ScrollView>

      <View style={newStyles.footer}>
        {currentStep > 1 && (
            <TouchableOpacity style={[newStyles.navButton, newStyles.prevButton]} onPress={handlePrevStep}>
                <Text style={newStyles.prevButtonText}>Anterior</Text>
            </TouchableOpacity>
        )}
        {currentStep < 4 ? (
            <TouchableOpacity style={[newStyles.navButton, newStyles.nextButton]} onPress={handleNextStep}>
                <Text style={newStyles.nextButtonText}>Siguiente</Text>
                <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
            </TouchableOpacity>
        ) : (
            <TouchableOpacity style={[newStyles.navButton, newStyles.nextButton]} onPress={handleScheduleAppointment} disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                      <Text style={newStyles.nextButtonText}>Confirmar Cita</Text>
                      <Ionicons name="calendar-outline" size={20} color="#fff" />
                    </>
                )}
            </TouchableOpacity>
        )}
      </View>

    </KeyboardAvoidingView>
  );
};

// --- ESTILOS MODERNOS CONSISTENTES CON EL SISTEMA ---
const { width } = Dimensions.get('window');

const newStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  stepperCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  stepperWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    top: 20,
    left: '10%',
    right: '10%',
    height: 4,
    backgroundColor: '#EEF2F6',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    top: 20,
    left: '10%',
    height: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepNode: {
    alignItems: 'center',
    width: 70,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EEF2F6',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activeStepCircle: {
    borderColor: '#1E88E5',
    backgroundColor: '#E3F2FD',
    transform: [{ scale: 1.1 }],
  },
  completedStepCircle: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#9E9E9E',
  },
  activeStepText: {
    color: '#1E88E5',
  },
  stepLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '600',
    textAlign: 'center',
  },
  activeStepLabel: {
    color: '#1E88E5',
    fontWeight: '800',
  },
  completedStepLabel: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for footer
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 25,
    marginBottom: 15,
  },
  horizontalList: {
    paddingVertical: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: '#1E88E5',
    borderWidth: 0,
  },
  cardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  selectedCardText: {
    color: '#fff',
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: '#E9ECEF',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  providerSpecialty: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 13,
    color: '#6C757D',
    marginLeft: 5,
  },
  checkIcon: {
    marginLeft: 10,
  },
  serviceListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  serviceInfo: {
      marginTop: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  dateItem: {
    width: 80,
    height: 100,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  dateMonth: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  timeItem: {
    minWidth: 105,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  unavailableTimeItem: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  unavailableTimeText: {
      color: '#999',
      textDecorationLine: 'line-through'
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    fontStyle: 'italic',
    padding: 20,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  helperText: {
    marginTop: -2,
    marginBottom: 8,
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
  },
  reasonInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  navButton: {
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  prevButton: {
    backgroundColor: '#F5F7FA',
    marginRight: 10,
  },
  nextButton: {
    backgroundColor: '#1E88E5',
  },
  prevButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // ─── SCROLLS HORIZONTALES ───
  hScroll: {
    marginHorizontal: -20,
    marginBottom: 5,
  },
  hScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },

  // ─── PASO 1: CHIPS TIPO PRESTADOR ───
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#1E88E5',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  chipInactive: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
  },
  chipText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  chipTextActive: { color: '#FFF' },
  chipTextInactive: { color: '#666' },

  // ─── PASO 1: TARJETAS DE PRESTADORES ───
  prestadorCard: {
    width: 150,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  prestadorCardActive: {
    backgroundColor: 'rgba(227, 242, 253, 0.5)',
    borderColor: '#1E88E5',
  },
  prestadorCardInactive: {
    backgroundColor: '#FFF',
    borderColor: '#F0F0F0',
  },
  prestadorImg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#E3F2FD',
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  prestadorNombre: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  prestadorTipo: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    textAlign: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  checkIconTopRight: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },

  // ─── PASO 1: FILA DE SERVICIO ───
  servicioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 2,
  },
  servicioRowActive: {
    backgroundColor: 'rgba(227, 242, 253, 0.4)',
    borderColor: '#1E88E5',
  },
  servicioRowInactive: {
    backgroundColor: '#FFF',
    borderColor: '#F0F0F0',
  },
  servicioInfo: {
    flex: 1,
  },
  servicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  servicioNombre: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#444',
    flex: 1,
    marginRight: 8,
  },
  servicioPrecio: {
    fontSize: 16,
    fontWeight: '900',
    color: '#666',
  },
  servicioFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicioTiempo: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  radioOuterActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },

  // ─── PASO 2: GRID DE MASCOTAS ───
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mascotaCard: {
    width: '48%',
    padding: 16,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 15,
    position: 'relative',
  },
  mascotaCardActive: {
    backgroundColor: 'rgba(227, 242, 253, 0.4)',
    borderColor: '#1E88E5',
  },
  mascotaCardInactive: {
    backgroundColor: '#FFF',
    borderColor: '#F0F0F0',
  },
  mascotaImg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: '#E3F2FD',
  },
  mascotaImgPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mascotaNombre: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  mascotaTipo: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },

  // ─── PASO 3: FECHA Y HORA ───
  fechaCard: {
    width: 74,
    height: 92,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 8,
  },
  fechaCardActive: {
    backgroundColor: '#1E88E5',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fechaCardInactive: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
  },
  fechaDia: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  fechaNum: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 2,
  },
  fechaMes: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  horasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  horaCard: {
    width: '31%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    marginBottom: 12,
  },
  horaCardActive: {
    backgroundColor: 'rgba(227, 242, 253, 0.4)',
    borderColor: '#1E88E5',
    borderWidth: 2,
  },
  horaCardDisabled: {
    opacity: 0.4,
    backgroundColor: '#F5F5F5',
  },
  horaText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  horaTextActive: {
    color: '#1E88E5',
    fontWeight: '900',
  },
  horaTextDisabled: {
    textDecorationLine: 'line-through',
  },

  // ─── PASO 4: UBICACIÓN ───
  ubicacionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  ubiCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 2,
  },
  ubiCardActive: {
    backgroundColor: 'rgba(227, 242, 253, 0.4)',
    borderColor: '#1E88E5',
  },
  ubiCardInactive: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
  },
  ubiText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  ubiSubText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },

  // ─── PASO 4: MOTIVO (TEXT AREA) ───
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 25,
  },

  // ─── PASO 4: TARJETA RESUMEN (color del header) ───
  resumenCard: {
    backgroundColor: '#1E88E5',
    borderRadius: 25,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  resumenBgIcon: {
    position: 'absolute',
    right: -25,
    bottom: -25,
  },
  resumenTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#BBDEFB',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  resumenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resumenIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  resumenMiniImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  resumenMainText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  resumenPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD54F',
    marginLeft: 8,
  },
  resumenSubText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E3F2FD',
    flex: 1,
  },
});

export default AgendarCitaScreen;
