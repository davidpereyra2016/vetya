import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mapea una categoría a colores e ícono (para el diseño visual de las tarjetas)
const getCategoryStyles = (category) => {
  switch (category) {
    case 'Nutrición':
      return { color: '#FF9800', bgColor: '#FFF3E0', icon: 'restaurant', featuredBg: '#E65100' };
    case 'Higiene':
      return { color: '#26A69A', bgColor: '#E0F2F1', icon: 'water', featuredBg: '#00695C' };
    case 'Cuidados Generales':
      return { color: '#42A5F5', bgColor: '#E3F2FD', icon: 'heart', featuredBg: '#1565C0' };
    case 'Comportamiento':
      return { color: '#AB47BC', bgColor: '#F3E5F5', icon: 'happy', featuredBg: '#6A1B9A' };
    case 'Actividad Física':
      return { color: '#EF5350', bgColor: '#FFEBEE', icon: 'fitness', featuredBg: '#B71C1C' };
    case 'Prevención':
      return { color: '#4CAF50', bgColor: '#E8F5E9', icon: 'shield-checkmark', featuredBg: '#2E7D32' };
    default:
      return { color: '#1E88E5', bgColor: '#E3F2FD', icon: 'medical', featuredBg: '#1A237E' };
  }
};

const HealthTipsScreen = ({ navigation }) => {
  const [selectedPetType, setSelectedPetType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTips, setFilteredTips] = useState([]);
  
  // Tipos de mascotas para filtrar
  const petTypes = [
    { id: 'all', name: 'Todos', icon: 'paw' },
    { id: 'dog', name: 'Perros', icon: 'logo-reddit' },
    { id: 'cat', name: 'Gatos', icon: 'logo-octocat' },
    { id: 'bird', name: 'Aves', icon: 'airplane' },
    { id: 'rabbit', name: 'Conejos', icon: 'extension-puzzle' },
    { id: 'rodent', name: 'Roedores', icon: 'ellipse' },
    { id: 'fish', name: 'Peces', icon: 'fish' },
    { id: 'reptile', name: 'Reptiles', icon: 'leaf' },
  ];
  
  // Datos de ejemplo para consejos de salud
  const healthTips = [
    {
      id: '1',
      title: 'Alimentación adecuada para perros',
      description: 'La nutrición correcta es clave para la salud de tu perro. Aprende cómo elegir la comida adecuada según su edad, tamaño y nivel de actividad.',
      image: null,
      petType: 'dog',
      category: 'Nutrición',
      author: 'Dr. Carlos Rodríguez',
      date: '12 mayo, 2025',
      readTime: '5 min'
    },
    {
      id: '2',
      title: 'Consejos para el cuidado dental de gatos',
      description: 'El cuidado dental es importante para prevenir enfermedades en los gatos. Aprende técnicas para mantener sus dientes limpios y sanos.',
      image: null,
      petType: 'cat',
      category: 'Higiene',
      author: 'Dra. María Gómez',
      date: '10 mayo, 2025',
      readTime: '4 min'
    },
    {
      id: '3',
      title: 'Cómo mantener hidratado a tu perro en verano',
      description: 'El calor puede ser peligroso para los perros. Descubre técnicas para mantenerlos frescos e hidratados durante los meses más calurosos.',
      image: null,
      petType: 'dog',
      category: 'Cuidados Generales',
      author: 'Dr. Juan Pérez',
      date: '5 mayo, 2025',
      readTime: '3 min'
    },
    {
      id: '4',
      title: 'Alimentación saludable para loros y pericos',
      description: 'Una dieta balanceada es fundamental para la salud de tus aves. Aprende qué alimentos son beneficiosos y cuáles debes evitar.',
      image: null,
      petType: 'bird',
      category: 'Nutrición',
      author: 'Dra. Sofía López',
      date: '3 mayo, 2025',
      readTime: '6 min'
    },
    {
      id: '5',
      title: 'Cuidados básicos para peces tropicales',
      description: 'Mantener un acuario saludable requiere atención a diferentes factores. Consejos para el mantenimiento del agua y alimentación correcta.',
      image: null,
      petType: 'fish',
      category: 'Cuidados Generales',
      author: 'Dr. Martín Díaz',
      date: '1 mayo, 2025',
      readTime: '5 min'
    },
    {
      id: '6',
      title: 'Vitaminas esenciales para reptiles',
      description: 'Las vitaminas son cruciales para la salud de los reptiles. Aprende sobre los suplementos necesarios para diferentes especies.',
      image: null,
      petType: 'reptile',
      category: 'Nutrición',
      author: 'Dra. Lucía Hernández',
      date: '28 abril, 2025',
      readTime: '7 min'
    },
    {
      id: '7',
      title: 'Signos de estrés en conejos',
      description: 'Reconocer los signos de estrés en tu conejo puede ayudar a prevenir problemas de salud. Aprende a identificarlos y cómo ayudarles.',
      image: null,
      petType: 'rabbit',
      category: 'Comportamiento',
      author: 'Dr. Carlos Rodríguez',
      date: '25 abril, 2025',
      readTime: '4 min'
    },
    {
      id: '8',
      title: 'Ejercicio adecuado para perros según su raza',
      description: 'Diferentes razas tienen diferentes necesidades de ejercicio. Descubre cuál es el nivel adecuado para tu mascota.',
      image: null,
      petType: 'dog',
      category: 'Actividad Física',
      author: 'Dr. Juan Pérez',
      date: '22 abril, 2025',
      readTime: '5 min'
    },
    {
      id: '9',
      title: 'Cuidados del pelaje para gatos de pelo largo',
      description: 'Los gatos de pelo largo requieren cuidados especiales. Aprende técnicas de cepillado y mantenimiento para evitar problemas.',
      image: null,
      petType: 'cat',
      category: 'Higiene',
      author: 'Dra. María Gómez',
      date: '20 abril, 2025',
      readTime: '6 min'
    },
    {
      id: '10',
      title: 'Salud dental en roedores',
      description: 'Los problemas dentales son comunes en roedores. Consejos para mantener sus dientes en buen estado y prevenir complicaciones.',
      image: null,
      petType: 'rodent',
      category: 'Higiene',
      author: 'Dra. Sofía López',
      date: '18 abril, 2025',
      readTime: '4 min'
    },
  ];
  
  // Filtrar consejos por tipo de mascota y búsqueda
  useEffect(() => {
    let filtered = healthTips;
    
    // Filtrar por tipo de mascota
    if (selectedPetType !== 'all') {
      filtered = filtered.filter(tip => tip.petType === selectedPetType);
    }
    
    // Filtrar por búsqueda
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        tip => 
          tip.title.toLowerCase().includes(query) || 
          tip.description.toLowerCase().includes(query) ||
          tip.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredTips(filtered);
  }, [selectedPetType, searchQuery]);
  
  // ─── RENDER ──────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER integrado con buscador y bordes curvos */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consejos de Salud</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="bookmark-outline" size={24} color="#FFF" />
          </TouchableOpacity>
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
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* FILTROS POR MASCOTA (Pills horizontales) */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {petTypes.map((pet) => {
              const isActive = selectedPetType === pet.id;
              return (
                <TouchableOpacity
                  key={pet.id}
                  onPress={() => setSelectedPetType(pet.id)}
                  style={[styles.filterPill, isActive ? styles.activeFilterPill : styles.inactiveFilterPill]}
                >
                  <Ionicons
                    name={pet.icon}
                    size={16}
                    color={isActive ? '#FFF' : '#666'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.filterText, isActive ? styles.activeFilterText : styles.inactiveFilterText]}>
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {filteredTips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No hay consejos disponibles para esta categoría.</Text>
          </View>
        ) : (
          <>
            {/* TIP DESTACADO (primer tip de la lista filtrada) */}
            {(() => {
              const featured = filteredTips[0];
              const fStyles = getCategoryStyles(featured.category);
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tip Destacado</Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[styles.featuredCard, { backgroundColor: fStyles.featuredBg }]}
                    onPress={() => navigation.navigate('HealthTipDetail', { tip: featured })}
                  >
                    {/* Ícono gigante de fondo */}
                    <View style={styles.featuredIconBg}>
                      <Ionicons
                        name={fStyles.icon}
                        size={140}
                        color="rgba(255,255,255,0.15)"
                        style={{ transform: [{ rotate: '-15deg' }] }}
                      />
                    </View>

                    {/* Contenido superpuesto */}
                    <View style={styles.featuredContent}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{featured.category.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.featuredTitle}>{featured.title}</Text>
                      <View style={styles.featuredMetaRow}>
                        <Ionicons name="time-outline" size={14} color="#E0E0E0" />
                        <Text style={styles.featuredMetaText}>{featured.readTime} de lectura</Text>
                        <Text style={styles.featuredMetaDot}> • </Text>
                        <Ionicons name="person" size={14} color="#E0E0E0" />
                        <Text style={styles.featuredMetaText}>{featured.author}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* LISTA COMPACTA DE TIPS (resto de la lista filtrada) */}
            {filteredTips.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Más consejos</Text>

                {filteredTips.slice(1).map((tip) => {
                  const tStyles = getCategoryStyles(tip.category);
                  return (
                    <TouchableOpacity
                      key={tip.id}
                      activeOpacity={0.8}
                      style={styles.tipListCard}
                      onPress={() => navigation.navigate('HealthTipDetail', { tip })}
                    >
                      {/* Cuadro de color con ícono */}
                      <View style={[styles.tipListIconContainer, { backgroundColor: tStyles.bgColor }]}>
                        <Ionicons name={tStyles.icon} size={36} color={tStyles.color} />
                      </View>

                      <View style={styles.tipListInfo}>
                        <View style={[styles.tipCategoryBadge, { backgroundColor: `${tStyles.color}1A` }]}>
                          <Text style={[styles.tipCategoryText, { color: tStyles.color }]}>{tip.category}</Text>
                        </View>
                        <Text style={styles.tipListTitle} numberOfLines={2}>{tip.title}</Text>
                        <View style={styles.tipListFooter}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="book-outline" size={12} color="#888" />
                            <Text style={styles.tipListReadTime}>{tip.readTime} de lectura</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#CCC" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  filtersContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activeFilterPill: {
    backgroundColor: '#1E88E5',
    borderWidth: 0,
  },
  inactiveFilterPill: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#FFF',
  },
  inactiveFilterText: {
    color: '#666',
  },
  section: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  featuredCard: {
    width: '100%',
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  featuredIconBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContent: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  categoryBadge: {
    backgroundColor: '#2196F3',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 8,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaText: {
    color: '#E0E0E0',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  featuredMetaDot: {
    color: '#E0E0E0',
    fontSize: 12,
    marginHorizontal: 4,
  },
  tipListCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tipListIconContainer: {
    width: 85,
    height: 85,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tipListInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tipCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  tipCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tipListTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  tipListFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipListReadTime: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default HealthTipsScreen;
