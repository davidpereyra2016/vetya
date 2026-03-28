/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import useCitaStore from '../useCitaStore';
import * as citaService from '../../services/citaService';

// Mock de los servicios
jest.mock('../../services/citaService', () => ({
  getCitasByProvider: jest.fn(),
  updateCitaStatus: jest.fn(),
  getCitaById: jest.fn(),
  getDashboardSummary: jest.fn(),
}));

describe('useCitaStore - Prestador gestiona citas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { result } = renderHook(() => useCitaStore());
    act(() => {
      result.current.setCitas([]);
    });
  });

  describe('Recepción de Citas', () => {
    test('debe obtener citas pendientes del prestador', async () => {
      const mockCitasPendientes = [
        {
          _id: 'cita1',
          clienteId: {
            nombre: 'Juan Pérez',
            telefono: '1122334455',
          },
          mascotaId: {
            nombre: 'Rocky',
            especie: 'Perro',
            edad: 3,
          },
          fecha: '2025-01-20',
          hora: '10:00',
          servicio: 'Consulta general',
          motivo: 'Vacunación anual',
          estado: 'Pendiente',
        },
      ];

      citaService.getCitasByProvider.mockResolvedValue({
        success: true,
        data: mockCitasPendientes,
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.fetchProviderCitas('prestador123', 'Pendiente');
      });

      await waitFor(() => {
        expect(citaService.getCitasByProvider).toHaveBeenCalledWith('prestador123', 'Pendiente');
        expect(result.current.citas).toEqual(mockCitasPendientes);
        expect(result.current.citas.length).toBe(1);
        expect(result.current.citas[0].estado).toBe('Pendiente');
      });
    });

    test('debe obtener citas confirmadas del prestador', async () => {
      const mockCitasConfirmadas = [
        {
          _id: 'cita2',
          estado: 'Confirmada',
          fecha: '2025-01-20',
          hora: '15:00',
        },
        {
          _id: 'cita3',
          estado: 'Confirmada',
          fecha: '2025-01-21',
          hora: '10:00',
        },
      ];

      citaService.getCitasByProvider.mockResolvedValue({
        success: true,
        data: mockCitasConfirmadas,
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.fetchProviderCitas('prestador123', 'Confirmada');
      });

      await waitFor(() => {
        expect(result.current.citas.length).toBe(2);
        expect(result.current.citas.every((c) => c.estado === 'Confirmada')).toBe(true);
      });
    });

    test('debe obtener detalle completo de una cita', async () => {
      const mockCitaDetalle = {
        _id: 'cita123',
        clienteId: {
          _id: 'cliente123',
          nombre: 'Juan Pérez',
          telefono: '1122334455',
          email: 'juan@example.com',
        },
        mascotaId: {
          _id: 'mascota123',
          nombre: 'Rocky',
          especie: 'Perro',
          raza: 'Golden Retriever',
          edad: 3,
          peso: 28,
          historialMedico: ['Vacunado', 'Desparasitado'],
        },
        fecha: '2025-01-20',
        hora: '10:00',
        duracion: 30,
        servicio: 'Consulta general',
        motivo: 'Vacunación anual y revisión general',
        estado: 'Confirmada',
        notas: 'Cliente prefiere atención temprano',
      };

      citaService.getCitaById.mockResolvedValue({
        success: true,
        data: mockCitaDetalle,
      });

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.fetchCitaById('cita123');
      });

      await waitFor(() => {
        expect(citaService.getCitaById).toHaveBeenCalledWith('cita123');
        expect(result.current.citaActual).toEqual(mockCitaDetalle);
        expect(result.current.citaActual.mascotaId.nombre).toBe('Rocky');
      });
    });
  });

  describe('Confirmación de Citas', () => {
    test('debe confirmar una cita pendiente', async () => {
      const mockResponse = {
        success: true,
        data: {
          _id: 'cita123',
          estado: 'Confirmada',
        },
        message: 'Cita confirmada exitosamente',
      };

      citaService.updateCitaStatus.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.confirmCita('cita123');
      });

      await waitFor(() => {
        expect(citaService.updateCitaStatus).toHaveBeenCalledWith('cita123', 'Confirmada');
        expect(result.current.error).toBe(null);
      });
    });

    test('debe manejar error al confirmar cita ya cancelada', async () => {
      citaService.updateCitaStatus.mockRejectedValue(
        new Error('No se puede confirmar una cita cancelada')
      );

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.confirmCita('cita123');
      });

      await waitFor(() => {
        expect(result.current.error).toContain('cancelada');
      });
    });
  });

  describe('Rechazo de Citas', () => {
    test('debe rechazar una cita con motivo', async () => {
      const mockResponse = {
        success: true,
        data: {
          _id: 'cita123',
          estado: 'Cancelada',
        },
        message: 'Cita rechazada',
      };

      citaService.updateCitaStatus.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.rechazarCita('cita123', 'No tengo disponibilidad en ese horario');
      });

      await waitFor(() => {
        expect(citaService.updateCitaStatus).toHaveBeenCalledWith(
          'cita123',
          'Cancelada',
          'No tengo disponibilidad en ese horario'
        );
        expect(result.current.error).toBe(null);
      });
    });

    test('debe requerir motivo al rechazar cita', async () => {
      citaService.updateCitaStatus.mockRejectedValue(
        new Error('Debe proporcionar un motivo para rechazar la cita')
      );

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.rechazarCita('cita123', ''); // Sin motivo
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('Completar Cita', () => {
    test('debe marcar cita como completada con notas', async () => {
      const mockResponse = {
        success: true,
        data: {
          _id: 'cita123',
          estado: 'Completada',
          notasVeterinario: 'Vacunación aplicada, próxima revisión en 6 meses',
        },
      };

      citaService.updateCitaStatus.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.completarCita(
          'cita123',
          'Vacunación aplicada, próxima revisión en 6 meses'
        );
      });

      await waitFor(() => {
        expect(citaService.updateCitaStatus).toHaveBeenCalledWith(
          'cita123',
          'Completada',
          'Vacunación aplicada, próxima revisión en 6 meses'
        );
      });
    });

    test('debe permitir completar sin notas opcionales', async () => {
      const mockResponse = {
        success: true,
        data: {
          _id: 'cita123',
          estado: 'Completada',
        },
      };

      citaService.updateCitaStatus.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCitaStore());

      await act(async () => {
        await result.current.completarCita('cita123');
      });

      await waitFor(() => {
        expect(citaService.updateCitaStatus).toHaveBeenCalledWith('cita123', 'Completada', undefined);
      });
    });
  });

  describe('Dashboard de Prestador', () => {
    test('debe obtener resumen de citas del prestador', async () => {
      const mockSummary = {
        proximaCita: {
          _id: 'cita123',
          fecha: '2025-01-20',
          hora: '10:00',
          cliente: { nombre: 'Juan Pérez' },
          mascota: { nombre: 'Rocky' },
        },
        citasHoy: 5,
        citasSemana: 20,
        citasPendientes: 8,
        citasConfirmadas: 12,
      };

      citaService.getDashboardSummary.mockResolvedValue({
        success: true,
        data: mockSummary,
      });

      const { result } = renderHook(() => useCitaStore());

      let summary;
      await act(async () => {
        summary = await result.current.getDashboardSummary('prestador123');
      });

      await waitFor(() => {
        expect(citaService.getDashboardSummary).toHaveBeenCalledWith('prestador123');
        expect(summary.citasHoy).toBe(5);
        expect(summary.citasPendientes).toBe(8);
      });
    });
  });

  describe('Filtrado y Ordenamiento', () => {
    test('debe filtrar citas de hoy', () => {
      const hoy = new Date().toISOString().split('T')[0];
      const citas = [
        { _id: '1', fecha: hoy, hora: '10:00' },
        { _id: '2', fecha: '2025-02-01', hora: '15:00' },
        { _id: '3', fecha: hoy, hora: '16:00' },
      ];

      const citasHoy = citas.filter((c) => c.fecha === hoy);
      expect(citasHoy.length).toBe(2);
    });

    test('debe ordenar citas por hora', () => {
      const citas = [
        { _id: '1', hora: '15:00' },
        { _id: '2', hora: '10:00' },
        { _id: '3', hora: '12:00' },
      ];

      const ordenadas = citas.sort((a, b) => {
        const [horaA] = a.hora.split(':').map(Number);
        const [horaB] = b.hora.split(':').map(Number);
        return horaA - horaB;
      });

      expect(ordenadas[0].hora).toBe('10:00');
      expect(ordenadas[1].hora).toBe('12:00');
      expect(ordenadas[2].hora).toBe('15:00');
    });

    test('debe contar citas por estado', () => {
      const citas = [
        { _id: '1', estado: 'Pendiente' },
        { _id: '2', estado: 'Confirmada' },
        { _id: '3', estado: 'Pendiente' },
        { _id: '4', estado: 'Completada' },
        { _id: '5', estado: 'Confirmada' },
      ];

      const conteo = citas.reduce((acc, cita) => {
        acc[cita.estado] = (acc[cita.estado] || 0) + 1;
        return acc;
      }, {});

      expect(conteo.Pendiente).toBe(2);
      expect(conteo.Confirmada).toBe(2);
      expect(conteo.Completada).toBe(1);
    });
  });

  describe('Validaciones de Tiempo', () => {
    test('debe detectar citas próximas en los próximos 30 minutos', () => {
      const ahora = new Date();
      const en25Minutos = new Date(ahora.getTime() + 25 * 60000);
      const fecha = en25Minutos.toISOString().split('T')[0];
      const hora = en25Minutos.toTimeString().substring(0, 5);

      const cita = {
        _id: 'cita123',
        fecha,
        hora,
      };

      const citaTime = new Date(`${cita.fecha} ${cita.hora}`);
      const diff = citaTime - ahora;
      const minutos = Math.floor(diff / 60000);

      expect(minutos).toBeLessThan(30);
      expect(minutos).toBeGreaterThan(0);
    });

    test('debe detectar citas vencidas', () => {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const fecha = ayer.toISOString().split('T')[0];

      const cita = {
        _id: 'cita123',
        fecha,
        hora: '10:00',
        estado: 'Confirmada',
      };

      const citaTime = new Date(`${cita.fecha} ${cita.hora}`);
      const esVencida = citaTime < new Date();

      expect(esVencida).toBe(true);
    });
  });
});
