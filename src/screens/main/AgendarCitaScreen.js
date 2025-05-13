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
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const AgendarCitaScreen = ({ navigation, route }) => {
  // Estados
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [selectedService, setSelectedService] = useState(null); // Nuevo estado para el servicio
  const [selectedLocation, setSelectedLocation] = useState(null); // Nuevo estado para la ubicación
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [availableVets, setAvailableVets] = useState([]);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]); // Lista de servicios disponibles
  const [isLoading, setIsLoading] = useState(false);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Generar fechas disponibles (próximos 7 días)
  useEffect(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // No incluir domingos
      if (date.getDay() !== 0) {
        dates.push({
          id: i.toString(),
          date: date,
          day: date.getDate(),
          month: date.toLocaleString('es-ES', { month: 'short' }),
          dayName: date.toLocaleString('es-ES', { weekday: 'short' })
        });
      }
    }
    
    setAvailableDates(dates);
    
    // Simular obtención de mascotas del usuario
    setPets([
      { id: '1', name: 'Max', type: 'Perro', breed: 'Golden Retriever', lastVisit: '15 de abril, 2025' },
      { id: '2', name: 'Luna', type: 'Gato', breed: 'Siamés', lastVisit: '23 de marzo, 2025' },
      { id: '3', name: 'Rocky', type: 'Perro', breed: 'Bulldog', lastVisit: '5 de mayo, 2025' }
    ]);
    
    // Servicios disponibles
    setServices([
      { id: '1', name: 'Consulta General', icon: 'medkit-outline', color: '#1E88E5' },
      { id: '2', name: 'Vacunación', icon: 'shield-checkmark-outline', color: '#4CAF50' },
      { id: '3', name: 'Desparasitación', icon: 'bug-outline', color: '#FF9800' },
      { id: '4', name: 'Peluquería', icon: 'cut-outline', color: '#9C27B0' },
      { id: '5', name: 'Revisión dental', icon: 'brush-outline', color: '#607D8B' }
    ]);
    
    // Simular obtención de veterinarios disponibles
    setAvailableVets([
      { 
        id: '1',
        name: 'Dr. Carlos Rodríguez',
        specialty: 'Medicina general',
        rating: 4.9,
        image: require('../../assets/images/app-usage.png'), // Asegúrate de que exista esta imagen o cámbiala
        experience: '10 años'
      },
      { 
        id: '2',
        name: 'Dra. María Gómez',
        specialty: 'Cirugía',
        rating: 4.8,
        image: require('../../assets/images/app-usage.png'), // Asegúrate de que exista esta imagen o cámbiala
        experience: '8 años'
      },
      { 
        id: '3',
        name: 'Dr. Juan Pérez',
        specialty: 'Dermatología',
        rating: 4.7,
        image: require('../../assets/images/app-usage.png'), // Asegúrate de que exista esta imagen o cámbiala
        experience: '5 años'
      }
    ]);
  }, []);
  
  // Generar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate) {
      // Horarios de ejemplo, en una app real vendrían del backend
      const times = [
        { id: '1', time: '09:00', available: true },
        { id: '2', time: '10:00', available: true },
        { id: '3', time: '11:00', available: false },
        { id: '4', time: '12:00', available: true },
        { id: '5', time: '16:00', available: true },
        { id: '6', time: '17:00', available: true },
        { id: '7', time: '18:00', available: false }
      ];
      
      setAvailableTimes(times);
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
  
  // Función para agendar la cita
  const handleScheduleAppointment = () => {
    // Validaciones
    if (!selectedPet) {
      alert('Por favor selecciona una mascota');
      return;
    }
    
    if (!selectedDate) {
      alert('Por favor selecciona una fecha');
      return;
    }
    
    if (!selectedTime) {
      alert('Por favor selecciona un horario');
      return;
    }
    
    if (!selectedVet) {
      alert('Por favor selecciona un veterinario');
      return;
    }
    
    if (!selectedService) {
      alert('Por favor selecciona un servicio');
      return;
    }
    
    if (!selectedLocation) {
      alert('Por favor selecciona una ubicación');
      return;
    }
    
    if (!reasonForVisit.trim()) {
      alert('Por favor describe el motivo de la consulta');
      return;
    }
    
    setIsLoading(true);
    
    // Simulamos procesamiento
    setTimeout(() => {
      setIsLoading(false);
      
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
      
      // En una app real, aquí enviaríamos los datos al backend
      navigation.navigate('CitaConfirmacion', {
        pet: selectedPet,
        date: serializableDate,
        time: selectedTime,
        service: selectedService,
        vet: selectedVet,
        location: selectedLocation,
        reason: reasonForVisit
      });
    }, 1500);
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
        <View style={[styles.petIconContainer, isSelected && styles.selectedPetIconContainer]}>
          <Ionicons 
            name={pet.type.toLowerCase() === 'perro' ? 'paw' : 'paw-outline'} 
            size={24} 
            color={isSelected ? '#fff' : '#1E88E5'} 
          />
        </View>
        <View style={styles.petInfo}>
          <Text style={[styles.petName, isSelected && styles.selectedPetText]}>
            {pet.name}
          </Text>
          <Text style={[styles.petBreed, isSelected && styles.selectedPetText]}>
            {pet.type} • {pet.breed}
          </Text>
          <Text style={styles.lastVisit}>
            Última visita: {pet.lastVisit}
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
  
  // Renderizar veterinarios disponibles
  const renderVetItem = ({ item }) => {
    const isSelected = selectedVet && selectedVet.id === item.id;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.vetItem, isSelected && styles.selectedVetItem]}
        onPress={() => setSelectedVet(item)}
      >
        <View style={[styles.vetImageContainer, isSelected && styles.selectedVetImageContainer]}>
          <Ionicons name="person-circle-outline" size={40} color={isSelected ? "#fff" : "#1E88E5"} />
        </View>
        <View style={styles.vetInfo}>
          <Text style={[styles.vetName, isSelected && styles.selectedVetText]}>
            {item.name}
          </Text>
          <Text style={[styles.vetSpecialty, isSelected && styles.selectedVetText]}>
            {item.specialty}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={isSelected ? "#fff" : "#FFC107"} />
            <Text style={[styles.ratingText, isSelected && styles.selectedVetText]}>
              {item.rating} • {item.experience}
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
            <Text style={styles.sectionTitle}>Selecciona un servicio</Text>
            <View style={styles.servicesList}>
              {services.map(renderServiceItem)}
            </View>
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
      case 'vets':
        return (
          <React.Fragment key="section-vets">
            <Text style={styles.sectionTitle}>Selecciona un veterinario</Text>
            <View style={styles.vetsList}>
              {availableVets.map(item => renderVetItem({ item }))}
            </View>
          </React.Fragment>
        );
      case 'reason':
        return (
          <React.Fragment key="section-reason">
            <Text style={styles.sectionTitle}>Motivo de la consulta</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Describe el motivo de la consulta..."
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
            { id: 'pets' },
            { id: 'services' },
            { id: 'calendar' },
            { id: 'vets' },
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
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
