import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock de los servicios - DEBE estar antes de importar el store
jest.mock('../../services/api', () => ({
  emergenciaService: {
    create: jest.fn(),
    getActiveEmergencies: jest.fn(),
    cancelEmergency: jest.fn(),
    assignVetToEmergency: jest.fn(),
    confirmVetArrival: jest.fn(),
    checkEmergencyExpiration: jest.fn(),
    uploadEmergencyImages: jest.fn(),
  },
  veterinarioService: {
    getAvailableForEmergencies: jest.fn(),
    getAvailableVetsWithLocation: jest.fn(),
  },
}));

// Importar después del mock
import useEmergencyStore from '../useEmergencyStore';
import { emergenciaService, veterinarioService } from '../../services/api';

describe('useEmergencyStore - Cliente crea emergencia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset del store
    const { result } = renderHook(() => useEmergencyStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Creación de Emergencia', () => {
    test('debe crear una emergencia exitosamente', async () => {
      const mockEmergencia = {
        _id: 'emergencia123',
        mascota: 'mascota123',
        descripcion: 'Mi perro se lastimó una pata',
        tipoEmergencia: 'Trauma',
        nivelUrgencia: 'Media',
        ubicacion: {
          coordenadas: {
            latitud: -34.6037,
            longitud: -58.3816,
          },
        },
        estado: 'Solicitada',
        emergencyMode: 'mascota',
      };

      emergenciaService.create.mockResolvedValueOnce({
        success: true,
        data: mockEmergencia,
      });

      const { result } = renderHook(() => useEmergencyStore());

      const emergenciaData = {
        mascota: 'mascota123',
        descripcion: 'Mi perro se lastimó una pata',
        tipoEmergencia: 'Trauma',
        nivelUrgencia: 'Media',
        emergencyMode: 'mascota',
        ubicacion: {
          coordenadas: {
            latitud: -34.6037,
            longitud: -58.3816,
          },
        },
      };

      await act(async () => {
        const response = await result.current.createEmergency(emergenciaData, []);
        expect(response.success).toBe(true);
      });

      expect(result.current.selectedEmergency).toEqual(mockEmergencia);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('debe manejar error al crear emergencia', async () => {
      emergenciaService.create.mockResolvedValueOnce({
        success: false,
        error: 'Error al crear emergencia',
      });

      const { result } = renderHook(() => useEmergencyStore());

      const emergenciaData = {
        mascota: 'mascota123',
        descripcion: 'Emergencia test',
        tipoEmergencia: 'Otro',
        nivelUrgencia: 'Alta',
        emergencyMode: 'mascota',
        ubicacion: {
          coordenadas: {
            latitud: -34.6037,
            longitud: -58.3816,
          },
        },
      };

      await act(async () => {
        const response = await result.current.createEmergency(emergenciaData, []);
        expect(response.success).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });

    test('debe cargar veterinarios disponibles cercanos', async () => {
      const mockVeterinarios = [
        {
          id: 'vet1',
          name: 'Dr. Juan Pérez',
          specialty: 'Cirugía, Medicina General',
          rating: 4.8,
          distance: '2.5 km',
          distanceValue: 2.5,
          estimatedTime: '15 min',
          estimatedTimeValue: 15,
          price: 5000,
          coordinate: {
            latitude: -34.6050,
            longitude: -58.3820,
          },
        },
      ];

      veterinarioService.getAvailableVetsWithLocation.mockResolvedValueOnce({
        success: true,
        data: mockVeterinarios,
      });

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        const vets = await result.current.loadVetsWithLocation(-34.6037, -58.3816);
        expect(vets).toHaveLength(1);
      });

      expect(result.current.availableVets).toHaveLength(1);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Seguimiento de Emergencia', () => {
    test('debe cargar emergencias activas del usuario', async () => {
      const mockEmergencias = [
        {
          _id: 'emergencia1',
          estado: 'En atención',
          mascota: { nombre: 'Rocky' },
          fechaSolicitud: new Date().toISOString(),
        },
        {
          _id: 'emergencia2',
          estado: 'Solicitada',
          mascota: { nombre: 'Luna' },
          fechaSolicitud: new Date().toISOString(),
        },
      ];

      emergenciaService.getActiveEmergencies.mockResolvedValueOnce({
        success: true,
        data: mockEmergencias,
      });

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        const emergencias = await result.current.loadActiveEmergencies();
        expect(emergencias).toHaveLength(2);
      });

      expect(result.current.activeEmergencies).toEqual(mockEmergencias);
    });

    test('debe establecer una emergencia seleccionada', () => {
      const mockEmergencia = {
        _id: 'emergencia123',
        estado: 'Asignada',
        veterinario: {
          nombre: 'Dr. Juan Pérez',
          telefono: '1122334455',
        },
      };

      const { result } = renderHook(() => useEmergencyStore());

      act(() => {
        result.current.setSelectedEmergency(mockEmergencia);
      });

      expect(result.current.selectedEmergency).toEqual(mockEmergencia);
      expect(result.current.selectedEmergency.estado).toBe('Asignada');
    });
  });

  describe('Cancelación de Emergencia', () => {
    test('debe cancelar una emergencia exitosamente', async () => {
      emergenciaService.cancelEmergency.mockResolvedValueOnce({
        success: true,
        message: 'Emergencia cancelada correctamente',
      });

      const { result } = renderHook(() => useEmergencyStore());

      // Agregar emergencia al estado
      act(() => {
        result.current.activeEmergencies = [{ _id: 'emergencia123', estado: 'Solicitada' }];
      });

      await act(async () => {
        const response = await result.current.cancelEmergency('emergencia123');
        expect(response.success).toBe(true);
      });

      expect(result.current.error).toBe(null);
    });

    test('debe manejar error al cancelar emergencia', async () => {
      emergenciaService.cancelEmergency.mockResolvedValueOnce({
        success: false,
        error: 'No se puede cancelar emergencia en atención',
      });

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        const response = await result.current.cancelEmergency('emergencia123');
        expect(response.success).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Asignación de Veterinario', () => {
    test('debe asignar un veterinario a una emergencia', async () => {
      emergenciaService.assignVetToEmergency.mockResolvedValueOnce({
        success: true,
        data: { _id: 'emergencia123', veterinario: 'vet1', estado: 'Asignada' },
      });

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        const response = await result.current.assignVetToEmergency('emergencia123', 'vet1');
        expect(response.success).toBe(true);
      });

      expect(result.current.error).toBe(null);
    });

    test('debe confirmar llegada del veterinario', async () => {
      emergenciaService.confirmVetArrival.mockResolvedValueOnce({
        success: true,
        data: { _id: 'emergencia123', estado: 'En atención', llegadaConfirmada: true },
      });

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        const response = await result.current.confirmVetArrival('emergencia123');
        expect(response.success).toBe(true);
      });

      expect(result.current.error).toBe(null);
    });
  });
});
