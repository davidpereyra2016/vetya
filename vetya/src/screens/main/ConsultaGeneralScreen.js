import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

const ConsultaGeneralScreen = ({ navigation, route }) => {
  // Estados
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null); // This will store the selected provider
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  // const [availableVets, setAvailableVets] = useState([]); // We will use consultaGeneralProvidersList instead
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // General loading for initial data
  const [isLoadingProviders, setIsLoadingProviders] = useState(false); // Specific loading for providers
  
  // Animaciones
  // Zustand store selectors - usando selectores individuales para evitar re-renders innecesarios
  const fetchConsultaGeneralProviders = useCitaStore(useCallback(state => state.fetchConsultaGeneralProviders, [])); 
  const consultaGeneralProviders = useCitaStore(useCallback(state => state.consultaGeneralProviders, [])); 
  const isLoadingStoreProviders = useCitaStore(useCallback(state => state.isLoading, [])); 
  const errorStoreProviders = useCitaStore(useCallback(state => state.error, [])); 
  const resetCitaStoreState = useCitaStore(useCallback(state => state.resetCitaState, []));
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Cargar mascotas cuando se monte el componente
  useEffect(() => {
    const loadPets = async () => {
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
      } catch (error) {
        console.error('Error al cargar mascotas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPets();
  }, []); // Sin dependencias pues solo carga una vez al montar

  // Efecto separado para cargar proveedores solo una vez al montar
  useEffect(() => {
    let isMounted = true; // Para evitar actualizaciones tras desmontaje
    
    const loadProviders = async () => {
      try {
        setIsLoadingProviders(true);
        // Llamar una sola vez para cargar prestadores de consulta general
        await fetchConsultaGeneralProviders();
        
        // Verificar que el componente sigue montado antes de actualizar estados
        if (isMounted) {
          setIsLoadingProviders(false);
        }
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
        if (isMounted) {
          setIsLoadingProviders(false);
        }
      }
    };
    
    loadProviders();
    
    // Limpieza
    return () => {
      isMounted = false;
    };
  }, [fetchConsultaGeneralProviders]);  // Añadimos la dependencia
  
  // Memoizamos la función fetchAvailableDates usando useCallback para evitar recrearla en cada render
  const fetchAvailableDates = useCallback(async (prestadorId) => {
    const { fetchAvailableDates } = useCitaStore.getState();
    return await fetchAvailableDates(prestadorId);
  }, []);

  // Cuando cambia el prestador seleccionado, cargar sus fechas disponibles
  useEffect(() => {
    // Cuando cambia el veterinario seleccionado
    if (selectedVet) {
      // Resetear selecciones previas
      setSelectedDate(null);
      setSelectedTime(null);
      setAvailableTimes([]);
      
      const loadDatesForProvider = async () => {
        try {
          setIsLoading(true);
          // Usamos la función memoizada
          const datesResult = await fetchAvailableDates(selectedVet._id); 
          
          if (datesResult && datesResult.success) {
            setAvailableDates(datesResult.data);
          } else {
            console.error('Error al cargar fechas para el prestador:', datesResult?.error || 'Error desconocido');
            setAvailableDates([]);
          }
        } catch (error) {
          console.error('Error al cargar fechas para el prestador:', error);
          setAvailableDates([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadDatesForProvider();
    }
  }, [selectedVet, fetchAvailableDates]); // Dependencias correctas
  
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
  
  // Función para agendar la consulta
  const handleScheduleConsultation = async () => {
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
    
    if (!selectedVet) {
      Alert.alert('Información requerida', 'Por favor selecciona un prestador');
      return;
    }
    
    if (!reasonForVisit.trim()) {
      Alert.alert('Información requerida', 'Por favor describe el motivo de la consulta');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const serializableDate = selectedDate ? {
        id: selectedDate.id,
        day: selectedDate.day,
        month: selectedDate.month,
        dayName: selectedDate.dayName,
        dateString: selectedDate.date.toISOString(),
        formattedDate: selectedDate.date.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } : null;
      
      const consultationData = {
        mascota: selectedPet.id, 
        fecha: serializableDate.dateString, 
        hora: selectedTime, 
        veterinario: selectedVet._id, 
        servicioNombre: 'Consulta General', 
        motivo: reasonForVisit,
        tipoCita: 'Consulta General', 
      };
      
      const { createAppointment } = useCitaStore.getState();
      const result = await createAppointment(consultationData);
      
      if (result.success) {
        // Navegar a la pantalla de confirmación con los datos adecuados
        const navParams = {
          pet: selectedPet,
          date: serializableDate,
          time: selectedTime,
          reason: reasonForVisit,
          appointmentId: result.data.id
        };
        
        // Añadir el veterinario seleccionado
        navParams.vet = selectedVet;
        
        navigation.navigate('ConsultaConfirmacion', navParams);
      } else {
        Alert.alert('Error', result.error || 'No se pudo agendar la consulta');
      }
    } catch (error) {
      console.error('Error al agendar la consulta:', error);
      Alert.alert('Error', 'Ocurrió un error al agendar la consulta');
    } finally {
      setIsLoading(false);
    }
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

  // Renderizar fechas disponibles (DISPONIBILIDAD)
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

  // Renderizar horarios disponibles (DISPONIBILIDAD)
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

  // Renderizar Prestadores con servicio de tipo (consulta_general)
  const renderProviderItem = ({ item }) => {
    // Verificar que item sea un objeto válido para prevenir errores
    if (!item || typeof item !== 'object') {
      console.log('Item inválido:', item);
      return null;
    }
    
    const isSelected = selectedVet && selectedVet._id === item._id;
    
    return (
      <TouchableOpacity
        key={item._id}
        style={[styles.providerItem, isSelected && styles.selectedProviderItem, {width: 280}]}
        onPress={() => setSelectedVet(item)}
      >
        {/* Imagen del prestador */}
        {item.imagen ? (
          <Image 
            source={{ uri: item.imagen }} 
            style={styles.providerImage}
          />
        ) : (
          <View style={[styles.providerImagePlaceholder, isSelected && styles.selectedProviderImageContainer]}>
            <Ionicons name="person" size={28} color={isSelected ? "#1E88E5" : "#888"} />
          </View>
        )}
        
        {/* Información del prestador */}
        <View style={styles.providerInfo}>
          <Text style={[styles.providerName, isSelected && styles.selectedProviderText]}>
            {item.nombre || 'Sin nombre'}
          </Text>
          
          <Text style={[styles.providerType, isSelected && styles.selectedProviderText]}>
            {item.tipo || 'Prestador'}
          </Text>
          
          {/* Dirección con verificación de estructura */}
          {item.direccion ? (
            <Text style={[styles.providerAddress, isSelected && styles.selectedProviderText]} numberOfLines={1} ellipsizeMode="tail">
              {typeof item.direccion === 'object' 
                ? `${item.direccion.calle || ''} ${item.direccion.numero || ''}, ${item.direccion.ciudad || ''}`.trim() || 'Dirección no disponible'
                : typeof item.direccion === 'string' ? item.direccion : 'Dirección no disponible'}
            </Text>
          ) : (
            <Text style={[styles.providerAddress, isSelected && styles.selectedProviderText]} numberOfLines={1}>
              Dirección no disponible
            </Text>
          )}
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={isSelected ? "#fff" : "#FFD700"} />
            <Text style={[styles.providerRating, isSelected && styles.selectedProviderText]}>
              {item.rating ? item.rating.toFixed(1) : 'N/A'}
            </Text>
          </View>
        </View>
        
        {/* Indicador de selección */}
        {isSelected && (
          <View style={{position: 'absolute', top: 8, right: 8}}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          </View>
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
      case 'vets':
        return (
          <React.Fragment key="section-vets">
            <Text style={styles.sectionTitle}>Selecciona un Prestador</Text>
            {isLoadingProviders ? (
              <ActivityIndicator size="small" color="#1E88E5" style={{ marginTop: 10, alignSelf: 'center' }}/>
            ) : errorStoreProviders ? (
              <Text style={[styles.errorText, {textAlign: 'center', marginHorizontal: 20}]}>Error al cargar prestadores: {typeof errorStoreProviders === 'string' ? errorStoreProviders : errorStoreProviders.message || 'Error desconocido'}</Text>
            ) : consultaGeneralProviders && consultaGeneralProviders.length > 0 ? (
              <FlatList
                data={consultaGeneralProviders}
                renderItem={renderProviderItem}
                keyExtractor={(item) => item._id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContentContainer} // Ensure this style provides padding if needed
              />
            ) : (
              <Text style={[styles.emptyListText, {textAlign: 'center'}]}>No hay prestadores disponibles para consulta general.</Text>
            )}
          </React.Fragment>
        );
      case 'calendar':
        if (!selectedVet) return null;
        return (
          <React.Fragment key="section-calendar">
            <Text style={styles.sectionTitle}>Selecciona una Fecha</Text>
            {isLoading && availableDates.length === 0 && pets.length > 0 && selectedVet ? (
                 <ActivityIndicator size="small" color="#1E88E5" style={{ marginTop: 10, alignSelf: 'center' }}/>
            ) : availableDates.length > 0 ? (
                <FlatList
                data={availableDates}
                renderItem={renderDateItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContentContainer}
                />
            ) : (
                <Text style={[styles.emptyListText, {textAlign: 'center'}]}>No hay fechas disponibles para este prestador.</Text>
            )}
            {selectedDate && (
              <>
                <Text key="times-title" style={styles.sectionTitle}>Selecciona un Horario</Text>
                {availableTimes.length > 0 ? (
                    <FlatList
                    key="times-list"
                    data={availableTimes}
                    renderItem={renderTimeItem}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()} // Ensure key is string
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContentContainer}
                    />
                ) : (
                    <Text style={[styles.emptyListText, {textAlign: 'center'}]}>No hay horarios disponibles para esta fecha.</Text>
                )}
              </>
            )}
          </React.Fragment>
        );
      case 'reason':
        if (!selectedVet || !selectedDate || !selectedTime) return null;
        return (
          <React.Fragment key="section-reason">
            <Text style={styles.sectionTitle}>Motivo de la Consulta</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Describe brevemente el motivo de la visita..."
              placeholderTextColor="#999"
              multiline
              value={reasonForVisit}
              onChangeText={setReasonForVisit}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </React.Fragment>
        );
      case 'button':
        if (!selectedPet || !selectedVet || !selectedDate || !selectedTime || !reasonForVisit.trim()) return null;
        return (
          <React.Fragment key="section-button">
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={handleScheduleConsultation}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isLoading} // isLoading from the main state, not isLoadingProviders
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
              <Text style={styles.link}>términos y condiciones.</Text>
            </Text>
          </React.Fragment>
        );
      default:
        return null;
    }
  };
  
  // Efecto para cleanup cuando el componente se desmonta
  useEffect(() => {
    return () => {
      // Limpieza al desmontar componente
      setSelectedPet(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedVet(null);
      setReasonForVisit('');
      setAvailableDates([]);
      setAvailableTimes([]);
      setPets([]);
    };
  }, []);
  
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
            { id: 'vets' },
            { id: 'calendar' },
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
//no modificar los estilos.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: '#1E88E5',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 5,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
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
  providersList: {
    marginTop: 5,
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
  providerImagePlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
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
  listContentContainer: {
    paddingHorizontal: 5, // For horizontal lists like providers, dates, times
  },
  providerAddress: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  providerRating: {
    fontSize: 14,
    color: '#444',
    marginLeft: 5,
    fontWeight: '500',
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
