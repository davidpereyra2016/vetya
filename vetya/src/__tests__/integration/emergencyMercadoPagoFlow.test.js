/**
 * @jest-environment node
 *
 * Integration test: cliente -> emergencia -> prestador -> Mercado Pago
 * Flujo realista para Argentina usando test users de Mercado Pago.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

jest.mock('axios', () => ({
  __esModule: true,
  default: (() => {
    const axiosMock = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
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

jest.mock('../../services/api', () => ({
  __esModule: true,
  authService: {
    login: jest.fn(),
  },
  emergenciaService: {
    create: jest.fn(),
    assignVetToEmergency: jest.fn(),
    confirmVetArrival: jest.fn(),
  },
  veterinarioService: {
    getAvailableForEmergencies: jest.fn(),
    getAvailableVetsWithLocation: jest.fn(),
  },
  pagoService: {
    crearPreferencia: jest.fn(),
    capturarPago: jest.fn(),
    consultarEstadoPago: jest.fn(),
    cancelarPago: jest.fn(),
    obtenerPagos: jest.fn(),
    obtenerPagosPorReferencia: jest.fn(),
  },
  setupAxiosInterceptors: jest.fn(),
}));

import useAuthStore from '../../store/useAuthStore';
import usePetStore from '../../store/usePetStore';
import useEmergencyStore from '../../store/useEmergencyStore';
import usePagoStore from '../../store/usePagoStore';
import axios from 'axios';
import { authService, emergenciaService, pagoService, setupAxiosInterceptors } from '../../services/api';

describe('Integration: emergency + Mercado Pago flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isFirstTime: false,
    });

    usePetStore.setState({
      pets: [],
      currentPet: null,
      isLoading: false,
      error: null,
    });

    useEmergencyStore.setState({
      availableVets: [],
      activeEmergencies: [],
      selectedEmergency: null,
      isLoading: false,
      error: null,
    });

    usePagoStore.setState({
      pagos: [],
      pagoActual: null,
      isLoading: false,
      error: null,
    });
  });

  test('debe completar el flujo cliente -> emergencia -> prestador felipe@gmail.com -> pago Mercado Pago', async () => {
    const clientEmail = 'david@gmail.com';
    const clientPassword = '123456';
    const providerEmail = 'felipe@gmail.com';

    const clientUser = {
      _id: 'user-client-001',
      nombre: 'David',
      email: clientEmail,
      role: 'Cliente',
    };

    const pet = {
      _id: 'pet-001',
      nombre: 'Misha',
      especie: 'Perro',
      raza: 'Mestiza',
      edad: 4,
      sexo: 'Hembra',
    };

    const emergencyCreated = {
      _id: 'emergencia-001',
      usuario: clientUser._id,
      mascota: pet._id,
      descripcion: 'Respira con dificultad y no puede apoyar una pata',
      tipoEmergencia: 'Trauma',
      nivelUrgencia: 'Alta',
      estado: 'Solicitada',
      metodoPago: 'MercadoPago',
      emergencyMode: 'mascota',
    };

    const emergencyAssigned = {
      ...emergencyCreated,
      estado: 'Asignada',
      veterinario: {
        _id: 'prestador-felipe-001',
        nombre: 'Felipe',
        email: providerEmail,
      },
    };

    const paymentInitPoint = 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-001';

    const paymentRecord = {
      _id: 'pago-001',
      concepto: 'Emergencia',
      referencia: { tipo: 'Emergencia', id: emergencyCreated._id },
      estado: 'Pendiente',
      mercadoPago: {
        preferenceId: 'pref-001',
        initPoint: paymentInitPoint,
        status: 'pending',
        captured: false,
      },
    };

    const preferenceDescription = 'Emergencia veterinaria - atención domiciliaria';

    authService.login.mockResolvedValueOnce({
      success: true,
      data: {
        user: clientUser,
        token: 'jwt-client-token',
      },
    });

    axios.get.mockResolvedValueOnce({
      data: [pet],
    });

    emergenciaService.create.mockResolvedValueOnce({
      success: true,
      data: emergencyCreated,
    });

    emergenciaService.assignVetToEmergency.mockResolvedValueOnce({
      success: true,
      data: emergencyAssigned,
    });

    emergenciaService.confirmVetArrival.mockResolvedValueOnce({
      success: true,
      data: {
        _id: emergencyCreated._id,
        estado: 'En atención',
        initPoint: paymentInitPoint,
        preferenciaMP: {
          id: 'pref-001',
          initPoint: paymentInitPoint,
        },
      },
      initPoint: paymentInitPoint,
      tienePreferenciaMP: true,
    });

    pagoService.obtenerPagosPorReferencia.mockResolvedValueOnce({
      success: true,
      data: [paymentRecord],
    });

    pagoService.crearPreferencia.mockResolvedValueOnce({
      success: true,
      data: {
        preferenceId: 'pref-001',
        initPoint: paymentInitPoint,
        pago: paymentRecord,
      },
    });

    pagoService.capturarPago.mockResolvedValueOnce({
      success: true,
      data: {
        pago: {
          ...paymentRecord,
          estado: 'Capturado',
          mercadoPago: {
            ...paymentRecord.mercadoPago,
            captured: true,
          },
        },
      },
    });

    const { result: authResult } = renderHook(() => useAuthStore());
    const { result: petResult } = renderHook(() => usePetStore());
    const { result: emergencyResult } = renderHook(() => useEmergencyStore());
    const { result: paymentResult } = renderHook(() => usePagoStore());

    let loginResponse;
    await act(async () => {
      loginResponse = await authResult.current.login('  david@gmail.com  ', clientPassword);
    });

    expect(loginResponse.success).toBe(true);
    expect(authService.login).toHaveBeenCalledWith(clientEmail, clientPassword);
    expect(setupAxiosInterceptors).toHaveBeenCalledWith('jwt-client-token');
    expect(authResult.current.user.email).toBe(clientEmail);

    await act(async () => {
      await petResult.current.fetchPets();
    });

    expect(petResult.current.pets).toHaveLength(1);
    expect(petResult.current.pets[0].nombre).toBe('Misha');

    act(() => {
      petResult.current.setCurrentPet(pet);
    });

    expect(petResult.current.currentPet._id).toBe(pet._id);

    const emergencyPayload = {
      mascota: pet._id,
      descripcion: emergencyCreated.descripcion,
      tipoEmergencia: emergencyCreated.tipoEmergencia,
      nivelUrgencia: emergencyCreated.nivelUrgencia,
      emergencyMode: 'mascota',
      ubicacion: {
        coordenadas: {
          latitud: -34.6037,
          longitud: -58.3816,
        },
      },
    };

    let createEmergencyResponse;
    await act(async () => {
      createEmergencyResponse = await emergencyResult.current.createEmergency(emergencyPayload, []);
    });

    expect(createEmergencyResponse.success).toBe(true);
    expect(emergencyResult.current.selectedEmergency._id).toBe(emergencyCreated._id);

    let assignResponse;
    await act(async () => {
      assignResponse = await emergencyResult.current.assignVetToEmergency(
        emergencyCreated._id,
        emergencyAssigned.veterinario._id
      );
    });

    expect(assignResponse.success).toBe(true);
    expect(emergenciaService.assignVetToEmergency).toHaveBeenCalledWith(
      emergencyCreated._id,
      emergencyAssigned.veterinario._id
    );
    expect(emergencyResult.current.selectedEmergency.veterinario.email).toBe(providerEmail);

    let confirmArrivalResponse;
    await act(async () => {
      confirmArrivalResponse = await emergencyResult.current.confirmVetArrival(emergencyCreated._id);
    });

    expect(confirmArrivalResponse.success).toBe(true);
    expect(confirmArrivalResponse.initPoint).toBe(paymentInitPoint);
    expect(emergenciaService.confirmVetArrival).toHaveBeenCalledWith(emergencyCreated._id);

    let preferenceResponse;
    await act(async () => {
      preferenceResponse = await paymentResult.current.crearPreferencia(
        emergencyCreated._id,
        null,
        8500,
        preferenceDescription
      );
    });

    expect(preferenceResponse.success).toBe(true);
    expect(preferenceResponse.initPoint).toBe(paymentInitPoint);
    expect(pagoService.crearPreferencia).toHaveBeenCalledWith(
      emergencyCreated._id,
      null,
      8500,
      preferenceDescription
    );

    let paymentResponse;
    await act(async () => {
      paymentResponse = await paymentResult.current.obtenerPagosPorReferencia('Emergencia', emergencyCreated._id);
    });

    expect(paymentResponse.success).toBe(true);
    expect(paymentResult.current.pagoActual.mercadoPago.initPoint).toBe(paymentInitPoint);
    expect(pagoService.obtenerPagosPorReferencia).toHaveBeenCalledWith('Emergencia', emergencyCreated._id);

    let captureResponse;
    await act(async () => {
      captureResponse = await paymentResult.current.capturarPago(paymentRecord._id);
    });

    expect(captureResponse.success).toBe(true);
    expect(pagoService.capturarPago).toHaveBeenCalledWith(paymentRecord._id);
    expect(paymentResult.current.pagoActual.estado).toBe('Capturado');
    expect(paymentResult.current.pagoActual.mercadoPago.captured).toBe(true);

    await waitFor(() => {
      expect(emergencyResult.current.error).toBe(null);
      expect(paymentResult.current.error).toBe(null);
    });
  });

  test('debe fallar el pago si Mercado Pago no devuelve preferencia para la emergencia', async () => {
    emergenciaService.confirmVetArrival.mockResolvedValueOnce({
      success: false,
      error: 'No se pudo generar la preferencia de Mercado Pago',
    });

    const { result: emergencyResult } = renderHook(() => useEmergencyStore());

    await act(async () => {
      emergencyResult.current.setSelectedEmergency({
        _id: 'emergencia-002',
        mascota: 'pet-001',
        estado: 'Asignada',
      });
    });

    let response;
    await act(async () => {
      response = await emergencyResult.current.confirmVetArrival('emergencia-002');
    });

    expect(response.success).toBe(false);
    expect(emergencyResult.current.error).toBe('No se pudo generar la preferencia de Mercado Pago');
  });
});
