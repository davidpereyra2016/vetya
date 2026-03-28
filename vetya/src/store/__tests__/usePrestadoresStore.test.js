/**
 * @jest-environment node
 */

import { renderHook, act } from '@testing-library/react-native';

jest.mock('../../services/prestadoresService', () => ({
  __esModule: true,
  getAllPrestadores: jest.fn(),
  getFeaturedPrestadores: jest.fn(),
  getPrestadorById: jest.fn(),
  getNearbyPrestadores: jest.fn(),
  getPrestadorStats: jest.fn(),
}));

import usePrestadoresStore from '../usePrestadoresStore';
import * as prestadoresService from '../../services/prestadoresService';

describe('usePrestadoresStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePrestadoresStore.setState({
      prestadores: [],
      prestadoresDestacados: [],
      prestadorCercanos: [],
      prestadorActual: null,
      isLoading: false,
      error: null,
    });
  });

  describe('fetchAllPrestadores', () => {
    test('debe obtener todos los prestadores', async () => {
      const mockPrestadores = [
        { _id: '1', nombre: 'Dr. Juan', tipo: 'Veterinario' },
        { _id: '2', nombre: 'Clínica Vet', tipo: 'Centro Veterinario' },
      ];

      prestadoresService.getAllPrestadores.mockResolvedValueOnce(mockPrestadores);

      const { result } = renderHook(() => usePrestadoresStore());

      let response;
      await act(async () => {
        response = await result.current.fetchAllPrestadores();
      });

      expect(response).toEqual(mockPrestadores);
      expect(result.current.prestadores).toEqual(mockPrestadores);
      expect(result.current.isLoading).toBe(false);
    });

    test('debe manejar error al obtener prestadores', async () => {
      prestadoresService.getAllPrestadores.mockRejectedValueOnce(new Error('Error de red'));

      const { result } = renderHook(() => usePrestadoresStore());

      let response;
      await act(async () => {
        response = await result.current.fetchAllPrestadores();
      });

      expect(response).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('fetchPrestadoresDestacados', () => {
    test('debe obtener prestadores destacados con límite por defecto', async () => {
      const mockDestacados = [
        { _id: '1', nombre: 'Dr. Juan', destacado: true },
        { _id: '2', nombre: 'Dra. María', destacado: true },
        { _id: '3', nombre: 'Dr. Carlos', destacado: true },
        { _id: '4', nombre: 'Dra. Ana', destacado: true },
      ];

      prestadoresService.getFeaturedPrestadores.mockResolvedValueOnce(mockDestacados);

      const { result } = renderHook(() => usePrestadoresStore());

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadoresDestacados();
      });

      expect(result.current.prestadoresDestacados.length).toBeLessThanOrEqual(4);
      expect(result.current.prestadoresDestacados.length).toBeGreaterThanOrEqual(3);
    });

    test('debe respetar el límite especificado', async () => {
      const mockDestacados = Array.from({ length: 10 }, (_, i) => ({
        _id: `${i}`,
        nombre: `Dr. ${i}`,
        destacado: true,
      }));

      prestadoresService.getFeaturedPrestadores.mockResolvedValueOnce(mockDestacados);

      const { result } = renderHook(() => usePrestadoresStore());

      await act(async () => {
        await result.current.fetchPrestadoresDestacados(6);
      });

      expect(result.current.prestadoresDestacados.length).toBeLessThanOrEqual(6);
    });

    test('debe manejar lista vacía', async () => {
      prestadoresService.getFeaturedPrestadores.mockResolvedValueOnce([]);

      const { result } = renderHook(() => usePrestadoresStore());

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadoresDestacados();
      });

      expect(response).toEqual([]);
      expect(result.current.prestadoresDestacados).toEqual([]);
    });
  });

  describe('fetchPrestadorById', () => {
    test('debe obtener prestador por ID', async () => {
      const mockPrestador = {
        _id: 'prestador123',
        nombre: 'Dr. Juan Pérez',
        tipo: 'Veterinario',
      };

      prestadoresService.getPrestadorById.mockResolvedValueOnce(mockPrestador);

      const { result } = renderHook(() => usePrestadoresStore());

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadorById('prestador123');
      });

      expect(response).toEqual(mockPrestador);
      expect(result.current.prestadorActual).toEqual(mockPrestador);
    });

    test('debe manejar error al obtener prestador', async () => {
      prestadoresService.getPrestadorById.mockRejectedValueOnce(
        new Error('Prestador no encontrado')
      );

      const { result } = renderHook(() => usePrestadoresStore());

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadorById('invalid-id');
      });

      expect(response).toBe(null);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('fetchPrestadoresCercanos', () => {
    test('debe obtener prestadores cercanos', async () => {
      const mockCercanos = [
        { _id: '1', nombre: 'Vet Cerca 1', distancia: 2.5 },
        { _id: '2', nombre: 'Vet Cerca 2', distancia: 5.0 },
      ];

      prestadoresService.getNearbyPrestadores.mockResolvedValueOnce(mockCercanos);

      const { result } = renderHook(() => usePrestadoresStore());

      const coords = { latitude: -34.6037, longitude: -58.3816 };

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadoresCercanos(coords);
      });

      expect(response).toEqual(mockCercanos);
      expect(result.current.prestadorCercanos).toEqual(mockCercanos);
    });

    test('debe usar radio personalizado', async () => {
      prestadoresService.getNearbyPrestadores.mockResolvedValueOnce([]);

      const { result } = renderHook(() => usePrestadoresStore());

      const coords = { latitude: -34.6037, longitude: -58.3816 };

      await act(async () => {
        await result.current.fetchPrestadoresCercanos(coords, 20);
      });

      expect(prestadoresService.getNearbyPrestadores).toHaveBeenCalledWith(coords, 20);
    });
  });

  describe('fetchPrestadoresPorTipo', () => {
    test('debe obtener prestadores por tipo', async () => {
      const mockPrestadores = [
        { _id: '1', nombre: 'Dr. Juan', tipo: 'Veterinario' },
        { _id: '2', nombre: 'Dra. María', tipo: 'Veterinario' },
      ];

      prestadoresService.getAllPrestadores.mockResolvedValueOnce(mockPrestadores);

      const { result } = renderHook(() => usePrestadoresStore());

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadoresPorTipo('Veterinario');
      });

      expect(response).toEqual(mockPrestadores);
      expect(prestadoresService.getAllPrestadores).toHaveBeenCalledWith({ tipo: 'Veterinario' });
    });
  });

  describe('fetchPrestadorStats', () => {
    test('debe obtener estadísticas del prestador', async () => {
      const mockStats = {
        totalPacientes: 150,
        promedioValoracion: 4.5,
        totalValoraciones: 50,
      };

      prestadoresService.getPrestadorStats.mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => usePrestadoresStore());

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadorStats('prestador123');
      });

      expect(response).toEqual(mockStats);
      expect(result.current.isLoading).toBe(false);
    });

    test('debe actualizar prestadorActual con stats si coincide el ID', async () => {
      const mockPrestador = { _id: 'prestador123', nombre: 'Dr. Juan' };
      const mockStats = { totalPacientes: 150 };

      prestadoresService.getPrestadorStats.mockResolvedValueOnce(mockStats);

      const { result } = renderHook(() => usePrestadoresStore());

      act(() => {
        usePrestadoresStore.setState({ prestadorActual: mockPrestador });
      });

      await act(async () => {
        await result.current.fetchPrestadorStats('prestador123');
      });

      expect(result.current.prestadorActual.stats).toEqual(mockStats);
    });

    test('debe manejar error al obtener stats', async () => {
      prestadoresService.getPrestadorStats.mockRejectedValueOnce(new Error('Error al obtener'));

      const { result } = renderHook(() => usePrestadoresStore());

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadorStats('prestador123');
      });

      expect(response).toBe(null);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('clearPrestadores', () => {
    test('debe limpiar el estado correctamente', () => {
      const { result } = renderHook(() => usePrestadoresStore());

      act(() => {
        usePrestadoresStore.setState({
          prestadores: [{ _id: '1' }],
          prestadoresDestacados: [{ _id: '2' }],
          prestadorCercanos: [{ _id: '3' }],
          prestadorActual: { _id: '4' },
          error: 'Algún error',
        });
      });

      act(() => {
        result.current.clearPrestadores();
      });

      expect(result.current.prestadores).toEqual([]);
      expect(result.current.prestadoresDestacados).toEqual([]);
      expect(result.current.prestadorCercanos).toEqual([]);
      expect(result.current.prestadorActual).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });
});
