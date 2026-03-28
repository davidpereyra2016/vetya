/**
 * @jest-environment node
 * 
 * TEST DE INTEGRACIÓN - Flujo completo de citas
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mocks de servicios - DEBEN estar antes de los imports
jest.mock('../../services/citaService', () => ({
  __esModule: true,
  default: {
    getProviderTypes: jest.fn(),
    createAppointment: jest.fn(),
  },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: (() => {
    const axiosMock = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
      defaults: { headers: { common: {} } },
    };

    axiosMock.create = jest.fn(() => axiosMock);

    return axiosMock;
  })(),
}));

// Importar DESPUÉS de los mocks
import useCitaStore from '../../store/useCitaStore';
import usePetStore from '../../store/usePetStore';
import citaService from '../../services/citaService';
import axios from 'axios';

describe('Integration: Flujo completo de Agendamiento de Cita', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Flujo completo: Cliente busca prestador, ve disponibilidad y agenda cita', async () => {
    // PASO 1: Cliente busca prestadores por ubicación/especialidad
    const mockPrestadores = [
      {
        _id: 'prestador123',
        nombre: 'Dr. Juan Pérez',
        tipo: 'Veterinario',
        especialidades: ['Medicina General', 'Cirugía'],
        direccion: {
          calle: 'Av. Corrientes 1234',
          coordenadas: { lat: -34.6037, lng: -58.3816 },
        },
        distancia: 2.5,
        calificacion: 4.8,
        activo: true,
        estadoValidacion: 'aprobado',
      },
      {
        _id: 'prestador456',
        nombre: 'Dra. María García',
        tipo: 'Veterinario',
        especialidades: ['Traumatología'],
        direccion: {
          calle: 'Av. Santa Fe 5678',
        },
        distancia: 3.2,
        calificacion: 4.9,
        activo: true,
        estadoValidacion: 'aprobado',
      },
    ];

    citaService.getProviderTypes.mockResolvedValueOnce({
      success: true,
      data: [{ id: '1', name: 'Veterinario' }],
    });

    const { result: citaResult } = renderHook(() => useCitaStore());

    await act(async () => {
      await citaResult.current.fetchProviderTypes();
    });

    expect(citaResult.current.providerTypes.length).toBeGreaterThan(0);

    // PASO 2: Cliente selecciona prestador y ve fechas disponibles
    citaService.getAvailableDates = jest.fn().mockResolvedValue({
      success: true,
      data: [
        { id: '1', date: '2025-01-20', dayName: 'Lunes' },
        { id: '2', date: '2025-01-21', dayName: 'Martes' },
      ],
    });

    await act(async () => {
      await citaResult.current.fetchAvailableDates();
    });

    expect(citaResult.current.availableDates.length).toBeGreaterThan(0);

    // PASO 3: Cliente selecciona su mascota
    const mockPets = [
      {
        _id: 'mascota123',
        nombre: 'Rocky',
        especie: 'Perro',
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockPets });

    const { result: petResult } = renderHook(() => usePetStore());

    await act(async () => {
      await petResult.current.fetchPets();
    });

    act(() => {
      petResult.current.setCurrentPet(mockPets[0]);
    });

    expect(petResult.current.currentPet.nombre).toBe('Rocky');

    // PASO 4: Cliente crea la cita
    const mockCitaCreada = {
      _id: 'cita123',
      prestadorId: 'prestador123',
      mascotaId: 'mascota123',
      fecha: '2025-01-20',
      hora: '10:00',
      servicio: 'Consulta general',
      motivo: 'Vacunación anual',
      estado: 'Pendiente',
    };

    citaService.createAppointment.mockResolvedValueOnce({
      success: true,
      data: mockCitaCreada,
    });

    const citaData = {
      prestadorId: 'prestador123',
      mascotaId: petResult.current.currentPet._id,
      fecha: '2025-01-20',
      hora: '10:00',
      servicio: 'Consulta general',
    };

    await act(async () => {
      const response = await citaResult.current.createAppointment(citaData);
      expect(response.success).toBe(true);
    });

    // VERIFICACIÓN FINAL: Flujo completado exitosamente
    expect(citaResult.current.providerTypes.length).toBeGreaterThan(0);
    expect(petResult.current.currentPet).toBeTruthy();
    expect(petResult.current.currentPet._id).toBe('mascota123');
  });

  test('Flujo con error: Horario seleccionado ya no está disponible', async () => {
    const { result: citaResult } = renderHook(() => useCitaStore());

    citaService.createAppointment.mockResolvedValueOnce({
      success: false,
      error: 'El horario seleccionado no está disponible',
    });

    const citaData = {
      prestadorId: 'prestador123',
      mascotaId: 'mascota123',
      fecha: '2025-01-20',
      hora: '10:00',
      servicio: 'Consulta general',
    };

    await act(async () => {
      const response = await citaResult.current.createAppointment(citaData);
      expect(response.success).toBe(false);
    });

    expect(citaResult.current.error).toBeTruthy();
  });

  test('Flujo completo: Cliente agenda y luego cancela cita', async () => {
    const { result: citaResult } = renderHook(() => useCitaStore());

    // Crear cita
    const mockCita = {
      _id: 'cita123',
      estado: 'Pendiente',
      fecha: '2025-01-25',
      hora: '10:00',
    };

    citaService.createAppointment.mockResolvedValueOnce({
      success: true,
      data: mockCita,
    });

    citaService.updateAppointmentStatus = jest.fn().mockResolvedValue({
      success: true,
      data: { ...mockCita, estado: 'Cancelada' },
    });

    citaService.getUserAppointments = jest.fn().mockResolvedValue({
      success: true,
      data: [mockCita],
    });

    await act(async () => {
      await citaResult.current.createAppointment({
        prestadorId: 'prestador123',
        mascotaId: 'mascota123',
        fecha: '2025-01-25',
        hora: '10:00',
        servicio: 'Consulta general',
      });
    });

    // Cancelar cita
    await act(async () => {
      const response = await citaResult.current.updateAppointmentStatus('cita123', 'Cancelada');
      expect(response.success).toBe(true);
    });

    expect(citaResult.current.error).toBe(null);
  });
});
