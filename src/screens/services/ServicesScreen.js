import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  SectionList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import { prestadorService } from '../../services/api';
import globalStyles, { COLORS, SIZES, SHADOWS } from '../../styles/globalStyles';
import { serviciosPorTipo, todosLosServicios } from '../../data/serviciosPredefinidos';

const ServicesScreen = ({ navigation }) => {
  // Estado global con Zustand
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);
  
  // Estados locales
  const [myServices, setMyServices] = useState([]); // Servicios seleccionados por el prestador
  const [availableServices, setAvailableServices] = useState([]); // Servicios disponibles por tipo
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('myServices'); // 'myServices' o 'catalog'
  const [showServiceDetailModal, setShowServiceDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [priceInput, setPriceInput] = useState('');
  
  // Cargar servicios al iniciar
  useEffect(() => {
    loadServices();
    loadAvailableServices();
  }, []);
  
  // Función para cargar los servicios que el prestador ya ha seleccionado
  const loadServices = async () => {
    try {
      setIsLoading(true);
      
      if (!provider?.id) {
        console.log('No hay ID de prestador disponible');
        return;
      }
      
      // En un escenario real, esto vendría de la API
      const result = await prestadorService.getById(provider.id);
      
      if (result.success && result.data) {
        // Inicialmente, como aún no hay servicios en la API, usamos datos de muestra
        // Este código se reemplazaría por: setMyServices(result.data.servicios || []);
        
        // Simulamos servicios ya seleccionados por el prestador (3 para prueba)
        const tipoProvider = provider.tipo || 'Veterinario';
        const serviciosDisponibles = serviciosPorTipo[tipoProvider] || [];
        
        const misServicios = serviciosDisponibles.slice(0, 3).map(servicio => ({
          ...servicio,
          precio: servicio.precio || 0, // Usamos el precio predefinido
          activo: true
        }));
        
        setMyServices(result.data.servicios || misServicios);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los servicios');
      }
    } catch (error) {
      console.log('Error al cargar servicios:', error);
      Alert.alert('Error', 'Ocurrió un problema al cargar los servicios');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar los servicios disponibles según el tipo de prestador
  const loadAvailableServices = () => {
    try {
      const tipoProvider = provider?.tipo || 'Veterinario';
      const serviciosDisponibles = serviciosPorTipo[tipoProvider] || [];
      setAvailableServices(serviciosDisponibles);
    } catch (error) {
      console.log('Error al cargar servicios disponibles:', error);
    }
  };
  
  // Función para ver detalles de un servicio
  const handleViewServiceDetail = (service) => {
    setSelectedService(service);
    setPriceInput(service.precio.toString());
    setShowServiceDetailModal(true);
  };
  
  // Función para agregar un servicio del catálogo a mis servicios
  const handleAddServiceFromCatalog = async () => {
    if (!selectedService) return;
    
    // Validación del precio
    const precio = Number(priceInput);
    if (isNaN(precio) || precio < 0) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      // Verificar si el servicio ya está en mi lista
      const exists = myServices.some(service => service.id === selectedService.id);
      
      if (exists) {
        Alert.alert('Información', 'Este servicio ya está en tu lista');
        setShowServiceDetailModal(false);
        setIsRefreshing(false);
        return;
      }
      
      const newService = {
        ...selectedService,
        precio: precio,
        activo: true
      };
      
      // En un escenario real, esto enviaría la solicitud a la API
      // const result = await prestadorService.addService(provider.id, newService);
      
      // Simulamos respuesta exitosa
      const result = { success: true, data: newService };
      
      if (result.success) {
        // Actualizar el estado local añadiendo el nuevo servicio
        setMyServices(prevServices => [
          ...prevServices,
          newService
        ]);
        
        setShowServiceDetailModal(false);
        Alert.alert('Éxito', 'Servicio agregado correctamente');
      } else {
        Alert.alert('Error', 'No se pudo agregar el servicio');
      }
    } catch (error) {
      console.log('Error al agregar servicio:', error);
      Alert.alert('Error', 'Ocurrió un problema al agregar el servicio');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Función para actualizar el precio de un servicio
  const handleUpdateServicePrice = async () => {
    if (!selectedService) return;
    
    // Validación del precio
    const precio = Number(priceInput);
    if (isNaN(precio) || precio < 0) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      const updatedService = {
        ...selectedService,
        precio: precio
      };
      
      // En un escenario real, esto enviaría la solicitud a la API
      // const result = await prestadorService.updateService(provider.id, selectedService.id, updatedService);
      
      // Simulamos respuesta exitosa
      const result = { success: true, data: updatedService };
      
      if (result.success) {
        // Actualizar el estado local con el servicio actualizado
        setMyServices(prevServices => 
          prevServices.map(s => 
            s.id === selectedService.id ? updatedService : s
          )
        );
        
        setShowServiceDetailModal(false);
        Alert.alert('Éxito', 'Precio actualizado correctamente');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el precio');
      }
    } catch (error) {
      console.log('Error al actualizar servicio:', error);
      Alert.alert('Error', 'Ocurrió un problema al actualizar el servicio');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Función para cambiar estado activo/inactivo de un servicio
  const handleToggleServiceStatus = async (service) => {
    try {
      setIsRefreshing(true);
      
      const updatedService = {
        ...service,
        activo: !service.activo
      };
      
      // En un escenario real, esto enviaría la solicitud a la API
      // const result = await prestadorService.updateService(provider.id, service.id, updatedService);
      
      // Simulamos respuesta exitosa
      const result = { success: true, data: updatedService };
      
      if (result.success) {
        // Actualizar el estado local con el servicio actualizado
        setMyServices(prevServices => 
          prevServices.map(s => 
            s.id === service.id ? updatedService : s
          )
        );
        
        const statusText = updatedService.activo ? 'activado' : 'desactivado';
        Alert.alert('Éxito', `Servicio ${statusText} correctamente`);
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado del servicio');
      }
    } catch (error) {
      console.log('Error al actualizar estado del servicio:', error);
      Alert.alert('Error', 'Ocurrió un problema al actualizar el servicio');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Función para eliminar un servicio
  const handleRemoveService = (service) => {
    Alert.alert(
      'Eliminar servicio',
      `¿Estás seguro de que deseas eliminar "${service.nombre}" de tu lista de servicios?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => confirmRemoveService(service)
        }
      ]
    );
  };
  
  // Función para confirmar eliminación de un servicio
  const confirmRemoveService = async (service) => {
    try {
      setIsRefreshing(true);
      
      // En un escenario real, esto enviaría la solicitud a la API
      // const result = await prestadorService.removeService(provider.id, service.id);
      
      // Simulamos respuesta exitosa
      const result = { success: true };
      
      if (result.success) {
        // Actualizar el estado local eliminando el servicio
        setMyServices(prevServices => 
          prevServices.filter(s => s.id !== service.id)
        );
        
        Alert.alert('Éxito', 'Servicio eliminado correctamente');
      } else {
        Alert.alert('Error', 'No se pudo eliminar el servicio');
      }
    } catch (error) {
      console.log('Error al eliminar servicio:', error);
      Alert.alert('Error', 'Ocurrió un problema al eliminar el servicio');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Filtrar mis servicios según la búsqueda
  const filteredMyServices = myServices.filter(service => 
    service.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.descripcion && service.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Filtrar servicios del catálogo según la búsqueda y categoría
  const filteredCatalogServices = availableServices.filter(service => {
    const matchesSearch = 
      service.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.descripcion && service.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = 
      selectedCategory === 'Todos' || 
      service.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Obtener categorías únicas para el tipo de prestador
  const getUniqueCategories = () => {
    const tipoProvider = provider?.tipo || 'Veterinario';
    const serviciosDisponibles = serviciosPorTipo[tipoProvider] || [];
    const categorias = ['Todos', ...new Set(serviciosDisponibles.map(s => s.categoria))];
    return categorias;
  };
  
  // Renderizar cada servicio de mi lista
  const renderMyServiceItem = ({ item }) => (
    <View style={[styles.serviceCard, { opacity: item.activo ? 1 : 0.6 }]}>
      <View style={styles.serviceCardContent}>
        <View style={styles.serviceInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 30, 
              height: 30, 
              borderRadius: 15,
              backgroundColor: item.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10
            }}>
              <Ionicons name={item.icono || 'medical-outline'} size={16} color={item.color || COLORS.primary} />
            </View>
            <Text style={styles.serviceName}>{item.nombre}</Text>
          </View>
          
          {item.descripcion ? (
            <Text style={styles.serviceDescription}>{item.descripcion}</Text>
          ) : null}
          
          <View style={styles.serviceDetailsRow}>
            <View style={styles.serviceDetail}>
              <Ionicons name="cash-outline" size={14} color={COLORS.dark} />
              <Text style={styles.serviceDetailText}>${item.precio}</Text>
            </View>
            
            <View style={styles.serviceDetail}>
              <Ionicons name="time-outline" size={14} color={COLORS.dark} />
              <Text style={styles.serviceDetailText}>{item.duracion} min</Text>
            </View>
            
            {item.categoria && (
              <View style={{
                backgroundColor: item.color + '15',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                marginLeft: 5
              }}>
                <Text style={{ fontSize: 12, color: item.color || COLORS.primary }}>
                  {item.categoria}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.serviceActions}>
          <TouchableOpacity 
            style={styles.serviceActionButton}
            onPress={() => handleViewServiceDetail(item)}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.serviceActionButton, { marginTop: 10 }]}
            onPress={() => handleToggleServiceStatus(item)}
          >
            <Ionicons 
              name={item.activo ? "eye-outline" : "eye-off-outline"} 
              size={18} 
              color={item.activo ? COLORS.success : COLORS.grey} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.serviceActionButton, { marginTop: 10 }]}
            onPress={() => handleRemoveService(item)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  
  // Renderizar cada servicio del catálogo
  const renderCatalogServiceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.catalogServiceCard}
      onPress={() => handleViewServiceDetail(item)}
    >
      <View style={{
        width: 40, 
        height: 40, 
        borderRadius: 20,
        backgroundColor: item.color + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
      }}>
        <Ionicons name={item.icono || 'medical-outline'} size={20} color={item.color || COLORS.primary} />
      </View>
      
      <Text style={styles.catalogServiceName} numberOfLines={2}>{item.nombre}</Text>
      
      <View style={styles.catalogServiceDetails}>
        <Text style={styles.catalogServicePrice}>
          {item.precio > 0 ? `$${item.precio}` : 'Personalizable'}
        </Text>
        
        <Text style={styles.catalogServiceDuration}>
          {item.duracion > 0 ? `${item.duracion} min` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  // Renderizar categorías para filtrar servicios
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.categoryButtonSelected
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text 
        style={[
          styles.categoryButtonText,
          selectedCategory === item && styles.categoryButtonTextSelected
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );
  
  // Renderizar contenido cuando no hay servicios
  const renderEmptyMyServicesList = () => (
    <View style={globalStyles.emptyStateContainer}>
      <Ionicons name="list" size={50} color="#ccc" />
      <Text style={globalStyles.emptyStateText}>
        No tienes servicios agregados
      </Text>
      <TouchableOpacity 
        style={[globalStyles.primaryButton, { width: 200, marginTop: 20 }]}
        onPress={() => setViewMode('catalog')}
      >
        <Text style={globalStyles.primaryButtonText}>Explorar catálogo</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Renderizar contenido cuando no hay resultados de búsqueda
  const renderEmptyCatalogSearch = () => (
    <View style={globalStyles.emptyStateContainer}>
      <Ionicons name="search" size={50} color="#ccc" />
      <Text style={globalStyles.emptyStateText}>
        No se encontraron servicios
      </Text>
    </View>
  );
  
  // Renderizar pantalla principal
  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={globalStyles.header}>
        <View style={globalStyles.headerContent}>
          <TouchableOpacity
            style={{ padding: 5 }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={globalStyles.headerTitle}>Mis Servicios</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
      
      {/* Selector de modo de vista */}
      <View style={styles.viewModeSelector}>
        <TouchableOpacity 
          style={[
            styles.viewModeButton,
            viewMode === 'myServices' && styles.viewModeButtonActive
          ]}
          onPress={() => setViewMode('myServices')}
        >
          <Ionicons 
            name="list-outline" 
            size={18} 
            color={viewMode === 'myServices' ? COLORS.primary : COLORS.grey} 
          />
          <Text 
            style={[
              styles.viewModeButtonText,
              viewMode === 'myServices' && styles.viewModeButtonTextActive
            ]}
          >
            Mis servicios
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.viewModeButton,
            viewMode === 'catalog' && styles.viewModeButtonActive
          ]}
          onPress={() => setViewMode('catalog')}
        >
          <Ionicons 
            name="grid-outline" 
            size={18} 
            color={viewMode === 'catalog' ? COLORS.primary : COLORS.grey} 
          />
          <Text 
            style={[
              styles.viewModeButtonText,
              viewMode === 'catalog' && styles.viewModeButtonTextActive
            ]}
          >
            Catálogo
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.grey} />
          <TextInput
            style={styles.searchInput}
            placeholder={viewMode === 'myServices' ? "Buscar en mis servicios..." : "Buscar en catálogo..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={{ padding: 5 }}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.grey} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {isLoading ? (
        <View style={globalStyles.centeredContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : viewMode === 'myServices' ? (
        // Vista de mis servicios
        <FlatList
          data={filteredMyServices}
          renderItem={renderMyServiceItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.servicesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyMyServicesList}
          refreshing={isRefreshing}
          onRefresh={loadServices}
        />
      ) : (
        // Vista de catálogo de servicios
        <View style={{ flex: 1 }}>
          {/* Lista horizontal de categorías */}
          <View style={styles.categoriesContainer}>
            <FlatList
              horizontal
              data={getUniqueCategories()}
              renderItem={renderCategoryItem}
              keyExtractor={item => item}
              contentContainerStyle={styles.categoriesList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
          
          {/* Cuadrícula de servicios del catálogo */}
          <FlatList
            data={filteredCatalogServices}
            renderItem={renderCatalogServiceItem}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.catalogRow}
            contentContainerStyle={styles.catalogList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyCatalogSearch}
          />
        </View>
      )}
      
      {/* Modal para detalle del servicio */}
      <Modal
        visible={showServiceDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceDetailModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{flex: 1}}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {viewMode === 'myServices' ? 'Editar precio' : 'Agregar servicio'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowServiceDetailModal(false)}>
                    <Ionicons name="close" size={24} color={COLORS.dark} />
                  </TouchableOpacity>
                </View>
                
                {selectedService && (
                  <ScrollView style={styles.modalBody}>
                    {/* Icono y nombre del servicio */}
                    <View style={styles.serviceDetailHeader}>
                      <View style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: selectedService.color + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 15
                      }}>
                        <Ionicons name={selectedService.icono || 'medical-outline'} size={30} color={selectedService.color || COLORS.primary} />
                      </View>
                      
                      <Text style={styles.serviceDetailName}>{selectedService.nombre}</Text>
                      
                      {selectedService.categoria && (
                        <View style={{
                          backgroundColor: selectedService.color + '15',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 15,
                          alignSelf: 'center',
                          marginTop: 10
                        }}>
                          <Text style={{ color: selectedService.color || COLORS.primary }}>
                            {selectedService.categoria}
                          </Text>
                        </View>
                      )}
                      
                      <Text style={styles.serviceDetailDescription}>{selectedService.descripcion}</Text>
                      
                      {/* Duración */}
                      {selectedService.duracion > 0 && (
                        <View style={styles.serviceDetailInfoRow}>
                          <Ionicons name="time-outline" size={18} color={COLORS.dark} />
                          <Text style={styles.serviceDetailInfoText}>
                            Duración: {selectedService.duracion} minutos
                          </Text>
                        </View>
                      )}
                      
                      {/* Campo de precio */}
                      <Text style={[styles.inputLabel, {marginTop: 20}]}>
                        Precio (USD)*
                      </Text>
                      <View style={globalStyles.inputContainer}>
                        <Ionicons name="cash-outline" size={20} color={COLORS.grey} style={{marginRight: 10}} />
                        <TextInput
                          style={globalStyles.input}
                          placeholder="Ej: 35"
                          keyboardType="numeric"
                          value={priceInput}
                          onChangeText={setPriceInput}
                        />
                      </View>
                      
                      <Text style={styles.priceHint}>
                        Establece el precio que cobrarás por este servicio
                      </Text>
                    </View>
                  </ScrollView>
                )}
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={[globalStyles.secondaryButton, { flex: 1, marginRight: 10 }]}
                    onPress={() => setShowServiceDetailModal(false)}
                  >
                    <Text style={globalStyles.secondaryButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[globalStyles.primaryButton, { flex: 1 }]}
                    onPress={viewMode === 'myServices' ? handleUpdateServicePrice : handleAddServiceFromCatalog}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={globalStyles.primaryButtonText}>
                        {viewMode === 'myServices' ? 'Actualizar' : 'Agregar'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

// Estilos específicos para esta pantalla
const styles = {
  keyboardView: {
    flex: 1,
  },
  // Selector de modo de vista
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    margin: 15,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewModeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  viewModeButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: COLORS.grey,
  },
  viewModeButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Contenedor de búsqueda
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.dark,
  },
  // Lista de mis servicios
  servicesList: {
    padding: 15,
    paddingTop: 10,
  },
  serviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    ...SHADOWS.small,
  },
  serviceCardContent: {
    flexDirection: 'row',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 8,
  },
  serviceDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  serviceDetailText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 4,
  },
  serviceActions: {
    justifyContent: 'center',
    paddingLeft: 15,
  },
  serviceActionButton: {
    padding: 5,
  },
  // Categorías
  categoriesContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: 5,
  },
  categoriesList: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  categoryButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  categoryButtonText: {
    color: COLORS.grey,
    fontSize: 14,
  },
  categoryButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Catálogo de servicios
  catalogList: {
    padding: 15,
  },
  catalogRow: {
    justifyContent: 'space-between',
  },
  catalogServiceCard: {
    backgroundColor: COLORS.card,
    width: '48%',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  catalogServiceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 10,
    height: 40,
  },
  catalogServiceDetails: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catalogServicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  catalogServiceDuration: {
    fontSize: 12,
    color: COLORS.grey,
  },
  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30, // Espacio para no interferir con controles inferiores en iOS
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  // Detalles del servicio
  serviceDetailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
  },
  serviceDetailDescription: {
    fontSize: 14,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 20,
  },
  serviceDetailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  serviceDetailInfoText: {
    fontSize: 14,
    color: COLORS.dark,
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 8,
  },
  priceHint: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 5,
    fontStyle: 'italic',
  },
};

export default ServicesScreen;
