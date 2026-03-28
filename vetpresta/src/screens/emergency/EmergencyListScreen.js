import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import useEmergencyStore from '../../store/useEmergencyStore';

const EmergencyListScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('active');
  
  // Obtenemos las emergencias del store
  const { fetchEmergencies, isLoading, error } = useEmergencyStore();
  
  // Estado local para organizar las emergencias
  const [emergencies, setEmergencies] = useState({
    active: [],
    history: []
  });

  // Función para cargar las emergencias asignadas al veterinario
  const loadEmergencias = useCallback(async () => {
    const result = await fetchEmergencies();
    if (result && result.success) {
      processEmergencies(result.data);
    }
  }, [fetchEmergencies]);

  useFocusEffect(
    useCallback(() => {
      loadEmergencias();
    }, [loadEmergencias])
  );

  // Procesar las emergencias para separarlas en activas e historial
  const processEmergencies = (emergenciesData) => {
    const active = [];
    const history = [];
    
    // Separar las emergencias según su estado
    emergenciesData.forEach(emergency => {
      // Formatear la fecha y hora
      const fecha = new Date(emergency.fechaSolicitud);
      const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Formatear la hora
      const horaFormateada = fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Determinar nombre de la mascota (puede ser mascota registrada u "otro animal")
      let petName = 'No especificada';
      if (emergency.otroAnimal?.esOtroAnimal) {
        // Es "otro animal" no registrado
        petName = emergency.otroAnimal.nombre || 'Animal no registrado';
      } else if (emergency.mascota?.nombre) {
        // Es mascota registrada
        petName = emergency.mascota.nombre;
      }
      
      // Procesar la emergencia
      const processedEmergency = {
        id: emergency._id,
        date: fechaFormateada,
        time: horaFormateada,
        type: emergency.tipoEmergencia || 'Emergencia veterinaria',
        petName: petName,
        clientName: emergency.usuario?.username || emergency.usuario?.email || 'Cliente',
        status: emergency.estado,
        address: emergency.ubicacion?.direccion || 'Ubicación del cliente',
        description: emergency.descripcion || '',
        urgency: emergency.nivelUrgencia || 'Media',
        images: emergency.imagenes || [],
        createdAt: emergency.fechaSolicitud,
        lastUpdate: emergency.updatedAt,
        originalData: emergency // Guardamos los datos originales para referencia
      };
      
      // Clasificar según estado
      // Activas: en proceso o pendientes de atención
      if (['Asignada', 'Confirmada', 'En camino', 'En atención'].includes(emergency.estado)) {
        active.push(processedEmergency);
      } 
      // Historial: completadas o canceladas
      else if (['Atendida', 'Cancelada'].includes(emergency.estado)) {
        history.push(processedEmergency);
      }
    });
    
    // Ordenar por fecha (más reciente primero)
    active.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setEmergencies({ active, history });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Asignada':
        return '#2196F3'; // Azul
      case 'Confirmada':
        return '#4CAF50'; // Verde
      case 'En camino':
        return '#9C27B0'; // Morado
      case 'En atención':
        return '#FF5722'; // Naranja
      case 'Atendida':
        return '#43A047'; // Verde oscuro
      case 'Cancelada':
        return '#F44336'; // Rojo
      default:
        return '#1E88E5'; // Azul por defecto
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Alta':
        return '#F44336'; // Rojo
      case 'Media':
        return '#FF9800'; // Naranja
      case 'Baja':
        return '#4CAF50'; // Verde
      default:
        return '#1E88E5';
    }
  };

  const getStatusLabel = (status) => {
    return status;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.emergencyCard} 
      onPress={() => navigation.navigate('EmergencyDetails', { emergencyId: item.id })}
    >
      <View style={styles.emergencyHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={18} color="#1E88E5" />
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <View style={styles.badgesContainer}>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
            <Text style={styles.urgencyText}>{item.urgency}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.emergencyDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="medkit-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="paw-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.petName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.clientName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
        </View>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => navigation.navigate('EmergencyDetails', { emergencyId: item.id })}
        >
          <Ionicons name="arrow-forward" size={16} color="#1E88E5" />
          <Text style={styles.detailsButtonText}>Ver detalles</Text>
        </TouchableOpacity>
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
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'Inicio' });
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Emergencias</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Activas ({emergencies.active.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Historial ({emergencies.history.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.emptyText}>Cargando emergencias...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={80} color="#F44336" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Error al cargar emergencias</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => loadEmergencias()}
          >
            <Text style={styles.emptyButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : emergencies[activeTab === 'active' ? 'active' : 'history'].length > 0 ? (
        <FlatList
          data={emergencies[activeTab === 'active' ? 'active' : 'history']}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={loadEmergencias}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="medkit" size={80} color="#1E88E5" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            {activeTab === 'active' 
              ? 'No tienes emergencias activas' 
              : 'No tienes historial de emergencias'
            }
          </Text>
        </View>
      )}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#e0e0e0',
  },
  activeTab: {
    borderBottomColor: '#1E88E5',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1E88E5',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
    paddingTop: 10,
  },
  emergencyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  urgencyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emergencyDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  detailsButtonText: {
    color: '#1E88E5',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EmergencyListScreen;
