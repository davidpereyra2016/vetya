/**
 * @jest-environment node
 *
 * Tests para useAuthStore
 */

import { renderHook, act } from '@testing-library/react-native';

// Mocks ANTES de imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('../../services/api', () => ({
  __esModule: true,
  authService: {
    register: jest.fn(),
    login: jest.fn(),
  },
  setupAxiosInterceptors: jest.fn(),
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
import useAuthStore from '../useAuthStore';
import { authService, setupAxiosInterceptors } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset del store antes de cada test
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isFirstTime: false,
    });
  });

  describe('register', () => {
    test('debe registrar usuario correctamente', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'nuevo@test.com',
        nombre: 'Usuario Nuevo',
        role: 'Cliente',
      };

      authService.register.mockResolvedValueOnce({
        success: true,
        data: {
          user: mockUser,
          token: 'token123',
        },
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.register(
          'usuarionuevo',
          'nuevo@test.com',
          'password123',
          'password123'
        );
      });

      expect(response.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('token123');
      expect(result.current.isFirstTime).toBe(true);
      expect(result.current.error).toBe(null);
      expect(setupAxiosInterceptors).toHaveBeenCalledWith('token123');
    });

    test('debe manejar error al registrar', async () => {
      authService.register.mockResolvedValueOnce({
        success: false,
        error: 'El email ya está registrado',
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.register(
          'usuario',
          'existente@test.com',
          'password123',
          'password123'
        );
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('El email ya está registrado');
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.error).toBe('El email ya está registrado');
    });

    test('debe manejar error cuando las contraseñas no coinciden', async () => {
      authService.register.mockResolvedValueOnce({
        success: false,
        error: 'Las contraseñas no coinciden',
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.register(
          'usuario',
          'test@test.com',
          'password123',
          'password456'
        );
      });

      expect(response.success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('login', () => {
    test('debe hacer login correctamente', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        nombre: 'Usuario Test',
        role: 'Cliente',
      };

      authService.login.mockResolvedValueOnce({
        success: true,
        data: {
          user: mockUser,
          token: 'token123',
        },
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.login('test@test.com', 'password123');
      });

      expect(response.success).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('token123');
      expect(result.current.isFirstTime).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(setupAxiosInterceptors).toHaveBeenCalledWith('token123');
    });

    test('debe manejar credenciales inválidas', async () => {
      authService.login.mockResolvedValueOnce({
        success: false,
        error: 'Credenciales inválidas',
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.login('wrong@test.com', 'wrongpass');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Credenciales inválidas');
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.error).toBe('Credenciales inválidas');
      expect(result.current.isLoading).toBe(false);
    });

    test('debe manejar usuario no encontrado', async () => {
      authService.login.mockResolvedValueOnce({
        success: false,
        error: 'Usuario no encontrado',
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.login('noexiste@test.com', 'password123');
      });

      expect(response.success).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('logout', () => {
    test('debe hacer logout correctamente', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Primero establecer un usuario logueado
      act(() => {
        useAuthStore.setState({
          user: { _id: '123', email: 'test@test.com' },
          token: 'token123',
          isFirstTime: false,
        });
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.token).toBe('token123');

      // Hacer logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.isFirstTime).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(setupAxiosInterceptors).toHaveBeenCalledWith(null);
    });
  });

  describe('checkAuth', () => {
    test('debe verificar autenticación con token válido', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        nombre: 'Usuario Test',
      };

      const mockStorage = {
        state: {
          token: 'stored-token',
          user: mockUser,
        },
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockStorage));
      axios.get.mockResolvedValueOnce({ data: mockUser });

      const { result } = renderHook(() => useAuthStore());

      let authResult;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authResult).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('stored-token');
      expect(setupAxiosInterceptors).toHaveBeenCalledWith('stored-token');
    });

    test('debe manejar cuando no hay token almacenado', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuthStore());

      let authResult;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authResult).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
    });

    test('debe manejar token inválido o expirado', async () => {
      const mockStorage = {
        state: {
          token: 'invalid-token',
        },
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockStorage));
      axios.get.mockRejectedValueOnce(new Error('Token inválido'));

      const { result } = renderHook(() => useAuthStore());

      let authResult;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authResult).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
    });

    test('debe manejar usuario no encontrado en el servidor', async () => {
      const mockStorage = {
        state: {
          token: 'valid-token',
        },
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockStorage));
      axios.get.mockResolvedValueOnce({ data: null });

      const { result } = renderHook(() => useAuthStore());

      let authResult;
      await act(async () => {
        authResult = await result.current.checkAuth();
      });

      expect(authResult).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('updateUser', () => {
    test('debe actualizar datos del usuario', () => {
      const { result } = renderHook(() => useAuthStore());

      const initialUser = { _id: '123', email: 'test@test.com', nombre: 'Usuario' };
      const updatedUser = { _id: '123', email: 'test@test.com', nombre: 'Usuario Actualizado' };

      act(() => {
        useAuthStore.setState({ user: initialUser });
      });

      expect(result.current.user.nombre).toBe('Usuario');

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user.nombre).toBe('Usuario Actualizado');
      expect(result.current.user._id).toBe('123');
    });
  });

  describe('setIsFirstTime', () => {
    test('debe establecer isFirstTime correctamente', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isFirstTime).toBe(false);

      act(() => {
        result.current.setIsFirstTime(true);
      });

      expect(result.current.isFirstTime).toBe(true);

      act(() => {
        result.current.setIsFirstTime(false);
      });

      expect(result.current.isFirstTime).toBe(false);
    });
  });

  describe('clearError', () => {
    test('debe limpiar el error', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ error: 'Algún error' });
      });

      expect(result.current.error).toBe('Algún error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Estados de carga', () => {
    test('debe establecer isLoading durante el login', async () => {
      authService.login.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true, data: { user: {}, token: 'token' } });
          }, 100);
        });
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.login('test@test.com', 'password123');
      });

      // Durante la carga
      expect(result.current.isLoading).toBe(true);

      // Esperar a que termine
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
