import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  FlatList,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ServiceCard from '../../components/ServiceCard'; // Import the new component

const HomeScreen = ({ navigation }) => {
  // Datos de ejemplo para los servicios
  const services = [
    {
      id: '1',
      title: 'Consulta General',
      icon: 'medkit-outline', 
      color: '#1E88E5'
    },
    {
      id: '2',
      title: 'Vacunación',
      icon: 'shield-checkmark-outline', 
      color: '#4CAF50'
    },
    {
      id: '3',
      title: 'Desparasitación',
      icon: 'bug-outline', 
      color: '#FF9800'
    },
    {
      id: 'emergencias', 
      title: 'Emergencias', 
      icon: 'alert-circle-outline', 
      color: '#F44336' 
    },
    {
      id: 'citas',
      title: 'Mis Citas',
      icon: 'calendar-outline',
      color: '#9C27B0'
    },
    {
      id: 'mascotas',
      title: 'Mis Mascotas',
      icon: 'paw-outline',
      color: '#795548'
    }
  ];

  // Datos de ejemplo para los veterinarios destacados
  const featuredVets = [
    {
      id: '1',
      name: 'Dr. Carlos Rodríguez',
      specialty: 'Medicina general',
      rating: 4.9,
      experience: '10 años',
      patients: 120,
      reviews: 48,
      available: true,
      status: 'Destacado',
      specialties: ['Perros', 'Gatos', 'Aves'],
      image: null // Usamos placeholder en vez de URL para evitar errores
    },
    {
      id: '2',
      name: 'Dra. María Gómez',
      specialty: 'Cirugía veterinaria',
      rating: 4.8,
      experience: '8 años',
      patients: 95,
      reviews: 36,
      available: true,
      status: 'Destacado',
      specialties: ['Perros', 'Gatos', 'Animales exóticos'],
      image: null
    },
    {
      id: '3',
      name: 'Dr. Juan Pérez',
      specialty: 'Dermatología animal',
      rating: 4.7,
      experience: '6 años',
      patients: 78,
      reviews: 29,
      available: false,
      status: 'Destacado',
      specialties: ['Perros', 'Gatos'],
      image: null
    },
  ];

  // Datos de ejemplo para los veterinarios disponibles ahora
  const availableVets = [
    {
      id: '4',
      name: 'Dra. Lucía Hernández',
      specialty: 'Nutrición animal',
      rating: 4.6,
      experience: '5 años',
      patients: 64,
      reviews: 31,
      available: true,
      status: 'Disponible ahora',
      specialties: ['Perros', 'Gatos', 'Roedores'],
      image: null
    },
    {
      id: '5',
      name: 'Dr. Martín Díaz',
      specialty: 'Cardiología',
      rating: 4.9,
      experience: '12 años',
      patients: 150,
      reviews: 67,
      available: true,
      status: 'Disponible ahora',
      specialties: ['Perros', 'Gatos'],
      image: null
    },
    {
      id: '6',
      name: 'Dra. Sofía López',
      specialty: 'Oftalmología',
      rating: 4.7,
      experience: '7 años',
      patients: 85,
      reviews: 42,
      available: true,
      status: 'Disponible ahora',
      specialties: ['Perros', 'Gatos', 'Conejos'],
      image: null
    },
  ];

  const handleServicePress = (service) => {
    if (service.id === 'emergencias') { // Emergencias
      navigation.navigate('EmergencyForm');
    } else if (service.id === '1') { // Consulta General
      navigation.navigate('ConsultaGeneral');
    } else if (service.id === 'citas') {
      navigation.navigate('Citas');
    } else if (service.id === 'mascotas') {
      navigation.navigate('Mascotas');
    } else {
      // Para otros servicios podríamos mostrar un mensaje o navegar a otras pantallas
      console.log(`Servicio seleccionado: ${service.title}`);
    }
  };

  // Función para manejar la selección de un veterinario
  const handleVetPress = (vet) => {
    // Navegar a la pantalla de detalle del veterinario
    navigation.navigate('VetDetailScreen', { vet });
  };

  // Renderizar cada veterinario destacado
  const renderFeaturedVetItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.featuredVetCard}
      onPress={() => handleVetPress(item)}
    >
      <View style={styles.vetTopSection}>
        <View style={styles.vetImageContainer}>
          <View style={[styles.vetImagePlaceholder, { backgroundColor: item.available ? '#4CAF50' : '#FFA000' }]}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
          {item.available && (
            <View style={styles.statusBadge}>
              <Ionicons name="ellipse" size={10} color="#4CAF50" />
            </View>
          )}
        </View>
        <View style={styles.vetInfo}>
          <Text style={styles.vetName}>{item.name}</Text>
          <Text style={styles.vetSpecialty}>{item.specialty}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.ratingText}>{item.rating} ({item.reviews} reseñas)</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.vetDetailSection}>
        <View style={styles.vetDetailItem}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.vetDetailText}>{item.experience}</Text>
        </View>
        <View style={styles.vetDetailItem}>
          <Ionicons name="people-outline" size={14} color="#666" />
          <Text style={styles.vetDetailText}>{item.patients} pacientes</Text>
        </View>
      </View>
      
      <View style={styles.vetSpecialtiesContainer}>
        {item.specialties.map((specialty, index) => (
          <View key={index} style={styles.specialtyBadge}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  // Renderizar cada veterinario disponible
  const renderAvailableVetItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.availableVetCard}
      onPress={() => handleVetPress(item)}
    >
      <View style={styles.vetStatusContainer}>
        <View style={styles.vetStatusIndicator} />
        <Text style={styles.vetStatusText}>{item.status}</Text>
      </View>
      
      <View style={styles.vetAvailableContent}>
        <View style={styles.vetImageContainer}>
          <View style={[styles.vetImagePlaceholder, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
        </View>
        
        <View style={styles.vetInfo}>
          <Text style={styles.vetName}>{item.name}</Text>
          <Text style={styles.vetSpecialty}>{item.specialty}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner principal */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>¡Bienvenido a VetYa!</Text>
            <Text style={styles.bannerSubtitle}>
              Cuidado veterinario profesional en la comodidad de tu hogar
            </Text>
            <TouchableOpacity 
              style={styles.bannerButton}
              onPress={() => navigation.navigate('AgendarCita')}
            >
              <Text style={styles.bannerButtonText}>Agendar cita</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bannerImageContainer}>
            <Ionicons name="paw" size={100} color="#fff" style={{ opacity: 0.3 }} />
          </View>
        </View>

        {/* Servicios */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nuestros servicios</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={services}
            renderItem={({ item }) => (
              <ServiceCard item={item} onPress={handleServicePress} />
            )}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesList}
          />
        </View>

        {/* Próxima cita */}
        <View style={styles.appointmentContainer}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentTitle}>Tu próxima cita</Text>
            <Ionicons name="calendar" size={24} color="#1E88E5" />
          </View>
          <View style={styles.appointmentContent}>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentDate}>Miércoles, 15 de Mayo</Text>
              <Text style={styles.appointmentTime}>15:30 - 16:30</Text>
              <Text style={styles.appointmentType}>Consulta general</Text>
              <Text style={styles.appointmentVet}>Dr. Carlos Rodríguez</Text>
            </View>
            <TouchableOpacity style={styles.appointmentButton}>
              <Text style={styles.appointmentButtonText}>Ver detalles</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Veterinarios disponibles ahora */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Veterinarios disponibles</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableVets}
            renderItem={renderAvailableVetItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vetsList}
          />
        </View>
        
        {/* Veterinarios destacados */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Veterinarios destacados</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredVets}
            renderItem={renderFeaturedVetItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vetsList}
          />
        </View>

        {/* Consejos de salud */}
        <View style={[styles.sectionContainer, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consejos de salud</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HealthTips')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.tipCard}
            onPress={() => navigation.navigate('HealthTipDetail', {
              tip: {
                id: '1',
                title: 'Alimentación saludable para tu mascota',
                description: 'Aprende cómo mejorar la dieta de tu mascota para una vida larga y feliz con los mejores consejos nutricionales.',
                image: null,
                petType: 'dog',
                category: 'Nutrición',
                author: 'Dr. Carlos Rodríguez',
                date: '12 mayo, 2025',
                readTime: '5 min'
              }
            })}
          >
            <View style={styles.tipImageContainer}>
              <Ionicons name="nutrition" size={32} color="#1E88E5" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>
                Alimentación saludable para tu mascota
              </Text>
              <Text style={styles.tipDescription}>
                Aprende cómo mejorar la dieta de tu mascota para una vida larga y feliz.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tipCard, { marginTop: 15 }]}
            onPress={() => navigation.navigate('HealthTipDetail', {
              tip: {
                id: '2',
                title: 'Signos de alerta en la salud de tu mascota',
                description: 'Conoce los síntomas que indican que debes llevar a tu mascota al veterinario inmediatamente.',
                image: null,
                petType: 'cat',
                category: 'Cuidados Generales',
                author: 'Dra. María Gómez',
                date: '10 mayo, 2025',
                readTime: '4 min'
              }
            })}
          >
            <View style={styles.tipImageContainer}>
              <Ionicons name="alert-circle" size={32} color="#F44336" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>
                Signos de alerta en la salud de tu mascota
              </Text>
              <Text style={styles.tipDescription}>
                Conoce los síntomas que indican que debes llevar a tu mascota al veterinario.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  banner: {
    backgroundColor: '#1E88E5',
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 3,
  },
  bannerImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginBottom: 15,
  },
  bannerButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  sectionContainer: {
    padding: 20,
  },
  lastSection: {
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  servicesList: {
    paddingRight: 10,
  },
  appointmentContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  appointmentVet: {
    fontSize: 14,
    color: '#666',
  },
  appointmentButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  appointmentButtonText: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  vetsList: {
    paddingRight: 10,
    paddingBottom: 10,
  },
  // Estilos para veterinarios destacados
  featuredVetCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    marginBottom: 5,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  vetTopSection: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  vetImageContainer: {
    marginRight: 10,
    position: 'relative',
  },
  vetImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  vetSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  vetDetailSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 10,
  },
  vetDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vetDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  vetSpecialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  specialtyText: {
    fontSize: 11,
    color: '#1E88E5',
    fontWeight: '500',
  },
  // Estilos para veterinarios disponibles
  availableVetCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    marginBottom: 5,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  vetStatusContainer: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 5,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  vetStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  vetStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  vetAvailableContent: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipImageContainer: {
    marginRight: 15,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tipDescription: {
    fontSize: 12,
    color: '#888',
  },
});

export default HomeScreen;
