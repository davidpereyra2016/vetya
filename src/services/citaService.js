import axios from 'axios';

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

  /**
   * Obtiene los horarios disponibles para una fecha específica
   * @param {string} dateId ID de la fecha seleccionada
   * @returns {Promise<Object>} Resultado de la operación
   */
  getAvailableTimes: async (dateId) => {
    try {
      // En un entorno real, esto debería venir del backend
      // Por ahora devolvemos horarios estáticos
      const times = [
        { id: '1', time: '09:00', available: true },
        { id: '2', time: '10:00', available: true },
        { id: '3', time: '11:00', available: false },
        { id: '4', time: '12:00', available: true },
        { id: '5', time: '16:00', available: true },
        { id: '6', time: '17:00', available: true },
        { id: '7', time: '18:00', available: false }
      ];
      
      return { success: true, data: times };
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
        { id: '1', name: 'Veterinarios', icon: 'medkit-outline', color: '#1E88E5' },
        { id: '2', name: 'Peluquerías', icon: 'cut-outline', color: '#9C27B0' },
        { id: '3', name: 'Pet Shops', icon: 'paw-outline', color: '#4CAF50' },
        { id: '4', name: 'Centros Veterinarios', icon: 'business-outline', color: '#FF9800' },
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
   * Obtiene los prestadores por tipo
   * @param {string} typeId ID del tipo de prestador
   * @returns {Promise<Object>} Resultado de la operación
   */
  getProvidersByType: async (typeId) => {
    try {
      // En un entorno real, esto vendría del backend filtrando por tipo
      // Por ahora simulamos diferentes prestadores según el tipo
      let providers = [];
      
      switch(typeId) {
        case '1': // Veterinarios
          providers = [
            { 
              id: '1',
              name: 'Dr. Carlos Rodríguez',
              type: 'Veterinario',
              specialty: 'Medicina general',
              rating: 4.9,
              image: require('../assets/images/app-usage.png'),
              experience: '10 años'
            },
            { 
              id: '2',
              name: 'Dra. María Gómez',
              type: 'Veterinario',
              specialty: 'Cirugía',
              rating: 4.8,
              image: require('../assets/images/app-usage.png'),
              experience: '8 años'
            }
          ];
          break;
        case '2': // Peluquerías
          providers = [
            { 
              id: '4',
              name: 'Peluquería Canina Happy Dog',
              type: 'Peluquería',
              specialty: 'Peluquería canina y felina',
              rating: 4.7,
              image: require('../assets/images/app-usage.png'),
              services: ['Corte', 'Baño', 'Uñas']
            },
            { 
              id: '5',
              name: 'Pet Style',
              type: 'Peluquería',
              specialty: 'Estética animal',
              rating: 4.5,
              image: require('../assets/images/app-usage.png'),
              services: ['Corte', 'Baño especial', 'Tratamientos']
            }
          ];
          break;
        case '3': // Pet Shops
          providers = [
            { 
              id: '6',
              name: 'Pet Shop Huellitas',
              type: 'PetShop',
              specialty: 'Alimentos y accesorios',
              rating: 4.6,
              image: require('../assets/images/app-usage.png'),
              services: ['Venta', 'Entregas', 'Asesoría']
            },
            { 
              id: '7',
              name: 'Animal House',
              type: 'PetShop',
              specialty: 'Productos premium',
              rating: 4.9,
              image: require('../assets/images/app-usage.png'),
              services: ['Venta', 'Suscripciones']
            }
          ];
          break;
        case '4': // Centros Veterinarios
          providers = [
            { 
              id: '8',
              name: 'Centro Veterinario Vida Animal',
              type: 'Centro Veterinario',
              specialty: 'Atención integral',
              rating: 4.9,
              image: require('../assets/images/app-usage.png'),
              services: ['Consultas', 'Cirugías', 'Hospitalización', 'Laboratorio']
            },
            { 
              id: '9',
              name: 'Hospital Veterinario 24h',
              type: 'Centro Veterinario',
              specialty: 'Emergencias 24 horas',
              rating: 4.8,
              image: require('../assets/images/app-usage.png'),
              services: ['Emergencias', 'Cuidados intensivos', 'Cirugías']
            }
          ];
          break;
        default:
          providers = [];
      }
      
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
   * Crea una nueva cita
   * @param {Object} appointmentData Datos de la cita
   * @returns {Promise<Object>} Resultado de la operación
   */
  createAppointment: async (appointmentData) => {
    try {
      // En un entorno real, esto se enviaría al backend
      // Por ahora simulamos una respuesta exitosa
      console.log('Datos de la cita a crear:', appointmentData);
      
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return { 
        success: true, 
        data: {
          id: Math.random().toString(36).substring(2, 9),
          ...appointmentData,
          createdAt: new Date().toISOString()
        } 
      };
    } catch (error) {
      console.error('Error al crear cita:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al crear la cita' 
      };
    }
  },

  /**
   * Obtiene los servicios disponibles para citas
   * @returns {Promise<Object>} Resultado de la operación
   */
  getAvailableServices: async () => {
    try {
      // En un entorno real, esto vendría del backend
      // Por ahora devolvemos servicios estáticos
      const services = [
        { id: '1', name: 'Consulta General', icon: 'medkit-outline', color: '#1E88E5' },
        { id: '2', name: 'Vacunación', icon: 'shield-checkmark-outline', color: '#4CAF50' },
        { id: '3', name: 'Desparasitación', icon: 'bug-outline', color: '#FF9800' },
        { id: '4', name: 'Peluquería', icon: 'cut-outline', color: '#9C27B0' },
        { id: '5', name: 'Revisión dental', icon: 'brush-outline', color: '#607D8B' }
      ];
      
      return { success: true, data: services };
    } catch (error) {
      console.error('Error al obtener servicios disponibles:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener servicios disponibles' 
      };
    }
  }
};

export default citaService;
