import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, prestadorService, setupAxiosInterceptors } from '../services/api';
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
      provider: null,
      providerProfile: null,

      // Acción para registrar usuario (no usada en esta app de prestadores)
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
      
      // Acción para registrar prestador de servicios
      registerProvider: async (providerData) => {
        set({ isLoading: true, error: null });
        
        const { name, email, password, confirmPassword, phone, providerType, specialties } = providerData;
        
        // Primero registramos el usuario base
        const userResult = await authService.register(name, email, password, confirmPassword);
        
        if (!userResult.success) {
          set({ isLoading: false, error: userResult.error });
          return { success: false, error: userResult.error };
        }
        
        // Si el registro de usuario fue exitoso, creamos el perfil de prestador
        const { user, token } = userResult.data;
        setupAxiosInterceptors(token);
        
        // Crear el perfil de prestador
        const providerResult = await prestadorService.create({
          nombre: name,
          tipo: providerType,
          especialidades: specialties,
          email: email,
          telefono: phone,
          // Valores predeterminados
          disponibleEmergencias: false,
          direccion: {
            calle: '',
            numero: '',
            ciudad: '',
            estado: '',
            codigoPostal: ''
          }
        });
        
        if (providerResult.success) {
          set({ 
            user, 
            token,
            provider: providerResult.data,
            isLoading: false, 
            error: null,
            isFirstTime: true 
          });
          
          return { success: true };
        } else {
          // Si falla la creación del perfil de prestador, igual dejamos al usuario logueado
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: 'Se creó la cuenta pero hubo un problema al configurar el perfil de prestador.'
          });
          
          return { 
            success: true, 
            warning: 'Se creó la cuenta pero hubo un problema al configurar el perfil de prestador.'
          };
        }
      },

      // Acción para iniciar sesión de prestador
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        // Paso 1: Iniciar sesión de usuario
        const result = await authService.login(email, password);
        
        if (result.success) {
          const { user, token } = result.data;
          // Configurar token para futuras peticiones
          setupAxiosInterceptors(token);
          
          try {
            // Paso 2: Obtener el perfil de prestador asociado a este usuario
            const providerResult = await prestadorService.getByUserId(user.id);
            
            if (providerResult.success && providerResult.data) {
              // Es un prestador, guardar el perfil completo
              set({ 
                user, 
                token, 
                provider: providerResult.data,
                isLoading: false, 
                error: null,
                isFirstTime: false
              });
              
              return { success: true };
            } else {
              // El usuario existe pero no tiene perfil de prestador
              set({ 
                isLoading: false, 
                error: 'Esta cuenta no está asociada a un prestador de servicios.'
              });
              return { 
                success: false, 
                error: 'Esta cuenta no está asociada a un prestador de servicios.' 
              };
            }
          } catch (error) {
            // Error al obtener el perfil de prestador
            set({ 
              isLoading: false, 
              error: 'Error al cargar el perfil de prestador.'
            });
            return { 
              success: false, 
              error: 'Error al cargar el perfil de prestador.' 
            };
          }
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
          provider: null,
          providerProfile: null,
          isLoading: false, 
          error: null,
          isFirstTime: false
        });
      },

      // Verificar token al iniciar la app
      checkAuth: async () => {
        const { token, user } = get();
        if (token) {
          // Configurar token en axios
          setupAxiosInterceptors(token);
          
          // Cargar datos actualizados del perfil desde el backend
          try {
            // Actualizar datos de usuario
            const userResponse = await axios.get('/users/profile');
            if (userResponse.data) {
              // Actualizar los datos del usuario con la información actualizada
              set({ user: userResponse.data });
              
              // Intentar cargar el perfil de prestador
              try {
                const providerResult = await prestadorService.getByUserId(userResponse.data.id);
                if (providerResult.success && providerResult.data) {
                  set({ provider: providerResult.data });
                }
              } catch (providerError) {
                console.log('Error al cargar perfil de prestador:', providerError);
              }
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
