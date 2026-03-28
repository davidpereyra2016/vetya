import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import usePetStore from '../../store/usePetStore';
import useEmergencyStore from '../../store/useEmergencyStore';
import useAuthStore from '../../store/useAuthStore';
import { syncCurrentUserLocation } from '../../services/locationService';

// Componente PetSelector mejorado visualmente
const PetSelector = ({ pet, isSelected, onSelect }) => {
  const petIcons = {
    perro: 'dog', gato: 'cat', ave: 'bird', pez: 'fish', conejo: 'rabbit', reptil: 'turtle', default: 'paw'
  };
  const iconName = petIcons[pet.tipo?.toLowerCase()] || petIcons.default;
  return (
    <TouchableOpacity
      style={[styles.petItem, isSelected && styles.selectedPetItem]}
      onPress={() => onSelect(pet)}
      activeOpacity={0.8}
    >
      <View style={styles.petImageContainer}>
        {pet.imagen ? (
          <Image 
            source={{ uri: pet.imagen }} 
            style={styles.petImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.petIconContainer}>
            <MaterialCommunityIcons 
              name={iconName} 
              size={34} 
              color={isSelected ? '#fff' : '#1E88E5'} 
            />
          </View>
        )}
      </View>
      <View style={styles.petInfo}>
        <Text style={[styles.petName, isSelected && styles.selectedPetText]} numberOfLines={1}>
          {pet.nombre}
        </Text>
        <Text style={[styles.petBreed, isSelected && styles.selectedPetBreedText]} numberOfLines={1}>
          {pet.tipo} {pet.raza ? `• ${pet.raza}` : ''}
        </Text>
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Ionicons name="checkmark-sharp" size={18} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
};

const EmergencyFormScreen = ({ navigation }) => {
  // --- Estados del componente ---
  const [description, setDescription] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [emergencyType, setEmergencyType] = useState('Otro');
  const [urgencyLevel, setUrgencyLevel] = useState('Media');
  const [location, setLocation] = useState(null);
  
  // Estados para el manejo de "otro animal"
  const [emergencyMode, setEmergencyMode] = useState('mascota'); // 'mascota' o 'otroAnimal'
  const [otroAnimal, setOtroAnimal] = useState({
    tipo: 'Perro',
    descripcionAnimal: '',
    condicion: '',
    ubicacionExacta: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  
  // Obtenemos la función para crear emergencia del store
  const { createEmergency } = useEmergencyStore();
  const updateUser = useAuthStore(state => state.updateUser);

  useEffect(() => {
    const initialize = async () => {
      await loadPets();
      await getLocation({ showAlerts: false });
    };
    initialize();
  }, []);

  const loadPets = async () => {
    setIsLoadingPets(true);
    try {
      const { fetchPets } = usePetStore.getState();
      const result = await fetchPets();
      if (result.success) {
        setPets(result.data.map(p => ({ ...p, id: p._id })));
      } else {
        Alert.alert('Error', 'No se pudieron cargar tus mascotas.');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al cargar tus mascotas.');
    } finally {
      setIsLoadingPets(false);
    }
  };

  const getLocation = async ({ showAlerts = false } = {}) => {
    const result = await syncCurrentUserLocation();

    if (result.success) {
      const nextLocation = {
        latitude: result.data.latitude,
        longitude: result.data.longitude,
        direccion: result.data.direccion,
        ciudad: result.data.ciudad
      };

      setLocation(nextLocation);

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        updateUser({
          ...currentUser,
          ubicacionActual: {
            coordinates: {
              lat: result.data.latitude,
              lng: result.data.longitude
            },
            lastUpdated: result.data.lastUpdated
          }
        });
      }

      return nextLocation;
    }

    if (showAlerts) {
      if (result.permissionDenied) {
        Alert.alert('Permiso denegado', 'Se requiere permiso de ubicación para solicitar una emergencia.');
      } else {
        Alert.alert('Error de Ubicación', result.error || 'No se pudo obtener tu ubicación actual.');
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!description.trim()) return Alert.alert('Falta información', 'Por favor, describe la emergencia.');
    
    // Validaciones específicas según el modo
    if (emergencyMode === 'mascota' && !selectedPet) {
      return Alert.alert('Falta información', 'Por favor, selecciona una mascota.');
    }
    
    if (emergencyMode === 'otroAnimal') {
      // Validar información del otro animal
      if (!otroAnimal.descripcionAnimal.trim()) {
        return Alert.alert('Falta información', 'Por favor, proporciona una descripción del animal.');
      }
    }

    setIsLoading(true);
    try {
      const currentLocation = await getLocation({ showAlerts: true });
      if (!currentLocation) {
        return;
      }

      // Mapeo de tipos de emergencia del frontend al backend
      const tipoEmergenciaMap = {
        'Accidente': 'Accidente',
        'Intoxicación': 'Envenenamiento',
        'Respiratoria': 'Dificultad respiratoria',
        'Herida': 'Herida grave',
        'Convulsión': 'Convulsiones',
        'Otro': 'Otro'
      };

      // Crear objeto base de emergencia (común para ambos modos)
      const emergencyData = {
        descripcion: description,
        tipoEmergencia: tipoEmergenciaMap[emergencyType] || emergencyType,
        nivelUrgencia: urgencyLevel,
        emergencyMode: emergencyMode, // Indicar el modo (mascota u otroAnimal)
        ubicacion: {
          direccion: currentLocation.direccion || 'Dirección no disponible',
          ciudad: currentLocation.ciudad || 'Ciudad no especificada',
          coordenadas: {
            latitud: currentLocation.latitude,
            longitud: currentLocation.longitude,
          },
        },
      };
      
      // Agregar datos específicos según el modo
      if (emergencyMode === 'mascota') {
        emergencyData.mascota = selectedPet.id;
      } else {
        emergencyData.otroAnimal = otroAnimal;
      }

      // Guardar en estado temporal y navegar (sin crear emergencia en BD)
      navigation.navigate('EmergencyVetMap', {
        emergencyData, // Datos temporales, no ID
        petInfo: emergencyMode === 'mascota' ? selectedPet : null,
        otroAnimalInfo: emergencyMode === 'otroAnimal' ? otroAnimal : null,
        emergencyDescription: description, // Descripción para pantalla de confirmación
        emergencyMode // Modo de emergencia (mascota u otroAnimal)
      });
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al procesar tu solicitud.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // El resto del renderizado y estilos se mantienen igual ya que estaban correctos
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar Emergencia</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color="#1E88E5" />
            <Text style={styles.infoText}>
              Completa los datos para encontrar un veterinario disponible cerca de ti.
            </Text>
          </View>
          
          {/* Selector de modo de emergencia */}
          <Text style={styles.sectionTitle}>¿Para quién es la emergencia?</Text>
          <View style={styles.modeSelector}>
            <TouchableOpacity 
              style={[styles.modeOption, emergencyMode === 'mascota' && styles.modeOptionSelected]} 
              onPress={() => setEmergencyMode('mascota')}
            >
              <MaterialCommunityIcons name="paw" size={24} color={emergencyMode === 'mascota' ? '#fff' : '#1E88E5'} />
              <Text style={[styles.modeOptionText, emergencyMode === 'mascota' && styles.modeOptionTextSelected]}>Mi mascota</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modeOption, emergencyMode === 'otroAnimal' && styles.modeOptionSelected]} 
              onPress={() => setEmergencyMode('otroAnimal')}
            >
              <MaterialCommunityIcons name="map-marker-alert" size={24} color={emergencyMode === 'otroAnimal' ? '#fff' : '#1E88E5'} />
              <Text style={[styles.modeOptionText, emergencyMode === 'otroAnimal' && styles.modeOptionTextSelected]}>Otro animal</Text>
            </TouchableOpacity>
          </View>

          {/* Formulario para mascota registrada */}
          {emergencyMode === 'mascota' && (
            <View style={styles.petSelectorContainer}>
              <Text style={styles.sectionTitle}>Selecciona tu mascota</Text>
              {isLoadingPets ? (
                <ActivityIndicator size="large" color="#1E88E5" style={{ marginVertical: 20 }} />
              ) : pets.length > 0 ? (
                pets.map(pet => (
                  <PetSelector
                    key={pet.id}
                    pet={pet}
                    isSelected={selectedPet?.id === pet.id}
                    onSelect={setSelectedPet}
                  />
                ))
              ) : (
                <Text style={styles.noPetsText}>No tienes mascotas registradas. Por favor, añade una desde tu perfil.</Text>
              )}
            </View>
          )}

          {/* Formulario para otro animal */}
          {emergencyMode === 'otroAnimal' && (
            <View style={styles.otherAnimalForm}>
              <Text style={styles.sectionTitle}>Datos del animal</Text>
              
              {/* Tipo de animal */}
              <Text style={styles.fieldLabel}>Tipo de animal</Text>
              <View style={styles.typeSelector}>
                {['Perro', 'Gato', 'Ave', 'Reptil', 'Roedor', 'Otro'].map((tipo) => (
                  <TouchableOpacity 
                    key={tipo}
                    style={[styles.typeOption, otroAnimal.tipo === tipo && styles.typeOptionSelected]}
                    onPress={() => setOtroAnimal({...otroAnimal, tipo})}
                  >
                    <Text style={[styles.typeText, otroAnimal.tipo === tipo && styles.typeTextSelected]}>{tipo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Descripción del animal */}
              <Text style={styles.fieldLabel}>Descripción del animal</Text>
              <TextInput
                style={styles.input}
                placeholder="Raza, tamaño, color, características distintivas"
                placeholderTextColor="#9E9E9E"
                value={otroAnimal.descripcionAnimal}
                onChangeText={(text) => setOtroAnimal({...otroAnimal, descripcionAnimal: text})}
                multiline
              />
              
              {/* Condición del animal */}
              <Text style={styles.fieldLabel}>Condición del animal</Text>
              <TextInput
                style={styles.input}
                placeholder="Estado actual, heridas visibles, comportamiento"
                placeholderTextColor="#9E9E9E"
                value={otroAnimal.condicion}
                onChangeText={(text) => setOtroAnimal({...otroAnimal, condicion: text})}
                multiline
              />
              
              {/* Ubicación exacta */}
              <Text style={styles.fieldLabel}>Ubicación exacta</Text>
              <TextInput
                style={styles.input}
                placeholder="Referencias del lugar donde está el animal"
                placeholderTextColor="#9E9E9E"
                value={otroAnimal.ubicacionExacta}
                onChangeText={(text) => setOtroAnimal({...otroAnimal, ubicacionExacta: text})}
              />
            </View>
          )}

          {/* Campo de descripción de la emergencia */}
          <Text style={styles.sectionTitle}>Descripción de la emergencia</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe brevemente la emergencia"
            placeholderTextColor="#9E9E9E"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          
          <Text style={styles.sectionTitle}>Tipo de emergencia</Text>
            <View style={styles.optionsContainer}>
                {['Accidente', 'Intoxicación', 'Respiratoria', 'Herida', 'Convulsión', 'Otro'].map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.optionButton, emergencyType === type && styles.selectedOptionButton]}
                        onPress={() => setEmergencyType(type)}
                    >
                        <Text style={[styles.optionButtonText, emergencyType === type && styles.selectedOptionText]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

          <Text style={styles.sectionTitle}>Nivel de urgencia</Text>
            <View style={styles.optionsContainer}>
                {['Baja', 'Media', 'Alta'].map(level => (
                    <TouchableOpacity
                        key={level}
                        style={[styles.optionButton, urgencyLevel === level && styles.selectedOptionButton,
                          level === 'Baja' && urgencyLevel === level && styles.selectedBaja,
                          level === 'Media' && urgencyLevel === level && styles.selectedMedia,
                          level === 'Alta' && urgencyLevel === level && styles.selectedAlta
                        ]}
                        onPress={() => setUrgencyLevel(level)}
                    >
                        <Text style={[styles.optionButtonText, urgencyLevel === level && styles.selectedOptionText]}>{level}</Text>
                    </TouchableOpacity>
                ))}
            </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button, 
            isLoading || 
            (emergencyMode === 'mascota' && !selectedPet) || 
            (emergencyMode === 'otroAnimal' && !otroAnimal.descripcionAnimal.trim()) ||
            !description.trim()
              ? styles.buttonDisabled 
              : null
          ]}
          onPress={handleSubmit}
          disabled={
            isLoading || 
            (emergencyMode === 'mascota' && !selectedPet) || 
            (emergencyMode === 'otroAnimal' && !otroAnimal.descripcionAnimal.trim()) ||
            !description.trim()
          }
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Buscar Veterinario</Text>
              <Ionicons name="search-circle" size={24} color="#fff" style={{ marginLeft: 8 }}/>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 15,
  },
  backButton: {
    padding: 5,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0D47A1',
    marginLeft: 10,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginVertical: 12,
    marginHorizontal: 15,
  },
  noPetsText: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
    marginHorizontal: 15,
    marginTop: 10,
  },
  // Estilos para el selector de modo de emergencia
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  modeOption: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeOptionSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1565C0',
  },
  modeOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#424242',
    marginLeft: 8,
  },
  modeOptionTextSelected: {
    color: '#fff',
  },
  // Estilos para el formulario de otro animal
  otherAnimalForm: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212121',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  typeOption: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeOptionSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1565C0',
  },
  typeText: {
    fontSize: 14,
    color: '#424242',
  },
  typeTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  // Estilos para el selector de mascotas
  petSelectorContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  selectedPetItem: {
    backgroundColor: '#1E88E5',
    borderColor: '#0D47A1',
  },
  petImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4FA',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  petIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4FA',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 14,
    color: '#757575',
  },
  selectedPetText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedPetBreedText: {
    color: '#E1F5FE',
  },
  descriptionInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: '#212121',
    textAlignVertical: 'top',
    minHeight: 100,
    marginHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedOptionButton: {
    backgroundColor: '#1E88E5',
    borderColor: '#1565C0',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#424242',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  levelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  levelBaja: {
    backgroundColor: '#E8F5E9',
  },
  levelMedia: {
    backgroundColor: '#FFF8E1',
  },
  levelAlta: {
    backgroundColor: '#FFEBEE',
  },
  selectedBaja: {
    backgroundColor: '#66BB6A',
    borderColor: '#43A047',
  },
  selectedMedia: {
    backgroundColor: '#FFB74D',
    borderColor: '#F57C00',
  },
  selectedAlta: {
    backgroundColor: '#EF5350',
    borderColor: '#D32F2F',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textBaja: {
    color: '#2E7D32',
  },
  textMedia: {
    color: '#EF6C00',
  },
  textAlta: {
    color: '#C62828',
  },
  selectedLevelText: {
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  button: {
    backgroundColor: '#1E88E5',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
  },
  selectedPetText: {},
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B0B8C4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkboxSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
});

export default EmergencyFormScreen;
