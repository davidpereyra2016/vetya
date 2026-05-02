import axios from '../config/axios'; // Usar la instancia configurada con tokens automáticos
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Servicio para manejar todas las llamadas a la API del backend
 * Cada función devuelve un objeto con { success, data, error }
 */

const getApiErrorMessage = (error, fallback) => {
  if (error.response?.status === 429) {
    return error.response?.data?.message || 'Demasiados intentos. Espera unos minutos e inténtalo nuevamente.';
  }

  if (error.code === 'ECONNABORTED') {
    return 'El servidor tardó demasiado en responder. Inténtalo nuevamente en unos segundos.';
  }

  if (!error.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
  }

  return error.response?.data?.message || fallback;
};

// Servicios de autenticación
export const authService = {
  // Iniciar sesión
  login: async (email, password, appType = 'provider') => {
    try {
      const response = await axios.post('/auth/login', { email, password, appType });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, 'Error al iniciar sesión'),
        requiresVerification: error.response?.data?.requiresVerification || false,
        email: error.response?.data?.email
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
        error: getApiErrorMessage(error, 'Error al registrar usuario')
      };
    }
  },
  
  // Solicitar recuperación de contraseña
  forgotPassword: async (email) => {
    try {
      const response = await axios.post('/auth/forgot-password', { email });
      if (response.data?.emailSent === false) {
        return {
          success: false,
          error: response.data.message || 'No se pudo enviar el correo de recuperación',
          data: response.data
        };
      }
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, 'Error al solicitar recuperación de contraseña')
      };
    }
  },

  // Restablecer contraseña con código de 6 dígitos
  resetPassword: async (email, code, newPassword) => {
    try {
      const response = await axios.post('/auth/reset-password', { 
        email, 
        code, 
        newPassword 
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, 'Error al restablecer contraseña')
      };
    }
  },

  // Registrar prestador de servicios
  registerProvider: async (username, email, password, confirmPassword, nombre, especialidad, telefono) => {
    try {
      const response = await axios.post('/auth/register/provider', {
        username,
        email,
        password,
        confirmPassword,
        nombre,
        especialidad,
        telefono
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, 'Error al registrar prestador de servicios')
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
        error: getApiErrorMessage(error, 'Error al verificar el código')
      };
    }
  },

  // Reenviar código de verificación
  resendVerification: async (email) => {
    try {
      const response = await axios.post('/auth/resend-verification', { email });
      if (response.data?.emailSent === false) {
        return {
          success: false,
          error: response.data.message || 'No se pudo reenviar el código',
          data: response.data
        };
      }
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(error, 'Error al reenviar el código')
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
  
  // Actualizar la ubicación del prestador en tiempo real
  actualizarUbicacion: async (id, lat, lng) => {
    try {
      const response = await axios.patch(`/prestadores/${id}/ubicacion`, { lat, lng });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar ubicación'
      };
    }
  },

  // Actualizar el precio de emergencia del prestador
  actualizarPrecioEmergencia: async (prestadorId, precioEmergencia, disponibleEmergencias) => {
    try {
      const response = await axios.patch(`/prestadores/${prestadorId}/precio-emergencia`, {
        precioEmergencia,
        disponibleEmergencias
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('Error al actualizar precio emergencia:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar precio de emergencia'
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

  // Actualizar horarios disponibles
  updateAvailableHours: async (availableHours) => {
    try {
      const response = await axios.put('/prestadores/horarios', { availableHours });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar horarios disponibles'
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

// Servicios para emergencias (principalmente para prestadores veterinarios)
export const emergenciaService = {
  // Obtener emergencias asignadas al veterinario (estados: Asignada, En camino, Atendida)
  getVeterinarianEmergencies: async () => {
    try {
      const response = await axios.get('/emergencias/asignadas');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener emergencias asignadas'
      };
    }
  },

  // Obtener emergencias cercanas disponibles para aceptar
  getNearbyEmergencies: async () => {
    try {
      const response = await axios.get('/emergencias/cercanas/disponibles');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener emergencias cercanas'
      };
    }
  },

  // Obtener detalles de una emergencia
  getEmergencyDetails: async (emergencyId) => {
    try {
      const response = await axios.get(`/emergencias/${emergencyId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener detalles de la emergencia'
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

  // Aceptar una emergencia
  acceptEmergency: async (emergencyId) => {
    try {
      console.log('🚀 [CLIENTE] Aceptando emergencia:', emergencyId);
      const response = await axios.post(`/emergencias/${emergencyId}/aceptar`);
      console.log('✅ [CLIENTE] Emergencia aceptada:', {
        emergenciaId: response.data?.emergenciaActualizada?._id,
        estado: response.data?.emergenciaActualizada?.estado,
        metodoPago: response.data?.emergenciaActualizada?.metodoPago,
        preferenciaMP: response.data?.preferenciaMP?.id
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ [CLIENTE] Error al aceptar emergencia:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al aceptar la emergencia'
      };
    }
  },

  // Rechazar una emergencia
  rejectEmergency: async (emergencyId) => {
    try {
      console.log(`Intentando rechazar emergencia con ID: ${emergencyId}`);
      const response = await axios.post(`/emergencias/${emergencyId}/rechazar`);
      console.log('Respuesta exitosa al rechazar emergencia:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.log('API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al rechazar la emergencia'
      };
    }
  },

  // Cambiar estado de una emergencia (En camino, Atendida)
  setEmergencyStatus: async (emergencyId, estado) => {
    console.log(`🟠 [API] setEmergencyStatus - ID: ${emergencyId}, Estado: ${estado}`);
    try {
      const response = await axios.patch(`/emergencias/${emergencyId}/estado`, { estado });
      console.log('🟠 [API] ✅ Respuesta exitosa:', response.status, response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('🟠 [API] ❌ Error en setEmergencyStatus:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || `Error al cambiar estado a ${estado}`
      };
    }
  },

  // Actualizar ubicación del veterinario durante una emergencia
  updateEmergencyLocation: async (emergencyId, latitude, longitude) => {
    try {
      const response = await axios.post(`/emergencias/${emergencyId}/ubicacion-veterinario`, {
        latitud: latitude,
        longitud: longitude
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar ubicación de emergencia'
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
  uploadProfilePicture: async (imageUri, isPrestador = false) => {
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

      // Elegir el endpoint correcto según el tipo de usuario
      const endpoint = isPrestador ? '/prestadores/profile-picture' : '/users/profile-picture';
      console.log(`Subiendo imagen a ${endpoint}...`);
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Imagen subida exitosamente:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al subir imagen:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al subir la imagen'
      };
    }
  }
};

// Servicios para manejo de servicios ofrecidos
export const servicioService = {
  // Obtener todos los servicios disponibles activos
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

// Variable para evitar múltiples redirects al login
let isRedirectingToLogin = false;

// Servicios para validación de prestadores
export const validacionService = {
  // Obtener estado de validación del prestador actual
  getEstadoValidacion: async () => {
    try {
      const response = await axios.get('/validacion/mi-estado');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener estado de validación'
      };
    }
  },

  // Actualizar datos adicionales del prestador
  updateDatosAdicionales: async (datos) => {
    try {
      const response = await axios.put('/validacion/datos-adicionales', datos);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar datos adicionales'
      };
    }
  },

  // Subir documento de validación
  subirDocumento: async (tipoDocumento, archivo, descripcion = '', onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('documento', {
        uri: archivo.uri,
        type: archivo.type || 'image/jpeg',
        name: archivo.name || `${tipoDocumento}.jpg`
      });
      formData.append('tipoDocumento', tipoDocumento);
      if (descripcion) {
        formData.append('descripcion', descripcion);
      }

      const response = await axios.post('/validacion/subir-documento', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al subir documento'
      };
    }
  },

  // Eliminar documento subido
  eliminarDocumento: async (tipoDocumento, indice = null) => {
    try {
      let url = `/validacion/documento/${tipoDocumento}`;
      if (indice !== null) {
        url += `?indice=${indice}`;
      }
      
      const response = await axios.delete(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar documento'
      };
    }
  }
};

// ============================================
// 🔷 Servicio de Pagos con Mercado Pago (Prestador)
// ============================================
export const pagoService = {
  /**
   * Consultar estado de un pago
   * Los prestadores pueden ver el estado de pagos asociados a sus servicios
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
   * Obtener pagos por referencia (emergencia o cita)
   * Útil para ver si una emergencia/cita ya tiene un pago asociado
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
   * Obtener todos los pagos del prestador
   * Lista de pagos donde el prestador es el destinatario
   */
  obtenerMisPagos: async () => {
    try {
      const response = await axios.get('/pagos/prestador/mis-pagos');
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
   * Obtener estadísticas de ganancias del prestador
   */
  obtenerEstadisticasGanancias: async () => {
    try {
      const response = await axios.get('/pagos/prestador/mis-pagos');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener estadísticas de ganancias'
      };
    }
  }
};

// Función simplificada - la instancia de axios ya maneja tokens automáticamente
export const setupAxiosInterceptors = (token, logoutCallback) => {
  // La instancia de axios configurada en config/axios.js ya maneja los tokens automáticamente
  // desde AsyncStorage, por lo que esta función ya no es necesaria para configurar tokens
  console.log('setupAxiosInterceptors llamada - usando configuración automática de tokens');
  
  // Solo guardamos el callback de logout si es necesario para otras funciones
  if (logoutCallback && typeof logoutCallback === 'function') {
    // Podrías guardar el callback globalmente si es necesario
    console.log('Callback de logout configurado');
  }
};
