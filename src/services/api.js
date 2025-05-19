import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Servicio para manejar todas las llamadas a la API del backend
 * Cada función devuelve un objeto con { success, data, error }
 */

// Servicios de autenticación
export const authService = {
  // Iniciar sesión
  login: async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al iniciar sesión'
      };
    }
  },

  // Registrar usuario
  register: async (username, email, password, confirmPassword) => {
    try {
      const response = await axios.post('/auth/register', {
        username,
        email,
        password,
        confirmPassword
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al registrar usuario'
      };
    }
  }
};

// Servicios para prestadores
export const prestadorService = {
  // Obtener todos los prestadores
  getAll: async () => {
    try {
      const response = await axios.get('/prestadores');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener prestadores'
      };
    }
  },

  // Obtener un prestador por ID
  getById: async (id) => {
    try {
      const response = await axios.get(`/prestadores/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener prestador'
      };
    }
  },

  // Obtener un prestador por ID de usuario
  getByUserId: async (userId) => {
    try {
      const response = await axios.get(`/prestadores/usuario/${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener prestador por usuario'
      };
    }
  },

  // Crear un nuevo prestador
  create: async (prestadorData) => {
    try {
      const response = await axios.post('/prestadores', prestadorData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear prestador'
      };
    }
  },

  // Actualizar un prestador
  update: async (id, prestadorData) => {
    try {
      const response = await axios.put(`/prestadores/${id}`, prestadorData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar prestador'
      };
    }
  },

  // Agregar servicio a un prestador
  addService: async (id, serviceData) => {
    try {
      console.log(`Añadiendo servicio para prestador ID:`, id, serviceData);
      const response = await axios.post(`/prestadores/${id}/servicios`, serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al agregar servicio:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al agregar servicio'
      };
    }
  },
  
  

  // Actualizar disponibilidad para emergencias
  updateEmergencyAvailability: async (id, isAvailable) => {
    try {
      const response = await axios.patch(`/prestadores/${id}/emergencia`, {
        disponibleEmergencias: isAvailable
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar disponibilidad de emergencias'
      };
    }
  },

  // Obtener disponibilidad por servicio
  getAvailability: async (prestadorId) => {
    try {
      const response = await axios.get(`/disponibilidad/prestador/${prestadorId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener disponibilidad'
      };
    }
  },

  // Obtener disponibilidad para un servicio específico
  getServiceAvailability: async (prestadorId, servicioId) => {
    try {
      const response = await axios.get(`/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener disponibilidad del servicio'
      };
    }
  },

  // Actualizar disponibilidad de un servicio
  updateServiceAvailability: async (prestadorId, servicioId, disponibilidadData) => {
    try {
      const response = await axios.put(
        `/disponibilidad/prestador/${prestadorId}/servicio/${servicioId}`,
        disponibilidadData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar disponibilidad del servicio'
      };
    }
  },

  // Agregar fechas especiales (feriados, vacaciones, etc.)
  addSpecialDate: async (prestadorId, fechaEspecialData) => {
    try {
      const response = await axios.post(
        `/disponibilidad/prestador/${prestadorId}/fecha-especial`,
        fechaEspecialData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al agregar fecha especial'
      };
    }
  },

  // Verificar disponibilidad para una fecha y hora específica
  checkAvailability: async (prestadorId, servicioId, fecha, hora) => {
    try {
      const response = await axios.get(
        `/disponibilidad/check`, {
          params: {
            prestador: prestadorId,
            servicio: servicioId,
            fecha,
            hora
          }
        }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al verificar disponibilidad'
      };
    }
  },

  // Obtener horarios disponibles para una fecha específica
  getAvailableTimeSlots: async (prestadorId, servicioId, fecha) => {
    try {
      const response = await axios.get(
        `/disponibilidad/horarios-disponibles`, {
          params: {
            prestador: prestadorId,
            servicio: servicioId,
            fecha
          }
        }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener horarios disponibles'
      };
    }
  }
};

// Servicios para veterinarios
export const veterinarioService = {
  // Obtener todos los veterinarios
  getAll: async () => {
    try {
      const response = await axios.get('/veterinarios');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener veterinarios'
      };
    }
  },

  // Obtener un veterinario por ID
  getById: async (id) => {
    try {
      const response = await axios.get(`/veterinarios/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener veterinario'
      };
    }
  },

  // Buscar veterinarios por especialidad
  getByEspecialidad: async (especialidad) => {
    try {
      const response = await axios.get(`/veterinarios/especialidad/${especialidad}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al buscar veterinarios por especialidad'
      };
    }
  }
};
// Servicio para manejo de mascotas
export const mascotaService = {
  // Obtener todas las mascotas del usuario
  getAll: async () => {
    try {
      const response = await axios.get('/mascotas');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener mascotas'
      };
    }
  },

  // Obtener una mascota por ID
  getById: async (id) => {
    try {
      const response = await axios.get(`/mascotas/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener detalles de la mascota'
      };
    }
  },

  // Crear una nueva mascota
  create: async (mascotaData) => {
    try {
      const response = await axios.post('/mascotas', mascotaData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear mascota'
      };
    }
  },

  // Actualizar una mascota
  update: async (id, mascotaData) => {
    try {
      const response = await axios.put(`/mascotas/${id}`, mascotaData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar mascota'
      };
    }
  },

  // Eliminar una mascota
  delete: async (id) => {
    try {
      await axios.delete(`/mascotas/${id}`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar mascota'
      };
    }
  },

  // Agregar registro al historial médico
  addMedicalRecord: async (petId, recordData) => {
    try {
      const response = await axios.post(`/mascotas/${petId}/historial`, recordData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al agregar historial médico'
      };
    }
  },

  // Seleccionar imagen de galería para mascota
  pickPetImage: async () => {
    try {
      // Pedir permisos para acceder a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Se necesitan permisos para acceder a la galería'
        };
      }

      // Lanzar el selector de imágenes con menor calidad para reducir tamaño
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled) {
        return { success: false, error: 'Selección cancelada' };
      }

      // Convertir la URI a base64 para enviar al servidor
      const base64Image = await convertImageToBase64(result.assets[0].uri);
      
      return {
        success: true,
        data: {
          uri: result.assets[0].uri,
          base64: `data:image/jpeg;base64,${base64Image}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al seleccionar imagen'
      };
    }
  }
};

