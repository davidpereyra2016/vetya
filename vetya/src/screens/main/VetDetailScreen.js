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
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
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


  // Imagen para el hero
  const displayImage = vetImage || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=250&q=80';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ============================================== */}
      {/* HERO SECTION (Header Azul Curvo)               */}
      {/* ============================================== */}
      <View style={styles.heroSection}>
        {/* Controles Superiores */}
        <View style={styles.headerTopBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassButton} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={styles.glassButton} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.glassButton} activeOpacity={0.8}>
              <Ionicons name="heart-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Principal del Veterinario/Clínica */}
        <View style={styles.heroInfoContainer}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: displayImage }} style={styles.profileImage} />
            {vetAvailable && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#FFF" />
              </View>
            )}
          </View>
          <Text style={styles.vetNameHero}>{vetName}</Text>
          <Text style={styles.vetSpecialtyHero}>{vetSpecialty}</Text>
        </View>

        {/* Fondos abstractos */}
        <View style={styles.abstractBlobTop} />
        <View style={styles.abstractBlobBottom} />
      </View>

      {/* ============================================== */}
      {/* OVERLAPPING SHEET (La hoja superpuesta blanca) */}
      {/* ============================================== */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheetContainer}>
          {/* Indicador de arrastre visual */}
          <View style={styles.dragIndicator} />

          {/* GRID DE ESTADÍSTICAS RÁPIDAS */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Ionicons name="star" size={14} color="#FFB300" style={{ marginRight: 4 }} />
                <Text style={styles.statValue}>{vetRating.toFixed(1)}</Text>
              </View>
              <Text style={styles.statLabel}>{vetReviews} Reseñas</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Ionicons name="people" size={14} color="#1E88E5" style={{ marginRight: 4 }} />
                <Text style={styles.statValue}>{isLoadingPacientes ? '-' : totalPacientes}</Text>
              </View>
              <Text style={styles.statLabel}>Pacientes</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Ionicons name="briefcase" size={14} color="#4CAF50" style={{ marginRight: 4 }} />
                <Text style={styles.statValue}>{ensureNumber(vet.experiencia, 0) || 'N/A'}</Text>
              </View>
              <Text style={styles.statLabel}>Años Exp.</Text>
            </View>
          </View>

          {/* UBICACIÓN / DIRECCIÓN */}
          <View style={styles.locationCard}>
            <View style={styles.locationIconBox}>
              <Ionicons name="location" size={20} color="#FFF" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>{ensureString(vet.clinica || vet.nombreClinica, vetTipo)}</Text>
              <Text style={styles.locationAddress}>{vetAddress}</Text>
            </View>
            <TouchableOpacity style={styles.navigateBtn} activeOpacity={0.8}>
              <Ionicons name="navigate" size={16} color="#1E88E5" />
            </TouchableOpacity>
          </View>

          {/* ESPECIALIDADES */}
          {vetSpecialties.length > 0 && (
            <View style={styles.specialtiesSection}>
              <Text style={styles.sectionTitle}>Especialidades</Text>
              <View style={styles.specialtiesContainer}>
                {vetSpecialties.map((specialty, index) => (
                  <View key={index} style={styles.specialtyBadge}>
                    <Text style={styles.specialtyText}>{ensureString(specialty)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* RESEÑAS */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reseñas ({vetReviews})</Text>
            {canRate && (
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() => setShowRatingModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="create" size={14} color="#FF9800" style={{ marginRight: 4 }} />
                <Text style={styles.rateButtonText}>Calificar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de Reseñas */}
          {isLoading ? (
            <ActivityIndicator size="small" color="#1E88E5" style={{ marginVertical: 20 }} />
          ) : formattedRatings.length > 0 ? (
            <View style={styles.reviewsList}>
              {formattedRatings.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {ensureString(review.userName, 'U')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.reviewUserName}>{review.userName}</Text>
                        <Text style={styles.reviewDate}>{review.formattedDate}</Text>
                      </View>
                    </View>
                    <View style={styles.starsRowSmall}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= ensureNumber(review.rating, 5) ? 'star' : 'star-outline'}
                          size={10}
                          color="#FFB300"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment || 'Sin comentarios adicionales.'}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noReviewsBox}>
              <Text style={styles.noReviewsText}>
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
                <Text style={styles.noReviewsText}>
                  Ya registraste tu valoración para este prestador.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ============================================== */}
      {/* BOTÓN FLOTANTE INFERIOR (Sticky Bottom Bar)    */}
      {/* ============================================== */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.9}
          onPress={scheduleAppointment}
        >
          <Ionicons name="calendar" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.fabText}>Agendar Cita</Text>
        </TouchableOpacity>
      </View>

      {/* ============================================== */}
      {/* MODAL DE RESEÑA                                */}
      {/* ============================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRatingModal}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escribir Reseña</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>¿Cómo calificarías tu experiencia con {vetName}?</Text>
            <RatingSelector />
            <Text style={styles.inputLabel}>Comparte tu experiencia (Opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="¿Qué tal fue la atención?"
              multiline={true}
              numberOfLines={4}
              value={userComment}
              onChangeText={setUserComment}
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.submitButton} onPress={submitRating}>
              <Text style={styles.submitButtonText}>Enviar Reseña</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // ─── HERO SECTION ───
  heroSection: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 70,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 20,
  },
  glassButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroInfoContainer: {
    alignItems: 'center',
    zIndex: 20,
  },
  imageWrapper: {
    position: 'relative',
    backgroundColor: '#FFF',
    padding: 4,
    borderRadius: 30,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 26,
    resizeMode: 'cover',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 4,
    borderWidth: 2,
    borderColor: '#1E88E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  vetNameHero: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  vetSpecialtyHero: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  abstractBlobTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    backgroundColor: '#FFF',
    opacity: 0.05,
    borderRadius: 100,
    transform: [{ scaleX: 1.5 }],
  },
  abstractBlobBottom: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 150,
    height: 150,
    backgroundColor: '#42A5F5',
    opacity: 0.1,
    borderRadius: 75,
    transform: [{ scaleX: 1.2 }],
  },

  // ─── SCROLL Y OVERLAP ───
  scrollArea: {
    flex: 1,
    marginTop: -40,
    zIndex: 30,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 25,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  dragIndicator: {
    width: 48,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 25,
  },

  // ─── GRID DE ESTADÍSTICAS ───
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
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
  },

  // ─── UBICACIÓN ───
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(227, 242, 253, 0.5)',
    borderWidth: 1,
    borderColor: '#BBDEFB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
  },
  locationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
    paddingRight: 10,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  navigateBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // ─── ESPECIALIDADES ───
  specialtiesSection: {
    marginBottom: 25,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },

  // ─── SECCIONES TEXTO ───
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 12,
  },

  // ─── RESEÑAS ───
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rateButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  reviewsList: {
    gap: 15,
  },
  reviewCard: {
    backgroundColor: '#F5F7FA',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#BBDEFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewAvatarText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  starsRowSmall: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  noReviewsBox: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
  },
  noReviewsText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
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

  // ─── BOTTOM BAR (Cita) ───
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
    elevation: 20,
    zIndex: 50,
  },
  fabButton: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ─── MODAL ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
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
    color: '#1565C0',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 25,
    gap: 10,
  },
  ratingStar: {
    padding: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  commentInput: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    padding: 15,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 25,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VetDetailScreen;