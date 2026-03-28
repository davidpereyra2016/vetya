/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useEmergencyStore from '../useEmergencyStore';
import * as emergenciaAPI from '../../services/api';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock de los servicios API
jest.mock('../../services/api', () => ({
  emergenciaService: {
    getByPrestador: jest.fn(),
    getById: jest.fn(),
    acceptEmergency: jest.fn(),
    updateStatus: jest.fn(),
    rejectEmergency: jest.fn(),
  },
}));

describe('useEmergencyStore - Prestador recibe emergencia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset del store
    const { result } = renderHook(() => useEmergencyStore());
    act(() => {
      result.current.setEmergencias([]);
    });
  });

  describe('Recepción de Emergencias', () => {
    test('debe obtener emergencias asignadas al prestador', async () => {
      const mockEmergencias = [
        {
          _id: 'emergencia1',
          clienteId: {
            nombre: 'Juan Pérez',
            telefono: '1122334455',
          },
          mascotaId: {
            nombre: 'Rocky',
            especie: 'Perro',
            raza: 'Golden Retriever',
          },
          descripcion: 'Se lastimó una pata',
          gravedad: 'moderada',
          estado: 'asignada',
          ubicacion: {
            lat: -34.6037,
            lng: -58.3816,
          },
          distancia: 2.5,
          tiempoEstimado: 15,
          fecha: new Date().toISOString(),
        },
      ];

      emergenciaAPI.emergenciaService.getByPrestador.mockResolvedValue({
        success: true,
        data: mockEmergencias,
      });

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        await result.current.fetchEmergenciesByPrestador('prestador123');
      });

      await waitFor(() => {
        expect(emergenciaAPI.emergenciaService.getByPrestador).toHaveBeenCalledWith('prestador123');
        expect(result.current.emergencias).toEqual(mockEmergencias);
        expect(result.current.emergencias.length).toBe(1);
        expect(result.current.emergencias[0].estado).toBe('asignada');
      });
    });

    test('debe recibir notificación de nueva emergencia cercana', async () => {
      const mockNuevaEmergencia = {
        _id: 'emergencia_nueva',
        clienteId: {
          nombre: 'María García',
        },
        mascotaId: {
          nombre: 'Luna',
          especie: 'Gato',
        },
        descripcion: 'Problemas respiratorios',
        gravedad: 'grave',
        estado: 'solicitada',
        ubicacion: {
          lat: -34.6050,
          lng: -58.3820,
        },
        distancia: 1.2,
        tiempoEstimado: 8,
      };

      emergenciaAPI.emergenciaService.getById.mockResolvedValue({
        success: true,
        data: mockNuevaEmergencia,
      });

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        await result.current.fetchEmergencyById('emergencia_nueva');
      });

      await waitFor(() => {
        expect(emergenciaAPI.emergenciaService.getById).toHaveBeenCalledWith('emergencia_nueva');
        expect(result.current.emergenciaActual).toEqual(mockNuevaEmergencia);
        expect(result.current.emergenciaActual.gravedad).toBe('grave');
        expect(result.current.emergenciaActual.distancia).toBeLessThan(2);
      });
    });
  });

  describe('Aceptación de Emergencias', () => {
    test('debe aceptar una emergencia exitosamente', async () => {
      const mockResponse = {
        success: true,
        data: {
          _id: 'emergencia123',
          estado: 'aceptada',
          veterinarioAsignado: 'prestador123',
          tiempoEstimado: 15,
        },
        message: 'Emergencia aceptada correctamente',
      };

      emergenciaAPI.emergenciaService.acceptEmergency.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEmergencyStore());

      const acceptData = {
        prestadorId: 'prestador123',
        tiempoEstimado: 15,
        costoEstimado: 3000,
      };

      await act(async () => {
        await result.current.acceptEmergency('emergencia123', acceptData);
      });

      await waitFor(() => {
        expect(emergenciaAPI.emergenciaService.acceptEmergency).toHaveBeenCalledWith(
          'emergencia123',
          acceptData
        );
        expect(result.current.error).toBe(null);
        expect(result.current.isLoading).toBe(false);
      });
    });

    test('debe manejar error si emergencia ya fue asignada', async () => {
      emergenciaAPI.emergenciaService.acceptEmergency.mockRejectedValue(
        new Error('Esta emergencia ya fue asignada a otro veterinario')
      );

      const { result } = renderHook(() => useEmergencyStore());

      const acceptData = {
        prestadorId: 'prestador123',
        tiempoEstimado: 15,
      };

      await act(async () => {
        await result.current.acceptEmergency('emergencia123', acceptData);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error).toContain('ya fue asignada');
      });
    });

    test('debe rechazar una emergencia con motivo', async () => {
      const mockResponse = {
        success: true,
        message: 'Emergencia rechazada',
      };

      emergenciaAPI.emergenciaService.rejectEmergency.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        await result.current.rejectEmergency('emergencia123', 'Fuera de mi área de cobertura');
      });

      await waitFor(() => {
        expect(emergenciaAPI.emergenciaService.rejectEmergency).toHaveBeenCalledWith(
          'emergencia123',
          'Fuera de mi área de cobertura'
        );
        expect(result.current.error).toBe(null);
      });
    });
  });

  describe('Actualización de Estados', () => {
    test('debe actualizar estado a "en_camino"', async () => {
      const mockResponse = {
        success: true,
        data: {
          _id: 'emergencia123',
          estado: 'en_camino',
        },
      };

      emergenciaAPI.emergenciaService.updateStatus.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        await result.current.updateEmergencyStatus('emergencia123', 'en_camino');
      });

      await waitFor(() => {
        expect(emergenciaAPI.emergenciaService.updateStatus).toHaveBeenCalledWith(
          'emergencia123',
          'en_camino'
        );
        expect(result.current.error).toBe(null);
      });
    });

    test('debe actualizar estado a "en_atencion"', async () => {
      const mockResponse = {
        success: true,
        data: {
          _id: 'emergencia123',
          estado: 'en_atencion',
          horaInicio: new Date().toISOString(),
        },
      };

      emergenciaAPI.emergenciaService.updateStatus.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        await result.current.updateEmergencyStatus('emergencia123', 'en_atencion');
      });

      await waitFor(() => {
        expect(emergenciaAPI.emergenciaService.updateStatus).toHaveBeenCalledWith(
          'emergencia123',
          'en_atencion'
        );
      });
    });

    test('debe actualizar estado a "completada" con notas', async () => {
      const mockResponse = {
        success: true,
        data: {
          _id: 'emergencia123',
          estado: 'completada',
          horaFin: new Date().toISOString(),
          notas: 'Tratamiento aplicado exitosamente',
        },
      };

      emergenciaAPI.emergenciaService.updateStatus.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        await result.current.updateEmergencyStatus('emergencia123', 'completada', {
          notas: 'Tratamiento aplicado exitosamente',
        });
      });

      await waitFor(() => {
        expect(emergenciaAPI.emergenciaService.updateStatus).toHaveBeenCalled();
        expect(result.current.error).toBe(null);
      });
    });
  });

  describe('Toggle de Disponibilidad', () => {
    test('debe activar disponibilidad para emergencias', async () => {
      const { result } = renderHook(() => useEmergencyStore());

      // Estado inicial
      expect(result.current.availableForEmergencies).toBe(false);

      act(() => {
        result.current.toggleAvailability();
      });

      await waitFor(() => {
        expect(result.current.availableForEmergencies).toBe(true);
      });
    });

    test('debe desactivar disponibilidad para emergencias', async () => {
      const { result } = renderHook(() => useEmergencyStore());

      // Activar primero
      act(() => {
        result.current.toggleAvailability();
      });

      // Luego desactivar
      act(() => {
        result.current.toggleAvailability();
      });

      await waitFor(() => {
        expect(result.current.availableForEmergencies).toBe(false);
      });
    });
  });

  describe('Filtrado de Emergencias', () => {
    test('debe filtrar emergencias por estado', async () => {
      const mockEmergencias = [
        {
          _id: 'emergencia1',
          estado: 'aceptada',
        },
        {
          _id: 'emergencia2',
          estado: 'en_camino',
        },
        {
          _id: 'emergencia3',
          estado: 'completada',
        },
      ];

      emergenciaAPI.emergenciaService.getByPrestador.mockResolvedValue({
        success: true,
        data: mockEmergencias,
      });

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        await result.current.fetchEmergenciesByPrestador('prestador123');
      });

      await waitFor(() => {
        const emergenciasActivas = result.current.emergencias.filter(
          (e) => e.estado !== 'completada' && e.estado !== 'cancelada'
        );
        expect(emergenciasActivas.length).toBe(2);
      });
    });

    test('debe ordenar emergencias por gravedad', async () => {
      const mockEmergencias = [
        {
          _id: 'emergencia1',
          gravedad: 'leve',
        },
        {
          _id: 'emergencia2',
          gravedad: 'grave',
        },
        {
          _id: 'emergencia3',
          gravedad: 'moderada',
        },
      ];

      emergenciaAPI.emergenciaService.getByPrestador.mockResolvedValue({
        success: true,
        data: mockEmergencias,
      });

      const { result } = renderHook(() => useEmergencyStore());

      await act(async () => {
        await result.current.fetchEmergenciesByPrestador('prestador123');
      });

      await waitFor(() => {
        const emergenciasOrdenadas = result.current.emergencias.sort((a, b) => {
          const orden = { grave: 3, moderada: 2, leve: 1 };
          return orden[b.gravedad] - orden[a.gravedad];
        });
        expect(emergenciasOrdenadas[0].gravedad).toBe('grave');
      });
    });
  });
});
