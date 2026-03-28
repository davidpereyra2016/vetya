import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, prestadorService, setupAxiosInterceptors } from '../services/api';
import { setupAxiosToken } from '../services/axiosInstance';
import axiosConfigured, { setTokenExpiredCallback, resetTokenExpiredFlag } from '../config/axios';
import { registerForPushNotifications } from '../services/pushNotificationService';
import { notificacionService } from '../services/apiNotificacion';

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
      provider: null,
      providerProfile: null,
      isLoggedIn: null,

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
        
        // Registramos directamente como prestador usando la ruta específica en el backend
        const userResult = await authService.registerProvider(
          name,              // username
          email,
          password, 
          confirmPassword,
          name,              // nombre (para el prestador)
          specialties.join(','), // especialidad como string
          phone              // teléfono
        );
        
        if (!userResult.success) {
          set({ isLoading: false, error: userResult.error });
          return { success: false, error: userResult.error };
        }
        
        // El registro ahora requiere verificación de email
        if (userResult.data.requiresVerification) {
          set({ isLoading: false, error: null });
          return { 
            success: true, 
            requiresVerification: true, 
            email: userResult.data.email 
          };
        }
        
        // Fallback: si el backend devuelve token directamente
        const { user, token, prestador } = userResult.data;
        setupAxiosInterceptors(token);
        setupAxiosToken(token); // Configurar token en axiosInstance para notificaciones
        
        // Ahora tenemos que actualizar el prestador con los datos adicionales
        const providerResult = await prestadorService.update(prestador.id, {
          tipo: providerType,
          especialidades: specialties,
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
            isFirstTime: true,
            isLoggedIn: true
          });
          
          return { success: true };
        } else {
          // Si falla la creación del perfil de prestador, igual dejamos al usuario logueado
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: 'Se creó la cuenta pero hubo un problema al configurar el perfil de prestador.',
            isLoggedIn: true,
            isFirstTime: true
          });
          
          return { 
            success: true, 
            warning: 'Se creó la cuenta pero hubo un problema al configurar el perfil de prestador.'
          };
        }
      },

      // Verificar código de email
      verifyEmail: async (email, code) => {
        set({ isLoading: true, error: null });
        
        const result = await authService.verifyEmail(email, code);
        
        if (result.success) {
          const { user, token, prestador } = result.data;
          setupAxiosInterceptors(token);
          setupAxiosToken(token);
          
          const handleTokenExpired = () => {
            console.log('🔒 Token expirado - ejecutando logout automático');
            set({ 
              token: null, 
              user: null, 
              provider: null, 
              isLoggedIn: false,
              isLoading: false,
              error: 'Sesión expirada, por favor inicie sesión nuevamente'
            });
          };
          setTokenExpiredCallback(handleTokenExpired);
          resetTokenExpiredFlag();
          
          // Si hay datos de prestador, cargar perfil completo
          if (prestador) {
            try {
              const providerResult = await prestadorService.getByUserId(user.id);
              if (providerResult.success && providerResult.data) {
                set({ 
                  user, 
                  token,
                  provider: providerResult.data,
                  isLoading: false, 
                  error: null,
                  isFirstTime: true,
                  isLoggedIn: true
                });
                return { success: true };
              }
            } catch (err) {
              console.log('Error al cargar perfil de prestador tras verificación:', err);
            }
          }
          
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: null,
            isFirstTime: true,
            isLoggedIn: true
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

      // Acción para iniciar sesión de prestador
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        // Paso 1: Iniciar sesión de usuario
        const normalizedEmail = email.trim().toLowerCase();
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
            console.log('🔒 Token expirado - ejecutando logout automático desde login callback');
            set({ 
              token: null, 
              user: null, 
              provider: null, 
              isLoggedIn: false,
              isLoading: false,
              error: 'Sesión expirada, por favor inicie sesión nuevamente'
            });
          };
          setTokenExpiredCallback(handleTokenExpired);
          
          try {
            // Paso 2: Obtener el perfil de prestador asociado a este usuario
            const providerResult = await prestadorService.getByUserId(user.id);
            
            if (providerResult.success && providerResult.data) {
              // Es un prestador, guardar el perfil completo
              // Resetear el flag de token expirado para permitir futuras detecciones
              resetTokenExpiredFlag();
              
              // Configurar token en axiosInstance ANTES de registrar push
              setupAxiosToken(token);
              
              set({ 
                user, 
                token, 
                provider: providerResult.data,
                isLoading: false, 
                error: null,
                isFirstTime: false,
                isLoggedIn: true
              });
              
              // Registrar para notificaciones push después del login exitoso
              try {
                console.log('🔔 Registrando para notificaciones push después del login...');
                const pushToken = await registerForPushNotifications();
                if (pushToken) {
                  console.log('✅ Token de push registrado exitosamente');
                }
              } catch (pushError) {
                console.log('⚠️ Error al registrar notificaciones push:', pushError);
              }
              
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
        }
      },

      // Acción para cerrar sesión
      logout: async () => {
        // Eliminar token de dispositivo del servidor antes de cerrar sesión
        try {
          console.log('🔔 Eliminando token de dispositivo del servidor...');
          await notificacionService.removeDeviceToken();
          console.log('✅ Token de dispositivo eliminado');
        } catch (error) {
          console.log('⚠️ Error al eliminar token de dispositivo:', error);
          // Continuar con el logout aunque falle
        }
        
        // Eliminar el token de las cabeceras de ambas instancias de axios
        // Limpiar headers de axios
        setupAxiosToken(null);
        // ELIMINADO: setupAxiosInterceptors(null); <- Esto causa el bug de 401 al re-loguear
        setTokenExpiredCallback(null); // Limpiar token en axiosInstance para notificaciones
        
        // Limpiar el estado
        set({ 
          user: null, 
          token: null, 
          provider: null,
          providerProfile: null,
          isLoading: false, 
          error: null,
          isFirstTime: false,
          isLoggedIn: null
        });
      },

      // Verificar token al iniciar la app
      checkAuth: async () => {
        set({ isInitializing: true });
        console.log('Iniciando verificación de autenticación...');
        
        // Configurar el callback de logout para cuando el token expire
        const handleTokenExpired = () => {
          console.log('🔒 Token expirado - ejecutando logout automático desde callback');
          set({ 
            token: null, 
            user: null, 
            provider: null, 
            isLoggedIn: false,
            isLoading: false,
            error: 'Sesión expirada, por favor inicie sesión nuevamente'
          });
        };
        
        // Registrar el callback en el interceptor de axios
        setTokenExpiredCallback(handleTokenExpired);
        
        try {
          // Obtener el token del estado de Zustand
          let { token } = get();
          
          // Si Zustand persist aún no rehidrató, leer directamente de AsyncStorage
          if (!token) {
            console.log('Token no encontrado en estado, verificando AsyncStorage...');
            try {
              const authData = await AsyncStorage.getItem('auth-storage');
              if (authData) {
                const parsed = JSON.parse(authData);
                token = parsed?.state?.token || null;
                if (token) {
                  console.log('Token recuperado desde AsyncStorage');
                  // Restaurar también los demás datos del estado
                  const restoredState = parsed?.state || {};
                  set({
                    token: restoredState.token,
                    user: restoredState.user || null,
                    provider: restoredState.provider || null,
                    providerProfile: restoredState.providerProfile || null,
                    isLoggedIn: restoredState.isLoggedIn || null,
                  });
                }
              }
            } catch (storageError) {
              console.log('Error al leer AsyncStorage:', storageError);
            }
          }
          
          if (!token) {
            console.log('No se encontró token almacenado, redirigiendo a login');
            set({ isInitializing: false, token: null, user: null, provider: null, isLoggedIn: false });
            return false;
          }
          
          console.log('Token encontrado, configurando en axios');
          // Configurar token en axios con callback de logout
          const logoutCallback = () => {
            console.log('Ejecutando logout automático por token expirado');
            set({ 
              token: null, 
              user: null, 
              provider: null, 
              isLoggedIn: false,
              error: 'Sesión expirada, por favor inicie sesión nuevamente'
            });
          };
          setupAxiosInterceptors(token, logoutCallback);
          setupAxiosToken(token); // Configurar token en axiosInstance para notificaciones
          
          try {
            // Obtener información del usuario usando la instancia configurada
            // que lee el token automáticamente desde AsyncStorage
            console.log('Solicitando perfil de usuario...');
            const userResponse = await axiosConfigured.get('/users/profile');
            
            if (!userResponse || !userResponse.data) {
              // Error al obtener usuario, resetear todo
              console.log('No se pudieron obtener los datos del usuario');
              set({ isInitializing: false, token: null, user: null, provider: null, isLoggedIn: false });
              return false;
            }
            
            console.log('Perfil de usuario obtenido correctamente');
            
            // Actualizar datos del usuario
            const userData = userResponse.data;
            set({ user: userData });
            
            // Verificar que el ID de usuario existe
            const userId = userData._id || userData.id;
            
            if (!userId) {
              console.log('Error: No se encontró ID de usuario');
              set({ isInitializing: false });
              return false;
            }
            
            // Intentar cargar el perfil de prestador
            try {
              const providerResult = await prestadorService.getByUserId(userId);
              
              if (!providerResult.success || !providerResult.data) {
                // Prestador no encontrado o eliminado, forzar logout
                console.log('Prestador no encontrado o eliminado');
                set({ isInitializing: false, token: null, user: null, provider: null, isLoggedIn: false });
                return false;
              }
              
              // Todo correcto, establecer datos del prestador
              console.log('Prestador cargado correctamente:', providerResult.data._id);
              set({ 
                provider: providerResult.data,
                isInitializing: false,
                error: null,
                isLoggedIn: true
              });
              
              return true;
            } catch (providerError) {
              console.log('Error al cargar perfil de prestador:', providerError);
              set({ isInitializing: false, token: null, user: null, provider: null, isLoggedIn: false });
              return false;
            }
          } catch (error) {
            console.log('Error al obtener perfil de usuario:', error);
            set({ isInitializing: false, token: null, user: null, provider: null, isLoggedIn: false });
            return false;
          }
        } catch (error) {
          console.log('Error general en checkAuth:', error);
          set({ isInitializing: false, token: null, user: null, provider: null, isLoggedIn: false });
          return false;
        }
      },

      // Acción para actualizar el estado de primera vez
      setIsFirstTime: (value) => set({ isFirstTime: value }),
      
      // Acción para actualizar datos del usuario
      updateUser: (userData) => {
        set({ user: userData });
      },
      
      // Acción para actualizar datos del prestador
      updateProvider: (providerData) => {
        set(state => ({
          provider: { ...state.provider, ...providerData }
        }));
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
        provider: state.provider,
        providerProfile: state.providerProfile,
        isFirstTime: state.isFirstTime,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useAuthStore;
