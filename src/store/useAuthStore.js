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
        const { token } = get();
        if (token) {
          // Configurar token en axios
          setupAxiosInterceptors(token);
          
          // Cargar datos actualizados del perfil desde el backend
          try {
            const response = await axios.get('/users/profile');
            if (response.data) {
              // Actualizar los datos del usuario con la información actualizada
              set({ user: response.data });
            }
          } catch (error) {
            console.log('Error al actualizar perfil:', error);
          }
          
          return true;
        }
        return false;
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
