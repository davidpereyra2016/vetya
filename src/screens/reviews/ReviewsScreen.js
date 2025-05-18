import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../styles/globalStyles';
import useAuthStore from '../../store/useAuthStore';

const ReviewsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    valoracionPromedio: 4.7,
    totalReviews: 0,
    distribucion: [0, 1, 3, 10, 25] // [1★, 2★, 3★, 4★, 5★]
  });
  const [reviews, setReviews] = useState([]);
  const [filterRating, setFilterRating] = useState(0); // 0 = todos, 1-5 = filtro por estrellas

  // Obtener información del prestador desde el store
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);

  // Cargar valoraciones al iniciar
  useEffect(() => {
    loadReviews();
  }, []);

  // Función para cargar las valoraciones desde el backend
  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // En una implementación real, aquí llamaríamos a la API
      // Por ejemplo:
      // const response = await fetch(`https://api.example.com/prestadores/${provider?.id}/valoraciones`);
      // const data = await response.json();
      
      // Simular una llamada a la API
      setTimeout(() => {
        // Datos de ejemplo
        const reviewsData = [
          {
            id: 'rev1',
            usuarioId: 'user1',
            usuarioNombre: 'María González',
            mascota: 'Fido (Perro)',
            rating: 5,
            fecha: '12/05/2025',
            comentario: 'Excelente atención, muy profesional y amable. Mi perro se sintió muy cómodo durante la consulta.',
            servicioTipo: 'Consulta general',
            respuesta: '',
            avatar: null,
          },
          {
            id: 'rev2',
            usuarioId: 'user2',
            usuarioNombre: 'Carlos López',
            mascota: 'Michi (Gato)',
            rating: 4,
            fecha: '08/05/2025',
            comentario: 'Buena atención, llegó puntual y fue muy profesional. Mi gato está mucho mejor después del tratamiento.',
            servicioTipo: 'Vacunación',
            respuesta: 'Gracias por tu valoración, Carlos. Me alegro de que Michi esté mejor.',
            avatar: null,
          },
          {
            id: 'rev3',
            usuarioId: 'user3',
            usuarioNombre: 'Ana Martínez',
            mascota: 'Pelusa (Conejo)',
            rating: 5,
            fecha: '03/05/2025',
            comentario: 'Increíble servicio, muy atento y educado. La revisión fue completa y me dio muchos consejos útiles para cuidar mejor a mi conejo.',
            servicioTipo: 'Control',
            respuesta: '',
            avatar: null,
          },
          {
            id: 'rev4',
            usuarioId: 'user4',
            usuarioNombre: 'Javier Rodríguez',
            mascota: 'Rocky (Perro)',
            rating: 3,
            fecha: '28/04/2025',
            comentario: 'El servicio fue aceptable, pero llegó un poco tarde. El tratamiento fue efectivo y mi perro está mejor.',
            servicioTipo: 'Emergencia',
            respuesta: 'Lamento la demora, Javier. Me alegra que Rocky esté mejor y trabajaré en mejorar la puntualidad.',
            avatar: null,
          },
          {
            id: 'rev5',
            usuarioId: 'user5',
            usuarioNombre: 'Laura Sánchez',
            mascota: 'Tom (Gato)',
            rating: 5,
            fecha: '22/04/2025',
            comentario: 'Muy profesional, atendió a mi gato con mucha paciencia y cariño. Definitivamente lo recomendaré.',
            servicioTipo: 'Desparasitación',
            respuesta: '',
            avatar: null,
          },
          {
            id: 'rev6',
            usuarioId: 'user6',
            usuarioNombre: 'Pedro Díaz',
            mascota: 'Luna (Perro)',
            rating: 4,
            fecha: '15/04/2025',
            comentario: 'Buen servicio, explicó todo claramente y fue muy amable con mi mascota.',
            servicioTipo: 'Consulta general',
            respuesta: '',
            avatar: null,
          },
          {
            id: 'rev7',
            usuarioId: 'user7',
            usuarioNombre: 'Sofía Ramírez',
            mascota: 'Max (Perro)',
            rating: 2,
            fecha: '10/04/2025',
            comentario: 'La atención fue regular, esperaba mayor detalle en el diagnóstico.',
            servicioTipo: 'Control',
            respuesta: 'Gracias por tu feedback, Sofía. Lamento que no quedara satisfecha. Me gustaría saber más sobre cómo podría mejorar.',
            avatar: null,
          },
        ];

        // Calcular estadísticas
        const total = reviewsData.length;
        const average = reviewsData.reduce((sum, rev) => sum + rev.rating, 0) / total;
        const distribution = [0, 0, 0, 0, 0];
        
        reviewsData.forEach(review => {
          distribution[review.rating - 1]++;
        });

        setStats({
          valoracionPromedio: average.toFixed(1),
          totalReviews: total,
          distribucion: distribution
        });

        setReviews(reviewsData);
        setLoading(false);
        setRefreshing(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error al cargar valoraciones:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'No pudimos cargar las valoraciones. Intenta nuevamente.');
    }
  };

  // Función para responder a una valoración
  const handleRespond = (reviewId) => {
    // En una implementación real, aquí se abriría un modal para responder
    Alert.prompt(
      'Responder Valoración',
      'Escribe tu respuesta a esta valoración:',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Enviar',
          onPress: (respuesta) => {
            if (respuesta && respuesta.trim() !== '') {
              // Aquí se implementaría el envío de la respuesta al backend
              // Por ahora, actualizamos el estado local
              const updatedReviews = reviews.map(review => {
                if (review.id === reviewId) {
                  return {
                    ...review,
                    respuesta: respuesta.trim()
                  };
                }
                return review;
              });
              
              setReviews(updatedReviews);
              Alert.alert('Respuesta enviada', 'Tu respuesta ha sido enviada con éxito.');
            } else {
              Alert.alert('Error', 'Por favor, escribe una respuesta válida.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Función para filtrar valoraciones por calificación
  const filterReviewsByRating = (rating) => {
    setFilterRating(rating);
  };

  // Obtener valoraciones filtradas
  const getFilteredReviews = () => {
    if (filterRating === 0) return reviews;
    return reviews.filter(review => review.rating === filterRating);
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  // Renderizar estrellas para la valoración
  const renderStars = (rating, size = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? COLORS.warning : "#DDD"}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  // Renderizar cada valoración
  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={COLORS.white} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.usuarioNombre}</Text>
            <Text style={styles.petName}>{item.mascota}</Text>
          </View>
        </View>
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewDate}>{item.fecha}</Text>
          {renderStars(item.rating)}
        </View>
      </View>

      <View style={styles.reviewContent}>
        <Text style={styles.serviceType}>{item.servicioTipo}</Text>
        <Text style={styles.reviewText}>{item.comentario}</Text>
      </View>

      {item.respuesta ? (
        <View style={styles.replyContainer}>
          <View style={styles.replyHeader}>
            <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
            <Text style={styles.replyTitle}>Tu respuesta:</Text>
          </View>
          <Text style={styles.replyText}>{item.respuesta}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => handleRespond(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
          <Text style={styles.replyButtonText}>Responder</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Renderizar el filtro de valoraciones
  const renderRatingFilter = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Filtrar por:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterRating === 0 && styles.activeFilterButton
          ]}
          onPress={() => filterReviewsByRating(0)}
        >
          <Text style={[
            styles.filterButtonText,
            filterRating === 0 && styles.activeFilterButtonText
          ]}>Todos</Text>
        </TouchableOpacity>

        {[5, 4, 3, 2, 1].map(rating => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.filterButton,
              filterRating === rating && styles.activeFilterButton
            ]}
            onPress={() => filterReviewsByRating(rating)}
          >
            <Ionicons name="star" size={16} color={filterRating === rating ? COLORS.white : COLORS.warning} />
            <Text style={[
              styles.filterButtonText,
              filterRating === rating && styles.activeFilterButtonText
            ]}>{rating}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Valoraciones</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Resumen de valoraciones */}
      <View style={styles.statsCard}>
        <View style={styles.ratingOverview}>
          <View style={styles.ratingValueContainer}>
            <Text style={styles.ratingValue}>{stats.valoracionPromedio}</Text>
            <View style={styles.totalStars}>
              {renderStars(Math.round(stats.valoracionPromedio), 16)}
              <Text style={styles.totalReviews}>({stats.totalReviews} valoraciones)</Text>
            </View>
          </View>

          <View style={styles.distributionContainer}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <View key={rating} style={styles.distributionRow}>
                <View style={styles.distributionLabel}>
                  <Text style={styles.distributionText}>{rating}</Text>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                </View>
                <View style={styles.distributionBarContainer}>
                  <View 
                    style={[
                      styles.distributionBar, 
                      { 
                        width: `${stats.totalReviews > 0 
                          ? (stats.distribucion[rating - 1] / stats.totalReviews) * 100 
                          : 0}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.distributionCount}>
                  {stats.distribucion[rating - 1]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Filtro de valoraciones */}
      {renderRatingFilter()}

      {/* Lista de valoraciones */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando valoraciones...</Text>
        </View>
      ) : getFilteredReviews().length > 0 ? (
        <FlatList
          data={getFilteredReviews()}
          renderItem={renderReviewItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="star-outline" size={70} color="#DDD" />
          <Text style={styles.emptyStateText}>
            {filterRating === 0 
              ? "Aún no tienes valoraciones" 
              : `No tienes valoraciones con ${filterRating} estrellas`}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    ...SHADOWS.medium,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerRight: {
    width: 40,
  },
  statsCard: {
    margin: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    ...SHADOWS.small,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  ratingValue: {
    fontSize: 35,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  totalStars: {
    alignItems: 'center',
  },
  totalReviews: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 5,
  },
  distributionContainer: {
    flex: 1,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 25,
    marginRight: 8,
  },
  distributionText: {
    fontSize: 12,
    color: COLORS.dark,
    marginRight: 2,
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
  },
  distributionBar: {
    height: 8,
    backgroundColor: COLORS.warning,
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 12,
    color: COLORS.grey,
    width: 25,
    textAlign: 'right',
    marginLeft: 8,
  },
  filterContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  filterScrollView: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    ...SHADOWS.small,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 4,
  },
  activeFilterButtonText: {
    color: COLORS.white,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...SHADOWS.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  petName: {
    fontSize: 14,
    color: COLORS.grey,
  },
  reviewInfo: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.grey,
    marginBottom: 4,
  },
  reviewContent: {
    marginBottom: 15,
  },
  serviceType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  replyContainer: {
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 6,
  },
  replyText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F7FF',
  },
  replyButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.grey,
    marginTop: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: 15,
  },
});

export default ReviewsScreen;
