/**
 * @jest-environment node
 */

import { renderHook, act } from '@testing-library/react-native';

jest.mock('../../services/valoracionesService', () => ({
  __esModule: true,
  default: {
    getValoracionesByPrestador: jest.fn(),
    getMisValoraciones: jest.fn(),
    puedeValorar: jest.fn(),
    getEstadisticasPrestador: jest.fn(),
    crearValoracion: jest.fn(),
    actualizarValoracion: jest.fn(),
    eliminarValoracion: jest.fn(),
    reportarValoracion: jest.fn(),
  },
}));

import useValoracionesStore from '../useValoracionesStore';
import valoracionesService from '../../services/valoracionesService';

describe('useValoracionesStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useValoracionesStore.setState({
      valoracionesPrestador: [],
      misValoraciones: [],
      estadisticasPrestador: {
        promedio: 0,
        total: 0,
        distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      puedeValorar: false,
      isLoading: false,
      error: null,
    });
  });

  describe('fetchValoracionesByPrestador', () => {
    test('debe obtener valoraciones del prestador', async () => {
      const mockValoraciones = [
        { _id: '1', puntuacion: 5, comentario: 'Excelente' },
        { _id: '2', puntuacion: 4, comentario: 'Muy bueno' },
      ];

      valoracionesService.getValoracionesByPrestador.mockResolvedValueOnce({
        success: true,
        data: mockValoraciones,
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.fetchValoracionesByPrestador('prestador123');
      });

      expect(response.success).toBe(true);
      expect(result.current.valoracionesPrestador).toEqual(mockValoraciones);
    });

    test('debe manejar error al obtener valoraciones', async () => {
      valoracionesService.getValoracionesByPrestador.mockResolvedValueOnce({
        success: false,
        error: 'No se encontraron valoraciones',
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.fetchValoracionesByPrestador('prestador123');
      });

      expect(response.success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('fetchMisValoraciones', () => {
    test('debe obtener mis valoraciones', async () => {
      const mockMisValoraciones = [
        { _id: '1', prestador: 'prestador1', puntuacion: 5 },
      ];

      valoracionesService.getMisValoraciones.mockResolvedValueOnce({
        success: true,
        data: mockMisValoraciones,
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.fetchMisValoraciones();
      });

      expect(response.success).toBe(true);
      expect(result.current.misValoraciones).toEqual(mockMisValoraciones);
    });
  });

  describe('checkPuedeValorar', () => {
    test('debe verificar si puede valorar (true)', async () => {
      valoracionesService.puedeValorar.mockResolvedValueOnce({
        success: true,
        puedeValorar: true,
        mensaje: 'Puede valorar',
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.checkPuedeValorar('prestador123');
      });

      expect(response.success).toBe(true);
      expect(response.puedeValorar).toBe(true);
      expect(result.current.puedeValorar).toBe(true);
    });

    test('debe verificar si puede valorar (false)', async () => {
      valoracionesService.puedeValorar.mockResolvedValueOnce({
        success: true,
        puedeValorar: false,
        mensaje: 'Ya valoró a este prestador',
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.checkPuedeValorar('prestador123');
      });

      expect(response.puedeValorar).toBe(false);
      expect(result.current.puedeValorar).toBe(false);
    });
  });

  describe('fetchEstadisticasPrestador', () => {
    test('debe obtener estadísticas del prestador', async () => {
      const mockEstadisticas = {
        promedio: 4.5,
        total: 100,
        distribucion: { 1: 5, 2: 10, 3: 15, 4: 30, 5: 40 },
      };

      valoracionesService.getEstadisticasPrestador.mockResolvedValueOnce({
        success: true,
        data: mockEstadisticas,
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.fetchEstadisticasPrestador('prestador123');
      });

      expect(response.success).toBe(true);
      expect(result.current.estadisticasPrestador).toEqual(mockEstadisticas);
    });
  });

  describe('crearValoracion', () => {
    test('debe crear valoración correctamente', async () => {
      const mockValoracion = { _id: 'val123', puntuacion: 5 };

      valoracionesService.crearValoracion.mockResolvedValueOnce({
        success: true,
        data: mockValoracion,
      });

      valoracionesService.getValoracionesByPrestador.mockResolvedValueOnce({
        success: true,
        data: [mockValoracion],
      });

      valoracionesService.getEstadisticasPrestador.mockResolvedValueOnce({
        success: true,
        data: { promedio: 5, total: 1 },
      });

      valoracionesService.getMisValoraciones.mockResolvedValueOnce({
        success: true,
        data: [mockValoracion],
      });

      const { result } = renderHook(() => useValoracionesStore());

      const valoracionData = {
        prestador: 'prestador123',
        puntuacion: 5,
        comentario: 'Excelente servicio',
      };

      let response;
      await act(async () => {
        response = await result.current.crearValoracion(valoracionData);
      });

      expect(response.success).toBe(true);
      expect(result.current.puedeValorar).toBe(false);
    });

    test('debe manejar error al crear valoración', async () => {
      valoracionesService.crearValoracion.mockResolvedValueOnce({
        success: false,
        error: 'No puede valorar a este prestador',
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.crearValoracion({ prestador: 'prestador123' });
      });

      expect(response.success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('actualizarValoracion', () => {
    test('debe actualizar valoración correctamente', async () => {
      const mockValoracion = {
        _id: 'val123',
        prestador: { _id: 'prestador123' },
        puntuacion: 4,
      };

      valoracionesService.actualizarValoracion.mockResolvedValueOnce({
        success: true,
        data: mockValoracion,
      });

      valoracionesService.getMisValoraciones.mockResolvedValueOnce({
        success: true,
        data: [mockValoracion],
      });

      valoracionesService.getValoracionesByPrestador.mockResolvedValueOnce({
        success: true,
        data: [mockValoracion],
      });

      valoracionesService.getEstadisticasPrestador.mockResolvedValueOnce({
        success: true,
        data: { promedio: 4, total: 1 },
      });

      const { result } = renderHook(() => useValoracionesStore());

      act(() => {
        useValoracionesStore.setState({ misValoraciones: [mockValoracion] });
      });

      let response;
      await act(async () => {
        response = await result.current.actualizarValoracion('val123', { puntuacion: 4 });
      });

      expect(response.success).toBe(true);
    });
  });

  describe('eliminarValoracion', () => {
    test('debe eliminar valoración correctamente', async () => {
      valoracionesService.eliminarValoracion.mockResolvedValueOnce({
        success: true,
      });

      valoracionesService.getMisValoraciones.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      valoracionesService.getValoracionesByPrestador.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      valoracionesService.getEstadisticasPrestador.mockResolvedValueOnce({
        success: true,
        data: { promedio: 0, total: 0 },
      });

      valoracionesService.puedeValorar.mockResolvedValueOnce({
        success: true,
        puedeValorar: true,
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.eliminarValoracion('val123', 'prestador123');
      });

      expect(response.success).toBe(true);
    });

    test('debe manejar error al eliminar', async () => {
      valoracionesService.eliminarValoracion.mockResolvedValueOnce({
        success: false,
        error: 'No se pudo eliminar',
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.eliminarValoracion('val123', 'prestador123');
      });

      expect(response.success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('reportarValoracion', () => {
    test('debe reportar valoración correctamente', async () => {
      valoracionesService.reportarValoracion.mockResolvedValueOnce({
        success: true,
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.reportarValoracion('val123');
      });

      expect(response.success).toBe(true);
    });

    test('debe manejar error al reportar', async () => {
      valoracionesService.reportarValoracion.mockResolvedValueOnce({
        success: false,
        error: 'No se pudo reportar',
      });

      const { result } = renderHook(() => useValoracionesStore());

      let response;
      await act(async () => {
        response = await result.current.reportarValoracion('val123');
      });

      expect(response.success).toBe(false);
    });
  });

  describe('clearErrors', () => {
    test('debe limpiar errores', () => {
      const { result } = renderHook(() => useValoracionesStore());

      act(() => {
        useValoracionesStore.setState({ error: 'Algún error' });
      });

      expect(result.current.error).toBe('Algún error');

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('resetValoracionesState', () => {
    test('debe resetear el estado completamente', () => {
      const { result } = renderHook(() => useValoracionesStore());

      act(() => {
        useValoracionesStore.setState({
          valoracionesPrestador: [{ _id: '1' }],
          misValoraciones: [{ _id: '2' }],
          estadisticasPrestador: { promedio: 4.5, total: 100 },
          puedeValorar: true,
          error: 'Error',
        });
      });

      act(() => {
        result.current.resetValoracionesState();
      });

      expect(result.current.valoracionesPrestador).toEqual([]);
      expect(result.current.misValoraciones).toEqual([]);
      expect(result.current.estadisticasPrestador.promedio).toBe(0);
      expect(result.current.puedeValorar).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});
