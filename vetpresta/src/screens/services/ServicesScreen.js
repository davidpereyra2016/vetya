import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  SectionList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import useServiceStore from '../../store/useServiceStore';
import usePrestadorStore from '../../store/usePrestadorStore';
import { prestadorService } from '../../services/api';
import globalStyles, { COLORS, SIZES, SHADOWS } from '../../styles/globalStyles';

/**
 * Helper para validar nombres de íconos de Ionicons
 * Lista de íconos válidos comunes para servicios veterinarios
 */
const VALID_ICONS = [
  'medical', 'medkit', 'heart', 'paw', 'bandage', 'pulse', 'fitness',
  'clipboard', 'cut', 'water', 'flask', 'leaf', 'moon', 'color-palette',
  'brush', 'sparkles', 'gift', 'calendar', 'time', 'alert-circle',
  'shield-checkmark', 'checkmark-circle', 'close-circle', 'information-circle',
  // Versiones con -outline
  'medical-outline', 'medkit-outline', 'heart-outline', 'paw-outline',
  'bandage-outline', 'pulse-outline', 'fitness-outline', 'clipboard-outline',
  'cut-outline', 'water-outline', 'flask-outline', 'leaf-outline',
  'moon-outline', 'color-palette-outline', 'brush-outline', 'sparkles-outline',
  'gift-outline', 'calendar-outline', 'time-outline', 'alert-circle-outline',
  'shield-checkmark-outline', 'checkmark-circle-outline', 'close-circle-outline',
  'information-circle-outline'
];

/**
 * Obtiene un nombre de ícono válido o devuelve un fallback seguro
 * @param {string} iconName - Nombre del ícono a validar
 * @returns {string} - Nombre del ícono válido o fallback
 */
const getSafeIconName = (iconName) => {
  if (!iconName) return 'medical-outline';
  
  // Si el ícono está en la lista de válidos, usarlo
  if (VALID_ICONS.includes(iconName)) {
    return iconName;
  }
  
  // Si el ícono termina en -outline, verificar versión sin outline
  if (iconName.endsWith('-outline')) {
    const baseName = iconName.replace('-outline', '');
    if (VALID_ICONS.includes(baseName)) {
      return baseName;
    }
  } else {
    // Si no termina en -outline, intentar con -outline
    const outlineVersion = `${iconName}-outline`;
    if (VALID_ICONS.includes(outlineVersion)) {
      return outlineVersion;
    }
  }
  
  // Mapeo de íconos comunes no válidos a alternativas válidas
  const iconMapping = {
    'tooth': 'medical',
    'teeth': 'medical',
    'dental': 'medical',
    'stethoscope': 'medkit',
    'pill': 'medical',
    'syringe': 'bandage',
    'ambulance': 'medkit',
    'hospital': 'medkit'
  };
  
  const mappedIcon = iconMapping[iconName.toLowerCase()];
  if (mappedIcon) {
    console.log(`⚠️ Ícono "${iconName}" no válido, usando "${mappedIcon}" como alternativa`);
    return mappedIcon;
  }
  
  // Si nada funciona, usar ícono por defecto
  console.log(`⚠️ Ícono "${iconName}" no válido, usando "medical-outline" por defecto`);
  return 'medical-outline';
};

