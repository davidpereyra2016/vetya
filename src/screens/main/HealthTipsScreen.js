import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

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
  
  // Renderizar cada tipo de mascota para el filtro
  const renderPetTypeItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.petTypeItem, 
        selectedPetType === item.id && styles.selectedPetTypeItem
      ]}
      onPress={() => setSelectedPetType(item.id)}
    >
      <Ionicons 
        name={item.icon} 
        size={20} 
        color={selectedPetType === item.id ? '#fff' : '#1E88E5'} 
      />
      <Text 
        style={[
          styles.petTypeText, 
          selectedPetType === item.id && styles.selectedPetTypeText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  // Renderizar cada consejo de salud
  const renderHealthTipItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.tipCard}
      onPress={() => navigation.navigate('HealthTipDetail', { tip: item })}
    >
      <View style={styles.tipCardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <View style={styles.metaInfo}>
          <Text style={styles.readTime}>{item.readTime} de lectura</Text>
        </View>
      </View>
      
      <View style={styles.tipImageContainer}>
        <View style={styles.tipImagePlaceholder}>
          {item.petType === 'dog' && <Ionicons name="logo-reddit" size={40} color="#fff" />}
          {item.petType === 'cat' && <Ionicons name="logo-octocat" size={40} color="#fff" />}
          {item.petType === 'bird' && <Ionicons name="airplane" size={40} color="#fff" />}
          {item.petType === 'fish' && <Ionicons name="fish" size={40} color="#fff" />}
          {item.petType === 'reptile' && <Ionicons name="leaf" size={40} color="#fff" />}
          {item.petType === 'rabbit' && <Ionicons name="extension-puzzle" size={40} color="#fff" />}
          {item.petType === 'rodent' && <Ionicons name="ellipse" size={40} color="#fff" />}
        </View>
      </View>
      
      <Text style={styles.tipTitle}>{item.title}</Text>
      <Text style={styles.tipDescription} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.tipFooter}>
        <Text style={styles.authorText}>{item.author}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consejos de Salud</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar consejos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Filtros de tipo de mascota */}
      <View style={styles.petTypesContainer}>
        <FlatList
          data={petTypes}
          renderItem={renderPetTypeItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.petTypesList}
        />
      </View>
      
      {/* Lista de consejos */}
      <FlatList
        data={filteredTips}
        renderItem={renderHealthTipItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.tipsList}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No hay consejos disponibles para esta categoría.</Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  searchContainer: {
    padding: 15,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  petTypesContainer: {
    paddingHorizontal: 15,
  },
  petTypesList: {
    paddingBottom: 15,
  },
  petTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedPetTypeItem: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  petTypeText: {
    fontSize: 14,
    color: '#1E88E5',
    marginLeft: 5,
    fontWeight: '500',
  },
  selectedPetTypeText: {
    color: '#fff',
  },
  tipsList: {
    padding: 15,
    paddingTop: 5,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 5,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    color: '#1E88E5',
    fontWeight: '500',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTime: {
    fontSize: 10,
    color: '#666',
  },
  tipImageContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  tipImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tipDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  tipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 10,
    color: '#1E88E5',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 10,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
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