// Función auxiliar para convertir imagen a base64 con comprensión adicional
const convertImageToBase64 = async (uri) => {
  try {
    // Primero comprobamos el tamaño del archivo
    const fileInfo = await FileSystem.getInfoAsync(uri);
    console.log(`Tamaño original de la imagen: ${fileInfo.size} bytes`);
    
    // Siempre comprimimos la imagen para reducir tamaño y evitar PayloadTooLargeError
    console.log('Aplicando compresión a la imagen');
    const compressedUri = await manipulateAsync(
      uri,
      [{ resize: { width: 400 } }],
      { compress: 0.3, format: SaveFormat.JPEG }
    );
    
    // Verificar tamaño de la imagen comprimida
    const compressedInfo = await FileSystem.getInfoAsync(compressedUri.uri);
    console.log(`Tamaño comprimido de la imagen: ${compressedInfo.size} bytes`);
    
    const response = await fetch(compressedUri.uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error convirtiendo imagen a base64:', error);
    throw error;
  }
};

// Servicios para manejo de usuarios
export const userService = {
  // Obtener perfil
  getProfile: async () => {
    try {
      const response = await axios.get('/users/profile');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener perfil'
      };
    }
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    try {
      const response = await axios.put('/users/profile', userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar perfil'
      };
    }
  },

  // Cambiar contraseña
  changePassword: async (passwordData) => {
    try {
      const response = await axios.put('/users/change-password', passwordData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al cambiar contraseña'
      };
    }
  },

  // Seleccionar imagen de galería
  pickImage: async () => {
    try {
      // Pedir permisos para acceder a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Se necesitan permisos para acceder a la galería'
        };
      }

      // Lanzar el selector de imágenes con menor calidad para reducir tamaño
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled) {
        return { success: false, error: 'Selección cancelada' };
      }

      return {
        success: true,
        data: { uri: result.assets[0].uri }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al seleccionar imagen'
      };
    }
  },

  // Subir imagen de perfil
  uploadProfilePicture: async (imageUri) => {
    try {
      // Crear FormData para subir la imagen
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.([\w\d]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type
      });

      const response = await axios.post('/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al subir la imagen'
      };
    }
  }
};

