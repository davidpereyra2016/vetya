import React, { useState, useEffect } from 'react';
import usePetStore from '../../store/usePetStore';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const PetDetailScreen = ({ route, navigation }) => {
  const { petId } = route.params;
  const [pet, setPet] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedPet, setEditedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar los detalles de la mascota cuando se monte el componente
  useEffect(() => {
    const loadPetDetails = async () => {
      try {
        setLoading(true);
        const { fetchPetById } = usePetStore.getState();
        const result = await fetchPetById(petId);
        
        if (result.success) {
          setPet(result.data);
          // Asegurarnos que todos los campos estén presentes para la edición
          setEditedPet({
            ...result.data,
            nombre: result.data.nombre || '',
            edad: result.data.edad || '',
            peso: result.data.peso || '',
            color: result.data.color || '',
            tipo: result.data.tipo || '',
            raza: result.data.raza || '',
            genero: result.data.genero || '',
            vacunado: result.data.vacunado || false,
            necesidadesEspeciales: result.data.necesidadesEspeciales || ''
          });
        } else {
          setError(result.error || 'Error al cargar los detalles de la mascota');
        }
      } catch (err) {
        console.error('Error al cargar detalles de mascota:', err);
        setError('Error al cargar los detalles de la mascota');
      } finally {
        setLoading(false);
      }
    };

    loadPetDetails();
  }, [petId]);

  // Función para confirmar eliminación de mascota
  const confirmDeletePet = () => {
    if (!pet) return;
    
    Alert.alert(
      "Eliminar mascota",
      `¿Estás seguro de que deseas eliminar a ${pet.nombre}?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          onPress: deletePet,
          style: "destructive"
        }
      ]
    );
  };

  // Función para eliminar mascota
  const deletePet = async () => {
    if (!pet) return;
    
    try {
      const { deletePet } = usePetStore.getState();
      const result = await deletePet(pet._id);
      
      if (result.success) {
        navigation.goBack();
        // Agregar notificación de éxito
        setTimeout(() => {
          Alert.alert("Mascota eliminada", `${pet.nombre} ha sido eliminado correctamente.`);
        }, 500);
      } else {
        Alert.alert("Error", result.error || "No se pudo eliminar la mascota");
      }
    } catch (err) {
      console.error('Error al eliminar mascota:', err);
      Alert.alert("Error", "Ocurrió un error al eliminar la mascota");
    }
  };

  // Función para guardar cambios de mascota
  const savePetChanges = async () => {
    if (!pet || !editedPet) return;
    
    try {
      const { updatePet } = usePetStore.getState();
      const result = await updatePet(pet._id, editedPet);
      
      if (result.success) {
        setPet(result.data);
        setIsEditModalVisible(false);
        // Mostrar alerta de éxito
        Alert.alert("Cambios guardados", "Los datos de la mascota se han actualizado correctamente.");
      } else {
        Alert.alert("Error", result.error || "No se pudieron guardar los cambios");
      }
    } catch (err) {
      console.error('Error al actualizar mascota:', err);
      Alert.alert("Error", "Ocurrió un error al guardar los cambios");
    }
  };

  // Renderizar el ícono correspondiente para el tipo de mascota
  const renderPetIcon = (type, size = 40) => {
    const iconColor = "#1E88E5";
    switch (type.toLowerCase()) {
      case 'perro':
      case 'dog':
        return <MaterialCommunityIcons name="dog" size={size} color={iconColor} />;
      case 'gato':
      case 'cat':
        return <MaterialCommunityIcons name="cat" size={size} color={iconColor} />;
      case 'ave':
      case 'bird':
        return <MaterialCommunityIcons name="bird" size={size} color={iconColor} />;
      case 'pez':
      case 'fish':
        return <MaterialCommunityIcons name="fish" size={size} color={iconColor} />;
      case 'conejo':
      case 'rabbit':
        return <MaterialCommunityIcons name="rabbit" size={size} color={iconColor} />;
      case 'reptil':
      case 'reptile':
        return <MaterialCommunityIcons name="turtle" size={size} color={iconColor} />;
      case 'roedor':
      case 'rodent':
        return <MaterialCommunityIcons name="rodent" size={size} color={iconColor} />;
      default:
        return <MaterialCommunityIcons name="paw" size={size} color={iconColor} />;
    }
  };

  // Si está cargando, mostrar indicador de carga
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Cargando detalles de la mascota...</Text>
      </View>
    );
  }

  // Si hay un error, mostrar mensaje de error
  if (error || !pet) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={60} color="#F44336" />
        <Text style={styles.errorText}>{error || 'No se encontró la mascota'}</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonErrorText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con botón de volver y título */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Mascota</Text>
        <TouchableOpacity onPress={confirmDeletePet} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Tarjeta principal con información básica */}
        <View style={styles.mainCard}>
          <View style={styles.petImageContainer}>
            {pet.imagen ? (
              <Image source={{ uri: pet.imagen }} style={styles.petImage} />
            ) : (
              <View style={styles.petIconContainer}>
                {renderPetIcon(pet.tipo, 80)}
              </View>
            )}
          </View>
          
          <Text style={styles.petName}>{pet.nombre}</Text>
          <View style={styles.petTypeContainer}>
            <Text style={styles.petType}>{pet.tipo}</Text>
            {pet.raza && pet.raza !== 'No especificada' && (
              <Text style={styles.petBreed}>{pet.raza}</Text>
            )}
          </View>

          {pet.vacunado && (
            <View style={styles.vaccinatedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
              <Text style={styles.vaccinatedText}>Vacunado</Text>
            </View>
          )}
        </View>

        {/* Tarjeta de información detallada */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Información General</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="calendar-outline" size={20} color="#1E88E5" />
              <Text style={styles.infoLabel}>Edad:</Text>
            </View>
            <Text style={styles.infoValue}>{pet.edad}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              {pet.genero === 'Macho' ? (
                <Ionicons name="male" size={20} color="#1E88E5" />
              ) : pet.genero === 'Hembra' ? (
                <Ionicons name="female" size={20} color="#E91E63" />
              ) : (
                <Ionicons name="help-circle-outline" size={20} color="#888" />
              )}
              <Text style={styles.infoLabel}>Género:</Text>
            </View>
            <Text style={styles.infoValue}>{pet.genero || 'No especificado'}</Text>
          </View>
          
          {pet.peso && pet.peso !== '' && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="weight" size={20} color="#1E88E5" />
                <Text style={styles.infoLabel}>Peso:</Text>
              </View>
              <Text style={styles.infoValue}>{pet.peso}</Text>
            </View>
          )}
          
          {pet.color && pet.color !== '' && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="palette" size={20} color="#1E88E5" />
                <Text style={styles.infoLabel}>Color:</Text>
              </View>
              <Text style={styles.infoValue}>{pet.color}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="medkit-outline" size={20} color="#1E88E5" />
              <Text style={styles.infoLabel}>Vacunado:</Text>
            </View>
            <Text style={[styles.infoValue, pet.vacunado ? styles.vaccinated : styles.notVaccinated]}>
              {pet.vacunado ? 'Sí' : 'No'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="time-outline" size={20} color="#1E88E5" />
              <Text style={styles.infoLabel}>Última visita:</Text>
            </View>
            <Text style={styles.infoValue}>{pet.ultimaVisita ? new Date(pet.ultimaVisita).toLocaleDateString() : 'Sin visitas'}</Text>
          </View>
        </View>

        {/* Tarjeta de necesidades especiales si existen */}
        {pet.necesidadesEspeciales && pet.necesidadesEspeciales !== '' && (
          <View style={styles.specialNeedsCard}>
            <Text style={styles.infoCardTitle}>Necesidades Especiales</Text>
            <Text style={styles.specialNeedsText}>{pet.necesidadesEspeciales}</Text>
          </View>
        )}

        {/* Botón para editar */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditModalVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Editar información</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para editar mascota */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Mascota</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={editedPet.nombre}
                  onChangeText={(text) => setEditedPet({...editedPet, nombre: text})}
                  placeholder="Nombre de la mascota"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Edad *</Text>
                <TextInput
                  style={styles.input}
                  value={editedPet.edad}
                  onChangeText={(text) => setEditedPet({...editedPet, edad: text})}
                  placeholder="Ej: 2 años"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Peso</Text>
                <TextInput
                  style={styles.input}
                  value={editedPet.peso === 'No especificado' ? '' : editedPet.peso}
                  onChangeText={(text) => setEditedPet({...editedPet, peso: text || 'No especificado'})}
                  placeholder="Ej: 5.2 kg"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Color</Text>
                <TextInput
                  style={styles.input}
                  value={editedPet.color === 'No especificado' ? '' : editedPet.color}
                  onChangeText={(text) => setEditedPet({...editedPet, color: text || 'No especificado'})}
                  placeholder="Ej: Negro, Blanco, Marrón..."
                />
              </View>
              
              <View style={styles.switchGroup}>
                <Text style={styles.inputLabel}>¿Está vacunado?</Text>
                <Switch
                  value={editedPet.vacunado}
                  onValueChange={(value) => setEditedPet({...editedPet, vacunado: value})}
                  trackColor={{ false: '#E0E0E0', true: '#a7d1f5' }}
                  thumbColor={editedPet.vacunado ? '#1E88E5' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Necesidades especiales</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editedPet.necesidadesEspeciales === 'Ninguna' ? '' : editedPet.necesidadesEspeciales}
                  onChangeText={(text) => setEditedPet({...editedPet, necesidadesEspeciales: text || 'Ninguna'})}
                  placeholder="Describe cualquier necesidad especial o condición médica"
                  multiline
                  numberOfLines={4}
                />

              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={savePetChanges}
              >
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  petImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#E3F2FD',
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  petIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  petTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  petType: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  petBreed: {
    fontSize: 16,
    color: '#666',
  },
  vaccinatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginTop: 5,
  },
  vaccinatedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  vaccinated: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  notVaccinated: {
    color: '#F44336',
  },
  specialNeedsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  specialNeedsText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  editButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#444',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginVertical: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default PetDetailScreen;
