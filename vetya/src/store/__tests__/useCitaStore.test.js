import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock de los servicios API - DEBE estar antes de importar el store
jest.mock('../../services/citaService', () => ({
  __esModule: true,
  default: {
    getUserAppointments: jest.fn(),
    getProviderTypes: jest.fn(),
    getProvidersByType: jest.fn(),
    getProviderServices: jest.fn(),
    getAvailableDates: jest.fn(),
    getAvailableTimeSlots: jest.fn(),
    createAppointment: jest.fn(),
    updateAppointmentStatus: jest.fn(),
    getConsultaGeneralProviders: jest.fn(),
    getProviderAvailability: jest.fn(),
    verifySlotAvailability: jest.fn(),
    getAvailableVets: jest.fn(),
    getAvailableServices: jest.fn(),
  },
}));

// Importar después del mock
import useCitaStore from '../useCitaStore';
import citaService from '../../services/citaService';

describe('useCitaStore - Cliente agenda cita', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store
    const { result } = renderHook(() => useCitaStore());
    act(() => {
      result.current.resetCitaState();
    });
  });

  describe('Flujo completo de Creación de Cita', () => {
    test('debe obtener tipos de prestadores exitosamente', async () => {
      const mockProviderTypes = [
        { id: '1', name: 'Veterinario', icon: 'medical' },
        { id: '2', name: 'Centro Veterinario', icon: 'business' }
      ];

      citaService.getProviderTypes.mockResolvedValueOnce({
        success: true,
        data: mockProviderTypes
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        const response = await result.current.fetchProviderTypes();
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockProviderTypes);
      });

      expect(result.current.providerTypes).toEqual(mockProviderTypes);
      expect(result.current.isLoading).toBe(false);
    });

    test('debe obtener prestadores por tipo', async () => {
      const mockProviders = [
        {
          _id: 'vet1',
          nombre: 'Dr. Juan Pérez',
          tipo: 'Veterinario',
          especialidades: ['Medicina General']
        }
      ];

      citaService.getProvidersByType.mockResolvedValueOnce({
        success: true,
        data: mockProviders
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        const response = await result.current.fetchProvidersByType('Veterinario');
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockProviders);
      });

      expect(result.current.providersByType).toEqual(mockProviders);
    });

    test('debe obtener servicios de un prestador', async () => {
      const mockServices = [
        { _id: 'serv1', nombre: 'Consulta General', precio: 500, duracion: 30 }
      ];

      citaService.getProviderServices.mockResolvedValueOnce({
        success: true,
        data: mockServices
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        const response = await result.current.getProviderServices('vet1');
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockServices);
      });

      expect(result.current.availableServices).toEqual(mockServices);
    });

    test('debe obtener fechas disponibles', async () => {
      const mockDates = [
        { id: '1', date: '2025-01-20', dayName: 'Lunes', day: 20, month: 'Enero' }
      ];

      citaService.getAvailableDates.mockResolvedValueOnce({
        success: true,
        data: mockDates
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        const response = await result.current.fetchAvailableDates();
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockDates);
      });

      expect(result.current.availableDates).toEqual(mockDates);
    });

    test('debe obtener horarios disponibles para una fecha, prestador y servicio', async () => {
      const mockTimes = [
        { id: '1', time: '10:00', endTime: '10:30', available: true },
        { id: '2', time: '11:00', endTime: '11:30', available: false }
      ];

      citaService.getAvailableTimeSlots.mockResolvedValueOnce({
        success: true,
        data: mockTimes
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        const response = await result.current.fetchAvailableTimes('2025-01-20', 'vet1', 'serv1');
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockTimes);
      });

      expect(result.current.availableTimes).toEqual(mockTimes);
    });

    test('debe crear una cita exitosamente', async () => {
      const appointmentData = {
        mascota: 'mascota123',
        prestador: 'vet1',
        servicio: 'serv1',
        fecha: '2025-01-20T10:00:00Z',
        horaInicio: '10:00',
        horaFin: '10:30',
        motivo: 'Consulta general',
        estado: 'Pendiente',
        ubicacion: 'Domicilio'
      };

      const mockCita = {
        _id: 'cita123',
        ...appointmentData,
        prestador: {
          nombre: 'Rocky',
          especie: 'Perro',
        },
      };

      citaService.createAppointment.mockResolvedValueOnce({
        success: true,
        data: mockCita,
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        const response = await result.current.createAppointment(appointmentData);
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockCita);
      });

      expect(result.current.userAppointments).toContainEqual(mockCita);
      expect(result.current.isLoading).toBe(false);
    });

  });

  describe('Consulta de Citas', () => {
    test('debe obtener todas las citas del usuario y clasificarlas', async () => {
      const mockCitas = [
        { _id: 'cita1', estado: 'Pendiente', fecha: '2025-01-25' },
        { _id: 'cita2', estado: 'Confirmada', fecha: '2025-01-20' },
        { _id: 'cita3', estado: 'Completada', fecha: '2025-01-10' },
        { _id: 'cita4', estado: 'Cancelada', fecha: '2025-01-15' }
      ];

      citaService.getUserAppointments.mockResolvedValueOnce({
        success: true,
        data: mockCitas
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.fetchUserAppointments();
      });

      // Verificar que las citas se clasifican correctamente
      expect(result.current.upcomingAppointments).toHaveLength(2);
      expect(result.current.pastAppointments).toHaveLength(2);
      expect(result.current.isLoading).toBe(false);
    });

    test('debe ordenar citas próximas por fecha ascendente', async () => {
      const mockCitas = [
        { _id: 'cita1', estado: 'Pendiente', fecha: '2025-01-25' },
        { _id: 'cita2', estado: 'Confirmada', fecha: '2025-01-20' }
      ];

      citaService.getUserAppointments.mockResolvedValueOnce({
        success: true,
        data: mockCitas
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.fetchUserAppointments();
      });

      // La cita con fecha más cercana debe estar primero
      expect(result.current.upcomingAppointments[0]._id).toBe('cita2');
      expect(result.current.upcomingAppointments[1]._id).toBe('cita1');
    });

    test('debe ordenar historial por fecha descendente', async () => {
      const mockCitas = [
        { _id: 'cita1', estado: 'Completada', fecha: '2025-01-10' },
        { _id: 'cita2', estado: 'Cancelada', fecha: '2025-01-15' }
      ];

      citaService.getUserAppointments.mockResolvedValueOnce({
        success: true,
        data: mockCitas
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.fetchUserAppointments();
      });

      // La cita más reciente en el historial debe estar primero
      expect(result.current.pastAppointments[0]._id).toBe('cita2');
      expect(result.current.pastAppointments[1]._id).toBe('cita1');
    });
  });

  describe('Actualización de Estado de Cita', () => {
    test('debe actualizar el estado de una cita y refrescar la lista', async () => {
      // Primero cargar citas
      const mockCitas = [
        { _id: 'cita1', estado: 'Pendiente', fecha: '2025-01-25' }
      ];

      citaService.getUserAppointments.mockResolvedValue({
        success: true,
        data: mockCitas
      });

      citaService.updateAppointmentStatus.mockResolvedValueOnce({
        success: true,
        data: { _id: 'cita1', estado: 'Cancelada' }
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.fetchUserAppointments();
      });

      await act(async () => {
        const response = await result.current.updateAppointmentStatus('cita1', 'Cancelada');
        expect(response.success).toBe(true);
      });

      expect(citaService.getUserAppointments).toHaveBeenCalledTimes(2);
    });
  });

  describe('Manejo de Errores', () => {
    test('debe manejar error al obtener tipos de prestadores', async () => {
      const errorMessage = 'Error de conexión';
      citaService.getProviderTypes.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        const response = await result.current.fetchProviderTypes();
        expect(response.success).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });

    test('debe manejar error al obtener citas del usuario', async () => {
      const errorMessage = 'Error al obtener citas';
      citaService.getUserAppointments.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        const response = await result.current.fetchUserAppointments();
        expect(response.success).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Reset de Estado', () => {
    test('debe resetear el estado correctamente', () => {
      const { result } = renderHook(() => useCitaStore());

      // Agregar datos al store
      act(() => {
        result.current.resetCitaState();
      });

      expect(result.current.availableDates).toEqual([]);
      expect(result.current.availableTimes).toEqual([]);
      expect(result.current.providerTypes).toEqual([]);
      expect(result.current.selectedProvider).toBe(null);
      expect(result.current.upcomingAppointments).toEqual([]);
      expect(result.current.pastAppointments).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });
});
