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
        set({ isLoading: true });
        
        try {
<<<<<<< HEAD
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
=======
          // Obtener el token almacenado
          const { token } = get();
          
          if (!token) {
            // No hay token, ir a login
            set({ isLoading: false, token: null, user: null, provider: null });
            return false;
          }
          
          // Configurar token en axios
          setupAxiosInterceptors(token);
          
          try {
            // Obtener información del usuario
            const userResponse = await axios.get('/users/profile');
            
            if (!userResponse || !userResponse.data) {
              // Error al obtener usuario, resetear todo
              console.log('No se pudieron obtener los datos del usuario');
              set({ isLoading: false, token: null, user: null, provider: null });
              return false;
            }
            
            // Actualizar datos del usuario
            const userData = userResponse.data;
            set({ user: userData });
            
            // Verificar que el ID de usuario existe
            const userId = userData._id || userData.id;
            
            if (!userId) {
              console.log('Error: No se encontró ID de usuario');
              set({ isLoading: false });
              return false;
            }
            
            // Intentar cargar el perfil de prestador
            try {
              const providerResult = await prestadorService.getByUserId(userId);
              
              if (!providerResult.success || !providerResult.data) {
                // Prestador no encontrado o eliminado, forzar logout
                console.log('Prestador no encontrado o eliminado');
                set({ isLoading: false, token: null, user: null, provider: null });
                return false;
              }
              
              // Todo correcto, establecer datos del prestador
              console.log('Prestador cargado correctamente:', providerResult.data._id);
              set({ 
                provider: providerResult.data,
                isLoading: false,
                error: null
              });
              
              return true;
            } catch (providerError) {
              console.log('Error al cargar perfil de prestador:', providerError);
              set({ isLoading: false, token: null, user: null, provider: null });
              return false;
            }
          } catch (error) {
            console.log('Error al obtener perfil de usuario:', error);
            set({ isLoading: false, token: null, user: null, provider: null });
            return false;
          }
        } catch (error) {
          console.log('Error general en checkAuth:', error);
          set({ isLoading: false, token: null, user: null, provider: null });
>>>>>>> e4ccb3e9d82b3e4202eea3a04659dece14a4b700
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
