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
import useServiceStore from '../../store/useServiceStore';
import { prestadorService, servicioService } from '../../services/api';
import globalStyles, { COLORS, SIZES, SHADOWS } from '../../styles/globalStyles';

const ServicesScreen = ({ navigation }) => {
  // Estado global con Zustand
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);
  
  // Estado de servicios usando Zustand
  const {
    services: myServices,
    availableServices,
    isLoading,
    error,
    getProviderServices,
    getAvailableServices,
    addServiceToProvider,
    updateProviderService,
    removeProviderService
  } = useServiceStore();
  
  // Estados locales para la UI
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('myServices'); // 'myServices' o 'catalog'
  const [showServiceDetailModal, setShowServiceDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [priceInput, setPriceInput] = useState('');
  const [durationInput, setDurationInput] = useState('');
  
  // Mostrar alertas de error si ocurren
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);
  
  // Cargar servicios al iniciar y cada vez que el provider cambie
  useEffect(() => {
    if (provider) {
      loadServices();
      loadAvailableServices();
    }
  }, [provider]);
  
  // Función para cargar los servicios que el prestador ya ha seleccionado
  const loadServices = async () => {
    try {
      if (!provider) {
        console.log('No hay información del prestador disponible');
        return;
      }
      
      if (!provider.id && !provider._id) {
        console.log('No se encontró ID del prestador:', provider);
        return;
      }
      
      // Usar el ID correcto (puede venir como id o _id dependiendo de la fuente)
      const providerId = provider.id || provider._id;
      console.log('Cargando servicios para el prestador ID:', providerId);
      
      // Usar el store para cargar los servicios del prestador
      setIsRefreshing(true);
      await getProviderServices(providerId);
      setIsRefreshing(false);
    } catch (error) {
      console.log('Error al cargar servicios:', error);
      setIsRefreshing(false);
    }
  };
  
  // Función para cargar los servicios disponibles según el tipo de prestador
  const loadAvailableServices = async () => {
    try {
      if (!provider) {
        console.log('No hay información del prestador disponible para cargar catálogo');
        // Cargar un tipo predeterminado para mostrar algo en el catálogo
        await getAvailableServices('Veterinario');
        return;
      }
      
      const tipoProvider = provider.tipo || 'Veterinario';
      console.log('Cargando catálogo de servicios para tipo de prestador:', tipoProvider);
      
      // Usar el store para cargar los servicios disponibles para este tipo de prestador
      await getAvailableServices(tipoProvider);
    } catch (error) {
      console.log('Error al cargar servicios disponibles:', error);
    }
  };
  
  // Función para ver detalles de un servicio
  const handleViewServiceDetail = (service) => {
    // Asegurarnos de que estamos almacenando la información completa del servicio
    console.log('Servicio seleccionado:', service);
    setSelectedService(service);
    setPriceInput(service.precio ? service.precio.toString() : '0');
    setDurationInput(service.duracion ? service.duracion.toString() : '0');
    setShowServiceDetailModal(true);
  };
  
  // Función para agregar un servicio del catálogo a mis servicios
  const handleAddServiceFromCatalog = async () => {
    if (!selectedService) {
      console.log('Error: No hay servicio seleccionado');
      return;
    }
    
    if (!provider || (!provider.id && !provider._id)) {
      console.log('Error: No hay proveedor disponible o su ID no es válido:', provider);
      Alert.alert('Error', 'No se pudo identificar tu perfil de prestador. Intenta cerrar sesión y volver a entrar.');
      return;
    }
    
    // Validación del precio
    const precio = Number(priceInput);
    if (isNaN(precio) || precio < 0) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }
    
    // Validación de la duración
    const duracion = Number(durationInput);
    if (isNaN(duracion) || duracion < 0) {
      Alert.alert('Error', 'La duración debe ser un número válido');
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      // Obtener los IDs correctos
      const providerId = provider._id || provider.id;
      const serviceId = selectedService._id || selectedService.id;
      
      console.log('Datos para agregar servicio:', {
        providerId,
        serviceId,
        precio,
        duracion
      });
      
      // Verificar si el servicio ya está en mi lista (usar el ID correcto)
      const exists = Array.isArray(myServices) && myServices.some(service => {
        const myServiceId = service._id || service.id;
        return myServiceId === serviceId;
      });
      
      if (exists) {
        Alert.alert('Información', 'Este servicio ya está en tu lista');
        setShowServiceDetailModal(false);
        setIsRefreshing(false);
        return;
      }
      
      const serviceData = {
        servicioId: serviceId,
        precio: precio,
        duracion: duracion,
        activo: true
      };
      
      console.log('Enviando solicitud con:', { providerId, serviceData });
      
      // Usar el store para agregar el servicio a través de la API real
      const result = await addServiceToProvider(providerId, serviceData);
      
      if (result) {
        setShowServiceDetailModal(false);
        Alert.alert('Éxito', 'Servicio agregado correctamente');
      }
    } catch (error) {
      console.log('Error al agregar servicio:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Función para actualizar el precio y duración de un servicio
  const handleUpdateServicePrice = async () => {
    if (!selectedService) {
      console.log('Error: No hay servicio seleccionado');
      return;
    }
    
    if (!provider || (!provider.id && !provider._id)) {
      console.log('Error: No hay proveedor disponible o su ID no es válido:', provider);
      Alert.alert('Error', 'No se pudo identificar tu perfil de prestador. Intenta cerrar sesión y volver a entrar.');
      return;
    }
    
    // Validación del precio
    const precio = Number(priceInput);
    if (isNaN(precio) || precio < 0) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }
    
    // Validación de la duración
    const duracion = Number(durationInput);
    if (isNaN(duracion) || duracion < 0) {
      Alert.alert('Error', 'La duración debe ser un número válido');
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      // Obtener los IDs correctos
      const providerId = provider._id || provider.id;
      const serviceId = selectedService._id || selectedService.id;
      
      console.log('Datos para actualizar servicio:', {
        providerId,
        serviceId,
        precio,
        duracion
      });
      
      const serviceData = {
        precio: precio,
        duracion: duracion
      };
      
      // Usar el store para actualizar el servicio a través de la API real
      const result = await updateProviderService(providerId, serviceId, serviceData);
      
      if (result) {
        setShowServiceDetailModal(false);
        Alert.alert('Éxito', 'Servicio actualizado correctamente');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el servicio');
      }
    } catch (error) {
      console.log('Error al actualizar servicio:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el servicio');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Función para activar/desactivar un servicio
  const handleToggleServiceStatus = async (service) => {
    if (!service) {
      console.log('Error: No se proporcionó servicio');
      return;
    }
    
    if (!provider || (!provider.id && !provider._id)) {
      console.log('Error: No hay proveedor disponible o su ID no es válido:', provider);
      Alert.alert('Error', 'No se pudo identificar tu perfil de prestador. Intenta cerrar sesión y volver a entrar.');
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      // Obtener los IDs correctos
      const providerId = provider._id || provider.id;
      const serviceId = service._id || service.id;
      
      console.log('Datos para cambiar estado de servicio:', {
        providerId,
        serviceId,
        activo: !service.activo
      });
      
      // Servicio con el estado actualizado
      const serviceData = {
        activo: !service.activo
      };
      
      // Usar el store para actualizar el servicio a través de la API real
      const result = await updateProviderService(providerId, serviceId, serviceData);
      
      if (result) {
        // El store ya actualizó el estado
        const newStatus = !service.activo;
        Alert.alert('Estado actualizado', `Servicio ${newStatus ? 'activado' : 'desactivado'} correctamente`);
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado del servicio');
      }
    } catch (error) {
      console.log('Error al cambiar estado del servicio:', error);
      Alert.alert('Error', 'Ocurrió un error al cambiar el estado del servicio');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Función para eliminar un servicio
  const handleRemoveService = (service) => {
    if (!service) {
      console.log('Error: No se proporcionó servicio');
      return;
    }
    
    if (!provider || (!provider.id && !provider._id)) {
      console.log('Error: No hay proveedor disponible o su ID no es válido:', provider);
      Alert.alert('Error', 'No se pudo identificar tu perfil de prestador. Intenta cerrar sesión y volver a entrar.');
      return;
    }
    
    // Obtener los IDs correctos antes de mostrar el diálogo
    const providerId = provider._id || provider.id;
    const serviceId = service._id || service.id;
    
    Alert.alert(
      'Eliminar servicio',
      `¿Estás seguro que deseas eliminar el servicio "${service.nombre}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsRefreshing(true);
              
              console.log('Eliminando servicio:', {
                providerId,
                serviceId
              });
              
              // Usar el store para eliminar el servicio
              const result = await removeProviderService(providerId, serviceId);
              
              if (result) {
                Alert.alert('Eliminado', 'Servicio eliminado correctamente');
              } else {
                Alert.alert('Error', 'No se pudo eliminar el servicio');
              }
            } catch (error) {
              console.log('Error al eliminar servicio:', error);
              Alert.alert('Error', 'Ocurrió un error al eliminar el servicio');
            } finally {
              setIsRefreshing(false);
            }
          },
        },
      ],
    );
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
    // Usar los servicios disponibles del store en lugar de los datos mock
    const categorias = ['Todos', ...new Set(availableServices.map(s => s.categoria))];
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
  
  // Renderizar contenido cuando no hay servicios propios
  const renderEmptyMyServicesList = () => (
    <View style={globalStyles.emptyStateContainer}>
      <Ionicons name="list" size={50} color="#ccc" />
      <Text style={globalStyles.emptyStateText}>
        No tienes servicios agregados
      </Text>
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[globalStyles.primaryButton, { marginTop: 20, marginRight: 10 }]}
          onPress={() => setViewMode('catalog')}
        >
          <Text style={globalStyles.primaryButtonText}>Explorar catálogo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[globalStyles.secondaryButton, { marginTop: 20 }]}
          onPress={loadServices}
        >
          <Ionicons name="refresh-outline" size={20} color={COLORS.primary} style={{marginRight: 5}} />
          <Text style={globalStyles.secondaryButtonText}>Recargar</Text>
        </TouchableOpacity>
      </View>
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
          keyExtractor={item => item._id ? item._id.toString() : item.id.toString()}
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
            keyExtractor={item => item._id ? item._id.toString() : `catalog-${item.id}`}
            numColumns={2}
            columnWrapperStyle={styles.catalogRow}
            contentContainerStyle={styles.catalogList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyCatalogSearch}
            refreshing={isRefreshing}
            onRefresh={loadAvailableServices}
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
                        Precio (Pesos)*
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
                      
                      {/* Campo de duración */}
                      <Text style={[styles.inputLabel, {marginTop: 15}]}>
                        Duración (minutos)*
                      </Text>
                      <View style={globalStyles.inputContainer}>
                        <Ionicons name="time-outline" size={20} color={COLORS.grey} style={{marginRight: 10}} />
                        <TextInput
                          style={globalStyles.input}
                          placeholder="Ej: 60"
                          keyboardType="numeric"
                          value={durationInput}
                          onChangeText={setDurationInput}
                        />
                      </View>
                      
                      <Text style={styles.priceHint}>
                        Define la duración aproximada de este servicio
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
