import axios from '../config/axios';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

const getApiErrorMessage = (error, fallback) => {
  if (error.response?.status === 429) {
    return error.response?.data?.message || 'Demasiados intentos. Espera unos minutos e intentalo nuevamente.';
  }

  if (error.code === 'ECONNABORTED') {
    return 'El servidor tardo demasiado en responder. Intentalo nuevamente en unos segundos.';
  }

  if (!error.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexion e intentalo nuevamente.';
  }

  return error.response?.data?.message || fallback;
};

/**
 * Servicio para manejar todas las llamadas a la API del backend
 * Cada función devuelve un objeto con { success, data, error }
 */

// Servicios de autenticación
export const authService = {
  // Iniciar sesión
  login: async (email, password) => {
    try {
      // Añadir appType para diferenciar entre aplicaciones
      const response = await axios.post('/auth/login', { 
        email, 
        password,
        appType: 'client' // Importante: indicar que es la app de clientes
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('[api.js login] Error status:', error.response?.status);
      console.log('[api.js login] Error data:', JSON.stringify(error.response?.data));
      console.log('[api.js login] requiresVerification:', error.response?.data?.requiresVerification);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al iniciar sesión',
        requiresVerification: error.response?.data?.requiresVerification || false,
        email: error.response?.data?.email
      };
    }
  },

  // Registrar usuario
  register: async (username, email, password, confirmPassword) => {
    try {
      const normalizedUsername = username?.trim().replace(/\s+/g, ' ');
      const normalizedEmail = email?.trim().toLowerCase();
      const response = await axios.post('/auth/register/client', {
        username: normalizedUsername,
        email: normalizedEmail,
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
        error: getApiErrorMessage(error, 'Error al registrar usuario'),
        requiresVerification: error.response?.data?.requiresVerification || false,
        email: error.response?.data?.email,
        code: error.response?.data?.code,
        canRecoverPassword: error.response?.data?.canRecoverPassword || false
      };
    }
  },

  // Verificar código de email
  verifyEmail: async (email, code) => {
    try {
      const response = await axios.post('/auth/verify-email', { email, code });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al verificar el código'
      };
    }
  },

  // Reenviar código de verificación
  resendVerification: async (email) => {
    try {
      const response = await axios.post('/auth/resend-verification', { email });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al reenviar el código'
      };
    }
  },

  // Solicitar recuperación de contraseña
  forgotPassword: async (email) => {
    try {
      const response = await axios.post('/auth/forgot-password', { email });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al solicitar recuperación'
      };
    }
  },

  // Restablecer contraseña con código
  resetPassword: async (email, code, newPassword) => {
    try {
      const response = await axios.post('/auth/reset-password', { email, code, newPassword });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al restablecer la contraseña'
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
  
  // Obtener veterinarios disponibles para emergencias
  getAvailableForEmergencies: async () => {
    try {
      console.log('🔍 [API] Solicitando veterinarios disponibles...');
      
      // Intentar con manejo de timeout más explícito
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos
      
      const response = await axios.get('/prestadores/emergencias', {
        signal: controller.signal,
        timeout: 15000
      });
      
      clearTimeout(timeoutId);
      
      console.log('✅ [API] Veterinarios recibidos:', response.data?.length || 0);
      
      // Log de las coordenadas de cada veterinario para debug
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((vet, index) => {
          console.log(`   Vet ${index + 1}: ${vet.nombre}, ubicacionActual:`, vet.ubicacionActual?.coordenadas || 'NO TIENE');
        });
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ [API] Error al obtener veterinarios:', error.response?.data || error.message);
      
      // Intentar diagnóstico de conexión
      await diagnosticarConexion();
      
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener veterinarios disponibles',
        errorDetails: {
          message: error.message,
          name: error.name,
          code: error.code
        }
      };
    }
  },
  
  // Obtener veterinarios disponibles para emergencias con ubicación en tiempo real
  getAvailableVetsWithLocation: async (clientLat, clientLng) => {
    try {
      console.log('🔍 [API] Solicitando veterinarios con ubicación. Cliente:', { lat: clientLat, lng: clientLng });
      
      const response = await axios.get('/prestadores/emergencias/ubicacion', {
        params: { lat: clientLat, lng: clientLng }
      });
      
      console.log('✅ [API] Veterinarios con ubicación recibidos:', response.data?.length || 0);
      
      // Log detallado de coordenadas
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((vet, index) => {
          const coords = vet.ubicacionActual?.coordenadas;
          console.log(`   Vet ${index + 1}: ${vet.nombre}`);
          console.log(`      -> ubicacionActual:`, coords ? `${coords.lat}, ${coords.lng}` : 'NO TIENE');
          console.log(`      -> distancia calculada:`, vet.distancia?.texto || 'N/A');
        });
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ [API] Error al obtener veterinarios con ubicación:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener veterinarios con ubicación'
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

// Servicio para manejo de emergencias
export const emergenciaService = {
  // Crear una nueva emergencia
  create: async (emergencyData) => {
    try {
      const response = await axios.post('/emergencias', emergencyData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al crear emergencia:', error.response?.data);
      // Verificar si el error es debido a una emergencia reciente
      if (error.response?.status === 429) {
        return {
          success: false,
          error: error.response?.data?.message || 'Ya tienes una emergencia activa o reciente',
          tiempoRestante: error.response?.data?.tiempoRestante || 5,
          emergenciaActiva: error.response?.data?.emergenciaActiva
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear la solicitud de emergencia'
      };
    }
  },

  // Obtener detalles completos de una emergencia por ID
  getEmergencyDetails: async (emergencyId) => {
    try {
      const response = await axios.get(`/emergencias/${emergencyId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener detalles de emergencia:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener detalles de la emergencia'
      };
    }
  },
  
  // Obtener actualización de ubicación del veterinario (datos reales del backend)
  getVetLocationUpdate: async (emergencyId) => {
    try {
      const response = await axios.get(`/emergencias/${emergencyId}/ubicacion-veterinario`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const backendMsg = error.response?.data?.message;
      // "Coordenadas del veterinario inválidas" es un caso esperado cuando el vet
      // no tiene ubicación en tiempo real cargada. Lo logueamos como warn silencioso
      // (una sola vez) en lugar de saturar la consola con ERROR en cada poll.
      if (backendMsg === 'Coordenadas del veterinario inválidas') {
        // Silencioso: el HomeScreen cuenta errores consecutivos y detiene el polling.
      } else {
        console.error('❌ [API] Error al obtener ubicación del veterinario:', backendMsg || error.message);
      }
      return {
        success: false,
        error: backendMsg || 'Error al obtener ubicación del veterinario'
      };
    }
  },
  
  // Obtener el estado actual de una emergencia
  getEmergencyStatus: async (emergencyId) => {
    try {
      const response = await axios.get(`/emergencias/${emergencyId}/estado`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al verificar estado de emergencia:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al verificar estado de la emergencia'
      };
    }
  },
  
  // Confirmar y aceptar el servicio de emergencia (pago)
  confirmEmergencyService: async (emergencyId, paymentMethod) => {
    try {
      const response = await axios.patch(`/emergencias/${emergencyId}/confirmar`, {
        metodoPago: paymentMethod
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al confirmar servicio de emergencia:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al confirmar el servicio'
      };
    }
  },

  // Obtener emergencias activas del usuario
  getActiveEmergencies: async () => {
    try {
      
      // Configurar timeout y control de aborto
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos
      
      const response = await axios.get('/emergencias/activas', {
        signal: controller.signal,
        timeout: 15000
      });
      
      clearTimeout(timeoutId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      
      // Intentar diagnóstico de conexión si es error de red
      if (error.message === 'Network Error') {
        await diagnosticarConexion();
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener emergencias activas',
        errorDetails: {
          message: error.message,
          name: error.name,
          code: error.code
        }
      };
    }
  },

  // Obtener TODAS las emergencias del usuario (activas + historial)
  getAllEmergencies: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await axios.get('/emergencias', {
        signal: controller.signal,
        timeout: 15000
      });
      
      clearTimeout(timeoutId);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      if (error.message === 'Network Error') {
        await diagnosticarConexion();
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener emergencias',
        errorDetails: {
          message: error.message,
          name: error.name,
          code: error.code
        }
      };
    }
  },

  // Cancelar una emergencia
  cancelEmergency: async (emergenciaId) => {
    try {
      const response = await axios.post(`/emergencias/${emergenciaId}/cancelar`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al cancelar la emergencia'
      };
    }
  },
  
  // Verificar si una emergencia ha expirado o está por expirar
  checkEmergencyExpiration: async (emergenciaId) => {
    try {
      const response = await axios.get(`/emergencias/verificar-expiracion/${emergenciaId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al verificar el estado de la emergencia'
      };
    }
  },

  // Subir imágenes para una emergencia
  uploadEmergencyImages: async (images) => {
    try {
      const formData = new FormData();
      
      for (let i = 0; i < images.length; i++) {
        const imageUri = images[i];
        const filename = imageUri.split('/').pop();
        
        // Determine mime type
        const match = /\.([\w\d_]+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('imagenes', {
          uri: imageUri,
          name: filename,
          type
        });
      }
      
      const response = await axios.post('/upload/emergencia', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al subir imágenes'
      };
    }
  },
  
  // Asignar un veterinario a una emergencia existente
  assignVetToEmergency: async (emergencyId, vetId) => {
    try {
      const response = await axios.patch(`/emergencias/${emergencyId}/asignar-veterinario`, {
        veterinarioId: vetId
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al asignar veterinario:', error);
      
      // Si ocurre un error, podemos intentar obtener los detalles actuales de la emergencia
      try {
        const emergencyResponse = await axios.get(`/emergencias/${emergencyId}`);
        return {
          success: false,
          error: error.response?.data?.message || 'Error al asignar veterinario a la emergencia',
          data: emergencyResponse.data
        };
      } catch (secondaryError) {
        // Si también falla obtener detalles, devolvemos solo el error original
        return {
          success: false,
          error: error.response?.data?.message || 'Error al asignar veterinario a la emergencia'
        };
      }
    }
  },

  // Confirmar la llegada del veterinario (por parte del cliente)
  confirmVetArrival: async (emergencyId, idempotencyKey) => {
    try {
      console.log('🚀 [CLIENTE] Confirmando llegada del veterinario:', emergencyId);
      const response = await axios.patch(
        `/emergencias/${emergencyId}/confirmar-llegada`,
        undefined,
        idempotencyKey ? {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        } : undefined
      );
      console.log('✅ [CLIENTE] Llegada confirmada:', {
        estado: response.data?.emergencia?.estado,
        tienePreferenciaMP: !!response.data?.preferenciaMP,
        initPoint: response.data?.preferenciaMP?.initPoint
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ [CLIENTE] Error al confirmar llegada:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al confirmar llegada del veterinario'
      };
    }
  },
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
        mediaTypes: ['images'],
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
    // console.log(`Tamaño original de la imagen: ${fileInfo.size} bytes`);
    
    // Siempre comprimimos la imagen para reducir tamaño y evitar PayloadTooLargeError
    // console.log('Aplicando compresión a la imagen');
    const compressedUri = await manipulateAsync(
      uri,
      [{ resize: { width: 400 } }],
      { compress: 0.3, format: SaveFormat.JPEG }
    );
    
    // Verificar tamaño de la imagen comprimida
    const compressedInfo = await FileSystem.getInfoAsync(compressedUri.uri);
    // console.log(`Tamaño comprimido de la imagen: ${compressedInfo.size} bytes`);
    
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
  
  // Actualizar la ubicación del cliente
  updateLocation: async (userId, lat, lng) => {
    try {
      const response = await axios.patch(`/clients/${userId}/ubicacion`, {
        lat,
        lng
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar la ubicación'
      };
    }
  },
  
  // Obtener la ubicación guardada del cliente
  getLocation: async (userId) => {
    try {
      const response = await axios.get(`/clients/${userId}/ubicacion`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener la ubicación'
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

  // Obtener direcciones del usuario (basadas en emergencias pasadas)
  getAddresses: async () => {
    try {
      const response = await axios.get('/users/addresses');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener direcciones'
      };
    }
  },

  // Actualizar ubicación actual del usuario
  updateCurrentLocation: async (lat, lng) => {
    try {
      const response = await axios.put('/users/location', { lat, lng });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar ubicación'
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
        mediaTypes: ['images'],
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

// Configurar interceptor para incluir automáticamente el token de autenticación
export const setupAxiosInterceptors = (token) => {
  // Eliminar interceptores previos para evitar duplicados
  axios.interceptors.request.eject(axios._requestInterceptorId);
  
  // Configurar el token en los headers
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
  
  // Configurar un nuevo interceptor de solicitud
  axios._requestInterceptorId = axios.interceptors.request.use(
    config => {
      // Añadir parámetro para evitar caché en ciertos navegadores/entornos
      if (config.method === 'get') {
        config.params = { ...config.params, _: Date.now() };
      }
      return config;
    },
    error => Promise.reject(error)
  );
};

// Función para diagnosticar problemas de red y conexión
export const diagnosticarConexion = async () => {
  try {
    const baseUrl = axios.defaults.baseURL.split('/api')[0];
    const timeout = ms => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
    const response = await Promise.race([
      fetch(baseUrl),
      timeout(5000)
    ]);
    
    return {
      success: true,
      mensaje: 'Conexión básica exitosa',
      detalles: {
        status: response.status,
        baseUrl
      }
    };
  } catch (error) {
    return {
      success: false,
      mensaje: 'Error de conexión básica',
      error: error.message,
      detalles: {
        baseUrl: axios.defaults.baseURL.split('/api')[0],
      }
    };
  }
};

// ============================================
// 🔷 Servicio de Pagos con Mercado Pago
// ============================================
export const pagoService = {
  /**
   * Crear preferencia de pago de Mercado Pago
   * Se ejecuta cuando el prestador acepta la emergencia
   */
  crearPreferencia: async (emergenciaId, citaId, monto, descripcion, idempotencyKey) => {
    try {
      const response = await axios.post('/pagos/mercadopago/create-preference', {
        emergenciaId,
        citaId,
        monto,
        descripcion
      }, idempotencyKey ? {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      } : undefined);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear preferencia de pago'
      };
    }
  },

  /**
   * Capturar pago cuando el servicio se completa
   * El cliente confirma que el servicio fue completado
   */
  capturarPago: async (pagoId) => {
    try {
      const response = await axios.post('/pagos/mercadopago/capture-payment', {
        pagoId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al capturar el pago'
      };
    }
  },

  /**
   * Consultar estado de un pago
   */
  consultarEstadoPago: async (paymentId) => {
    try {
      const response = await axios.get(`/pagos/mercadopago/payment-status/${paymentId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al consultar el estado del pago'
      };
    }
  },

  /**
   * Cancelar un pago pendiente
   */
  cancelarPago: async (pagoId) => {
    try {
      const response = await axios.post('/pagos/mercadopago/cancel-payment', {
        pagoId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al cancelar el pago'
      };
    }
  },

  /**
   * Obtener todos los pagos del usuario
   */
  obtenerPagos: async () => {
    try {
      const response = await axios.get('/pagos');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener los pagos'
      };
    }
  },

  /**
   * Obtener pagos por referencia (emergencia o cita)
   */
  obtenerPagosPorReferencia: async (tipo, id) => {
    try {
      const response = await axios.get(`/pagos/referencia/${tipo}/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener los pagos'
      };
    }
  },

  /**
   * Registrar un pago en efectivo para una cita o emergencia
   */
  crearPagoEfectivo: async (emergenciaId, citaId, monto, descripcion, idempotencyKey) => {
    try {
      const response = await axios.post('/pagos/efectivo', {
        emergenciaId,
        citaId,
        monto,
        descripcion,
      }, idempotencyKey ? {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      } : undefined);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          'Error al registrar el pago en efectivo',
      };
    }
  }
};
