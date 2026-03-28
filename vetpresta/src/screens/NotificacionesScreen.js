import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useNotificacionStore from '../store/useNotificacionStore';
import NotificacionItem from '../components/NotificacionItem';

/**
 * Pantalla que muestra y gestiona las notificaciones del prestador
 */
const NotificacionesScreen = ({ navigation }) => {
  const { 
    notificaciones, 
    isLoading, 
    error,
    loadNotificaciones, 
    markAsRead, 
    markAllAsRead,
    deleteNotification
  } = useNotificacionStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('todas'); // 'todas', 'noLeidas'
  
  // Cargar notificaciones cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      return () => {};
    }, [])
  );
  
  // Función para cargar datos
  const loadData = async () => {
    await loadNotificaciones();
  };
  
  // Manejar refresh al tirar hacia abajo
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // Marcar notificación como leída
  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
  };
  
  // Marcar todas las notificaciones como leídas
  const handleMarkAllAsRead = async () => {
    Alert.alert(
      "Marcar todas como leídas",
      "¿Estás seguro de que quieres marcar todas las notificaciones como leídas?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Aceptar", onPress: async () => await markAllAsRead() }
      ]
    );
  };
  
  // Eliminar notificación
  const handleDelete = (id) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que quieres eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", onPress: async () => await deleteNotification(id) }
      ]
    );
  };
  
  // Filtrar notificaciones según estado
  const filteredNotificaciones = filter === 'noLeidas' 
    ? notificaciones.filter(n => !n.leida)
    : notificaciones;
  
  // Renderizar cada notificación
  const renderItem = ({ item }) => (
    <NotificacionItem 
      item={item} 
      onRead={handleMarkAsRead}
      onDelete={handleDelete}
    />
  );
  
  // Renderizar mensaje cuando no hay notificaciones
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={70} color="#ccc" />
      <Text style={styles.emptyText}>No tienes notificaciones</Text>
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={loadData}
      >
        <Text style={styles.refreshButtonText}>Actualizar</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {/* Cabecera con filtros */}
      <View style={styles.header}>
        <View style={styles.filterButtons}>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'todas' && styles.activeFilter]}
            onPress={() => setFilter('todas')}
          >
            <Text style={[styles.filterText, filter === 'todas' && styles.activeFilterText]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'noLeidas' && styles.activeFilter]}
            onPress={() => setFilter('noLeidas')}
          >
            <Text style={[styles.filterText, filter === 'noLeidas' && styles.activeFilterText]}>
              No leídas
            </Text>
          </TouchableOpacity>
        </View>
        
        {notificaciones.length > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Lista de notificaciones */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5469d4" />
          <Text style={styles.loadingText}>Cargando notificaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotificaciones}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#5469d4']}
            />
          }
        />
      )}
      
      {/* Mensaje de error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f1f5f9',
  },
  activeFilter: {
    backgroundColor: '#5469d4',
  },
  filterText: {
    fontSize: 14,
    color: '#4a5568',
  },
  activeFilterText: {
    color: '#fff',
  },
  markAllButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  markAllText: {
    color: '#5469d4',
    fontWeight: '500',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#4a5568',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 15,
  },
  refreshButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#5469d4',
    borderRadius: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#fee2e2',
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 10,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default NotificacionesScreen;
