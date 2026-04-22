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

  // CAMBIO: Renombrado y ajustado para el nuevo flujo.
  const renderProviderSelectionStep = () => (
    <View>
      {/* Paso 1.1: Seleccionar Tipo de Prestador */}
      {renderSectionTitle('1. Elige el tipo de prestador')}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={newStyles.horizontalList}>
        {providerTypes.map(type => {
          const isSelected = selectedProviderType?.id === type.id;
          return (
            <TouchableOpacity key={type.id} style={[newStyles.card, isSelected && newStyles.selectedCard]} onPress={() => handleSelectProviderType(type)}>
              <Ionicons name={type.icon} size={28} color={isSelected ? '#fff' : '#1E88E5'} />
              <Text style={[newStyles.cardText, isSelected && newStyles.selectedCardText]}>{type.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading && !providers.length && selectedProviderType && renderLoader()}

      {/* Paso 1.2: Seleccionar Prestador específico */}
      {selectedProviderType && providers.length > 0 && (
        <>
          {renderSectionTitle('2. Selecciona un prestador')}
          {providers.map(provider => {
             const isSelected = selectedProvider?._id === provider._id;
             return (
                <TouchableOpacity key={provider._id} style={[newStyles.providerCard, isSelected && newStyles.selectedCard]} onPress={() => handleSelectProvider(provider)}>
                  <Image source={{ uri: provider.imagen || `https://placehold.co/100x100/E3F2FD/1E88E5?text=${provider.nombre.charAt(0)}` }} style={newStyles.providerImage} />
                  <View style={newStyles.providerInfo}>
                    <Text style={[newStyles.providerName, isSelected && newStyles.selectedCardText]}>{provider.nombre}</Text>
                    <Text style={[newStyles.providerSpecialty, isSelected && newStyles.selectedCardText]}>{provider.tipo}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={24} color="#fff" style={newStyles.checkIcon} />}
                </TouchableOpacity>
             );
          })}
        </>
      )}

      {isLoading && !services.length && selectedProvider && renderLoader()}

      {/* Paso 1.3: Seleccionar Servicio del Prestador */}
      {selectedProvider && services.length > 0 && (
        <>
          {renderSectionTitle('3. ¿Qué servicio necesitas?')}
            <View style={newStyles.serviceListContainer}>
                {services.map(service => {
                    const isSelected = selectedService?._id === service._id;
                    return (
                    <TouchableOpacity key={service._id} style={[newStyles.serviceCard, isSelected && newStyles.selectedCard]} onPress={() => setSelectedService(service)}>
                        <Ionicons name={service.icon || 'medical-outline'} size={24} color={isSelected ? '#fff' : '#1E88E5'} />
                        <View style={newStyles.serviceInfo}>
                          <Text style={[newStyles.serviceName, isSelected && newStyles.selectedCardText]}>{service.nombre}</Text>
                          <Text style={[newStyles.serviceDetails, isSelected && newStyles.selectedCardText]}>${service.precio || '0'} • {service.duracion || 30} min</Text>
                        </View>
                    </TouchableOpacity>
                    );
                })}
            </View>
        </>
      )}
    </View>
  );

  // El resto de las funciones de renderizado (renderPetStep, renderDateTimeStep, etc.) no necesitan cambios.
  const renderPetStep = () => (
    <View>
      {renderSectionTitle('Selecciona tu mascota')}
      {pets.map(pet => {
        const isSelected = selectedPet?.id === pet.id;
        return (
          <TouchableOpacity key={pet.id} style={[newStyles.providerCard, isSelected && newStyles.selectedCard]} onPress={() => setSelectedPet(pet)}>
            <Image source={{ uri: pet.imagen || `https://placehold.co/100x100/EBF2FA/1E88E5?text=${pet.nombre.charAt(0)}` }} style={newStyles.providerImage} />
            <View style={newStyles.providerInfo}>
              <Text style={[newStyles.providerName, isSelected && newStyles.selectedCardText]}>{pet.nombre}</Text>
              <Text style={[newStyles.providerSpecialty, isSelected && newStyles.selectedCardText]}>{pet.tipo} {pet.raza ? `• ${pet.raza}` : ''}</Text>
            </View>
            {isSelected && <Ionicons name="checkmark-circle" size={24} color="#fff" style={newStyles.checkIcon} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderDateTimeStep = () => ( <View>
        {renderSectionTitle('Elige una fecha')}
        <FlatList
            data={availableDates}
            renderItem={({ item }) => {
                const isSelected = selectedDate?.id === item.id;
                return (
                    <TouchableOpacity style={[newStyles.dateItem, isSelected && newStyles.selectedCard]} onPress={() => setSelectedDate(item)}>
                        <Text style={[newStyles.dateDay, isSelected && newStyles.selectedCardText]}>{item.dayName.substring(0, 3)}</Text>
                        <Text style={[newStyles.dateNumber, isSelected && newStyles.selectedCardText]}>{item.day}</Text>
                        <Text style={[newStyles.dateMonth, isSelected && newStyles.selectedCardText]}>{item.month.substring(0, 3)}</Text>
                    </TouchableOpacity>
                );
            }}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={newStyles.horizontalList}
        />
        
        {isLoading && selectedDate && renderLoader()}

        {selectedDate && !isLoading && (
            <>
                {renderSectionTitle('Elige un horario')}
                {availableTimes.length > 0 ? (
                    <FlatList
                        data={availableTimes}
                        renderItem={({ item }) => {
                            const isSelected = selectedTime?.id === item.id;
                            return (
                                <TouchableOpacity 
                                    style={[
                                        newStyles.timeItem, 
                                        !item.available && newStyles.unavailableTimeItem,
                                        isSelected && newStyles.selectedCard
                                    ]} 
                                    onPress={() => item.available && setSelectedTime(item)}
                                    disabled={!item.available}
                                >
                                    <Text style={[newStyles.timeText, isSelected && newStyles.selectedCardText, !item.available && newStyles.unavailableTimeText]}>{item.time}</Text>
                                </TouchableOpacity>
                            );
                        }}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={newStyles.horizontalList}
                    />
                ) : (
                    <Text style={newStyles.noDataText}>No hay horarios disponibles para la fecha y servicio seleccionados.</Text>
                )}
            </>
        )}
    </View>);

    const renderDetailsStep = () => {
      const locationOptions = getLocationOptionsForService();

      return(
        <View>
            {renderSectionTitle('¿Dónde será la cita?')}
            {locationOptions.map(loc => {
                const isSelected = selectedLocation?.id === loc.id;
                return(
                    <TouchableOpacity key={loc.id} style={[newStyles.providerCard, isSelected && newStyles.selectedCard]} onPress={() => setSelectedLocation(loc)}>
                        <Ionicons name={loc.icon} size={28} color={isSelected ? '#fff' : '#1E88E5'} style={{marginRight: 15}}/>
                        <View style={newStyles.providerInfo}>
                            <Text style={[newStyles.providerName, isSelected && newStyles.selectedCardText]}>{loc.type}</Text>
                            <Text style={[newStyles.providerSpecialty, isSelected && newStyles.selectedCardText]}>{loc.description}</Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#fff" style={newStyles.checkIcon} />}
                    </TouchableOpacity>
                );
            })}

            {selectedService?.modalidadAtencion?.length === 1 && (
              <Text style={newStyles.helperText}>
                Este servicio solo está disponible en {selectedService.modalidadAtencion[0]}.
              </Text>
            )}

            {renderSectionTitle('Motivo de la Cita')}
            <TextInput
              style={newStyles.reasonInput}
              placeholder="Describe brevemente el motivo de la visita (ej: control anual, vacuna, etc.)"
              placeholderTextColor="#999"
              multiline
              value={reasonForVisit}
              onChangeText={setReasonForVisit}
              textAlignVertical="top"
            />
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
  }
});

export default AgendarCitaScreen;
