import ScrollView from '../../components/common/AppScrollView';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useConsejosSaludStore from '../../store/useConsejosSaludStore';

const PET_TYPES = [
  { id: 'all', api: null, name: 'Todos', icon: 'paw' },
  { id: 'dog', api: 'Perro', name: 'Perros', icon: 'paw-outline' },
  { id: 'cat', api: 'Gato', name: 'Gatos', icon: 'logo-octocat' },
  { id: 'bird', api: 'Ave', name: 'Aves', icon: 'airplane' },
  { id: 'rabbit', api: 'Conejo', name: 'Conejos', icon: 'extension-puzzle' },
  { id: 'rodent', api: 'Roedor', name: 'Roedores', icon: 'ellipse' },
  { id: 'fish', api: 'Pez', name: 'Peces', icon: 'fish' },
  { id: 'reptile', api: 'Reptil', name: 'Reptiles', icon: 'leaf' },
];

const FALLBACK_CATEGORY = { color: '#1E88E5', bgColor: '#E3F2FD', icon: 'medical', featuredBg: '#1A237E' };

const getCategoryStyles = (category, categorias = []) => {
  const match = categorias.find((item) => item.name === category || item.nombre === category || item.slug === category);
  if (match) {
    return {
      color: match.color || FALLBACK_CATEGORY.color,
      bgColor: `${match.color || FALLBACK_CATEGORY.color}1A`,
      icon: match.icon || match.icono || FALLBACK_CATEGORY.icon,
      featuredBg: match.color || FALLBACK_CATEGORY.featuredBg,
    };
  }
  return FALLBACK_CATEGORY;
};

