import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';

// Estado global con Zustand
import useAuthStore from '../store/useAuthStore';
import useValidacionStore from '../store/useValidacionStore';

// Pantalla de notificaciones
import NotificacionesScreen from '../screens/NotificacionesScreen';

// Pantallas de autenticación
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';

// Pantallas de onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Pantallas principales
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Pantallas de perfil
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';

// Pantallas de servicios
import ServicesScreen from '../screens/services/ServicesScreen';
import AvailabilityScreen from '../screens/availability/AvailabilityScreen';

// Pantallas de citas
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import AppointmentDetailsScreen from '../screens/appointments/AppointmentDetailsScreen';

// Pantallas de valoraciones
import ReviewsScreen from '../screens/reviews/ReviewsScreen';

// Pantallas de ganancias
import EarningsScreen from '../screens/earnings/EarningsScreen';

// Pantallas de emergencia
import EmergencyDetailsScreen from '../screens/emergency/EmergencyDetailsScreen';
import EmergencyListScreen from '../screens/emergency/EmergencyListScreen';
import ConfirmarEmergenciaScreen from '../screens/emergency/ConfirmarEmergenciaScreen';

// Pantallas de validación
import ValidationDashboardScreen from '../screens/validation/ValidationDashboardScreen';
import DocumentUploadScreen from '../screens/validation/DocumentUploadScreen';
import AdditionalDataScreen from '../screens/validation/AdditionalDataScreen';
import ValidationBlockScreen from '../screens/validation/ValidationBlockScreen';

// Componentes de UI
import NotificacionBadge from '../components/NotificacionBadge';

// Componentes temporales para pantallas que aún no existen
// Se reemplazarán con las implementaciones reales en futuras iteraciones
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
    <Ionicons name="construct-outline" size={80} color="#1E88E5" />
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, color: '#333' }}>
      {route.name}
    </Text>
    <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginHorizontal: 40, marginTop: 10 }}>
      Esta pantalla está en construcción y estará disponible pronto
    </Text>
  </View>
);

// Declaraciones temporales para pantallas que aún no existen

// Creación de navegadores
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador de tabs principales
function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Servicios') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Citas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Ocultar el header en todas las pestañas
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Servicios" component={ServicesScreen} />
      <Tab.Screen name="Citas" component={AppointmentsScreen} />
      
      
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen}
        options={({ navigation }) => ({
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Notificaciones')}
              style={{ marginRight: 15 }}
            >
              <NotificacionBadge />
            </TouchableOpacity>
          ),
        })} 
      />
    </Tab.Navigator>
  );
}

