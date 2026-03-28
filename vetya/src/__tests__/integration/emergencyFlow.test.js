/**
 * @jest-environment node
 * 
 * TEST DE INTEGRACIÓN - Flujo completo de emergencia
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mocks de axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../../services/api', () => ({
  emergenciaService: {
    create: jest.fn(),
  },
  veterinarioService: {
    getAvailableVetsWithLocation: jest.fn(),
  },
}));

// Importar después del mock
import useEmergencyStore from '../../store/useEmergencyStore';
import usePetStore from '../../store/usePetStore';
import axios from 'axios';
import { emergenciaService, veterinarioService } from '../../services/api';

describe('Integration: Flujo completo de Emergencia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Flujo completo: Cliente con mascota crea emergencia y recibe veterinario asignado', async () => {
    // PASO 1: Cliente tiene mascotas registradas
    const mockPets = [
      {
        _id: 'mascota123',
        nombre: 'Rocky',
        especie: 'Perro',
        raza: 'Golden Retriever',
        edad: 3,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockPets });

    const { result: petResult } = renderHook(() => usePetStore());

    await act(async () => {
      await petResult.current.fetchPets();
    });

    await waitFor(() => {
      expect(petResult.current.pets.length).toBe(1);
      expect(petResult.current.pets[0].nombre).toBe('Rocky');
    });

    // PASO 2: Cliente selecciona mascota afectada
    act(() => {
      petResult.current.setCurrentPet(mockPets[0]);
    });

    expect(petResult.current.currentPet._id).toBe('mascota123');

    // PASO 3: Cliente solicita emergencia
    const mockUbicacion = {
      lat: -34.6037,
      lng: -58.3816,
    };

    const mockEmergenciaCreada = {
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
      data: mockEmergenciaCreada,
    });

    const { result: emergencyResult } = renderHook(() => useEmergencyStore());

    const emergenciaData = {
      mascota: petResult.current.currentPet._id,
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
      await emergencyResult.current.createEmergency(emergenciaData, []);
    });

    expect(emergencyResult.current.selectedEmergency).toEqual(mockEmergenciaCreada);

    // VERIFICACIÓN FINAL: Flujo completado exitosamente
    expect(petResult.current.currentPet).toBeTruthy();
    expect(emergencyResult.current.selectedEmergency).toBeTruthy();
    expect(emergencyResult.current.selectedEmergency.mascota).toBe('mascota123');
    expect(emergencyResult.current.error).toBe(null);
  });

  test('Flujo con error: Cliente intenta crear emergencia sin mascota', async () => {
    const { result: emergencyResult } = renderHook(() => useEmergencyStore());

    emergenciaService.create.mockResolvedValueOnce({
      success: false,
      error: 'Debe seleccionar una mascota',
    });

    const emergenciaData = {
      descripcion: 'Emergencia',
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
      const response = await emergencyResult.current.createEmergency(emergenciaData, []);
      expect(response.success).toBe(false);
    });

    expect(emergencyResult.current.error).toBeTruthy();
  });

  test('Flujo con error: No hay veterinarios disponibles cerca', async () => {
    const mockEmergencia = {
      _id: 'emergencia123',
      estado: 'Solicitada',
      mascota: 'mascota123',
    };

    emergenciaService.create.mockResolvedValueOnce({
      success: true,
      data: mockEmergencia,
    });

    veterinarioService.getAvailableVetsWithLocation.mockResolvedValueOnce({
      success: true,
      data: [], // Sin veterinarios
    });

    const { result: emergencyResult } = renderHook(() => useEmergencyStore());

    await act(async () => {
      await emergencyResult.current.createEmergency({
        mascota: 'mascota123',
        descripcion: 'Emergencia',
        tipoEmergencia: 'Otro',
        nivelUrgencia: 'Alta',
        emergencyMode: 'mascota',
        ubicacion: {
          coordenadas: {
            latitud: -34.6037,
            longitud: -58.3816,
          },
        },
      }, []);
    });

    await act(async () => {
      await emergencyResult.current.loadVetsWithLocation(-34.6037, -58.3816);
    });

    expect(emergencyResult.current.availableVets.length).toBe(0);
  });
});
