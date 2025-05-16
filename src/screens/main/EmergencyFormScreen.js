import React, { useState, useEffect } from 'react';
import { 
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Image,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import usePetStore from '../../store/usePetStore';

const EmergencyFormScreen = ({ navigation, route }) => {
  const [description, setDescription] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState([]);
  
  // Animaciones
  const fadeAnim = new Animated.Value(1); // Inicializar ya visible
  const slideAnim = new Animated.Value(0); // Inicializar ya en posición final
  const buttonScale = new Animated.Value(1);

  // Cargar mascotas del usuario desde el store
  useEffect(() => {
    const loadPets = async () => {
      try {
        setIsLoading(true);
        const { fetchPets } = usePetStore.getState();
        const result = await fetchPets();
        
        if (result.success) {
          setPets(result.data.map(pet => ({
            id: pet._id,
            nombre: pet.nombre,
            tipo: pet.tipo,
            raza: pet.raza,
            imagen: pet.imagen
          })));
        } else {
          console.error('Error al cargar mascotas:', result.error);
          Alert.alert('Error', 'No se pudieron cargar tus mascotas');
        }
      } catch (error) {
        console.error('Error al cargar mascotas:', error);
        Alert.alert('Error', 'Ocurrió un error al cargar tus mascotas');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPets();

    // NOTA: Ya iniciamos con valores visibles, así que no necesitamos
    // las animaciones iniciales, pero podemos dejarlas si queremos un efecto
    // sutil de refuerzo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      })
    ]).start();
  }, []);

  // Efectos de presión para el botón
  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  // Función para buscar veterinario
  const handleSearchVet = () => {
    if (!selectedPet) {
      // Retroalimentación visual para error
      Alert.alert('Información requerida', 'Por favor selecciona una mascota');
      return;
    }
    if (!description.trim()) {
      // Retroalimentación visual para error
      Alert.alert('Información requerida', 'Por favor describe la emergencia');
      return;
    }

    setIsLoading(true);
    
    // En una implementación real, aquí se enviarían los datos al backend
    // y se buscarían veterinarios disponibles para emergencias
    
    // Por ahora simulamos una carga para mejorar UX
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('EmergencyVetMap', {
        petInfo: selectedPet,
        emergencyDescription: description,
        emergencyTime: new Date().toISOString()
      });
    }, 1500);
  };

  const renderPetItem = (pet) => {
    const isSelected = selectedPet && selectedPet.id === pet.id;
    
    // Función auxiliar para renderizar el icono según el tipo de mascota
    const renderPetIcon = (type, size = 24, color = isSelected ? '#fff' : '#1E88E5') => {
      switch ((type || '').toLowerCase()) {
        case 'perro':
        case 'dog':
          return <MaterialCommunityIcons name="dog" size={size} color={color} />;
        case 'gato':
        case 'cat':
          return <MaterialCommunityIcons name="cat" size={size} color={color} />;
        case 'ave':
        case 'bird':
          return <MaterialCommunityIcons name="bird" size={size} color={color} />;
        case 'pez':
        case 'fish':
          return <MaterialCommunityIcons name="fish" size={size} color={color} />;
        case 'conejo':
        case 'rabbit':
          return <MaterialCommunityIcons name="rabbit" size={size} color={color} />;
        case 'reptil':
        case 'reptile':
          return <MaterialCommunityIcons name="turtle" size={size} color={color} />;
        default:
          return <Ionicons name="paw" size={size} color={color} />;
      }
    };
    
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
            renderPetIcon(pet.tipo)
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
        <Text style={styles.headerTitle}>Emergencia Veterinaria</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View 
          style={[
            styles.formContainer,
            // Aplicamos animaciones pero nos aseguramos que siempre sea visible
            // incluso si la animación falla
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#1E88E5" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Completa este formulario y te conectaremos con un veterinario disponible de inmediato.
            </Text>
          </View>
          
          <Text style={styles.sectionTitle}>¿Qué mascota necesita atención?</Text>
          <View style={styles.petsList}>
            {pets.map(renderPetItem)}
          </View>
          
          <Text style={styles.sectionTitle}>Describe la emergencia</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe qué le está sucediendo a tu mascota..."
            placeholderTextColor="#666"
            multiline
            value={description}
            onChangeText={setDescription}
            numberOfLines={5}
            textAlignVertical="top"
          />
          
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchVet}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.searchButtonText}>Buscar Veterinario</Text>
                  <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.disclaimer}>
            Al presionar "Buscar Veterinario" aceptas los {' '}
            <Text style={styles.link}>términos del servicio de emergencia</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
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
  },
  petsList: {
    marginBottom: 20,
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
  selectedPetText: {
    color: '#fff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#B0B8C4',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    height: 120,
    marginBottom: 25,
    backgroundColor: '#F5F7FA',
    placeholderTextColor: '#666',
  },
  searchButton: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchIcon: {
    marginLeft: 10,
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
  link: {
    color: '#1E88E5',
    textDecorationLine: 'underline',
  },
});

export default EmergencyFormScreen;
