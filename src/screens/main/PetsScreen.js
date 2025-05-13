import React, { useState, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  TextInput,
  ScrollView, 
  Image,
  Platform,
  KeyboardAvoidingView,
  Switch
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const PetsScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petGender, setPetGender] = useState('');
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [petWeight, setPetWeight] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [petColor, setPetColor] = useState('');
  const [showBreedSelector, setShowBreedSelector] = useState(false);

  // Datos predefinidos para tipos de mascotas
  const petTypes = [
    { id: 'dog', name: 'Perro', icon: 'paw' },
    { id: 'cat', name: 'Gato', icon: 'paw' },
    { id: 'bird', name: 'Ave', icon: 'airplane' },
    { id: 'fish', name: 'Pez', icon: 'fish' },
    { id: 'rabbit', name: 'Conejo', icon: 'extension-puzzle' },
    { id: 'rodent', name: 'Roedor', icon: 'ellipse' },
    { id: 'reptile', name: 'Reptil', icon: 'leaf' },
    { id: 'other', name: 'Otro', icon: 'paw' }
  ];

  // Datos predefinidos para razas según el tipo de mascota
  const breedsByType = {
    'Perro': [
      'Labrador Retriever', 'Pastor Alemán', 'Bulldog', 'Golden Retriever', 
      'Beagle', 'Poodle', 'Boxer', 'Chihuahua', 'Husky Siberiano', 
      'Dálmata', 'Doberman', 'Gran Danés', 'Pitbull', 'Pug', 
      'Rottweiler', 'Shih Tzu', 'Yorkshire Terrier', 'Otro'
    ],
    'Gato': [
      'Siamés', 'Persa', 'Maine Coon', 'Bengalí', 'Sphynx', 
      'Ragdoll', 'Británico de Pelo Corto', 'Abisinio', 'Azul Ruso', 
      'Himalayo', 'Munchkin', 'Savannah', 'Siberiano', 'Otro'
    ],
    'Ave': [
      'Periquito', 'Canario', 'Cacatúa', 'Loro', 'Agapornis', 
      'Ninfa', 'Guacamayo', 'Jilguero', 'Diamante Mandarín', 'Otro'
    ],
    'Pez': [
      'Guppy', 'Betta', 'Goldfish', 'Neón Tetra', 'Pez Ángel', 
      'Pez Payaso', 'Pez Disco', 'Pez Koi', 'Otro'
    ],
    'Conejo': [
      'Rex', 'Cabeza de León', 'Holandés', 'Mini Lop', 'Angora', 
      'Californiano', 'Gigante de Flandes', 'Otro'
    ],
    'Roedor': [
      'Hámster', 'Rata', 'Ratón', 'Cobaya', 'Jerbo', 'Chinchilla', 'Otro'
    ],
    'Reptil': [
      'Iguana', 'Gecko', 'Tortuga', 'Camaleón', 'Serpiente', 'Dragón Barbudo', 'Otro'
    ],
    'Otro': ['No especificada']
  };

  // Obtener las razas disponibles según el tipo de mascota seleccionado
  const availableBreeds = useMemo(() => {
    return petType ? (breedsByType[petType] || []) : [];
  }, [petType]);

  // Datos de ejemplo para las mascotas
  const [pets, setPets] = useState([
    {
      id: '1',
      name: 'Max',
      type: 'Perro',
      breed: 'Golden Retriever',
      age: '3 años',
      lastVisit: '10/04/2025',
      image: null,
      iconType: 'dog'
    },
    {
      id: '2',
      name: 'Luna',
      type: 'Gato',
      breed: 'Siamés',
      age: '2 años',
      lastVisit: '25/04/2025',
      image: null,
      iconType: 'cat'
    },
    {
      id: '3',
      name: 'Rocky',
      type: 'Perro',
      breed: 'Bulldog',
      age: '5 años',
      lastVisit: '03/05/2025',
      image: null,
      iconType: 'dog'
    },
  ]);

  const renderPetIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'perro':
      case 'dog':
        return <Ionicons name="paw" size={40} color="#1E88E5" />;
      case 'gato':
      case 'cat':
        return <Ionicons name="paw" size={40} color="#42A5F5" />;
      case 'ave':
      case 'bird':
        return <Ionicons name="airplane" size={40} color="#64B5F6" />;
      case 'pez':
      case 'fish':
        return <Ionicons name="fish" size={40} color="#2196F3" />;
      default:
        return <Ionicons name="paw" size={40} color="#90CAF9" />;
    }
  };

  const addPet = useCallback(() => {
    if (petName && petType && petAge) {
      const newPet = {
        id: Date.now().toString(),
        name: petName,
        type: petType,
        breed: petBreed || 'No especificada',
        age: petAge,
        gender: petGender || 'No especificado',
        vaccinated: isVaccinated,
        weight: petWeight || 'No especificado',
        specialNeeds: specialNeeds || 'Ninguna',
        color: petColor || 'No especificado',
        lastVisit: 'Sin visitas',
        image: null,
        iconType: petTypes.find(type => type.name === petType)?.id || 'other'
      };
      
      setPets([...pets, newPet]);
      // Limpiar todos los campos
      setPetName('');
      setPetType('');
      setPetAge('');
      setPetBreed('');
      setPetGender('');
      setIsVaccinated(false);
      setPetWeight('');
      setSpecialNeeds('');
      setPetColor('');
      setModalVisible(false);
    } else {
      alert('Por favor complete los campos requeridos');
    }
  }, [petName, petType, petAge, petBreed, petGender, isVaccinated, petWeight, specialNeeds, petColor, petTypes, pets]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.petCard}>
      <View style={styles.petImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.petImage} />
        ) : (
          <View style={styles.petIconContainer}>
            {renderPetIcon(item.iconType)}
          </View>
        )}
      </View>
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petDetails}>{item.type} • {item.breed}</Text>
        <Text style={styles.petAge}>{item.age}{item.gender ? ` • ${item.gender}` : ''}</Text>
        
        {/* Badges para características importantes */}
        <View style={styles.badgesContainer}>
          {item.vaccinated && (
            <View style={styles.vaccinatedBadge}>
              <Ionicons name="checkmark-circle" size={10} color="#fff" />
              <Text style={styles.vaccinatedText}>Vacunado</Text>
            </View>
          )}
        </View>
        
        <View style={styles.lastVisitContainer}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.lastVisitText}>Última visita: {item.lastVisit}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={20} color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Función para manejar la selección de tipo de mascota
  const handleSelectPetType = useCallback((type) => {
    setPetType(type.name);
    setPetBreed(''); // Resetear la raza al cambiar el tipo
    setShowBreedSelector(false);
  }, []);

  // Función para manejar la selección de raza
  const handleSelectBreed = useCallback((breed) => {
    setPetBreed(breed);
    setShowBreedSelector(false);
  }, []);

  // Función para manejar la selección de género
  const handleSelectGender = useCallback((gender) => {
    setPetGender(gender);
  }, []);

  // Componente modal para agregar mascota
  const AddPetModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Mascota</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {/* Nombre de mascota */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={petName}
                onChangeText={setPetName}
                placeholder="Nombre de tu mascota"
              />
            </View>
            
            {/* Tipo de mascota */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tipo de mascota *</Text>
              <View style={styles.selectorContainer}>
                {petTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeOption, petType === type.name && styles.selectedTypeOption]}
                    onPress={() => handleSelectPetType(type)}
                  >
                    <View style={styles.typeOptionContent}>
                      <Ionicons 
                        name={type.icon} 
                        size={18} 
                        color={petType === type.name ? '#fff' : '#1E88E5'} 
                      />
                      <Text style={[styles.typeText, petType === type.name && styles.selectedTypeText]}>
                        {type.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Raza basada en el tipo de mascota */}
            {petType && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Raza</Text>
                <TouchableOpacity 
                  style={styles.breedInput}
                  onPress={() => setShowBreedSelector(!showBreedSelector)}
                >
                  {petBreed ? (
                    <Text style={styles.breedSelectedText}>{petBreed}</Text>
                  ) : (
                    <Text style={styles.breedPlaceholder}>Selecciona una raza</Text>
                  )}
                  <Ionicons 
                    name={showBreedSelector ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {/* Selector de razas */}
                <View style={[styles.breedSelectorContainer, !showBreedSelector && styles.hiddenBreedSelector]}>
                  <ScrollView style={styles.breedsScrollView}>
                    {availableBreeds.map((breed, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.breedOption, petBreed === breed && styles.selectedBreedOption]}
                        onPress={() => handleSelectBreed(breed)}
                      >
                        <Text style={[styles.breedText, petBreed === breed && styles.selectedBreedText]}>
                          {breed}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
            
            {/* Edad */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Edad *</Text>
              <TextInput
                style={styles.input}
                value={petAge}
                onChangeText={setPetAge}
                placeholder="Ej. 2 años, 6 meses"
              />
            </View>
            
            {/* Peso */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Peso (opcional)</Text>
              <TextInput
                style={styles.input}
                value={petWeight}
                onChangeText={setPetWeight}
                placeholder="Ej. 5.2 kg"
                keyboardType="numeric"
              />
            </View>
            
            {/* Color */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Color (opcional)</Text>
              <TextInput
                style={styles.input}
                value={petColor}
                onChangeText={setPetColor}
                placeholder="Ej. Negro, Blanco, Marrón..."
              />
            </View>
            
            {/* Género */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Género</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity 
                  style={[styles.genderOption, petGender === 'Macho' && styles.selectedGenderOption]}
                  onPress={() => handleSelectGender('Macho')}
                >
                  <Ionicons 
                    name="male" 
                    size={20} 
                    color={petGender === 'Macho' ? '#fff' : '#1E88E5'} 
                  />
                  <Text style={[styles.genderText, petGender === 'Macho' && styles.selectedGenderText]}>Macho</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.genderOption, petGender === 'Hembra' && styles.selectedGenderOption]}
                  onPress={() => handleSelectGender('Hembra')}
                >
                  <Ionicons 
                    name="female" 
                    size={20} 
                    color={petGender === 'Hembra' ? '#fff' : '#1E88E5'} 
                  />
                  <Text style={[styles.genderText, petGender === 'Hembra' && styles.selectedGenderText]}>Hembra</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Vacunación */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Información adicional</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>¿Está vacunado?</Text>
                <Switch
                  value={isVaccinated}
                  onValueChange={setIsVaccinated}
                  trackColor={{ false: '#E0E0E0', true: '#a7d1f5' }}
                  thumbColor={isVaccinated ? '#1E88E5' : '#f4f3f4'}
                />
              </View>
            </View>
            
            {/* Necesidades especiales */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Necesidades especiales (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={specialNeeds}
                onChangeText={setSpecialNeeds}
                placeholder="Describe cualquier necesidad especial o condición médica"
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* Foto */}
            <View style={styles.photoContainer}>
              <Text style={styles.photoText}>Agregar foto</Text>
              <TouchableOpacity style={styles.photoButton}>
                <Ionicons name="camera" size={28} color="#1E88E5" />
              </TouchableOpacity>
            </View>
            
            {/* Botón Guardar */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={addPet}
            >
              <Text style={styles.addButtonText}>Guardar mascota</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Mascotas</Text>
        <TouchableOpacity
          style={styles.addPetButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {pets.length > 0 ? (
        <FlatList
          data={pets}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="paw" size={80} color="#1E88E5" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No tienes mascotas registradas</Text>
          <Text style={styles.emptySubText}>Agrega tu primera mascota para comenzar</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.emptyButtonText}>Agregar mascota</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <AddPetModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addPetButton: {
    backgroundColor: '#1E88E5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  petCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  petImageContainer: {
    marginRight: 15,
  },
  petImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  petIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  petAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  lastVisitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastVisitText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  moreButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  typeOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectedTypeOption: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  typeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    marginLeft: 5,
    color: '#333',
    fontWeight: '500',
  },
  selectedTypeText: {
    color: '#fff',
  },
  breedInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breedPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  breedSelectedText: {
    color: '#333',
    fontSize: 16,
  },
  breedSelectorContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 5,
    overflow: 'hidden',
  },
  hiddenBreedSelector: {
    display: 'none',
  },
  breedsScrollView: {
    maxHeight: 200,
  },
  breedOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedBreedOption: {
    backgroundColor: '#E3F2FD',
  },
  breedText: {
    fontSize: 16,
    color: '#333',
  },
  selectedBreedText: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '45%',
    justifyContent: 'center',
  },
  selectedGenderOption: {
    backgroundColor: '#1E88E5',
  },
  genderText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  selectedGenderText: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  badgesContainer: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 5,
  },
  vaccinatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  vaccinatedText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 3,
    fontWeight: '500',
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  photoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90CAF9',
    borderStyle: 'dashed',
  },
  addButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PetsScreen;
