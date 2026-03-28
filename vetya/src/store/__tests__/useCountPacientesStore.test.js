/**
 * @jest-environment node
 */

import { renderHook, act } from '@testing-library/react-native';

jest.mock('../../services/countPacientesService', () => ({
  __esModule: true,
  default: {
    getTotalPacientes: jest.fn(),
  },
}));

import useCountPacientesStore from '../useCountPacientesStore';
import countPacientesService from '../../services/countPacientesService';

describe('useCountPacientesStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCountPacientesStore.setState({
      totalPacientes: 0,
      desglosePacientes: { citas: 0, emergencias: 0 },
      isLoading: false,
      error: null,
    });
  });

  describe('fetchTotalPacientes', () => {
    test('debe obtener total de pacientes correctamente', async () => {
      const mockData = {
        success: true,
        data: {
          totalPacientes: 150,
          desglose: {
            citas: 100,
            emergencias: 50,
          },
        },
      };

      countPacientesService.getTotalPacientes.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useCountPacientesStore());

      let response;
      await act(async () => {
        response = await result.current.fetchTotalPacientes('prestador123');
      });

      expect(response.success).toBe(true);
      expect(result.current.totalPacientes).toBe(150);
      expect(result.current.desglosePacientes.citas).toBe(100);
      expect(result.current.desglosePacientes.emergencias).toBe(50);
      expect(result.current.isLoading).toBe(false);
    });

    test('debe manejar desglose vacío correctamente', async () => {
      const mockData = {
        success: true,
        data: {
          totalPacientes: 50,
          // Sin desglose
        },
      };

      countPacientesService.getTotalPacientes.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useCountPacientesStore());

      await act(async () => {
        await result.current.fetchTotalPacientes('prestador123');
      });

      expect(result.current.totalPacientes).toBe(50);
      expect(result.current.desglosePacientes).toEqual({ citas: 0, emergencias: 0 });
    });

    test('debe manejar error del servicio', async () => {
      const mockData = {
        success: false,
        error: 'No se pudo obtener los datos',
      };

      countPacientesService.getTotalPacientes.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useCountPacientesStore());

      let response;
      await act(async () => {
        response = await result.current.fetchTotalPacientes('prestador123');
      });

      expect(response.success).toBe(false);
      expect(result.current.error).toBe('No se pudo obtener los datos');
      expect(result.current.isLoading).toBe(false);
    });

    test('debe manejar excepción al obtener pacientes', async () => {
      countPacientesService.getTotalPacientes.mockRejectedValueOnce(
        new Error('Error de conexión')
      );

      const { result } = renderHook(() => useCountPacientesStore());

      let response;
      await act(async () => {
        response = await result.current.fetchTotalPacientes('prestador123');
      });

      expect(response.success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('resetState', () => {
    test('debe resetear el estado a valores iniciales', () => {
      const { result } = renderHook(() => useCountPacientesStore());

      act(() => {
        useCountPacientesStore.setState({
          totalPacientes: 200,
          desglosePacientes: { citas: 150, emergencias: 50 },
          isLoading: true,
          error: 'Algún error',
        });
      });

      expect(result.current.totalPacientes).toBe(200);

      act(() => {
        result.current.resetState();
      });

      expect(result.current.totalPacientes).toBe(0);
      expect(result.current.desglosePacientes).toEqual({ citas: 0, emergencias: 0 });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});