// Servicios para manejo de servicios ofrecidos
export const servicioService = {
  // Obtener todos los servicios disponibles
  getAll: async () => {
    try {
      const response = await axios.get('/servicios');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios'
      };
    }
  },
  
  // Obtener servicios predefinidos del catálogo por tipo de prestador
  getCatalogServices: async (tipoPrestador) => {
    try {
      console.log(`Obteniendo catálogo de servicios para tipo:`, tipoPrestador);
      const response = await axios.get(`/catalogo/servicios/${tipoPrestador}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener catálogo de servicios:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener catálogo de servicios'
      };
    }
  },
  
  // Obtener servicios de un prestador específico
  getProviderServices: async (prestadorId) => {
    try {
      console.log(`Obteniendo servicios del prestador ID:`, prestadorId);
      const response = await axios.get(`/prestadores/${prestadorId}/servicios`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener servicios del prestador:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios del prestador'
      };
    }
  },
  
  // Obtener servicios disponibles por tipo de prestador
  getByProviderType: async (tipoPrestador) => {
    try {
      console.log(`Obteniendo servicios disponibles para tipo:`, tipoPrestador);
      const response = await axios.get(`/catalogo/servicios/${tipoPrestador}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al obtener servicios disponibles:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios disponibles'
      };
    }
  },
  
  // Añadir un servicio del catálogo al prestador
  addServiceFromCatalog: async (prestadorId, servicioId, datos) => {
    try {
      console.log(`Añadiendo servicio ${servicioId} al prestador ${prestadorId}`);
      const response = await axios.post(`/prestadores/${prestadorId}/servicios`, {
        servicioId,
        ...datos
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al añadir servicio:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al añadir servicio'
      };
    }
  },

  // Obtener un servicio por ID
  getById: async (id) => {
    try {
      const response = await axios.get(`/servicios/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicio'
      };
    }
  },

  // Obtener servicios por tipo de prestador
  getByProviderType: async (providerType) => {
    try {
      // Filtrar por el tipo de prestador que se está requiriendo
      const response = await axios.get(`/servicios?tipoPrestador=${providerType}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios para este tipo de prestador'
      };
    }
  },

  // Obtener servicios que ofrece un prestador
  getProviderServices: async (providerId) => {
    try {
      const response = await axios.get(`/prestadores/${providerId}/servicios`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener servicios del prestador'
      };
    }
  },

  // Agregar un servicio a un prestador
  addToProvider: async (providerId, serviceData) => {
    try {
      const response = await axios.post(`/prestadores/${providerId}/servicios`, serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al agregar servicio al prestador'
      };
    }
  },

  // Actualizar un servicio de un prestador
  updateProviderService: async (providerId, serviceId, serviceData) => {
    try {
      const response = await axios.put(`/prestadores/${providerId}/servicios/${serviceId}`, serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar servicio'
      };
    }
  },

  // Eliminar un servicio de un prestador
  removeFromProvider: async (providerId, serviceId) => {
    try {
      await axios.delete(`/prestadores/${providerId}/servicios/${serviceId}`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar servicio del prestador'
      };
    }
  },

  // Actualizar la disponibilidad de un servicio
  updateAvailability: async (providerId, serviceId, availabilityData) => {
    try {
      const response = await axios.put(
        `/prestadores/${providerId}/servicios/${serviceId}/disponibilidad`, 
        availabilityData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar disponibilidad del servicio'
      };
    }
  },

  // Crear un nuevo servicio base (solo para administradores)
  create: async (servicioData) => {
    try {
      const response = await axios.post('/servicios', servicioData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear servicio'
      };
    }
  },
};

// Ya agregamos estas funciones a la declaración anterior del servicioService

// Configurar interceptor para incluir automáticamente el token de autenticación
export const setupAxiosInterceptors = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};
