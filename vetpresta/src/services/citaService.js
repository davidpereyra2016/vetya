import axios from '../config/axios'; // Usar la misma instancia que api.js

/**
 * Servicios para gestionar las citas y reservas con diferentes prestadores
 * Específico para la aplicación de prestadores (veterinarios/peluqueros/etc)
 */
const citaService = {
  /**
   * NOTA: Los siguientes métodos son stubs vacíos para evitar errores de referencia
   * en useCitaStore.js que fue compartido desde la app de cliente
   * La app de prestadores no debería usar estos métodos pero se mantienen
   * para evitar errores hasta que se limpie el store
   */
  getAvailableDates: async () => ({ success: false, error: 'No implementado en app de prestadores' }),
  getAvailableTimes: async () => ({ success: false, error: 'No implementado en app de prestadores' }),
  getAvailableVets: async () => ({ success: false, error: 'No implementado en app de prestadores' }),
  getAvailableServices: async () => ({ success: false, error: 'No implementado en app de prestadores' }),
  createAppointment: async () => ({ success: false, error: 'No implementado en app de prestadores' }),
  getProviderTypes: async () => ({ success: false, error: 'No implementado en app de prestadores' }),
  getProvidersByType: async () => ({ success: false, error: 'No implementado en app de prestadores' }),
  getUserAppointments: async () => ({ success: false, error: 'No implementado en app de prestadores' }),

  /**
   * Obtiene las citas de un prestador filtradas por estado
   * @param {string} prestadorId ID del prestador
   * @param {string} estado Estado de las citas (Pendiente, Confirmada, Completada, Cancelada)
   * @returns {Promise<Object>} Resultado de la operación
   */
  getCitasByProvider: async (prestadorId, estado = null) => {
    try {
      // Construir la URL con querystring si hay estado
      let url = `/citas/prestador/${prestadorId}`;
      if (estado) {
        url += `?estado=${estado}`;
      }
      
      // Realizar la petición - el interceptor de axios se encarga de añadir el token
      const response = await axios.get(url);
      
      return { success: true, data: response.data };
    } catch (error) {
      // Si es un 404, significa que no hay citas, no es un error real
      if (error.response?.status === 404) {
        return { success: true, data: [] };
      }
      
      console.error('Error al obtener citas del prestador:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener citas del prestador' 
      };
    }
  },
  
  /**
   * Actualiza el estado de una cita (Confirmar, Completar, Cancelar)
   * @param {string} prestadorId ID del prestador
   * @param {string} citaId ID de la cita a actualizar
   * @param {string} estado Nuevo estado (Confirmada, Completada, Cancelada)
   * @returns {Promise<Object>} Resultado de la operación
   */
  updateCitaStatus: async (prestadorId, citaId, estado) => {
    try {
      // Validar el estado
      if (!['Confirmada', 'Completada', 'Cancelada'].includes(estado)) {
        return { success: false, error: 'Estado no válido' };
      }
      
      // URL para el endpoint de actualización
      const url = `/citas/prestador/${prestadorId}/cita/${citaId}`;
      
      // Realizar la petición - el interceptor de axios se encarga de añadir el token
      const response = await axios.patch(url, { estado });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al actualizar estado de cita:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al actualizar estado de la cita' 
      };
    }
  },
  
  /**
   * Obtiene un resumen de citas para el dashboard del prestador
   * @param {string} prestadorId ID del prestador
   * @returns {Promise<Object>} Resultado de la operación con resumen de citas
   */
  getDashboardSummary: async (prestadorId) => {
    try {
      // URL para el endpoint de resumen
      const url = `/citas/prestador/${prestadorId}/resumen`;
      
      // Realizar la petición - el interceptor de axios se encarga de añadir el token
      const response = await axios.get(url);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al obtener resumen del dashboard:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener resumen del dashboard' 
      };
    }
  },
  /**
   * Verifica y auto-cancela las citas pendientes vencidas basado en la hora local del dispositivo
   * @returns {Promise<Object>} Resultado de la operación
   */
  verificarCitasVencidas: async () => {
    try {
      // Obtener la hora local del dispositivo
      const horaLocal = new Date().toISOString();
      
      // Llamar al endpoint que verifica las citas vencidas
      const response = await axios.post('/citas/verificar-citas-vencidas', { horaLocal });
      
      return { 
        success: true, 
        data: response.data,
        citasCanceladas: response.data.citasCanceladas || 0
      };
    } catch (error) {
      console.error('Error al verificar citas vencidas:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al verificar citas vencidas' 
      };
    }
  }
};

export default citaService;
