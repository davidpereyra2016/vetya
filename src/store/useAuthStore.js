import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, setupAxiosInterceptors } from '../services/api';
import axios from 'axios';

// Este store maneja el estado de autenticación usando Zustand

// Crear la tienda de autenticación con persistencia
const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isFirstTime: false,

      // Acción para registrar usuario
      register: async (username, email, password, confirmPassword) => {
        set({ isLoading: true, error: null });
        
        const result = await authService.register(username, email, password, confirmPassword);
        
        if (result.success) {
          const { user, token } = result.data;
          // Configurar token para futuras peticiones
          setupAxiosInterceptors(token);
          
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: null,
            isFirstTime: true 
          });
          
          return { success: true };
        } else {
          set({ isLoading: false, error: result.error });
          return { success: false, error: result.error };
        }
      },

      // Acción para iniciar sesión
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        const result = await authService.login(email, password);
        
        if (result.success) {
          const { user, token } = result.data;
          // Configurar token para futuras peticiones
          setupAxiosInterceptors(token);
          
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: null,
            isFirstTime: false
          });
          
          return { success: true };
        } else {
          set({ isLoading: false, error: result.error });
          return { success: false, error: result.error };
        }
      },

      // Acción para cerrar sesión
      logout: () => {
        // Eliminar el token de las cabeceras de axios
        setupAxiosInterceptors(null);
        
        // Limpiar el estado
        set({ 
          user: null, 
          token: null, 
          isLoading: false, 
          error: null,
          isFirstTime: false
        });
      },

      // Verificar token al iniciar la app
      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          // Verificar token almacenado
          const storedToken = await AsyncStorage.getItem('auth-storage');
          const parsedStorage = storedToken ? JSON.parse(storedToken) : null;
          const token = parsedStorage?.state?.token;
          
          if (!token) {
            // No hay token, ir a login
            set({ isLoading: false, token: null, user: null });
            return false;
          }
          
          // Configurar interceptor con el token
          setupAxiosInterceptors(token);
          
          // Obtener información del usuario
          try {
            const response = await axios.get('/users/profile');
            
            if (response.data) {
              // Todo bien, actualizar los datos del usuario
              set({
                isLoading: false,
                user: response.data,
                token: token
              });
              return true;
            } else {
              // No se encontró el usuario, forzar logout
              console.log('Usuario no encontrado o eliminado');
              set({ isLoading: false, token: null, user: null });
              return false;
            }
          } catch (error) {
            // Error al obtener usuario, resetear todo
            console.log('Error al verificar perfil:', error);
            set({ isLoading: false, token: null, user: null });
            return false;
          }
        } catch (error) {
          // Cualquier error, resetear la sesión
          console.error('Error en checkAuth:', error);
          set({ isLoading: false, token: null, user: null });
          return false;
        }
      },

      // Acción para actualizar el estado de primera vez
      setIsFirstTime: (value) => set({ isFirstTime: value }),
      
      // Acción para actualizar datos del usuario
      updateUser: (userData) => {
        set({ user: userData });
      },

      // Acción para limpiar errores
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage', // nombre único para el almacenamiento
      storage: createJSONStorage(() => AsyncStorage), // usar AsyncStorage
    }
  )
);

export default useAuthStore;
