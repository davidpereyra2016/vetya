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
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import usePetStore from '../../store/usePetStore';
import useCitaStore from '../../store/useCitaStore';

const AgendarCitaScreen = ({ navigation, route }) => {
  // Estados
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para proveedores de servicios
  const [providerTypes, setProviderTypes] = useState([]);
  const [selectedProviderType, setSelectedProviderType] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null); // Estado para la ubicación
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Cargar datos iniciales cuando se monte el componente
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar mascotas del usuario desde el store
        const { fetchPets } = usePetStore.getState();
        const petsResult = await fetchPets();
        
        if (petsResult.success) {
          setPets(petsResult.data.map(pet => ({
            id: pet._id,
            nombre: pet.nombre,
            tipo: pet.tipo,
            raza: pet.raza,
            imagen: pet.imagen,
            ultimaVisita: pet.ultimaVisita ? new Date(pet.ultimaVisita).toLocaleDateString('es-ES') : 'Sin visitas'
          })));
        } else {
          console.error('Error al cargar mascotas:', petsResult.error);
          Alert.alert('Error', 'No se pudieron cargar tus mascotas');
        }
        
        // Cargar fechas disponibles
        const { fetchAvailableDates } = useCitaStore.getState();
        const datesResult = await fetchAvailableDates();
        
        if (datesResult.success) {
          setAvailableDates(datesResult.data);
        } else {
          console.error('Error al cargar fechas:', datesResult.error);
        }
        
        // Cargar tipos de prestadores de servicios
        const { fetchProviderTypes } = useCitaStore.getState();
        const typesResult = await fetchProviderTypes();
        
        if (typesResult.success) {
          setProviderTypes(typesResult.data);
        } else {
          console.error('Error al cargar tipos de prestadores:', typesResult.error);
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        Alert.alert('Error', 'Ocurrió un error al cargar los datos iniciales');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
    
    // Limpieza al desmontar
    return () => {
      const { resetCitaState } = useCitaStore.getState();
      resetCitaState();
    };
  }, []);
  
  // Cargar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate) {
      const loadAvailableTimes = async () => {
        try {
          const { fetchAvailableTimes } = useCitaStore.getState();
          const result = await fetchAvailableTimes(selectedDate.id);
          
          if (result.success) {
            setAvailableTimes(result.data);
          } else {
            console.error('Error al cargar horarios:', result.error);
            setAvailableTimes([]);
          }
        } catch (error) {
          console.error('Error al cargar horarios disponibles:', error);
          setAvailableTimes([]);
        }
      };
      
      loadAvailableTimes();
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate]);
  
  // Efectos de presión para el botón
  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: false
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: false
    }).start();
  };
  
  // Manejar la selección de tipo de prestador
  const handleSelectProviderType = async (type) => {
    setSelectedProviderType(type);
    setSelectedProvider(null);
    
    try {
      setIsLoading(true);
      const { fetchProvidersByType } = useCitaStore.getState();
      const result = await fetchProvidersByType(type.id);
      
      if (result.success) {
        setProviders(result.data);
      } else {
        console.error('Error al cargar prestadores:', result.error);
        Alert.alert('Error', result.error || 'No se pudieron cargar los prestadores');
        setProviders([]);
      }
    } catch (error) {
      console.error('Error al cargar prestadores por tipo:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar los prestadores');
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para agendar la cita
  const handleScheduleAppointment = async () => {
    // Validaciones
    if (!selectedPet) {
      Alert.alert('Información requerida', 'Por favor selecciona una mascota');
      return;
    }
    
    if (!selectedDate) {
      Alert.alert('Información requerida', 'Por favor selecciona una fecha');
      return;
    }
    
    if (!selectedTime) {
      Alert.alert('Información requerida', 'Por favor selecciona un horario');
      return;
    }
    
    if (!selectedProviderType) {
      Alert.alert('Información requerida', 'Por favor selecciona un tipo de servicio');
      return;
    }
    
    if (!selectedProvider) {
      Alert.alert('Información requerida', 'Por favor selecciona un prestador de servicios');
      return;
    }
    
    if (!selectedLocation) {
      Alert.alert('Información requerida', 'Por favor selecciona una ubicación');
      return;
    }
    
    if (!reasonForVisit.trim()) {
      Alert.alert('Información requerida', 'Por favor describe el motivo de la cita');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convertir la fecha a formato serializable
      const serializableDate = selectedDate ? {
        id: selectedDate.id,
        day: selectedDate.day,
        month: selectedDate.month,
        dayName: selectedDate.dayName,
        // Convertir el objeto Date a string ISO
        dateString: selectedDate.date.toISOString(),
        formattedDate: selectedDate.date.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } : null;
      
      // Crear objeto de datos de la cita
      const appointmentData = {
        petId: selectedPet.id,
        date: serializableDate,
        time: selectedTime,
        providerId: selectedProvider.id,
        providerType: selectedProviderType.id,
        locationId: selectedLocation.id,
        reason: reasonForVisit,
        status: 'pendiente',
        type: 'cita_agendada'
      };
      
      // Usar el store para crear la cita
      const { createAppointment } = useCitaStore.getState();
      const result = await createAppointment(appointmentData);
      
      if (result.success) {
        // Navegar a la pantalla de confirmación
        navigation.navigate('CitaConfirmacion', {
          pet: selectedPet,
          date: serializableDate,
          time: selectedTime,
          vet: selectedVet,
          service: selectedService,
          location: selectedLocation,
          reason: reasonForVisit,
          appointmentId: result.data.id
        });
      } else {
        Alert.alert('Error', result.error || 'No se pudo agendar la cita');
      }
    } catch (error) {
      console.error('Error al agendar cita:', error);
      Alert.alert('Error', 'Ocurrió un error al agendar la cita');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Renderizar servicios disponibles
  const renderServiceItem = (service) => {
    const isSelected = selectedService && selectedService.id === service.id;
    
    return (
      <TouchableOpacity
        key={service.id}
        style={[styles.serviceItem, isSelected && styles.selectedServiceItem]}
        onPress={() => setSelectedService(service)}
      >
        <View style={[styles.serviceIconContainer, isSelected && styles.selectedServiceIconContainer]}>
          <Ionicons 
            name={service.icon} 
            size={24} 
            color={isSelected ? '#fff' : service.color} 
          />
        </View>
        <Text style={[styles.serviceName, isSelected && styles.selectedServiceText]}>
          {service.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };
  
  // Renderizar opciones de ubicación
  const renderLocationOption = (location) => {
    const isSelected = selectedLocation && selectedLocation.id === location.id;
    
    return (
      <TouchableOpacity
        key={location.id}
        style={[styles.locationOption, isSelected && styles.selectedLocationOption]}
        onPress={() => setSelectedLocation(location)}
      >
        <Ionicons 
          name={location.icon} 
          size={24} 
          color={isSelected ? '#fff' : '#1E88E5'} 
          style={styles.locationIcon}
        />
        <View style={styles.locationTextContainer}>
          <Text style={[styles.locationType, isSelected && styles.selectedLocationText]}>
            {location.type}
          </Text>
          <Text style={[styles.locationDescription, isSelected && styles.selectedLocationText]}>
            {location.description}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  // Renderizar cada item de mascota
  const renderPetItem = (pet) => {
    const isSelected = selectedPet && selectedPet.id === pet.id;
    
    return (
      <TouchableOpacity
        key={pet.id}
        style={[styles.petItem, isSelected && styles.selectedPetItem]}
        onPress={() => setSelectedPet(pet)}
      >
        <View style={styles.petIconContainer}>
          {pet.imagen ? (
            <Image 
              source={{ uri: pet.imagen }} 
              style={styles.petItemImage} 
              resizeMode="cover"
            />
          ) : (
            <Ionicons 
              name={(pet.tipo || '').toLowerCase() === 'perro' ? 'paw' : 'paw-outline'} 
              size={24} 
              color={isSelected ? '#fff' : '#1E88E5'} 
            />
          )}
        </View>
        <View style={styles.petInfo}>
          <Text style={[styles.petName, isSelected && styles.selectedPetText]}>
            {pet.nombre}
          </Text>
          <Text style={[styles.petBreed, isSelected && styles.selectedPetText]}>
            {pet.tipo} {pet.raza ? `• ${pet.raza}` : ''}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };
  
  // Renderizar fechas disponibles
  const renderDateItem = ({ item }) => {
    const isSelected = selectedDate && selectedDate.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.selectedDateItem]}
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dateDay, isSelected && styles.selectedDateText]}>
          {item.dayName}
        </Text>
        <Text style={[styles.dateNumber, isSelected && styles.selectedDateText]}>
          {item.day}
        </Text>
        <Text style={[styles.dateMonth, isSelected && styles.selectedDateText]}>
          {item.month}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Renderizar horarios disponibles
  const renderTimeItem = ({ item }) => {
    const isSelected = selectedTime && selectedTime.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.timeItem, 
          !item.available && styles.unavailableTimeItem,
          isSelected && styles.selectedTimeItem
        ]}
        onPress={() => item.available && setSelectedTime(item)}
        disabled={!item.available}
      >
        <Text 
          style={[
            styles.timeText, 
            !item.available && styles.unavailableTimeText,
            isSelected && styles.selectedTimeText
          ]}
        >
          {item.time}
        </Text>
        {!item.available && (
          <Text style={styles.unavailableLabel}>No disponible</Text>
        )}
      </TouchableOpacity>
    );
  };
  
  // Renderizar tipos de prestadores
  const renderProviderTypeItem = (type) => {
    const isSelected = selectedProviderType && selectedProviderType.id === type.id;
    
    return (
      <TouchableOpacity
        key={type.id}
        style={[styles.providerTypeItem, isSelected && styles.selectedProviderTypeItem]}
        onPress={() => handleSelectProviderType(type)}
      >
        <View style={[styles.providerTypeIcon, isSelected && styles.selectedProviderTypeIcon]}>
          <Ionicons 
            name={type.icon || "business-outline"} 
            size={24} 
            color={isSelected ? "#fff" : "#1E88E5"} 
          />
        </View>
        <Text style={[styles.providerTypeName, isSelected && styles.selectedProviderTypeText]}>
          {type.nombre}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };
  
  // Renderizar prestadores disponibles
  const renderProviderItem = (provider) => {
    const isSelected = selectedProvider && selectedProvider.id === provider.id;
    
    return (
      <TouchableOpacity
        key={provider.id}
        style={[styles.providerItem, isSelected && styles.selectedProviderItem]}
        onPress={() => setSelectedProvider(provider)}
      >
        <View style={[styles.providerImageContainer, isSelected && styles.selectedProviderImageContainer]}>
          {provider.imagen ? (
            <Image 
              source={{ uri: provider.imagen }} 
              style={styles.providerImage} 
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="business-outline" size={32} color={isSelected ? "#fff" : "#1E88E5"} />
          )}
        </View>
        <View style={styles.providerInfo}>
          <Text style={[styles.providerName, isSelected && styles.selectedProviderText]}>
            {provider.nombre}
          </Text>
          <Text style={[styles.providerType, isSelected && styles.selectedProviderText]}>
            {provider.tipo}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={isSelected ? "#fff" : "#FFC107"} />
            <Text style={[styles.ratingText, isSelected && styles.selectedProviderText]}>
              {provider.rating || "4.5"}
            </Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };
  
  const renderSectionItem = ({ item }) => {
    switch (item.id) {
      case 'info':
        return (
          <React.Fragment key="section-info">
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#1E88E5" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Agenda una cita para tu mascota con nuestros profesionales veterinarios. Selecciona el servicio, la fecha y la hora que mejor te convenga.
              </Text>
            </View>
          </React.Fragment>
        );
      case 'services':
        return (
          <React.Fragment key="section-services">
            <Text style={styles.sectionTitle}>Selecciona un tipo de servicio</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.providerTypesList}
            >
              {providerTypes.map(renderProviderTypeItem)}
            </ScrollView>
            
            {/* Lista de prestadores del tipo seleccionado */}
            {selectedProviderType && (
              <View>
                <Text style={styles.subsectionTitle}>
                  Prestadores disponibles - {selectedProviderType.nombre}
                </Text>
                <View style={styles.providersList}>
                  {providers.length > 0 ? (
                    providers.map(renderProviderItem)
                  ) : (
                    <Text style={styles.noProvidersText}>
                      No hay prestadores disponibles para este tipo de servicio
                    </Text>
                  )}
                </View>
              </View>
            )}
          </React.Fragment>
        );
      case 'pets':
        return (
          <React.Fragment key="section-pets">
            <Text style={styles.sectionTitle}>Selecciona tu mascota</Text>
            <View style={styles.petsList}>
              {pets.map(renderPetItem)}
            </View>
          </React.Fragment>
        );
      case 'calendar':
        return (
          <React.Fragment key="section-calendar">
            <Text style={styles.sectionTitle}>Selecciona una fecha</Text>
            <FlatList
              data={availableDates}
              renderItem={renderDateItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesList}
              nestedScrollEnabled={true}
            />
            {selectedDate && (
              <>
                <Text key="times-title" style={styles.sectionTitle}>Selecciona un horario</Text>
                <FlatList
                  key="times-list"
                  data={availableTimes}
                  renderItem={renderTimeItem}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timesList}
                  nestedScrollEnabled={true}
                />
              </>
            )}
          </React.Fragment>
        );
      case 'location':
        return (
          <React.Fragment key="section-location">
            <Text style={styles.sectionTitle}>Selecciona la ubicación</Text>
            <View style={styles.locationsList}>
              {renderLocationOption({
                id: '1',
                type: 'Domicilio',
                description: 'El veterinario visitará tu domicilio',
                icon: 'home-outline'
              })}
              {renderLocationOption({
                id: '2',
                type: 'Clínica',
                description: 'Visita la clínica del veterinario',
                icon: 'business-outline'
              })}
            </View>
          </React.Fragment>
        );
      // Eliminada la sección de veterinarios, ahora se gestionan como prestadores de servicio
      case 'reason':
        return (
          <React.Fragment key="section-reason">
            <Text style={styles.sectionTitle}>Motivo de la Cita</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Describe el motivo de la cita..."
              placeholderTextColor="#666"
              multiline
              value={reasonForVisit}
              onChangeText={setReasonForVisit}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </React.Fragment>
        );
      case 'button':
        return (
          <React.Fragment key="section-button">
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={handleScheduleAppointment}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.scheduleButtonText}>Agendar Cita</Text>
                    <Ionicons name="calendar" size={20} color="#fff" style={styles.scheduleIcon} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.disclaimer}>
              Al agendar una consulta aceptas nuestros{' '}
              <Text style={styles.link}>términos y condiciones</Text>
            </Text>
          </React.Fragment>
        );
      default:
        return null;
    }
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar Cita</Text>
      </View>
      
      {/* Usamos Animated.View para envolver el contenido con animaciones */}
      <Animated.View 
        style={[
          styles.animatedContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <FlatList
          data={[
            { id: 'info' },
            { id: 'services' },
            { id: 'pets' },
            { id: 'calendar' },
            { id: 'location' },
            { id: 'reason' },
            { id: 'button' }
          ]}
          renderItem={renderSectionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.content}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  // Estilos para secciones de prestadores
  providerTypesList: {
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  providerTypeItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedProviderTypeItem: {
    backgroundColor: '#1E88E5',
  },
  providerTypeIcon: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
  },
  selectedProviderTypeIcon: {
    backgroundColor: '#fff',
  },
  providerTypeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedProviderTypeText: {
    color: '#fff',
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  providersList: {
    marginTop: 5,
    marginBottom: 10,
  },
  providerItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedProviderItem: {
    backgroundColor: '#1E88E5',
  },
  providerImageContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  selectedProviderImageContainer: {
    backgroundColor: '#fff',
  },
  providerImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  providerType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedProviderText: {
    color: '#fff',
  },
  noProvidersText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  checkIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  content: {
    padding: 20,
    paddingTop: 15,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    color: '#0D47A1',
    fontSize: 14,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 20,
  },
  petsList: {
    marginBottom: 10,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCD1D9',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPetItem: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  petIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF2FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden'
  },
  petItemImage: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  selectedPetIconContainer: {
    backgroundColor: '#fff',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
  },
  lastVisit: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },
  selectedPetText: {
    color: '#fff',
  },
  datesList: {
    paddingBottom: 10,
  },
  dateItem: {
    width: 70,
    height: 90,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CCD1D9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  selectedDateItem: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateMonth: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  selectedDateText: {
    color: '#fff',
  },
  timesList: {
    paddingBottom: 10,
  },
  timeItem: {
    width: 90,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CCD1D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTimeItem: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  unavailableTimeItem: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedTimeText: {
    color: '#fff',
  },
  unavailableTimeText: {
    color: '#999',
  },
  unavailableLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  vetsList: {
    marginBottom: 10,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  serviceItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCD1D9',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedServiceItem: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  serviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedServiceIconContainer: {
    backgroundColor: '#fff',
  },
  serviceName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectedServiceText: {
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 6,
  },
  locationsList: {
    marginBottom: 15,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCD1D9',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedLocationOption: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  locationIcon: {
    marginRight: 15,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  locationDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedLocationText: {
    color: '#fff',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#CCD1D9',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    marginBottom: 20,
  },
  vetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCD1D9',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedVetItem: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  vetImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  selectedVetImageContainer: {
    backgroundColor: '#0D47A1',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  vetSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  selectedVetText: {
    color: '#fff',
  },
  scheduleButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleIcon: {
    marginLeft: 10,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  link: {
    color: '#1E88E5',
    textDecorationLine: 'underline',
  },
});

export default AgendarCitaScreen;
