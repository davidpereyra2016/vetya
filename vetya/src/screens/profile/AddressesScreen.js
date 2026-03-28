import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import { userService } from '../../services/api';
import { syncCurrentUserLocation } from '../../services/locationService';
import WalkingPet from '../../components/WalkingPet';

const AddressesScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  // Cargar direcciones
  const loadAddresses = useCallback(async () => {
    try {
      const result = await userService.getAddresses();
      if (result.success) {
        setAddresses(result.data.direcciones || []);
        if (result.data.ubicacionActual) {
          setCurrentLocation(result.data.ubicacionActual);
        }
      }
    } catch (error) {
      console.error('Error al cargar direcciones:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAddresses();
  }, [loadAddresses]);

  // Actualizar ubicación actual
  const handleUpdateLocation = async () => {
    try {
      setUpdatingLocation(true);

      const result = await syncCurrentUserLocation();

      if (result.success) {
        setCurrentLocation({
          lat: result.data.latitude,
          lng: result.data.longitude,
          lastUpdated: result.data.lastUpdated
        });
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().updateUser({
            ...currentUser,
            ubicacionActual: {
              coordinates: {
                lat: result.data.latitude,
                lng: result.data.longitude
              },
              lastUpdated: result.data.lastUpdated
            }
          });
        }
        Alert.alert('Éxito', 'Tu ubicación ha sido actualizada');
      } else if (result.permissionDenied) {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu ubicación para guardarla.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar la ubicación');
      }
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    } finally {
      setUpdatingLocation(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Renderizar tarjeta de ubicación actual
  const renderCurrentLocation = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="navigate" size={20} color="#1E88E5" />
          <Text style={styles.sectionTitle}>Ubicación Actual</Text>
        </View>
        
        {currentLocation ? (
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Latitud:</Text>
                <Text style={styles.coordValue}>{currentLocation.lat?.toFixed(6)}</Text>
              </View>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Longitud:</Text>
                <Text style={styles.coordValue}>{currentLocation.lng?.toFixed(6)}</Text>
              </View>
              {currentLocation.lastUpdated && (
                <Text style={styles.lastUpdated}>
                  Actualizado: {formatDate(currentLocation.lastUpdated)}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={handleUpdateLocation}
              disabled={updatingLocation}
            >
              {updatingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.updateButtonText}>Actualizar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noLocationCard}>
            <Ionicons name="location-outline" size={40} color="#ccc" />
            <Text style={styles.noLocationText}>No hay ubicación guardada</Text>
            <TouchableOpacity 
              style={styles.setLocationButton}
              onPress={handleUpdateLocation}
              disabled={updatingLocation}
            >
              {updatingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="locate" size={18} color="#fff" />
                  <Text style={styles.setLocationButtonText}>Guardar mi ubicación</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Renderizar tarjeta de dirección
  const renderAddressCard = (address, index) => {
    return (
      <View key={address._id || index} style={styles.addressCard}>
        <View style={styles.addressIconContainer}>
          <Ionicons name="location" size={24} color="#F44336" />
        </View>
        <View style={styles.addressContent}>
          <Text style={styles.addressText} numberOfLines={2}>
            {address.direccion || 'Dirección no especificada'}
          </Text>
          <Text style={styles.cityText}>
            {address.ciudad || 'Ciudad no especificada'}
          </Text>
          <View style={styles.addressMeta}>
            <View style={styles.typeBadge}>
              <Ionicons name="medkit" size={12} color="#F44336" />
              <Text style={styles.typeText}>Emergencia</Text>
            </View>
            {address.ultimoUso && (
              <Text style={styles.dateText}>
                {formatDate(address.ultimoUso)}
              </Text>
            )}
          </View>
          {address.coordenadas && (
            <View style={styles.coordsContainer}>
              <Text style={styles.coordsText}>
                📍 {address.coordenadas.lat?.toFixed(4)}, {address.coordenadas.lng?.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Cargando direcciones...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Mis Direcciones</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E88E5']}
            tintColor="#1E88E5"
          />
        }
      >
        {/* Ubicación actual */}
        {renderCurrentLocation()}

        {/* Historial de direcciones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color="#1E88E5" />
            <Text style={styles.sectionTitle}>Historial de Direcciones</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Direcciones utilizadas en emergencias anteriores
          </Text>

          {addresses.length > 0 ? (
            addresses.map((address, index) => renderAddressCard(address, index))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Sin direcciones guardadas</Text>
              <Text style={styles.emptyText}>
                Las direcciones de tus emergencias aparecerán aquí
              </Text>
            </View>
          )}
        </View>

        {/* Info adicional */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#1E88E5" />
          <Text style={styles.infoText}>
            Las direcciones se guardan automáticamente cuando solicitas una emergencia. 
            Tu ubicación actual ayuda a los veterinarios a llegar más rápido.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
      <WalkingPet />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
  },
  locationCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  coordLabel: {
    fontSize: 13,
    color: '#666',
    width: 70,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  updateButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  noLocationCard: {
    alignItems: 'center',
    padding: 20,
  },
  noLocationText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    marginBottom: 15,
  },
  setLocationButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  setLocationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cityText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  addressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 11,
    color: '#F44336',
    marginLeft: 4,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  coordsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  coordsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    marginLeft: 10,
    lineHeight: 18,
  },
});

export default AddressesScreen;
