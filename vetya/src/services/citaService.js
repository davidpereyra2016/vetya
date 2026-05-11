import axios from '../config/axios';

/**
 * Servicios para gestionar las citas y reservas con diferentes prestadores
 */
const citaService = {
  /**
   * Obtiene las fechas disponibles para citas
   * @returns {Promise<Object>} Resultado de la operación
   */
  getAvailableDates: async () => {
    try {
      // En un entorno real, esto debería venir del backend
      // Por ahora generamos fechas localmente
      const dates = [];
      const today = new Date();
      
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // No incluir domingos
        if (date.getDay() !== 0) {
          dates.push({
            id: i.toString(),
            date: date,
            day: date.getDate(),
            month: date.toLocaleString('es-ES', { month: 'short' }),
            dayName: date.toLocaleString('es-ES', { weekday: 'short' })
          });
        }
      }
      
      return { success: true, data: dates };
    } catch (error) {
      console.error('Error al obtener fechas disponibles:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener fechas disponibles' 
      };
    }
  },

  reprogramAppointment: async (appointmentId, appointmentData) => {
    try {
      const response = await axios.patch(`/citas/${appointmentId}/reprogramar`, appointmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al reprogramar la cita'
      };
    }
  },

  /**
   * Obtiene los horarios disponibles para una fecha específica
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @param {string} providerId - ID del prestador
   * @param {string} serviceId - ID del servicio
   * @returns {Promise<Object>} Resultado de la operación
   */
  getAvailableTimeSlots: async (date, providerId, serviceId) => {
    try {
      // Si falta algún parámetro requerido, retornar error
      if (!date || !providerId || !serviceId) {
        console.error('Faltan parámetros para obtener horarios disponibles');
        return {
          success: false,
          error: 'Debe seleccionar fecha, prestador y servicio'
        };
      }
      
      console.log(`Consultando horarios disponibles para fecha: ${date} prestador: ${providerId} servicio: ${serviceId}`);
      
      // Realizar la petición al endpoint de disponibilidad
      const response = await axios.get(`/citas/prestadores/${providerId}/disponibilidad`, {
        params: { servicioId: serviceId, fecha: date }
      });
      
      // Filtrar la disponibilidad para la fecha seleccionada
      // const fechaStr = date.split('T')[0]; // Aseguramos formato YYYY-MM-DD sin hora
      // Buscar directamente por fecha (sin conversiones)
      const disponibilidadFecha = response.data.find(d => d.fecha === date);
      if (!disponibilidadFecha) {
        return { success: true, data: [] };
      }
      // console.log(`Disponibilidad recibida para ${date}:`, disponibilidadFecha);
      
      // Si no hay disponibilidad para esa fecha, devolver array vacío
      if (disponibilidadFecha.length === 0) {
        return {
          success: true,
          data: []
        };
      }
      // Mapear slots correctamente
      const mappedSlots = (disponibilidadFecha.slots || []).map(slot => ({
        id: slot.id,
        time: slot.inicio,
        endTime: slot.fin,
        available: slot.disponible
      }));
      
      // Formatear la respuesta para el frontend
      return {
        success: true,
        data: mappedSlots
      };
    } catch (error) {
      console.error('Error al obtener horarios disponibles:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener horarios disponibles' 
      };
    }
  },

  /**
   * Obtiene los veterinarios disponibles
   * @returns {Promise<Object>} Resultado de la operación
   */
  getAvailableVets: async () => {
    try {
      // En un entorno real, esto vendría del backend
      // Por ahora devolvemos veterinarios estáticos
      const vets = [
        { 
          id: '1',
          name: 'Dr. Carlos Rodríguez',
          specialty: 'Medicina general',
          rating: 4.9,
          image: require('../assets/images/app-usage.png'), // Asegúrate de que exista esta imagen o cámbiala
          experience: '10 años'
        },
        { 
          id: '2',
          name: 'Dra. María Gómez',
          specialty: 'Cirugía',
          rating: 4.8,
          image: require('../assets/images/app-usage.png'), // Asegúrate de que exista esta imagen o cámbiala
          experience: '8 años'
        },
        { 
          id: '3',
          name: 'Dr. Juan Pérez',
          specialty: 'Dermatología',
          rating: 4.7,
          image: require('../assets/images/app-usage.png'), // Asegúrate de que exista esta imagen o cámbiala
          experience: '5 años'
        }
      ];
      
      return { success: true, data: vets };
    } catch (error) {
      console.error('Error al obtener veterinarios disponibles:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener veterinarios disponibles' 
      };
    }
  },

  /**
   * Obtiene los tipos de prestadores disponibles
   * @returns {Promise<Object>} Resultado de la operación
   */
  getProviderTypes: async () => {
    try {
      // En un entorno real, esto vendría del backend
      // Por ahora devolvemos tipos estáticos
      const types = [
        { id: '1', name: 'Veterinario', icon: 'medkit-outline' },
        { id: '2', name: 'Centro Veterinario', icon: 'business-outline' },
        { id: '3', name: 'Veterinaria', icon: 'storefront-outline' },
        { id: '4', name: 'Otro', icon: 'paw-outline' },
      ];
      
      return { success: true, data: types };
    } catch (error) {
      console.error('Error al obtener tipos de prestadores:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener tipos de prestadores' 
      };
    }
  },

  /**
   * CAMBIO: Obtiene los prestadores por tipo, usando directamente el nombre del tipo.
   * @param {string} tipo - Nombre del tipo de prestador (ej: 'Veterinario')
   * @returns {Promise<Object>} Resultado de la operación
   */
  getProvidersByType: async (tipo) => {
    try {
      // console.log(`Obteniendo prestadores del tipo: ${tipo}`);
      if (!tipo) {
        return { success: false, error: "Tipo de prestador no válido" };
      }
      
      // La llamada ahora usa la ruta /tipo/:tipo, que es la correcta y más específica.
      const response = await axios.get(`/prestadores/tipo/${tipo}`);
      // console.log('Respuesta de prestadores por tipo:', response.data);
      
      const providers = response.data.map(p => ({
        _id: p._id,
        nombre: p.nombre,
        tipo: p.tipo,
        especialidades: p.especialidades,
        rating: p.rating || 4.5,
        imagen: p.imagen,
        canAcceptCash: p.canAcceptCash ?? p.can_accept_cash ?? true,
        can_accept_cash: p.can_accept_cash ?? p.canAcceptCash ?? true
      }));
      
      return { success: true, data: providers };
    } catch (error) {
      console.error('Error al obtener prestadores por tipo:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener prestadores por tipo' 
      };
    }
  },

  /**
   * Obtiene los servicios ofrecidos por un prestador específico
   * @param {string} providerId ID del prestador
   * @returns {Promise<Object>} Resultado con los servicios del prestador
   */
  getProviderServices: async (providerId) => {
    try {
      // console.log(`Obteniendo servicios del prestador con ID: ${providerId}`);
      // Hacer petición real al backend
      const response = await axios.get(`/prestadores/${providerId}/servicios`);
      // console.log('Respuesta del backend con servicios:', response.data);
      
      // Transformar los datos del servicio al formato esperado por el frontend
      const formattedServices = response.data.map(servicio => ({
        _id: servicio._id,
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio,
        duracion: servicio.duracion || 30,
        categoria: servicio.categoria,
        modalidadAtencion: Array.isArray(servicio.modalidadAtencion) && servicio.modalidadAtencion.length > 0
          ? servicio.modalidadAtencion
          : ['Clínica'],
        icon: citaService.getServiceIcon(servicio.categoria),
        color: servicio.color || '#1E88E5'
      }));
      
      return { success: true, data: formattedServices };
    } catch (error) {
      console.error('Error al obtener servicios del prestador:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener servicios del prestador' 
      };
    }
  },

  /**
   * Crea una nueva cita
   * @param {Object} appointmentData Datos de la cita
   * @returns {Promise<Object>} Resultado de la operación
   */
  
  // Crear una nueva cita (implementación real)
  createAppointment: async (appointmentData) => {
    try {
      const response = await axios.post(`/citas`, appointmentData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al crear cita' 
      };
    }
  },

  /**
   * Obtiene los servicios disponibles para citas
   * @param {string} prestadorId - ID del prestador para filtrar servicios (opcional)
   * @returns {Promise<Object>} Resultado de la operación
   */
  getAvailableServices: async (prestadorId = null) => {
    try {
      let endpoint = '/servicios';
      
      // Si hay un prestador específico, filtrar por sus servicios
      if (prestadorId) {
        endpoint = `/prestadores/${prestadorId}/servicios`;
      }
      
      const response = await axios.get(endpoint);
      
      // Mapear los datos del backend al formato que espera el frontend
      const services = response.data.map(servicio => ({
        id: servicio._id,
        name: servicio.nombre,
        description: servicio.descripcion,
        duration: servicio.duracion,
        price: servicio.precio,
        category: servicio.categoria,
        // Asignar icono según la categoría
        icon: citaService.getServiceIcon(servicio.categoria),
        color: servicio.color || '#1E88E5'
      }));
      
      return { success: true, data: services };
    } catch (error) {
      console.error('Error al obtener servicios disponibles:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener servicios disponibles' 
      };
    }
  },
  
  /**
   * Devuelve un icono apropiado según la categoría del servicio
   * @param {string} category - Categoría del servicio
   * @returns {string} - Nombre del icono
   */
  getServiceIcon: (category) => {
    const categoryIcons = {
      'consulta': 'medkit-outline',
      'vacunacion': 'fitness-outline',
      'cirugia': 'cut-outline',
      'emergencia': 'alert-circle-outline',
      'hospitalizacion': 'bed-outline',
      'preventiva': 'shield-checkmark-outline',
      'examen': 'flask-outline',
      'radiologia': 'scan-outline',
      'peluqueria': 'cut-outline',
      'laboratorio': 'flask-outline',
      'complementario': 'options-outline',
      'estetica': 'cut-outline',
      'alimentos': 'nutrition-outline',
      'accesorios': 'paw-outline',
      'Limpieza de oídos': 'ear-outline',
      'Limpieza de glándulas anales': 'medical-outline',
      'Spa canino': 'flower-outline',
      'Tratamiento antipulgas': 'bug-outline',
      'Tratamiento dermatológico': 'bandage-outline',
      'Perfumería': 'flask-outline'
    };
    
    // Normalizar la categoría (quitar acentos, convertir a minúsculas)
    const normalizedCategory = (category || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    return categoryIcons[normalizedCategory] || 'paw-outline'; // Icono por defecto
  },
  // Obtener prestadores de consulta general
  getConsultaGeneralProviders: async () => {
    try {
      const response = await axios.get(`/citas/prestadores/consulta-general`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener prestadores' 
      };
    }
  },
  // Obtener disponibilidad de un prestador
  getProviderAvailability: async (prestadorId, servicioId) => {
    try {
      const response = await axios.get(
        `/citas/prestadores/${prestadorId}/disponibilidad`,
        { params: { servicioId } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener disponibilidad' 
      };
    }
  },
  // Verificar disponibilidad de un slot específico
  verifySlotAvailability: async (prestadorId, servicioId, fecha, horaInicio) => {
    try {
      const response = await axios.post(
        `/citas/verificar-disponibilidad`,
        { prestadorId, servicioId, fecha, horaInicio }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al verificar disponibilidad' 
      };
    }
  },

  /**
   * Obtiene todas las citas del usuario autenticado.
   * Llama a: GET /api/citas
   * @returns {Promise<Object>}
   */
  getUserAppointments: async () => {
    try {
      const response = await axios.get('/citas');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener las citas' 
      };
    }
  },
  /**
   * Actualiza el estado de una cita específica.
   * Llama a: PATCH /api/citas/:id/estado
   * @param {string} appointmentId - El ID de la cita.
   * @param {string} status - El nuevo estado.
   * @returns {Promise<Object>}
   */
  updateAppointmentStatus: async (appointmentId, status) => {
    try {
      const response = await axios.patch(`/citas/${appointmentId}/estado`, { estado: status });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al actualizar la cita' 
      };
    }
  },

  /**
   * Confirma una cita con método de pago específico
   * Llama a: PATCH /api/citas/prestador/:prestadorId/cita/:citaId/confirmar-pago
   * @param {string} prestadorId - ID del prestador
   * @param {string} citaId - ID de la cita
   * @param {string} metodoPago - Método de pago ('MercadoPago' o 'Efectivo')
   * @returns {Promise<Object>}
   */
  confirmarCitaConPago: async (prestadorId, citaId, metodoPago) => {
    try {
      const response = await axios.patch(`/citas/prestador/${prestadorId}/cita/${citaId}/confirmar-pago`, {
        metodoPago
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al confirmar cita con método de pago' 
      };
    }
  },
};

export default citaService;