const HealthTipsScreen = ({ navigation }) => {
  const [selectedPetType, setSelectedPetType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const consejos = useConsejosSaludStore((state) => state.consejos);
  const categorias = useConsejosSaludStore((state) => state.categorias);
  const isLoading = useConsejosSaludStore((state) => state.isLoading);
  const isRefreshing = useConsejosSaludStore((state) => state.isRefreshing);
  const error = useConsejosSaludStore((state) => state.error);
  const fetchConsejos = useConsejosSaludStore((state) => state.fetchConsejos);
  const fetchCategorias = useConsejosSaludStore((state) => state.fetchCategorias);
  const searchConsejos = useConsejosSaludStore((state) => state.searchConsejos);
  const clearError = useConsejosSaludStore((state) => state.clearError);

  const queryParams = useMemo(() => {
    const selectedPet = PET_TYPES.find((pet) => pet.id === selectedPetType);
    const params = { activo: true, limit: 50 };
    if (selectedPet?.api) params.paraTipos = selectedPet.api;
    if (selectedCategory !== 'all') params.categoria = selectedCategory;
    return params;
  }, [selectedPetType, selectedCategory]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchConsejos(searchQuery, queryParams);
      } else {
        fetchConsejos(queryParams, true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchConsejos, queryParams, searchConsejos, searchQuery]);

  const refresh = () => {
    clearError();
    fetchCategorias(true);
    if (searchQuery.trim()) searchConsejos(searchQuery, queryParams);
    else fetchConsejos(queryParams, true);
  };

  const featured = consejos[0];
  const rest = consejos.slice(1);

  const renderTipCard = (tip) => {
    const stylesForCategory = getCategoryStyles(tip.category, categorias);
    return (
      <TouchableOpacity accessibilityRole="button"
        key={tip.id}
        activeOpacity={0.85}
        style={styles.tipListCard}
        onPress={() => navigation.navigate('HealthTipDetail', { tip })}
      >
        <View style={[styles.tipImageContainer, { backgroundColor: stylesForCategory.bgColor }]}>
          {tip.image ? (
            <Image source={{ uri: tip.image }} style={styles.tipImage} />
          ) : (
            <Ionicons name={stylesForCategory.icon} size={34} color={stylesForCategory.color} />
          )}
        </View>
        <View style={styles.tipListInfo}>
          <View style={[styles.tipCategoryBadge, { backgroundColor: `${stylesForCategory.color}1A` }]}>
            <Text style={[styles.tipCategoryText, { color: stylesForCategory.color }]}>{tip.category}</Text>
          </View>
          <Text style={styles.tipListTitle} numberOfLines={2}>{tip.title}</Text>
          <Text style={styles.tipDescription} numberOfLines={2}>{tip.description}</Text>
          <View style={styles.tipListFooter}>
            <Text style={styles.tipListReadTime}>{tip.readTime} de lectura</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver" hitSlop={8} onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consejos de Salud</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar consejos, enfermedades..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity accessibilityRole="button" hitSlop={8} onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#1E88E5" />}
      >
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {PET_TYPES.map((pet) => {
              const isActive = selectedPetType === pet.id;
              return (
                <TouchableOpacity accessibilityRole="button"
                  key={pet.id}
                  onPress={() => setSelectedPetType(pet.id)}
                  style={[styles.filterPill, isActive ? styles.activeFilterPill : styles.inactiveFilterPill]}
                >
                  <Ionicons name={pet.icon} size={16} color={isActive ? '#FFF' : '#666'} style={{ marginRight: 6 }} />
                  <Text style={[styles.filterText, isActive ? styles.activeFilterText : styles.inactiveFilterText]}>{pet.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {categorias.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
              <TouchableOpacity accessibilityRole="button"
                onPress={() => setSelectedCategory('all')}
                style={[styles.categoryFilter, selectedCategory === 'all' && styles.categoryFilterActive]}
              >
                <Text style={[styles.categoryFilterText, selectedCategory === 'all' && styles.categoryFilterTextActive]}>Todas</Text>
              </TouchableOpacity>
              {categorias.map((cat) => (
                <TouchableOpacity accessibilityRole="button"
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.slug || cat.name)}
                  style={[styles.categoryFilter, selectedCategory === (cat.slug || cat.name) && styles.categoryFilterActive]}
                >
                  <Ionicons name={cat.icon} size={14} color={selectedCategory === (cat.slug || cat.name) ? '#FFF' : cat.color} />
                  <Text style={[styles.categoryFilterText, selectedCategory === (cat.slug || cat.name) && styles.categoryFilterTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {isLoading && consejos.length === 0 ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.stateText}>Cargando consejos...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Ionicons name="alert-circle-outline" size={58} color="#F44336" />
            <Text style={styles.stateTitle}>No se pudieron cargar los consejos</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={refresh} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : consejos.length === 0 ? (
          <View style={styles.stateContainer}>
            <Ionicons name="document-text-outline" size={58} color="#B0BEC5" />
            <Text style={styles.stateTitle}>No hay consejos disponibles</Text>
            <Text style={styles.stateText}>Probá con otra búsqueda o filtro.</Text>
          </View>
        ) : (
          <>
            {featured && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tip destacado</Text>
                <TouchableOpacity accessibilityRole="button"
                  activeOpacity={0.9}
                  style={[styles.featuredCard, { backgroundColor: getCategoryStyles(featured.category, categorias).featuredBg }]}
                  onPress={() => navigation.navigate('HealthTipDetail', { tip: featured })}
                >
                  {featured.image ? <Image source={{ uri: featured.image }} style={styles.featuredImage} /> : null}
                  <View style={styles.featuredOverlay}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{featured.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.featuredTitle}>{featured.title}</Text>
                    <Text style={styles.featuredMetaText}>{featured.readTime} de lectura · {featured.author}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {rest.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mas consejos</Text>
                {rest.map(renderTipCard)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: 16,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  iconButton: {
    minWidth: 48,
    minHeight: 48, width: 32, padding: 4 },
  headerTitle: {
    flexShrink: 1, fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 48,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  clearButton: { padding: 4 },
  scrollContent: { paddingBottom: 40 },
  filtersContainer: { marginTop: 20, marginBottom: 10 },
  filtersScroll: { paddingHorizontal: 20, paddingBottom: 8 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 1,
  },
  activeFilterPill: { backgroundColor: '#1E88E5' },
  inactiveFilterPill: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEEEEE' },
  filterText: {
    flexShrink: 1, fontSize: 14, fontWeight: '700' },
  activeFilterText: {
    flexShrink: 1, color: '#FFF' },
  inactiveFilterText: {
    flexShrink: 1, color: '#666' },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8EDF5',
  },
  categoryFilterActive: { backgroundColor: '#1A237E', borderColor: '#1A237E' },
  categoryFilterText: {
    flexShrink: 1, color: '#455A64', fontSize: 12, fontWeight: '700' },
  categoryFilterTextActive: {
    flexShrink: 1, color: '#FFF' },
  section: { marginTop: 15, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  featuredCard: {
    minHeight: 205, width: '100%',  borderRadius: 20, overflow: 'hidden', justifyContent: 'flex-end', elevation: 5 },
  featuredImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexShrink: 0,
    top: 0, ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', },
  featuredOverlay: { padding: 16, backgroundColor: 'rgba(0,0,0,0.42)' },
  categoryBadge: { backgroundColor: '#2196F3', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  categoryBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  featuredTitle: { color: '#FFF', fontSize: 19, fontWeight: 'bold', lineHeight: 25, marginBottom: 8 },
  featuredMetaText: { color: '#E0E0E0', fontSize: 12, fontWeight: '600' },
  tipListCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tipImageContainer: { width: 88, height: 88, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' },
  tipImage: { width: '100%', height: '100%' },
  tipListInfo: { flex: 1 },
  tipCategoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  tipCategoryText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  tipListTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', lineHeight: 20, marginBottom: 4 },
  tipDescription: { fontSize: 12, color: '#78909C', lineHeight: 17, marginBottom: 8 },
  tipListFooter: {
    flexWrap: 'wrap',
    gap: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipListReadTime: {
    flexShrink: 1, fontSize: 12, color: '#888' },
  stateContainer: { alignItems: 'center', justifyContent: 'center', padding: 28, marginTop: 45 },
  stateTitle: { fontSize: 17, color: '#333', fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  stateText: { fontSize: 14, color: '#78909C', textAlign: 'center', marginTop: 8 },
  retryButton: { backgroundColor: '#1E88E5', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10, marginTop: 16 },
  retryButtonText: { color: '#FFF', fontWeight: 'bold' },
});

export default HealthTipsScreen;