// Navegador principal (incluye tabs principales y pantallas específicas para prestadores)
function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
      
      {/* Pantallas de emergencias para prestadores */}
      <Stack.Screen 
        name="EmergencyList" 
        component={EmergencyListScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress
            }
          })
        }}
      />
      <Stack.Screen 
        name="EmergencyDetails" 
        component={EmergencyDetailsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress
            }
          })
        }}
      />
      
      {/* Pantallas de citas */}
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} options={{ headerShown: false }}/>
      
      {/* Pantallas de perfil */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ 
          headerShown: false,
          title: "Editar Perfil",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={{ 
          headerShown: false,
          title: "Cambiar Contraseña",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      
      {/* Pantallas de servicios */}
      <Stack.Screen 
        name="Services" 
        component={ServicesScreen} 
        options={{ 
          headerShown: false,
          title: "Mis Servicios",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Availability" 
        component={AvailabilityScreen} 
        options={{ 
          headerShown: false,
          title: "Disponibilidad",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      
      {/* Pantallas de valoraciones */}
      <Stack.Screen 
        name="Reviews" 
        component={ReviewsScreen} 
        options={{ 
          headerShown: false,
          title: "Valoraciones",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      
      {/* Pantallas de ganancias */}
      <Stack.Screen 
        name="Earnings" 
        component={EarningsScreen} 
        options={{ 
          headerShown: false,
          title: "Ganancias",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      
      {/* Pantalla de confirmación de emergencia */}
      <Stack.Screen 
        name="ConfirmarEmergencia" 
        component={ConfirmarEmergenciaScreen} 
        options={{ 
          headerShown: false,
          title: "Confirmar Emergencia",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      
      {/* Pantallas de validación de prestadores */}
      <Stack.Screen 
        name="ValidationDashboard" 
        component={ValidationDashboardScreen} 
        options={{ 
          headerShown: false,
          title: "Estado de Validación",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="DocumentUpload" 
        component={DocumentUploadScreen} 
        options={{ 
          headerShown: false,
          title: "Subir Documentos",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="AdditionalData" 
        component={AdditionalDataScreen} 
        options={{ 
          headerShown: false,
          title: "Datos Adicionales",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="ValidationBlock" 
        component={ValidationBlockScreen} 
        options={{ 
          headerShown: false,
          title: "Validación Requerida",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
      
      {/* Pantalla de notificaciones */}
      <Stack.Screen 
        name="Notificaciones" 
        component={NotificacionesScreen} 
        options={{ 
          headerShown: true,
          title: "Notificaciones",
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

// Navegador de autenticación
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// Navegador de onboarding
function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

// Componente principal que controla toda la navegación
function AppNavigator() {
  const { isLoggedIn, isInitializing, isFirstLaunch, provider } = useAuthStore();
  const { estadoValidacion, fetchEstadoValidacion, initializeFromProvider } = useValidacionStore();
  
  // Debug logs para ver los estados
  console.log('[AppNavigator] Estados actuales:', {
    isLoggedIn,
    isInitializing,
    isFirstLaunch,
    hasProvider: !!provider
  });
  
  // Referencia para la navegación (para procesar acciones de notificaciones)
  const navigationRef = useRef();

  // Verificar autenticación al iniciar la app
  const checkAuth = useAuthStore(state => state.checkAuth);
  
  useEffect(() => {
    checkAuth();
  }, []);

  // Verificar estado de validación cuando el usuario esté logueado
  useEffect(() => {
    if (isLoggedIn && provider) {
      // ✅ Primero intentar inicializar desde el provider si ya está aprobado
      initializeFromProvider(provider);
      
      // ✅ Solo hacer request si no está ya aprobado o es la primera carga
      if (!estadoValidacion || estadoValidacion !== 'aprobado') {
        console.log('🔄 Verificando estado de validación desde AppNavigator');
        fetchEstadoValidacion();
      } else {
        console.log('⚡ Prestador ya aprobado, evitando verificación innecesaria');
      }
    }
  }, [isLoggedIn, provider?.email]); // ✅ Usar provider.email en lugar de provider completo
  
  // Procesar acciones pendientes de notificaciones
  useEffect(() => {
    const checkPendingNotificationAction = () => {
      if (global.pendingNotificationAction && navigationRef.current) {
        const { action, params } = global.pendingNotificationAction;
        console.log('📱 Procesando acción pendiente de notificación:', action, params);
        
        try {
          switch (action) {
            case 'navigateToConfirmarEmergencia':
              navigationRef.current.navigate('ConfirmarEmergencia', { 
                emergenciaId: params.emergenciaId 
              });
              break;
            case 'navigateToEmergencyDetails':
              navigationRef.current.navigate('EmergencyDetails', { 
                emergencyId: params.emergenciaId 
              });
              break;
            case 'navigateToAppointments':
              navigationRef.current.navigate('MainTabs', { screen: 'Citas' });
              break;
            case 'navigateToNotificaciones':
              navigationRef.current.navigate('Notificaciones');
              break;
            default:
              console.log('⚠️ Acción de notificación no reconocida:', action);
          }
        } catch (error) {
          console.error('❌ Error al procesar acción de notificación:', error);
        }
        
        // Limpiar la acción pendiente
        global.pendingNotificationAction = null;
      }
    };
    
    // Verificar periódicamente si hay acciones pendientes
    const interval = setInterval(checkPendingNotificationAction, 1000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  // Si el prestador está logueado pero no aprobado, mostrar pantalla de bloqueo
  const shouldShowValidationBlock = isLoggedIn && provider && estadoValidacion && estadoValidacion !== 'aprobado';
  
  if (shouldShowValidationBlock) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="ValidationBlock" component={ValidationBlockScreen} />
          <Stack.Screen name="ValidationDashboard" component={ValidationDashboardScreen} />
          <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
          <Stack.Screen name="AdditionalData" component={AdditionalDataScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  
  // Configuración del encabezado con notificaciones
  const screenOptions = {
    headerStyle: {
      backgroundColor: '#1E88E5',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    headerRight: ({ navigation }) => (
      <TouchableOpacity
        onPress={() => navigation.navigate('Notificaciones')}
        style={{ marginRight: 15 }}
      >
        <NotificacionBadge />
      </TouchableOpacity>
    ),
  };

  // Log para ver qué navegador se está renderizando
  let navigatorType = 'unknown';
  if (!isLoggedIn) {
    navigatorType = 'AuthNavigator (Login)';
  } else if (isFirstLaunch) {
    navigatorType = 'OnboardingNavigator';
  } else {
    navigatorType = 'MainNavigator';
  }
  console.log('[AppNavigator] Renderizando:', navigatorType);

  return (
    <NavigationContainer ref={navigationRef}>
      {!isLoggedIn ? (
        <AuthNavigator />
      ) : isFirstLaunch ? (
        <OnboardingNavigator />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