const ServicesScreen = ({ navigation }) => {
  // Estado global con Zustand
  const provider = useAuthStore(state => state.provider);
  
  // Estado de servicios usando Zustand
  const {
    services: myServices,
    activeServices,
    inactiveServices,
    availableServices,
    isLoading,
    error,
    getProviderServices,
    getActiveProviderServices,
    getInactiveProviderServices,
    getAvailableServices,
    addServiceToProvider,
    updateProviderService,
    removeProviderService,
    
  } = useServiceStore();
  
  // Estado del prestador (para configuración de emergencias)
  const {
    prestador: prestadorDetails,
    updateEmergencySettings,
  } = usePrestadorStore();
  
  // Estados locales para la UI
  // Estado para filtrado de servicios por estado (activo/inactivo/todos)
  const [serviceStatusFilter, setServiceStatusFilter] = useState('todos');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('myServices'); // 'myServices' o 'catalog'
  const [showServiceDetailModal, setShowServiceDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [priceInput, setPriceInput] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [emergencyPriceInput, setEmergencyPriceInput] = useState('');
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [modalidadAtencion, setModalidadAtencion] = useState(['Clínica']);
  
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
  
  // Cargar detalles del prestador para configuración de emergencias
  const loadPrestadorDetails = async () => {
    try {
      if (!provider) return;
      
      // Usar el ID del prestador directamente en lugar del ID de usuario
      const prestadorId = provider._id || provider.id;
      
      if (!prestadorId) {
        console.log('Error: No se encontró ID de prestador válido');
        return;
      }
      
      console.log('Cargando detalles del prestador usando ID:', prestadorId);
      
      // Cargar detalles del prestador directamente
      const result = await usePrestadorStore.getState().loadPrestadorById(prestadorId);
      
      if (result) {
        // Inicializar los estados de emergencia
        setEmergencyPriceInput(result.precioEmergencia ? result.precioEmergencia.toString() : '0');
        setEmergencyAvailable(result.disponibleEmergencias || false);
        console.log('Datos de emergencia cargados - Precio:', result.precioEmergencia, 'Disponible:', result.disponibleEmergencias);
      } else {
        console.log('No se pudieron cargar los detalles del prestador');
      }
    } catch (error) {
      console.log('Error al cargar detalles del prestador:', error);
    }
  };
  
  // Función para cargar todos los servicios que el prestador ya ha seleccionado (activos e inactivos)
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
      console.log('Cargando todos los servicios (activos e inactivos) para el prestador ID:', providerId);
      
      // Usar el store para cargar los servicios del prestador
      setIsRefreshing(true);
      await getProviderServices(providerId);
      console.log(`Total de servicios cargados: ${myServices.length} (Activos: ${activeServices.length}, Inactivos: ${inactiveServices.length})`);
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
    setModalidadAtencion(
      Array.isArray(service.modalidadAtencion) && service.modalidadAtencion.length > 0
        ? service.modalidadAtencion
        : ['Clínica']
    );
    setShowServiceDetailModal(true);
  };

  // Toggle una modalidad de atención
  const toggleModalidad = (modalidad) => {
    setModalidadAtencion(prev => {
      if (prev.includes(modalidad)) {
        // No permitir deseleccionar todas
        if (prev.length === 1) return prev;
        return prev.filter(m => m !== modalidad);
      }
      return [...prev, modalidad];
    });
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
        modalidadAtencion: modalidadAtencion,
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
        duracion: duracion,
        modalidadAtencion: modalidadAtencion
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
        await loadServices();
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
  
  // Función para actualizar configuración de emergencias
  const handleUpdateEmergencySettings = async () => {
    if (!prestadorDetails || !prestadorDetails._id) {
      Alert.alert('Error', 'No se pudo identificar tu perfil de prestador. Intenta cerrar sesión y volver a entrar.');
      return;
    }
    
    // Validar que el prestador sea Veterinario
    if (prestadorDetails.tipo !== 'Veterinario') {
      Alert.alert('Información', 'Solo los veterinarios pueden configurar el servicio de emergencias.');
      return;
    }
    
    // Validar precio
    const precioEmergencia = Number(emergencyPriceInput);
    if (isNaN(precioEmergencia) || precioEmergencia < 0) {
      Alert.alert('Error', 'El precio de emergencia debe ser un número válido');
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      console.log('Actualizando configuración de emergencias:', {
        precioEmergencia,
        disponibleEmergencias: emergencyAvailable
      });
      
      const result = await updateEmergencySettings(precioEmergencia, emergencyAvailable);
      
      if (result) {
        setShowEmergencyModal(false);
        Alert.alert('Éxito', 'Configuración de emergencias actualizada correctamente');
      } else {
        Alert.alert('Error', 'No se pudo actualizar la configuración de emergencias');
      }
    } catch (error) {
      console.log('Error al actualizar configuración de emergencias:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar la configuración de emergencias');
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
  

  
  // Filtrar mis servicios según la búsqueda y estado (activo/inactivo/todos)
  const filteredMyServices = myServices.filter(service => {
    // Filtrar por búsqueda de texto
    const matchesSearch = service.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.descripcion && service.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filtrar por estado (activo/inactivo/todos)
    const matchesStatus = 
      serviceStatusFilter === 'todos' || 
      (serviceStatusFilter === 'activos' && service.activo === true) ||
      (serviceStatusFilter === 'inactivos' && service.activo === false);
    
    return matchesSearch && matchesStatus;
  });
  
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
              <Ionicons name={getSafeIconName(item.icono)} size={16} color={item.color || COLORS.primary} />
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
          
          {/* Badges de modalidad de atención */}
          {Array.isArray(item.modalidadAtencion) && item.modalidadAtencion.length > 0 && (
            <View style={styles.modalidadBadgesRow}>
              {item.modalidadAtencion.includes('Clínica') && (
                <View style={[styles.modalidadBadge, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name="business-outline" size={14} color={COLORS.primary} />
                  <Text style={[styles.modalidadBadgeText, { color: COLORS.primary }]}>Clínica</Text>
                </View>
              )}
              {item.modalidadAtencion.includes('Domicilio') && (
                <View style={[styles.modalidadBadge, { backgroundColor: '#4CAF50' + '15' }]}>
                  <Ionicons name="home-outline" size={14} color="#4CAF50" />
                  <Text style={[styles.modalidadBadgeText, { color: '#4CAF50' }]}>Domicilio</Text>
                </View>
              )}
            </View>
          )}
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
        <Ionicons name={getSafeIconName(item.icono)} size={20} color={item.color || COLORS.primary} />
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
        No tienes servicios {serviceStatusFilter !== 'todos' ? 
          (serviceStatusFilter === 'activos' ? 'activos' : 'inactivos') 
          : ''} agregados
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
  
  // Renderizar botón de configuración de emergencias (solo para veterinarios)
  const renderEmergencySettingsButton = () => {
    // Solo mostrar para veterinarios
    if (prestadorDetails?.tipo !== 'Veterinario') return null;
    
    return (
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => setShowEmergencyModal(true)}
      >
        <Ionicons name="medkit" size={20} color="#F44336" style={{marginRight: 8}} />
        <Text style={styles.emergencyButtonText}>Configurar Servicio de Emergencia</Text>
      </TouchableOpacity>
    );
  };
  
  // Renderizar pantalla principal
  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={globalStyles.header}>
        <View style={globalStyles.headerContent}>
          <TouchableOpacity
            style={{ padding: 5 }}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'Servicios' });
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={globalStyles.headerTitle}>Mis Servicios</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
      
      {/* Botón de configuración de emergencias (solo para veterinarios) */}
      {renderEmergencySettingsButton()}
      
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
          extraData={myServices} // ← Añade esta prop
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
                        <Ionicons name={getSafeIconName(selectedService.icono)} size={30} color={selectedService.color || COLORS.primary} />
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

                      {/* Selector de modalidad de atención */}
                      <Text style={[styles.inputLabel, {marginTop: 20}]}>
                        Modalidad de atención*
                      </Text>
                      <Text style={[styles.priceHint, {marginTop: 0, marginBottom: 12}]}>
                        Indica dónde ofreces este servicio
                      </Text>
                      <View style={styles.modalidadContainer}>
                        <TouchableOpacity
                          style={[
                            styles.modalidadOption,
                            modalidadAtencion.includes('Clínica') && styles.modalidadOptionActive
                          ]}
                          onPress={() => toggleModalidad('Clínica')}
                        >
                          <Text style={[
                            styles.modalidadOptionTitle,
                            modalidadAtencion.includes('Clínica') && styles.modalidadOptionTextActive
                          ]}>Clínica</Text>
                          
                          <View style={styles.modalidadIconsRow}>
                            <Ionicons 
                              name={modalidadAtencion.includes('Clínica') ? 'checkmark-circle' : 'ellipse-outline'}
                              size={24} 
                              color={modalidadAtencion.includes('Clínica') ? COLORS.primary : COLORS.grey}
                              style={{marginRight: 8}}
                            />
                            <Ionicons 
                              name="business-outline" 
                              size={28} 
                              color={modalidadAtencion.includes('Clínica') ? COLORS.primary : COLORS.grey} 
                            />
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.modalidadOption,
                            modalidadAtencion.includes('Domicilio') && styles.modalidadOptionActiveDomicilio
                          ]}
                          onPress={() => toggleModalidad('Domicilio')}
                        >
                          <Text style={[
                            styles.modalidadOptionTitle,
                            modalidadAtencion.includes('Domicilio') && {color: '#4CAF50'}
                          ]}>Domicilio</Text>
                          
                          <View style={styles.modalidadIconsRow}>
                            <Ionicons 
                              name={modalidadAtencion.includes('Domicilio') ? 'checkmark-circle' : 'ellipse-outline'}
                              size={24} 
                              color={modalidadAtencion.includes('Domicilio') ? '#4CAF50' : COLORS.grey}
                              style={{marginRight: 8}}
                            />
                            <Ionicons 
                              name="home-outline" 
                              size={28} 
                              color={modalidadAtencion.includes('Domicilio') ? '#4CAF50' : COLORS.grey} 
                            />
                          </View>
                        </TouchableOpacity>
                      </View>
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
      
      {/* Modal para configuración de emergencias (solo veterinarios) */}
      <Modal
        visible={showEmergencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmergencyModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{flex: 1}}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Configurar Servicio de Emergencia</Text>
                  <TouchableOpacity onPress={() => setShowEmergencyModal(false)}>
                    <Ionicons name="close" size={24} color={COLORS.dark} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  {/* Icono y descripción */}
                  <View style={styles.serviceDetailHeader}>
                    <View style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: '#F44336' + '20',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 15
                    }}>
                      <Ionicons name="medkit" size={30} color="#F44336" />
                    </View>
                    
                    <Text style={styles.serviceDetailName}>Servicio de Emergencia</Text>
                    
                    <Text style={styles.serviceDetailDescription}>
                      Configura el precio de tus servicios de emergencia a domicilio.
                      Los clientes podrán ver este precio cuando busquen veterinarios disponibles para emergencias.
                    </Text>
                    
                    {/* Opción para habilitar/deshabilitar disponibilidad */}
                    <View style={styles.switchContainer}>
                      <Text style={styles.switchLabel}>Disponible para emergencias</Text>
                      <TouchableOpacity 
                        style={[styles.toggleButton, emergencyAvailable ? styles.toggleButtonActive : {}]}
                        onPress={() => setEmergencyAvailable(!emergencyAvailable)}
                      >
                        <View style={[styles.toggleDot, emergencyAvailable ? styles.toggleDotActive : {}]} />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Campo de precio de emergencia */}
                    <Text style={[styles.inputLabel, {marginTop: 20}]}>
                      Precio de Emergencia (Pesos)*
                    </Text>
                    <View style={globalStyles.inputContainer}>
                      <Ionicons name="cash-outline" size={20} color={COLORS.grey} style={{marginRight: 10}} />
                      <TextInput
                        style={globalStyles.input}
                        placeholder="Ej: 150000"
                        keyboardType="numeric"
                        value={emergencyPriceInput}
                        onChangeText={setEmergencyPriceInput}
                      />
                    </View>
                    
                    <Text style={styles.priceHint}>
                      Establece el precio que cobrarás por atender una emergencia a domicilio
                    </Text>
                  </View>
                </ScrollView>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={[globalStyles.secondaryButton, { flex: 1, marginRight: 10 }]}
                    onPress={() => setShowEmergencyModal(false)}
                  >
                    <Text style={globalStyles.secondaryButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[globalStyles.primaryButton, { flex: 1 }]}
                    onPress={handleUpdateEmergencySettings}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={globalStyles.primaryButtonText}>Guardar</Text>
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

// Estilos específicos para esta pantalla no analizar.
const styles = {
  keyboardView: {
    flex: 1,
  },
  // Botón para configuración de emergencias
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  emergencyButtonText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 14,
  },
  // Estilos para toggle switch
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary + '40',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    ...SHADOWS.small,
  },
  toggleDotActive: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
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
  
  // Modalidad de atención
  modalidadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalidadOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  modalidadOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  modalidadOptionActiveDomicilio: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50' + '10',
  },
  modalidadOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 10,
  },
  modalidadIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalidadOptionTextActive: {
    color: COLORS.primary,
  },
  
  modalidadBadgesRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  modalidadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  modalidadBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
};

export default ServicesScreen;