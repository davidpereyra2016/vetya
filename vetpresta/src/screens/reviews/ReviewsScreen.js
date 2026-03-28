import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Image,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../styles/globalStyles';
import useAuthStore from '../../store/useAuthStore';
import useValoracionStore from '../../store/useValoracionStore';

const ReviewsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [stats, setStats] = useState({
    valoracionPromedio: 4.7,
    totalReviews: 0,
    distribucion: [0, 1, 3, 10, 25] // [1★, 2★, 3★, 4★, 5★]
  });
  const [reviews, setReviews] = useState([]);
  const [filterRating, setFilterRating] = useState(0); // 0 = todos, 1-5 = filtro por estrellas

  // Obtener información del prestador desde el store
  const provider = useAuthStore(state => state.provider);
  
  // Store de valoraciones
  const { fetchValoraciones } = useValoracionStore();

  // Cargar valoraciones al iniciar
  useEffect(() => {
    loadReviews();
  }, []);

  // Función para cargar las valoraciones desde el backend
  const loadReviews = async () => {
    try {
      setLoading(true);
      
      if (!provider?._id) {
        console.log('⚠️ No hay provider ID disponible');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      console.log('📊 Cargando valoraciones del prestador desde ReviewsScreen...');
      const result = await fetchValoraciones(provider._id);
      
      if (result.success && result.data) {
        console.log(`✅ Valoraciones cargadas: ${result.data.length}`);
        
        // Mapear datos del backend al formato que espera la vista
        const reviewsData = result.data.map(valoracion => ({
          id: valoracion._id,
          usuarioId: valoracion.usuario?._id || 'unknown',
          usuarioNombre: valoracion.usuario?.username || 'Usuario',
          mascota: valoracion.mascota 
            ? `${valoracion.mascota.nombre} (${valoracion.mascota.tipo})`
            : 'Mascota',
          rating: valoracion.calificacion,
          fecha: formatDate(valoracion.createdAt),
          comentario: valoracion.comentario || 'Sin comentario',
          servicioTipo: valoracion.tipoServicio || 'Consulta',
          respuesta: '', // Las respuestas se manejarán en el futuro
          avatar: valoracion.usuario?.profilePicture || null,
        }));
        
        // Usar las estadísticas calculadas por el store
        if (result.estadisticas) {
          setStats({
            valoracionPromedio: result.estadisticas.promedio.toFixed(1),
            totalReviews: result.estadisticas.total,
            distribucion: [
              result.estadisticas.distribucion[1] || 0,
              result.estadisticas.distribucion[2] || 0,
              result.estadisticas.distribucion[3] || 0,
              result.estadisticas.distribucion[4] || 0,
              result.estadisticas.distribucion[5] || 0
            ]
          });
        }
        
        setReviews(reviewsData);
      } else {
        console.log('⚠️ No se pudieron cargar valoraciones o no hay valoraciones');
        setReviews([]);
        setStats({
          valoracionPromedio: '0.0',
          totalReviews: 0,
          distribucion: [0, 0, 0, 0, 0]
        });
      }
      
      setLoading(false);
      setRefreshing(false);
      
    } catch (error) {
      console.error('❌ Error al cargar valoraciones:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'No pudimos cargar las valoraciones. Intenta nuevamente.');
    }
  };
  
  // Función auxiliar para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Función para responder a una valoración
  const handleRespond = (reviewId) => {
    setSelectedReviewId(reviewId);
    setResponseText('');
    setResponseModalVisible(true);
  };

  const handleSubmitResponse = () => {
    const respuesta = responseText.trim();

    if (!respuesta) {
      Alert.alert('Error', 'Por favor, escribe una respuesta válida.');
      return;
    }

    const updatedReviews = reviews.map(review => {
      if (review.id === selectedReviewId) {
        return {
          ...review,
          respuesta,
        };
      }
      return review;
    });

    setReviews(updatedReviews);
    setResponseModalVisible(false);
    setSelectedReviewId(null);
    setResponseText('');
    Alert.alert('Respuesta enviada', 'Tu respuesta ha sido enviada con éxito.');
  };

  const handleCancelResponse = () => {
    setResponseModalVisible(false);
    setSelectedReviewId(null);
    setResponseText('');
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
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'Perfil' });
              }
            }}
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

      <Modal
        visible={responseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelResponse}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Responder valoración</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Escribe tu respuesta..."
              placeholderTextColor={COLORS.grey}
              multiline
              value={responseText}
              onChangeText={setResponseText}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancelResponse}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSendButton} onPress={handleSubmitResponse}>
                <Text style={styles.modalSendText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 12,
  },
  modalInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F1F1',
  },
  modalCancelText: {
    color: COLORS.dark,
    fontWeight: '600',
  },
  modalSendButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  modalSendText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default ReviewsScreen;
