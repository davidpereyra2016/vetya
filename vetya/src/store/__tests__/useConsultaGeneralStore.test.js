/**
 * @jest-environment node
 */

import { renderHook, act } from '@testing-library/react-native';

jest.mock('../../services/consultaGeneralService', () => ({
  __esModule: true,
  default: {
    getPrestadoresConsultaGeneral: jest.fn(),
    getDisponibilidadPrestador: jest.fn(),
    crearConsultaGeneral: jest.fn(),
  },
}));

import useConsultaGeneralStore from '../useConsultaGeneralStore';
import consultaGeneralService from '../../services/consultaGeneralService';

describe('useConsultaGeneralStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useConsultaGeneralStore.setState({
      prestadores: [],
      selectedPrestador: null,
      disponibilidad: [],
      selectedFecha: null,
      selectedHorario: null,
      isLoading: false,
      error: null,
    });
  });

  describe('fetchPrestadoresConsultaGeneral', () => {
    test('debe obtener prestadores correctamente', async () => {
      const mockPrestadores = [
        { _id: '1', nombre: 'Dr. Juan', especialidades: ['Medicina General'] },
        { _id: '2', nombre: 'Dra. María', especialidades: ['Cirugía'] },
      ];

      consultaGeneralService.getPrestadoresConsultaGeneral.mockResolvedValueOnce(mockPrestadores);

      const { result } = renderHook(() => useConsultaGeneralStore());

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadoresConsultaGeneral();
      });

      expect(response.success).toBe(true);
      expect(result.current.prestadores).toEqual(mockPrestadores);
      expect(result.current.isLoading).toBe(false);
    });

    test('debe manejar error al obtener prestadores', async () => {
      consultaGeneralService.getPrestadoresConsultaGeneral.mockRejectedValueOnce(
        new Error('Error de red')
      );

      const { result } = renderHook(() => useConsultaGeneralStore());

      let response;
      await act(async () => {
        response = await result.current.fetchPrestadoresConsultaGeneral();
      });

      expect(response.success).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.prestadores).toEqual([]);
    });
  });

  describe('setSelectedPrestador', () => {
    test('debe seleccionar prestador y limpiar fecha/horario', () => {
      const { result } = renderHook(() => useConsultaGeneralStore());

      const prestador = { _id: '1', nombre: 'Dr. Juan' };

      act(() => {
        useConsultaGeneralStore.setState({
          selectedFecha: '2025-01-20',
          selectedHorario: '10:00',
        });
      });

      act(() => {
        result.current.setSelectedPrestador(prestador);
      });

      expect(result.current.selectedPrestador).toEqual(prestador);
      expect(result.current.selectedFecha).toBe(null);
      expect(result.current.selectedHorario).toBe(null);
    });
  });

  describe('fetchDisponibilidadPrestador', () => {
    test('debe obtener disponibilidad correctamente', async () => {
      const mockDisponibilidad = [
        { fecha: '2025-01-20T00:00:00.000Z', horarios: ['09:00', '10:00'] },
        { fecha: '2025-01-21T00:00:00.000Z', horarios: ['14:00', '15:00'] },
      ];

      consultaGeneralService.getDisponibilidadPrestador.mockResolvedValueOnce(mockDisponibilidad);

      const { result } = renderHook(() => useConsultaGeneralStore());

      let response;
      await act(async () => {
        response = await result.current.fetchDisponibilidadPrestador('prestador123');
      });

      expect(response.success).toBe(true);
      expect(result.current.disponibilidad.length).toBe(2);
      expect(result.current.disponibilidad[0]).toHaveProperty('dia');
      expect(result.current.disponibilidad[0]).toHaveProperty('mes');
    });

    test('debe filtrar fechas inválidas', async () => {
      const mockDisponibilidad = [
        { fecha: 'fecha-invalida', horarios: ['09:00'] },
        { fecha: '2025-01-20T00:00:00.000Z', horarios: ['10:00'] },
      ];

      consultaGeneralService.getDisponibilidadPrestador.mockResolvedValueOnce(mockDisponibilidad);

      const { result } = renderHook(() => useConsultaGeneralStore());

      await act(async () => {
        await result.current.fetchDisponibilidadPrestador('prestador123');
      });

      expect(result.current.disponibilidad.length).toBe(1);
    });
  });

  describe('setSelectedFecha y setSelectedHorario', () => {
    test('debe establecer fecha y limpiar horario', () => {
      const { result } = renderHook(() => useConsultaGeneralStore());

      act(() => {
        useConsultaGeneralStore.setState({ selectedHorario: '10:00' });
      });

      act(() => {
        result.current.setSelectedFecha('2025-01-20');
      });

      expect(result.current.selectedFecha).toBe('2025-01-20');
      expect(result.current.selectedHorario).toBe(null);
    });

    test('debe establecer horario', () => {
      const { result } = renderHook(() => useConsultaGeneralStore());

      act(() => {
        result.current.setSelectedHorario('14:00');
      });

      expect(result.current.selectedHorario).toBe('14:00');
    });
  });

  describe('crearConsultaGeneral', () => {
    test('debe crear consulta correctamente', async () => {
      const mockConsulta = { _id: 'consulta123', estado: 'Confirmada' };
      consultaGeneralService.crearConsultaGeneral.mockResolvedValueOnce(mockConsulta);

      const { result } = renderHook(() => useConsultaGeneralStore());

      const consultaData = {
        prestadorId: 'prestador123',
        fecha: '2025-01-20',
        horario: '10:00',
      };

      let response;
      await act(async () => {
        response = await result.current.crearConsultaGeneral(consultaData);
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockConsulta);
    });

    test('debe manejar error al crear consulta', async () => {
      consultaGeneralService.crearConsultaGeneral.mockRejectedValueOnce({
        response: { data: { message: 'Horario no disponible' } },
      });

      const { result } = renderHook(() => useConsultaGeneralStore());

      let response;
      await act(async () => {
        response = await result.current.crearConsultaGeneral({});
      });

      expect(response.success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('resetState', () => {
    test('debe resetear el estado correctamente', () => {
      const { result } = renderHook(() => useConsultaGeneralStore());

      act(() => {
        useConsultaGeneralStore.setState({
          selectedPrestador: { _id: '1' },
          selectedFecha: '2025-01-20',
          selectedHorario: '10:00',
          disponibilidad: [{ fecha: '2025-01-20' }],
          error: 'Algún error',
        });
      });

      act(() => {
        result.current.resetState();
      });

      expect(result.current.selectedPrestador).toBe(null);
      expect(result.current.selectedFecha).toBe(null);
      expect(result.current.selectedHorario).toBe(null);
      expect(result.current.disponibilidad).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('clearError', () => {
    test('debe limpiar el error', () => {
      const { result } = renderHook(() => useConsultaGeneralStore());

      act(() => {
        useConsultaGeneralStore.setState({ error: 'Error de prueba' });
      });

      expect(result.current.error).toBe('Error de prueba');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });
});
