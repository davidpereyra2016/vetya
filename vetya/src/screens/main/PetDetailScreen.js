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

  const isMale = pet.genero === 'Macho';
  const isFemale = pet.genero === 'Hembra';
  const showGenderBadge = isMale || isFemale;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ─── HERO SECTION (imagen de fondo) ─── */}
        <View style={styles.heroSection}>
          {pet.imagen ? (
            <Image source={{ uri: pet.imagen }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              {renderPetIcon(pet.tipo, 110)}
            </View>
          )}

          {/* Header flotante (glassmorphism) */}
          <View style={styles.floatingHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassButton}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(true)}
                style={[styles.glassButton, { marginRight: 10 }]}
              >
                <Ionicons name="pencil" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeletePet} style={styles.glassDeleteButton}>
                <Ionicons name="trash" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ─── OVERLAPPING SHEET ─── */}
        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          {/* Nombre + género */}
          <View style={styles.petTitleRow}>
            <Text style={styles.petName} numberOfLines={1}>{pet.nombre}</Text>
            {showGenderBadge && (
              <View style={[styles.genderIconWrapper, isMale ? styles.maleBg : styles.femaleBg]}>
                <Ionicons
                  name={isMale ? 'male' : 'female'}
                  size={22}
                  color={isMale ? '#2196F3' : '#E91E63'}
                />
              </View>
            )}
          </View>
          <Text style={styles.petSubtitle}>
            {pet.tipo}{pet.raza && pet.raza !== 'No especificada' ? ` • ${pet.raza}` : ''}
          </Text>

          {/* Grid de Estadísticas */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>EDAD</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {pet.edad
                  ? (/\b(año|mes)/i.test(pet.edad) ? pet.edad : `${pet.edad} años`)
                  : '--'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>PESO</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {pet.peso && pet.peso !== 'No especificado'
                  ? (/kg/i.test(pet.peso) ? pet.peso : `${pet.peso} kg`)
                  : '--'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>COLOR</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {pet.color && pet.color !== 'No especificado' ? pet.color : '--'}
              </Text>
            </View>
          </View>

          {/* Estado de Salud */}
          <Text style={styles.sectionTitle}>Estado de Salud</Text>
          <View style={[styles.healthCard, pet.vacunado ? styles.healthCardOk : styles.healthCardWarn]}>
            <View style={[styles.healthIconBox, pet.vacunado ? styles.healthIconOk : styles.healthIconWarn]}>
              <Ionicons name={pet.vacunado ? 'shield-checkmark' : 'alert-circle'} size={26} color="#FFF" />
            </View>
            <View style={styles.healthInfo}>
              <Text style={[styles.healthTitle, pet.vacunado ? styles.healthTextOk : styles.healthTextWarn]}>
                {pet.vacunado ? 'Vacunación al día' : 'Vacunación pendiente'}
              </Text>
              <Text style={[styles.healthDesc, pet.vacunado ? styles.healthDescOk : styles.healthDescWarn]}>
                {pet.vacunado
                  ? 'La cartilla de vacunas se encuentra actualizada.'
                  : 'Agenda una cita para actualizar sus vacunas.'}
              </Text>
            </View>
          </View>

          {/* Última visita */}
          <View style={styles.lastVisitCard}>
            <View style={styles.lastVisitIcon}>
              <Ionicons name="time-outline" size={20} color="#1E88E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lastVisitLabel}>Última visita</Text>
              <Text style={styles.lastVisitValue}>
                {pet.ultimaVisita ? new Date(pet.ultimaVisita).toLocaleDateString() : 'Sin visitas registradas'}
              </Text>
            </View>
          </View>

          {/* Necesidades Especiales */}
          {pet.necesidadesEspeciales && pet.necesidadesEspeciales !== '' && pet.necesidadesEspeciales !== 'Ninguna' ? (
            <>
              <Text style={styles.sectionTitle}>Necesidades Especiales</Text>
              <View style={styles.specialNeedsCard}>
                <View style={styles.specialNeedsIconBox}>
                  <Ionicons name="warning" size={22} color="#F57C00" />
                </View>
                <View style={styles.specialNeedsInfo}>
                  <Text style={styles.specialNeedsText}>{pet.necesidadesEspeciales}</Text>
                </View>
              </View>
            </>
          ) : null}

        </View>
      </ScrollView>

      {/* ─── BOTTOM BAR (sticky) ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.9}
          onPress={() => setIsEditModalVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.fabText}>Editar información de {pet.nombre}</Text>
        </TouchableOpacity>
      </View>

      {/* ─── MODAL DE EDICIÓN (lógica original preservada) ─── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Mascota</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={editedPet.nombre}
                  onChangeText={(text) => setEditedPet({ ...editedPet, nombre: text })}
                  placeholder="Nombre de la mascota"
                  placeholderTextColor="#AAB0B7"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Edad *</Text>
                  <TextInput
                    style={styles.input}
                    value={editedPet.edad}
                    onChangeText={(text) => setEditedPet({ ...editedPet, edad: text })}
                    placeholder="Ej: 2 años"
                    placeholderTextColor="#AAB0B7"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Peso</Text>
                  <TextInput
                    style={styles.input}
                    value={editedPet.peso === 'No especificado' ? '' : editedPet.peso}
                    onChangeText={(text) => setEditedPet({ ...editedPet, peso: text || 'No especificado' })}
                    placeholder="Ej: 5.2"
                    placeholderTextColor="#AAB0B7"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Color</Text>
                <TextInput
                  style={styles.input}
                  value={editedPet.color === 'No especificado' ? '' : editedPet.color}
                  onChangeText={(text) => setEditedPet({ ...editedPet, color: text || 'No especificado' })}
                  placeholder="Ej: Negro, Blanco, Marrón..."
                  placeholderTextColor="#AAB0B7"
                />
              </View>

              <View style={styles.switchGroup}>
                <View style={styles.switchLabelWrap}>
                  <Ionicons name="shield-checkmark" size={18} color="#4CAF50" />
                  <Text style={styles.switchLabel}>¿Está vacunado?</Text>
                </View>
                <Switch
                  value={editedPet.vacunado}
                  onValueChange={(value) => setEditedPet({ ...editedPet, vacunado: value })}
                  trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                  thumbColor={editedPet.vacunado ? '#4CAF50' : '#f4f3f4'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Necesidades especiales</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editedPet.necesidadesEspeciales === 'Ninguna' ? '' : editedPet.necesidadesEspeciales}
                  onChangeText={(text) => setEditedPet({ ...editedPet, necesidadesEspeciales: text || 'Ninguna' })}
                  placeholder="Describe cualquier necesidad especial o condición médica"
                  placeholderTextColor="#AAB0B7"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={savePetChanges} activeOpacity={0.9}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
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
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 100, // espacio para el bottom bar
  },

  // ─── LOADING / ERROR (estados originales preservados) ───
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButtonError: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  backButtonErrorText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // ─── HERO SECTION ───
  heroSection: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 30,
  },
  headerActions: {
    flexDirection: 'row',
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  glassDeleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244,67,54,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.5)',
  },

  // ─── OVERLAPPING SHEET ───
  sheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginTop: -50,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 40,
    minHeight: 500,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  dragIndicator: {
    width: 50,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  petTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  petName: {
    flex: 1,
    fontSize: 30,
    fontWeight: '900',
    color: '#1A237E',
    marginRight: 10,
  },
  genderIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maleBg: { backgroundColor: '#E3F2FD' },
  femaleBg: { backgroundColor: '#FCE4EC' },
  petSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 25,
  },

  // ─── STATS GRID ───
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#333',
  },

  // ─── SECCIONES ───
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
  },

  // ─── HEALTH CARD ───
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  healthCardOk: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  healthCardWarn: { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' },
  healthIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  healthIconOk: { backgroundColor: '#4CAF50' },
  healthIconWarn: { backgroundColor: '#FF9800' },
  healthInfo: { flex: 1 },
  healthTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  healthTextOk: { color: '#2E7D32' },
  healthTextWarn: { color: '#E65100' },
  healthDesc: { fontSize: 12, lineHeight: 16 },
  healthDescOk: { color: '#388E3C' },
  healthDescWarn: { color: '#F57C00' },

  // ─── LAST VISIT CARD ───
  lastVisitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  lastVisitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lastVisitLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginBottom: 2,
  },
  lastVisitValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },

  // ─── SPECIAL NEEDS ───
  specialNeedsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
  },
  specialNeedsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,152,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  specialNeedsInfo: { flex: 1, paddingTop: 4 },
  specialNeedsText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500',
    lineHeight: 20,
  },

  // ─── BOTTOM BAR ───
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  fabButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ─── MODAL DE EDICIÓN ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 8,
    paddingBottom: 10,
    maxHeight: '92%',
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
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
  },
  switchGroup: {
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PetDetailScreen;
