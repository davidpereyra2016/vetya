import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import usePetStore from '../../store/usePetStore';
import { mascotaService } from '../../services/api';
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
  Switch,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Componente modal para agregar mascota - extraído y memoizado (diseño premium)
const MemoizedAddPetModal = memo(({
  modalVisible,
  setModalVisible,
  petName,
  setPetName,
  petType,
  petTypes,
  petBreed,
  setPetBreed,
  petAge,
  setPetAge,
  petGender,
  isVaccinated,
  setIsVaccinated,
  petWeight,
  setPetWeight,
  specialNeeds,
  setSpecialNeeds,
  petColor,
  setPetColor,
  showBreedSelector,
  setShowBreedSelector,
  availableBreeds,
  handleSelectPetType,
  handleSelectBreed,
  handleSelectGender,
  addPet,
  petImage,
  handleSelectImage
}) => (
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
        <View style={styles.modalDragIndicator} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Agregar Mascota</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.modalCloseBtn}
          >
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
          {/* Foto (primero, más visual) */}
          <View style={styles.photoContainer}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleSelectImage}
              activeOpacity={0.85}
            >
              {petImage ? (
                <Image source={{ uri: petImage.uri }} style={styles.petImagePreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={30} color="#1E88E5" />
                  <Text style={styles.photoText}>Agregar foto</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Nombre de mascota */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={petName}
              onChangeText={setPetName}
              placeholder="Nombre de tu mascota"
              placeholderTextColor="#AAB0B7"
            />
          </View>

          {/* Tipo de mascota */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tipo de mascota *</Text>
            <View style={styles.selectorContainer}>
              {petTypes.map((type) => {
                const selected = petType === type.name;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeOption, selected && styles.selectedTypeOption]}
                    onPress={() => handleSelectPetType(type)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={type.icon}
                      size={16}
                      color={selected ? '#fff' : '#1E88E5'}
                    />
                    <Text style={[styles.typeText, selected && styles.selectedTypeText]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Raza basada en el tipo de mascota */}
          {petType && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Raza</Text>
              <TouchableOpacity
                style={styles.breedInput}
                onPress={() => setShowBreedSelector(!showBreedSelector)}
                activeOpacity={0.85}
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
                <ScrollView style={styles.breedsScrollView} nestedScrollEnabled>
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

          {/* Edad y Peso (fila) */}
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>Edad *</Text>
              <TextInput
                style={styles.input}
                value={petAge}
                onChangeText={setPetAge}
                placeholder="Ej. 2 años"
                placeholderTextColor="#AAB0B7"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Peso</Text>
              <TextInput
                style={styles.input}
                value={petWeight}
                onChangeText={setPetWeight}
                placeholder="Ej. 5.2"
                placeholderTextColor="#AAB0B7"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Color */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Color</Text>
            <TextInput
              style={styles.input}
              value={petColor}
              onChangeText={setPetColor}
              placeholder="Ej. Negro, Blanco, Marrón..."
              placeholderTextColor="#AAB0B7"
            />
          </View>

          {/* Género */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Género</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderOption, petGender === 'Macho' && styles.selectedGenderMale]}
                onPress={() => handleSelectGender('Macho')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="male"
                  size={20}
                  color={petGender === 'Macho' ? '#fff' : '#2196F3'}
                />
                <Text style={[styles.genderText, petGender === 'Macho' && styles.selectedGenderText]}>Macho</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genderOption, petGender === 'Hembra' && styles.selectedGenderFemale]}
                onPress={() => handleSelectGender('Hembra')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="female"
                  size={20}
                  color={petGender === 'Hembra' ? '#fff' : '#E91E63'}
                />
                <Text style={[styles.genderText, petGender === 'Hembra' && styles.selectedGenderText]}>Hembra</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Vacunación */}
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelWrap}>
              <Ionicons name="shield-checkmark" size={18} color="#4CAF50" />
              <Text style={styles.switchLabel}>¿Está vacunado?</Text>
            </View>
            <Switch
              value={isVaccinated}
              onValueChange={setIsVaccinated}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={isVaccinated ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          {/* Necesidades especiales */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Necesidades especiales</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={specialNeeds}
              onChangeText={setSpecialNeeds}
              placeholder="Describe cualquier necesidad especial o condición médica"
              placeholderTextColor="#AAB0B7"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity style={styles.addButton} onPress={addPet} activeOpacity={0.9}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>Guardar mascota</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
));

const PetsScreen = ({ navigation }) => {
  // Estados desde el store de Zustand
  const { pets, isLoading, error, fetchPets } = usePetStore();
  
  // Estados locales para el formulario y UI
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPetType, setSelectedPetType] = useState('all');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Perro');
  const [petAge, setPetAge] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petGender, setPetGender] = useState('Macho');
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [petWeight, setPetWeight] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [petColor, setPetColor] = useState('');
  const [petImage, setPetImage] = useState(null);
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
      'Mestizo',
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

  // Filtrar mascotas por tipo
  const filteredPets = useMemo(() => {
    if (!pets) return [];
    if (selectedPetType === 'all') return pets;
    return pets.filter(pet => pet.tipo === selectedPetType);
  }, [pets, selectedPetType]);

  // Filtros dinámicos: solo mostrar tipos que el usuario realmente tiene registrados.
  // Ejemplo: si solo tiene un Perro, solo aparece el botón "Perros" (además de "Todas").
  const availableFilters = useMemo(() => {
    if (!pets || pets.length === 0) return [];
    const counts = new Map();
    pets.forEach((p) => {
      if (p?.tipo) counts.set(p.tipo, (counts.get(p.tipo) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([tipo, count]) => {
      const meta = petTypes.find((t) => t.name === tipo);
      return {
        id: meta?.id || tipo,
        name: tipo,
        icon: meta?.icon || 'paw',
        count
      };
    });
  }, [pets]);

  // Cargar mascotas al montar el componente
  useEffect(() => {
    loadPets();
  }, []);

  // Función para cargar las mascotas del usuario
  const loadPets = async () => {
    await fetchPets();
  };

  // Función para manejar el pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPets();
    setRefreshing(false);
  }, []);

  // Función para seleccionar imagen de mascota
  const handleSelectImage = async () => {
    try {
      const result = await mascotaService.pickPetImage();
      if (result.success) {
        setPetImage(result.data);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      alert('No se pudo seleccionar la imagen');
    }
  };

  // Función para agregar nueva mascota con Zustand
  const addPet = useCallback(async () => {
    if (!petName.trim()) {
      alert('Por favor ingresa el nombre de tu mascota');
      return;
    }
    
    if (!petType) {
      alert('Por favor selecciona el tipo de mascota');
      return;
    }
    
    if (!petAge.trim()) {
      alert('Por favor ingresa la edad de tu mascota');
      return;
    }
    
    // Preparar datos de la mascota
    const mascotaData = {
      nombre: petName,
      tipo: petType,
      raza: petBreed || 'No especificada',
      edad: petAge,
      genero: petGender || 'No especificado',
      color: petColor || '',
      peso: petWeight || '',
      necesidadesEspeciales: specialNeeds || '',
      vacunado: isVaccinated,
      imagen: petImage?.base64 || ''
    };
    
    // Usar el store para agregar la mascota
    const { createPet } = usePetStore.getState();
    const result = await createPet(mascotaData);
    
    if (result.success) {
      setModalVisible(false);
      resetForm();  // Reiniciar formulario
    } else {
      alert(result.error || 'Error al agregar mascota');
    }
  }, [petName, petType, petAge, petBreed, petGender, isVaccinated, petWeight, specialNeeds, petColor, petImage]);
  
  // Reiniciar formulario
  const resetForm = () => {
    setPetName('');
    setPetType('Perro');
    setPetBreed('');
    setPetAge('');
    setPetGender('Macho');
    setPetColor('');
    setPetWeight('');
    setSpecialNeeds('');
    setIsVaccinated(false);
    setPetImage(null);
  };

  // Renderizar cada mascota con datos del backend (diseño premium)
  const renderItem = ({ item }) => {
    const isMale = item.genero === 'Macho';
    const isFemale = item.genero === 'Hembra';
    const showGenderBadge = isMale || isFemale;

    return (
      <TouchableOpacity
        style={styles.petCard}
        onPress={() => navigation.navigate('PetDetailScreen', { petId: item._id })}
        activeOpacity={0.9}
      >
        {/* Imagen cuadrada redondeada */}
        {item.imagen ? (
          <Image source={{ uri: item.imagen }} style={styles.petImage} />
        ) : (
          <View style={[styles.petImage, styles.petIconContainer]}>
            <Ionicons name="paw" size={34} color="#1E88E5" />
          </View>
        )}

        <View style={styles.petInfo}>
          {/* Nombre + badge de género */}
          <View style={styles.petHeader}>
            <Text style={styles.petName} numberOfLines={1}>{item.nombre}</Text>
            {showGenderBadge && (
              <View style={[styles.genderBadge, isMale ? styles.maleBg : styles.femaleBg]}>
                <Ionicons
                  name={isMale ? 'male' : 'female'}
                  size={14}
                  color={isMale ? '#2196F3' : '#E91E63'}
                />
              </View>
            )}
          </View>

          {/* Subtítulo: Raza • Edad */}
          <Text style={styles.petSubtitle} numberOfLines={1}>
            {item.raza}{item.edad ? ` • ${item.edad}` : ''}
          </Text>

          {/* Pills de estado (vacunado + peso) */}
          <View style={styles.badgesContainer}>
            {item.vacunado ? (
              <View style={[styles.statusPill, styles.vaccinatedPill]}>
                <Ionicons name="shield-checkmark" size={12} color="#4CAF50" />
                <Text style={styles.vaccinatedPillText}>Vacunado</Text>
              </View>
            ) : (
              <View style={[styles.statusPill, styles.pendingPill]}>
                <Ionicons name="alert-circle" size={12} color="#FF9800" />
                <Text style={styles.pendingPillText}>Vacuna Pte.</Text>
              </View>
            )}

            {item.peso ? (
              <View style={[styles.statusPill, styles.weightPill]}>
                <Text style={styles.weightPillText}>{item.peso}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Función para manejar la selección de tipo de mascota en el modal
  const handleSelectPetType = useCallback((type) => {
    setPetType(type.name);
    setPetBreed(''); // Resetear la raza al cambiar el tipo
    setShowBreedSelector(false);
  }, []);

  // Función para manejar la selección de filtro por tipo de mascota
  const handleFilterByType = useCallback((typeValue) => {
    setSelectedPetType(typeValue);
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

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />

      {/* HEADER PREMIUM (curvo, con back + add glass) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Mascotas</Text>
          <TouchableOpacity
            style={styles.headerAddButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTROS DINÁMICOS (solo tipos que tiene el usuario) */}
      {!isLoading && !error && pets && pets.length > 0 && (
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterBtn,
                selectedPetType === 'all' ? styles.filterBtnActive : styles.filterBtnInactive
              ]}
              onPress={() => handleFilterByType('all')}
              activeOpacity={0.85}
            >
              <Text style={selectedPetType === 'all' ? styles.filterTextActive : styles.filterTextInactive}>
                Todas ({pets.length})
              </Text>
            </TouchableOpacity>

            {availableFilters.map((filtro) => {
              const active = selectedPetType === filtro.name;
              return (
                <TouchableOpacity
                  key={filtro.id}
                  style={[styles.filterBtn, active ? styles.filterBtnActive : styles.filterBtnInactive]}
                  onPress={() => handleFilterByType(filtro.name)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={filtro.icon}
                    size={14}
                    color={active ? '#FFF' : '#1E88E5'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={active ? styles.filterTextActive : styles.filterTextInactive}>
                    {filtro.name} ({filtro.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* CONTENIDO */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loaderText}>Cargando mascotas...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#F44336" style={styles.errorIcon} />
          <Text style={styles.errorText}>Error al cargar mascotas</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPets}>
            <Text style={styles.retryText}>Intentar nuevamente</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPets.length > 0 ? (
        <FlatList
          data={filteredPets}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.dashedAddButton}
              activeOpacity={0.85}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.dashedIconCircle}>
                <Ionicons name="add" size={26} color="#FFF" />
              </View>
              <Text style={styles.dashedAddText}>Registrar nueva mascota</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="paw" size={56} color="#1E88E5" />
          </View>
          <Text style={styles.emptyText}>No tienes mascotas registradas</Text>
          <Text style={styles.emptySubText}>Agrega tu primera mascota para comenzar</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={20} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.emptyButtonText}>Agregar mascota</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <MemoizedAddPetModal 
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        petName={petName}
        setPetName={setPetName}
        petType={petType}
        petTypes={petTypes}
        petBreed={petBreed}
        setPetBreed={setPetBreed}
        petAge={petAge}
        setPetAge={setPetAge}
        petGender={petGender}
        isVaccinated={isVaccinated}
        setIsVaccinated={setIsVaccinated}
        petWeight={petWeight}
        setPetWeight={setPetWeight}
        specialNeeds={specialNeeds}
        setSpecialNeeds={setSpecialNeeds}
        petColor={petColor}
        setPetColor={setPetColor}
        showBreedSelector={showBreedSelector}
        setShowBreedSelector={setShowBreedSelector}
        availableBreeds={availableBreeds}
        handleSelectPetType={handleSelectPetType}
        handleSelectBreed={handleSelectBreed}
        handleSelectGender={handleSelectGender}
        addPet={addPet}
        petImage={petImage}
        handleSelectImage={handleSelectImage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // ─── HEADER PREMIUM ───
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAddButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── FILTROS ───
  filtersWrapper: {
    marginTop: 15,
    marginBottom: 5,
    zIndex: 5,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#1E88E5',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  filterBtnInactive: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  filterTextInactive: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },

  // ─── LOADERS / ERROR / EMPTY ───
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // ─── LISTA Y TARJETAS ───
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 15,
  },
  petCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 3,
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 18,
    marginRight: 14,
  },
  petIconContainer: {
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  petName: {
    flex: 1,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  genderBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maleBg: {
    backgroundColor: '#E3F2FD',
  },
  femaleBg: {
    backgroundColor: '#FCE4EC',
  },
  petSubtitle: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
    marginBottom: 10,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  vaccinatedPill: {
    backgroundColor: '#E8F5E9',
  },
  vaccinatedPillText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  pendingPill: {
    backgroundColor: '#FFF3E0',
  },
  pendingPillText: {
    color: '#FF9800',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  weightPill: {
    backgroundColor: '#F5F5F5',
  },
  weightPillText: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // ─── DASHED ADD BUTTON (footer) ───
  dashedAddButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#90CAF9',
    borderStyle: 'dashed',
    borderRadius: 22,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  dashedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dashedAddText: {
    color: '#1E88E5',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ─── EMPTY STATE ───
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // ─── MODAL ───
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '90%',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalDragIndicator: {
    width: 50,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    paddingHorizontal: 25,
  },

  // ─── INPUTS ───
  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  // ─── SELECTOR DE TIPO ───
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFF',
  },
  selectedTypeOption: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  typeText: {
    marginLeft: 6,
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedTypeText: {
    color: '#fff',
  },

  // ─── SELECTOR DE RAZA ───
  breedInput: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breedPlaceholder: {
    color: '#AAB0B7',
    fontSize: 15,
  },
  breedSelectedText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '500',
  },
  breedSelectorContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginTop: 6,
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
    fontSize: 15,
    color: '#333',
  },
  selectedBreedText: {
    color: '#1E88E5',
    fontWeight: '600',
  },

  // ─── GÉNERO ───
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
  },
  selectedGenderMale: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  selectedGenderFemale: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  genderText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  selectedGenderText: {
    color: '#fff',
  },

  // ─── SWITCH ───
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 16,
  },
  switchLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    marginLeft: 8,
  },

  // ─── FOTO ───
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  photoButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#90CAF9',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    marginTop: 6,
    fontSize: 12,
    color: '#1E88E5',
    fontWeight: '600',
  },
  petImagePreview: {
    width: '100%',
    height: '100%',
  },

  // ─── BOTÓN GUARDAR ───
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E88E5',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 12,
    marginBottom: 30,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PetsScreen;
