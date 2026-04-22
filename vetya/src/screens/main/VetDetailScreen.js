import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useValoracionesStore from '../../store/useValoracionesStore';
import useCitaStore from '../../store/useCitaStore';
import useCountPacientesStore from '../../store/useCountPacientesStore';
import usePrestadoresStore from '../../store/usePrestadoresStore';

import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper para asegurar que el valor es un string o un string vacío si es null/undefined
const ensureString = (value, fallback = '') => {
  if (value === null || typeof value === 'undefined') {
    return fallback;
  }
  return String(value);
};

// Helper para asegurar que el valor es un número o un valor por defecto si es null/undefined/NaN
const ensureNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};


const VetDetailScreen = ({ route, navigation }) => {
  const { vet } = route.params;

  // Guarda temprana: Si 'vet' no está o es null, no intentar renderizar.
  if (!vet) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Error: No se encontraron datos del prestador.</Text>
      </View>
    );
  }

  // Estado local
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');

  // IDs del prestador
  const prestadorId = vet._id || vet.id;
  const matriculaRef = useRef(`MP-${Math.floor(10000 + Math.random() * 90000)}`);
  
  // Estado desde Zustand stores
  const {
    valoracionesPrestador, 
    misValoraciones,
    estadisticasPrestador, 
    puedeValorar,
    isLoading, 
    error,
    fetchValoracionesByPrestador,
    fetchEstadisticasPrestador,
    checkPuedeValorar,
    fetchMisValoraciones,
    crearValoracion,
    clearErrors
  } = useValoracionesStore();
  
  const {
    pastAppointments,
    fetchUserAppointments,
    isLoading: isLoadingCitas
  } = useCitaStore();
  
  // Estado para el conteo de pacientes atendidos
  const {
    totalPacientes,
    desglosePacientes,
    isLoading: isLoadingPacientes,
    fetchTotalPacientes
  } = useCountPacientesStore();
  
  // Comprobar elegibilidad desde las citas completadas en el frontend
  const localEligibilityCheck = useMemo(() => {
    if (!prestadorId || !pastAppointments || pastAppointments.length === 0) return false;
    
    // Buscar si hay alguna cita completada con este prestador
    return pastAppointments.some(cita => {
      const citaPrestadorId = cita.prestador?._id || cita.prestador;
      return citaPrestadorId === prestadorId && cita.estado === 'Completada';
    });
  }, [prestadorId, pastAppointments]);
  
  // Combinar elegibilidad local y del backend
  const alreadyRatedThisPrestador = useMemo(() => {
    if (!prestadorId || !Array.isArray(misValoraciones) || misValoraciones.length === 0) {
      return false;
    }

    return misValoraciones.some((valoracion) => {
      const valoracionPrestadorId = valoracion.prestador?._id || valoracion.prestador;
      return valoracionPrestadorId === prestadorId;
    });
  }, [prestadorId, misValoraciones]);

  const canRate = (puedeValorar || localEligibilityCheck) && !alreadyRatedThisPrestador;
  
  // Cargar valoraciones, estadísticas, citas y total de pacientes al montar
  useEffect(() => {
    const loadData = async () => {
      if (prestadorId) {
        await Promise.all([
          fetchValoracionesByPrestador(prestadorId),
          fetchEstadisticasPrestador(prestadorId),
          checkPuedeValorar(prestadorId),
          fetchMisValoraciones(),
          fetchUserAppointments(),
          fetchTotalPacientes(prestadorId)
        ]);
      }
    };
    
    loadData();
    
    // Limpiar errores y estado al desmontar
    return () => clearErrors();
  }, [prestadorId]);

  const submitRating = async () => {
    if (!canRate) {
      const duplicateRatingMessage = alreadyRatedThisPrestador
        ? 'Ya has valorado a este prestador. Puedes editar o revisar tu valoración desde “Mis valoraciones”.'
        : 'Solo puedes valorar a prestadores con los que hayas tenido una cita o emergencia.';

      Alert.alert(
        "No puedes valorar",
        duplicateRatingMessage
      );
      return;
    }
    
    if (userRating === 0) {
      Alert.alert("Valoración requerida", "Por favor selecciona un número de estrellas.");
      return;
    }
    
    // Preparar los datos de valoración
    const valoracionData = {
      prestador: prestadorId,
      calificacion: userRating,
      comentario: userComment || '',
      tipoServicio: 'Cita' // Por defecto, podría cambiarse según la interacción real
    };
    
    console.log('DEBUG - Frontend - Enviando valoración:', {
      prestador: prestadorId,
      calificacion: userRating,
      comentario: userComment || '',
      tipoServicio: 'Cita'
    });
    
    // Crear una valoración temporal para actualizar optimistamente la UI
    const tempValoracion = {
      _id: 'temp_' + Date.now(),
      usuario: { username: 'Yo' }, // Podría obtenerse del userStore si está disponible
      calificacion: userRating,
      comentario: userComment || '',
      createdAt: new Date().toISOString(),
      prestador: prestadorId
    };
    
    // Actualizar optimistamente
    const updatedRatings = [tempValoracion, ...valoracionesPrestador];
    // Actualizar estadísticas temporalmente
    const tempStats = { ...estadisticasPrestador };
    tempStats.total += 1;
    tempStats.distribucion[userRating] = (tempStats.distribucion[userRating] || 0) + 1;
    // Recalcular promedio
    const totalStars = Object.entries(tempStats.distribucion).reduce(
      (sum, [rating, count]) => sum + (Number(rating) * count), 0
    );
    tempStats.promedio = totalStars / tempStats.total;
    
    // Actualizar UI inmediatamente
    useValoracionesStore.setState({
      valoracionesPrestador: updatedRatings,
      estadisticasPrestador: tempStats,
      puedeValorar: false // Ya no podrá valorar después de enviar
    });
    
    // Cerrar modal y limpiar
    setShowRatingModal(false);
    setUserRating(0);
    setUserComment('');
    
    // Enviar la valoración al servidor
    console.log('DEBUG - Frontend - Llamando a crearValoracion con:', valoracionData);
    const result = await crearValoracion(valoracionData);
    console.log('DEBUG - Frontend - Respuesta de crearValoracion:', result);
    
    if (!result.success) {
      console.log('DEBUG - Frontend - Error al crear valoración:', result.error);
      // Si falla, revertir los cambios optimistas
      await fetchValoracionesByPrestador(prestadorId);
      await fetchEstadisticasPrestador(prestadorId);
      await checkPuedeValorar(prestadorId);
      
      Alert.alert(
        "Error",
        result.error || "No se pudo enviar la valoración. Intenta de nuevo más tarde."
      );
    } else {
      console.log('DEBUG - Frontend - Valoración creada exitosamente');
      // Actualizar con datos reales del servidor
      await fetchValoracionesByPrestador(prestadorId);
      await fetchEstadisticasPrestador(prestadorId);
    }
  };

  const scheduleAppointment = () => {
    navigation.navigate('AgendarCita', {
      selectedVet: vet,
      fromVetDetail: true
    });
  };

  const RatingStars = ({ rating, size = 18 }) => {
    const numericRating = ensureNumber(rating, 0);
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    if (fullStars < 0 || emptyStars < 0) {
        // Esto podría indicar un problema con los datos de rating.
        // Puedes retornar null o un placeholder.
        return <View><Text style={{color: 'red', fontSize: size}}>(Error rating)</Text></View>;
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <Text key={`full-${i}`}>
            <Ionicons name="star" size={size} color="#FFC107" />
          </Text>
        ))}
        {Boolean(halfStar) && (
          <Text key="half">
            <Ionicons name="star-half" size={size} color="#FFC107" />
          </Text>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Text key={`empty-${i}`}>
            <Ionicons name="star-outline" size={size} color="#FFC107" />
          </Text>
        ))}
      </View>
    );
  };

  const RatingSelector = () => (
    <View style={styles.ratingSelector}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
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

  // Extraer y formatear los datos del prestador
  const vetId = vet._id || vet.id;
  const vetName = ensureString(vet.nombre, 'Sin nombre');
  const vetTipo = ensureString(vet.tipo, 'Prestador'); // Tipo del prestador (Veterinario, Peluquero, etc)
  const vetSpecialty = ensureString(vet.especialidad, 'General');
  const vetSpecialties = Array.isArray(vet.especialidades) ? vet.especialidades : [vetSpecialty]; 
  const vetBio = ensureString(vet.descripcion, 'Sin descripción disponible.');
  const vetAddress = ensureString(vet.ubicacion, 'Sin ubicación especificada');
  const vetPhone = ensureString(vet.telefono, 'No disponible');
  const vetEmail = ensureString(vet.email, 'No disponible');
  const vetImage = vet.imagen;
  const vetAvailable = Boolean(vet.disponible); // Convertir a booleano explícitamente
  const vetServices = Array.isArray(vet.servicios) ? vet.servicios : [];
  const vetEmergency = Boolean(vet.atencionEmergencias);
  // Obtener rating y reseñas desde estadisticasPrestador o del objeto vet o valores por defecto
  const vetRating = ensureNumber(estadisticasPrestador?.promedio || vet.rating, 0);
  const vetReviews = ensureNumber(estadisticasPrestador?.total || vet.totalValoraciones, 0);

  // Formatear las valoraciones para su visualización
  const formattedRatings = valoracionesPrestador?.map(val => ({
    id: val._id,
    userName: val.usuario?.username || 'Usuario Anónimo',
    userImage: val.usuario?.profilePicture,
    rating: val.calificacion,
    date: val.createdAt,
    formattedDate: val.createdAt ? formatDistanceToNow(new Date(val.createdAt), { locale: es, addSuffix: true }) : 'Hace poco',
    comment: val.comentario || ''
  })) || [];


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Perfil de {vetName}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.mainCard}>
          <View style={styles.vetImageContainer}>
            {vetImage ? (
              <Image source={{ uri: vetImage }} style={styles.vetImage} />
            ) : (
              <View style={styles.vetImagePlaceholder}>
                <Text><Ionicons name="person" size={60} color="#fff" /></Text>
              </View>
            )}
            {vetAvailable && (
              <View style={styles.statusBadge}>
                <Text><Ionicons name="ellipse" size={12} color="#4CAF50" /></Text>
              </View>
            )}
          </View>

          <Text style={styles.vetName}>{vetName}</Text>
          <Text style={styles.vetSpecialty}>{vetSpecialty}</Text>

          <View style={styles.ratingSection}>
            <View style={styles.ratingContainer}>
              <RatingStars rating={vetRating} />
              <Text style={styles.ratingText}>
                {vetRating.toFixed(1)} ({vetReviews} reseñas)
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.rateButton, !canRate && styles.rateButtonDisabled]}
              onPress={() => canRate ? setShowRatingModal(true) :
                Alert.alert(
                  "No puedes valorar",
                  alreadyRatedThisPrestador
                    ? 'Ya has valorado a este prestador.'
                    : 'Solo puedes valorar a prestadores con los que hayas tenido una cita o emergencia.'
                )
              }
            >
              <Text>
                <Ionicons name="star" size={16} color={canRate ? "#fff" : "#aaa"} />
              </Text>
              <Text style={[styles.rateButtonText, !canRate && styles.rateButtonTextDisabled]}>
                Valorar
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.specialtiesContainer}>
            {vetSpecialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyBadge}>
                <Text style={styles.specialtyText}>{ensureString(specialty)}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.scheduleButton} onPress={scheduleAppointment}>
            <Text><Ionicons name="calendar" size={20} color="#fff" /></Text>
            <Text style={styles.scheduleButtonText}>Agendar Cita</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Información Profesional</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Text><Ionicons name="medical-outline" size={20} color="#1E88E5" /></Text>
              <Text style={styles.infoLabelText}>Especialidad:</Text>
            </View>
            <Text style={styles.infoValue}>{vetSpecialty}</Text>
          </View>
          
          {/* <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Text><Ionicons name="checkmark-circle-outline" size={20} color="#1E88E5" /></Text>
              <Text style={styles.infoLabelText}>Disponibilidad:</Text>
            </View>
            <Text style={[styles.infoValue, vetAvailable ? styles.availableText : styles.unavailableText]}>
              {vetAvailable ? 'Disponible ahora' : 'No disponible'}
            </Text>
          </View> */}
          
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Text><Ionicons name="people-outline" size={20} color="#1E88E5" /></Text>
              <Text style={styles.infoLabelText}>Pacientes atendidos:</Text>
            </View>
            <Text style={styles.infoValue}>
              {isLoadingPacientes ? 'Cargando...' : `${totalPacientes} pacientes`}
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Estadísticas y Valoraciones</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vetRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Valoración</Text>
              <View style={styles.smallRatingContainer}>
                <RatingStars rating={vetRating} />
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ensureString(vetReviews, '0')}</Text>
              <Text style={styles.statLabel}>Reseñas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{isLoadingPacientes ? '-' : totalPacientes}</Text>
              <Text style={styles.statLabel}>Pacientes</Text>
            </View>
          </View>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Últimas Reseñas</Text>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E88E5" />
                <Text style={styles.loadingText}>Cargando valoraciones...</Text>
              </View>
            ) : formattedRatings.length > 0 ? (
              formattedRatings.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUser}>
                      {review.userImage ? (
                        <Image source={{ uri: review.userImage }} style={styles.reviewUserImage} />
                      ) : (
                        <Text><Ionicons name="person-circle" size={24} color="#1E88E5" /></Text>
                      )}
                      <Text style={styles.reviewUserName}>{review.userName}</Text>
                    </View>
                    <View style={styles.reviewRating}><RatingStars rating={review.rating} /></View>
                  </View>
                  <Text style={styles.reviewDate}>{review.formattedDate}</Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyReviewsContainer}>
                <Text style={styles.emptyReviewsText}>
                  No hay reseñas disponibles para este prestador.
                </Text>
                {canRate && (
                  <TouchableOpacity 
                    style={styles.beFirstButton}
                    onPress={() => setShowRatingModal(true)}
                  >
                    <Text style={styles.beFirstButtonText}>¡Sé el primero en valorar!</Text>
                  </TouchableOpacity>
                )}
                {!canRate && alreadyRatedThisPrestador && (
                  <Text style={styles.emptyReviewsText}>
                    Ya registraste tu valoración para este prestador.
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showRatingModal}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Valorar Veterinario</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Text><Ionicons name="close" size={24} color="#666" /></Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>¿Cómo calificarías a {vetName}?</Text>
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
            <TouchableOpacity style={styles.submitButton} onPress={submitRating}>
              <Text style={styles.submitButtonText}>Enviar Valoración</Text>
            </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// Asegúrate de que todos tus estilos estén aquí.
// He copiado los estilos de tu pregunta original.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
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
  headerBackButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
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
    backgroundColor: '#1E88E5', // Fallback color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
    overflow: 'hidden', // Para que la imagen no se salga del borde redondeado
  },
  vetImage: {
    width: '100%', // Ocupar todo el contenedor
    height: '100%', // Ocupar todo el contenedor
  },
  vetImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#B0BEC5', // Un color de placeholder diferente
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff', // Fondo blanco para el badge
    borderRadius: 10,       // Hacerlo circular
    width: 20,              // Tamaño del badge
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,         // Borde blanco alrededor del punto verde/rojo
    borderColor: '#fff',    // El borde es blanco para destacar sobre la imagen
  },
  vetName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  vetSpecialty: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
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
    marginLeft: 8, // Un poco más de espacio
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingVertical: 8, // Ajuste de padding
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  rateButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  rateButtonText: {
    color: '#fff',
    marginLeft: 5, // Espacio entre icono y texto
    fontSize: 12,  // Un poco más pequeño para botones compactos
    fontWeight: '500',
  },
  rateButtonTextDisabled: {
    color: '#9E9E9E', // Un gris más oscuro para mejor contraste
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 5, // Para que los badges no peguen a los bordes si hay muchos
  },
  specialtyBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16, // Un poco menos redondeado
    margin: 4,        // Espacio uniforme alrededor
  },
  specialtyText: {
    color: '#1976D2', // Un azul más oscuro para mejor lectura
    fontSize: 12,
    fontWeight: '500',
  },
  scheduleButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14, // Un poco más alto
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '90%', // No ocupar todo el ancho para que respire
    alignSelf: 'center', // Centrar el botón
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
    paddingVertical: 12, // Más espaciado vertical
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Un color de borde más sutil
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1, // Permitir que el label se encoja si el valor es largo
    marginRight: 10, // Espacio entre label y value
  },
  infoLabelText: {
    fontSize: 15,
    color: '#424242', // Un poco más oscuro
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 15,
    color: '#212121', // Más oscuro para el valor
    fontWeight: '500',
    textAlign: 'right',
    flexGrow: 1, // Permitir que el valor ocupe el espacio restante
  },
  availableText: {
    color: '#388E3C', // Verde más oscuro
    fontWeight: 'bold',
  },
  unavailableText: {
    color: '#D32F2F', // Rojo más oscuro
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
    alignItems: 'flex-start', // Alinear items al inicio para mejor distribución vertical
    marginVertical: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1, // Para que cada item ocupe espacio equitativo
    paddingHorizontal: 5, // Espacio para que no se peguen
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 3, // Espacio debajo del valor
  },
  statLabel: {
    fontSize: 13, // Ligeramente más pequeño
    color: '#757575', // Gris más oscuro
    marginTop: 5,
    textAlign: 'center', // Para etiquetas de múltiples palabras
  },
  statDivider: {
    width: 1,
    height: '70%', // Ajustar altura del divisor
    alignSelf: 'center',
    backgroundColor: '#e0e0e0',
  },
  smallRatingContainer: {
    flexDirection: 'row',
    marginTop: 4, // Ajuste de espacio
  },
  reviewSection: {
    marginTop: 20,
  },
  reviewSectionTitle: {
    fontSize: 17, // Ligeramente más grande
    fontWeight: '600', // Un poco más de peso
    color: '#333',
    marginBottom: 15,
  },
  reviewItem: {
    backgroundColor: '#FAFAFA', // Un fondo muy sutil
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE', // Borde sutil
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Más espacio
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewUserName: {
    fontSize: 15, // Un poco más grande
    fontWeight: '600',
    color: '#424242',
    marginLeft: 8,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 21, // Mejor interlineado
  },
  reviewUserImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyReviewsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 10,
  },
  emptyReviewsText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  beFirstButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  beFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Un poco más oscuro
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25, // Más padding
    maxHeight: '85%', // Un poco más de altura máxima
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: -2 // Sombra hacia arriba
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25, // Más espacio
  },
  modalTitle: {
    fontSize: 22, // Más grande
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20, // Más espacio
    textAlign: 'center',
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 25, // Más espacio
  },
  ratingStar: {
    marginHorizontal: 6, // Un poco más de separación
  },
  inputLabel: {
    fontSize: 16,
    color: '#444',
    marginBottom: 10, // Más espacio
    fontWeight: '500',
  },
  commentInput: {
    minHeight: 120, // Altura mínima
    borderWidth: 1,
    borderColor: '#CFD8DC', // Color de borde más definido
    borderRadius: 10, // Bordes más redondeados
    padding: 15,    // Más padding interno
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#F7F9FA', // Un fondo muy sutil
    marginBottom: 20, // Espacio antes del botón
  },
  submitButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 10, // Bordes más redondeados
    paddingVertical: 16, // Botón más alto
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17, // Texto un poco más grande
    fontWeight: 'bold',
  },
});

export default VetDetailScreen;