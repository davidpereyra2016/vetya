import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VetDetailScreen = ({ route, navigation }) => {
  const { vet } = route.params;
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  
  // Estado que determina si el usuario puede valorar al veterinario
  // En un entorno real, esto se cargaría desde el backend
  const [canRateVet, setCanRateVet] = useState(false);

  // Simulamos la carga de datos para verificar si el usuario puede valorar
  useEffect(() => {
    // En una implementación real, aquí se haría una llamada a API
    // para verificar si el usuario tuvo cita o emergencia con este veterinario
    
    // Simulación: 50% de probabilidad de poder valorar (para demo)
    const checkIfUserCanRate = () => {
      // En producción, esto sería:
      // const hasHadAppointment = await checkPreviousAppointments(vet.id, userId);
      // const hasHadEmergency = await checkPreviousEmergencies(vet.id, userId);
      // setCanRateVet(hasHadAppointment || hasHadEmergency);
      
      // Para demo solamente:
      const randomCanRate = Math.random() > 0.5;
      setCanRateVet(randomCanRate);
    };
    
    checkIfUserCanRate();
  }, [vet.id]);

  // Función para enviar una valoración
  const submitRating = () => {
    if (!canRateVet) {
      Alert.alert(
        "No puedes valorar",
        "Solo puedes valorar a veterinarios con los que hayas tenido una cita o emergencia."
      );
      return;
    }

    if (userRating === 0) {
      Alert.alert(
        "Valoración requerida",
        "Por favor selecciona un número de estrellas."
      );
      return;
    }

    // En una implementación real, aquí se enviaría la valoración a la API
    Alert.alert(
      "¡Gracias por tu valoración!",
      "Tu opinión es muy importante para nosotros y otros usuarios.",
      [
        {
          text: "OK",
          onPress: () => {
            setShowRatingModal(false);
            setUserRating(0);
            setUserComment('');
          }
        }
      ]
    );
  };

  // Función para agendar cita con este veterinario
  const scheduleAppointment = () => {
    navigation.navigate('AgendarCita', { 
      selectedVet: vet,
      fromVetDetail: true
    });
  };

  // Componente dedicado para mostrar estrellas de valoración
  const RatingStars = ({ rating, size = 18 }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        {/* Estrellas completas */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Text key={`full-${i}`}>
            <Ionicons name="star" size={size} color="#FFC107" />
          </Text>
        ))}
        
        {/* Media estrella si corresponde */}
        {halfStar && (
          <Text key="half">
            <Ionicons name="star-half" size={size} color="#FFC107" />
          </Text>
        )}
        
        {/* Estrellas vacías */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Text key={`empty-${i}`}>
            <Ionicons name="star-outline" size={size} color="#FFC107" />
          </Text>
        ))}
      </View>
    );
  };

  // Componente para las estrellas interactivas del modal de valoración
  const RatingSelector = () => {
    return (
      <View style={styles.ratingSelector}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setUserRating(star)}
          >
            <Text>
              <Ionicons
                name={userRating >= star ? "star" : "star-outline"}
                size={36}
                color="#FFC107"
                style={styles.ratingStar}
              />
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con botón de regreso */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text><Ionicons name="arrow-back" size={24} color="#fff" /></Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil de Veterinario</Text>
        <View style={{ width: 24 }} /> {/* Espacio para equilibrar el header */}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Tarjeta principal del veterinario */}
        <View style={styles.mainCard}>
          <View style={styles.vetImageContainer}>
            {vet.image ? (
              <Image source={{ uri: vet.image }} style={styles.vetImage} />
            ) : (
              <View style={styles.vetImagePlaceholder}>
                <Text><Ionicons name="person" size={60} color="#fff" /></Text>
              </View>
            )}
            {vet.available && (
              <View style={styles.statusBadge}>
                <Text><Ionicons name="ellipse" size={12} color="#4CAF50" /></Text>
              </View>
            )}
          </View>

          <Text style={styles.vetName}>{vet.name}</Text>
          <Text style={styles.vetSpecialty}>{vet.specialty}</Text>

          <View style={styles.ratingSection}>
            <View style={styles.ratingContainer}>
              <RatingStars rating={vet.rating} />
              <Text style={styles.ratingText}>
                {vet.rating} ({vet.reviews} reseñas)
              </Text>
            </View>

            {/* Botón para valorar condicionado */}
            <TouchableOpacity 
              style={[styles.rateButton, !canRateVet && styles.rateButtonDisabled]}
              onPress={() => canRateVet ? setShowRatingModal(true) : 
                Alert.alert(
                  "No puedes valorar", 
                  "Solo puedes valorar a veterinarios con los que hayas tenido una cita o emergencia."
                )
              }
            >
              <Text>
                <Ionicons 
                  name="star" 
                  size={16} 
                  color={canRateVet ? "#fff" : "#aaa"} 
                />
              </Text>
              <Text style={[styles.rateButtonText, !canRateVet && styles.rateButtonTextDisabled]}>
                Valorar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sección de especialidades */}
          <View style={styles.specialtiesContainer}>
            {vet.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyBadge}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>

          {/* Botón para agendar cita */}
          <TouchableOpacity 
            style={styles.scheduleButton}
            onPress={scheduleAppointment}
          >
            <Text><Ionicons name="calendar" size={20} color="#fff" /></Text>
            <Text style={styles.scheduleButtonText}>Agendar Cita</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta de información detallada */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Información Profesional</Text>

          {/* Datos profesionales */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Text><Ionicons name="school-outline" size={20} color="#1E88E5" /></Text>
              <Text style={styles.infoLabelText}>Número de Matrícula:</Text>
            </View>
            <Text style={styles.infoValue}>MP-{Math.floor(10000 + Math.random() * 90000)}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Text><Ionicons name="time-outline" size={20} color="#1E88E5" /></Text>
              <Text style={styles.infoLabelText}>Experiencia:</Text>
            </View>
            <Text style={styles.infoValue}>{vet.experience}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Text><Ionicons name="people-outline" size={20} color="#1E88E5" /></Text>
              <Text style={styles.infoLabelText}>Pacientes atendidos:</Text>
            </View>
            <Text style={styles.infoValue}>{vet.patients}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Text><Ionicons name="medical-outline" size={20} color="#1E88E5" /></Text>
              <Text style={styles.infoLabelText}>Especialidad:</Text>
            </View>
            <Text style={styles.infoValue}>{vet.specialty}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Text><Ionicons name="checkmark-circle-outline" size={20} color="#1E88E5" /></Text>
              <Text style={styles.infoLabelText}>Disponibilidad:</Text>
            </View>
            <Text style={[styles.infoValue, vet.available ? styles.availableText : styles.unavailableText]}>
              {vet.available ? 'Disponible ahora' : 'No disponible'}
            </Text>
          </View>
        </View>

        {/* Tarjeta de estadísticas y valoraciones */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Estadísticas y Valoraciones</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vet.rating}</Text>
              <Text style={styles.statLabel}>Valoración</Text>
              <View style={styles.smallRatingContainer}>
                <RatingStars rating={vet.rating} />
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vet.reviews}</Text>
              <Text style={styles.statLabel}>Reseñas</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vet.patients}</Text>
              <Text style={styles.statLabel}>Pacientes</Text>
            </View>
          </View>
          
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Últimas Reseñas</Text>
            
            {/* Reseñas de ejemplo - en una implementación real se cargarían desde API */}
            <View style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUser}>
                  <Text><Ionicons name="person-circle" size={24} color="#1E88E5" /></Text>
                  <Text style={styles.reviewUserName}>Andrea D.</Text>
                </View>
                <View style={styles.reviewRating}>
                  <RatingStars rating={5} />
                </View>
              </View>
              <Text style={styles.reviewDate}>Hace 2 días</Text>
              <Text style={styles.reviewComment}>
                Excelente profesional, muy amable con mi mascota. La trató con mucho cuidado y explicó detalladamente el tratamiento.
              </Text>
            </View>

            <View style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUser}>
                  <Text><Ionicons name="person-circle" size={24} color="#1E88E5" /></Text>
                  <Text style={styles.reviewUserName}>David P.</Text>
                </View>
                <View style={styles.reviewRating}>
                  <RatingStars rating={5} />
                </View>
              </View>
              <Text style={styles.reviewDate}>Hace 1 semana</Text>
              <Text style={styles.reviewComment}>
                Muy buena atención a mi gato. El diagnóstico fue acertado y rápidamente mejoró con el tratamiento recomendado.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal para valorar al veterinario */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRatingModal}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Valorar Veterinario</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Text><Ionicons name="close" size={24} color="#666" /></Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>¿Cómo calificarías a {vet.name}?</Text>
            
            <RatingSelector />
            
            <Text style={styles.inputLabel}>Tu comentario (opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Comparte tu experiencia con este veterinario"
              multiline={true}
              numberOfLines={4}
              value={userComment}
              onChangeText={setUserComment}
            />
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={submitRating}
            >
              <Text style={styles.submitButtonText}>Enviar Valoración</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  vetImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  vetImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  vetImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#1E88E5',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  vetName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  vetSpecialty: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  rateButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  rateButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  rateButtonTextDisabled: {
    color: '#999',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
  },
  specialtyBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: '#1E88E5',
    fontSize: 12,
    fontWeight: '500',
  },
  scheduleButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%',
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
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
  cardTitle: {
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
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabelText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  availableText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  unavailableText: {
    color: '#F44336',
  },
  statsCard: {
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  smallRatingContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  reviewSection: {
    marginTop: 20,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  reviewItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 5,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
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
    maxHeight: '80%',
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
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  ratingStar: {
    marginHorizontal: 5,
  },
  inputLabel: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  commentInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VetDetailScreen;
