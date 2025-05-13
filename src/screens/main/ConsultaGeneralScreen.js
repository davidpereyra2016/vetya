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

const ConsultaGeneralScreen = ({ navigation, route }) => {
  // Estados
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [availableVets, setAvailableVets] = useState([]);
  const [pets, setPets] = useState([]);
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
  
  // Función para agendar la consulta
  const handleScheduleConsultation = () => {
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
      navigation.navigate('ConsultaConfirmacion', {
        pet: selectedPet,
        date: serializableDate,
        time: selectedTime,
        vet: selectedVet,
        reason: reasonForVisit
      });
    }, 1500);
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
                Agenda una consulta general para revisar el estado de salud de tu mascota con nuestros veterinarios profesionales.
              </Text>
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
                onPress={handleScheduleConsultation}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.scheduleButtonText}>Agendar Consulta</Text>
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
        <Text style={styles.headerTitle}>Consulta General</Text>
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
            { id: 'calendar' },
            { id: 'vets' },
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

export default ConsultaGeneralScreen;
