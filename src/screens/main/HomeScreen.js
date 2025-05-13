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

  // Datos de ejemplo para los veterinarios
  const vets = [
    {
      id: '1',
      name: 'Dr. Carlos Rodríguez',
      specialty: 'Medicina general',
      rating: 4.9,
      image: 'https://example.com/vet1.jpg'
    },
    {
      id: '2',
      name: 'Dra. María Gómez',
      specialty: 'Cirugía',
      rating: 4.8,
      image: 'https://example.com/vet2.jpg'
    },
    {
      id: '3',
      name: 'Dr. Juan Pérez',
      specialty: 'Dermatología',
      rating: 4.7,
      image: 'https://example.com/vet3.jpg'
    },
  ];

  const handleServicePress = (service) => {
    if (service.id === 'emergencias') { // Emergencias
      navigation.navigate('EmergencyForm');
    } else if (service.id === '1') { // Consulta General
      navigation.navigate('ConsultaGeneral');
    } else if (service.id === 'citas') {
      navigation.navigate('Appointments');
    } else if (service.id === 'mascotas') {
      navigation.navigate('Pets');
    } else {
      // Para otros servicios podríamos mostrar un mensaje o navegar a otras pantallas
      console.log(`Servicio seleccionado: ${service.title}`);
    }
  };

  const renderVetItem = ({ item }) => (
    <TouchableOpacity style={styles.vetCard}>
      <View style={styles.vetImageContainer}>
        <View style={styles.vetImagePlaceholder}>
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

        {/* Veterinarios destacados */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Veterinarios destacados</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={vets}
            renderItem={renderVetItem}
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
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.tipCard}>
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
  },
  vetCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    flexDirection: 'row',
  },
  vetImageContainer: {
    marginRight: 10,
  },
  vetImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  vetSpecialty: {
    fontSize: 12,
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
