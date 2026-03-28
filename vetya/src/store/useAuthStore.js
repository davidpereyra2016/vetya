import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, setupAxiosInterceptors } from '../services/api';
import axiosConfigured, { setTokenExpiredCallback, resetTokenExpiredFlag } from '../config/axios';
import { registerForPushNotifications } from '../services/pushNotificationService';
import notificacionService from '../services/apiNotificacion';

// Este store maneja el estado de autenticación usando Zustand

// Crear la tienda de autenticación con persistencia
const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isLoading: false,
      isInitializing: true,
      error: null,
      isFirstTime: false,

      // Acción para registrar usuario
      register: async (username, email, password, confirmPassword) => {
        set({ isLoading: true, error: null });
        
        const result = await authService.register(username, email, password, confirmPassword);
        
        if (result.success) {
          // El registro ahora requiere verificación de email
          if (result.data.requiresVerification) {
            set({ isLoading: false, error: null });
            return { 
              success: true, 
              requiresVerification: true, 
              email: result.data.email 
            };
          }
          
          // Fallback: si el backend devuelve token directamente
          const { user, token } = result.data;
          setupAxiosInterceptors(token);
          
          const handleTokenExpired = () => {
            console.log('🔒 Token expirado - ejecutando logout automático');
            set({ 
              token: null, 
              user: null, 
              isLoading: false,
              error: 'Sesión expirada, por favor inicie sesión nuevamente'
            });
          };
          setTokenExpiredCallback(handleTokenExpired);
          resetTokenExpiredFlag();
          
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

      // Verificar código de email
      verifyEmail: async (email, code) => {
        set({ isLoading: true, error: null });
        
        const result = await authService.verifyEmail(email, code);
        
        if (result.success) {
          const { user, token } = result.data;
          setupAxiosInterceptors(token);
          
          const handleTokenExpired = () => {
            console.log('🔒 Token expirado - ejecutando logout automático');
            set({ 
              token: null, 
              user: null, 
              isLoading: false,
              error: 'Sesión expirada, por favor inicie sesión nuevamente'
            });
          };
          setTokenExpiredCallback(handleTokenExpired);
          resetTokenExpiredFlag();
          
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

      // Reenviar código de verificación
      resendVerification: async (email) => {
        const result = await authService.resendVerification(email);
        return result;
      },

      // Acción para iniciar sesión
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        const normalizedEmail = email?.trim().toLowerCase();
        const result = await authService.login(normalizedEmail, password);
        
        if (!result.success) {
          // Verificar si el error es por email no verificado
          if (result.requiresVerification) {
            set({ isLoading: false, error: null });
            return { 
              success: false, 
              requiresVerification: true, 
              email: result.email || normalizedEmail,
              error: result.error 
            };
          }
          set({ isLoading: false, error: result.error });
          return { success: false, error: result.error };
        }
        
        if (result.success) {
          const { user, token } = result.data;
          // Configurar token para futuras peticiones
          setupAxiosInterceptors(token);
          
          // Configurar callback de logout para cuando el token expire
          const handleTokenExpired = () => {
            console.log('🔒 Token expirado - ejecutando logout automático');
            set({ 
              token: null, 
              user: null, 
              isLoading: false,
              error: 'Sesión expirada, por favor inicie sesión nuevamente'
            });
          };
          setTokenExpiredCallback(handleTokenExpired);
          
          // Resetear el flag de token expirado
          resetTokenExpiredFlag();
          
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: null,
            isFirstTime: false
          });
          
          // Registrar para notificaciones push después del login
          try {
            console.log('🔔 Registrando para notificaciones push...');
            const pushToken = await registerForPushNotifications();
            if (pushToken) {
              console.log('✅ Token de push registrado exitosamente');
            }
          } catch (pushError) {
            console.log('⚠️ Error al registrar notificaciones push:', pushError.message);
          }
          
          return { success: true };
        }
      },

      // Acción para cerrar sesión
      logout: async () => {
        // Eliminar token de dispositivo del servidor
        try {
          await notificacionService.removeDeviceToken();
        } catch (e) {
          console.log('⚠️ Error al eliminar token de dispositivo:', e.message);
        }
        
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
        set({ isInitializing: true });
        
        // Configurar el callback de logout para cuando el token expire
        const handleTokenExpired = () => {
          console.log('🔒 Token expirado - ejecutando logout automático desde checkAuth');
          set({ 
            token: null, 
            user: null, 
            isLoading: false,
            error: 'Sesión expirada, por favor inicie sesión nuevamente'
          });
        };
        
        // Registrar el callback en el interceptor de axios
        setTokenExpiredCallback(handleTokenExpired);
        
        try {
          // Verificar token almacenado
          const storedToken = await AsyncStorage.getItem('auth-storage');
          const parsedStorage = storedToken ? JSON.parse(storedToken) : null;
          const token = parsedStorage?.state?.token;
          
          if (!token) {
            // No hay token, ir a login
            set({ isInitializing: false, token: null, user: null });
            return false;
          }
          
          // Configurar interceptor con el token
          setupAxiosInterceptors(token);
          
          // Obtener información del usuario
          try {
            const response = await axiosConfigured.get('/users/profile');
            
            if (response.data) {
              // Todo bien, actualizar los datos del usuario
              // Resetear el flag de token expirado
              resetTokenExpiredFlag();
              
              set({
                isInitializing: false,
                user: response.data,
                token: token
              });
              
              // Registrar para notificaciones push después de restaurar sesión
              try {
                const pushToken = await registerForPushNotifications();
                if (pushToken) {
                  console.log('✅ Push token registrado al restaurar sesión');
                }
              } catch (pushError) {
                console.log('⚠️ Error al registrar push en checkAuth:', pushError.message);
              }
              
              return true;
            } else {
              // No se encontró el usuario, forzar logout
              console.log('Usuario no encontrado o eliminado');
              set({ isInitializing: false, token: null, user: null });
              return false;
            }
          } catch (error) {
            // Error al obtener usuario, resetear todo
            console.log('Error al verificar perfil:', error);
            set({ isInitializing: false, token: null, user: null });
            return false;
          }
        } catch (error) {
          // Cualquier error, resetear la sesión
          console.error('Error en checkAuth:', error);
          set({ isInitializing: false, token: null, user: null });
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
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isFirstTime: state.isFirstTime,
      }),
    }
  )
);

export default useAuthStore;
