import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

// Estado global con Zustand
import useAuthStore from '../store/useAuthStore';

// Pantallas de autenticación
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Pantallas de onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Pantallas principales
import HomeScreen from '../screens/main/HomeScreen';
import PetsScreen from '../screens/main/PetsScreen';
import PetDetailScreen from '../screens/main/PetDetailScreen';
import VetDetailScreen from '../screens/main/VetDetailScreen';
import PrestaDetailsScreen from '../screens/main/PrestaDetailsScreen';
import AllVetsScreen from '../screens/main/AllVetsScreen';
import AppointmentsScreen from '../screens/main/AppointmentsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Pantallas de perfil
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import AddressesScreen from '../screens/profile/AddressesScreen';
import PaymentHistoryScreen from '../screens/profile/PaymentHistoryScreen';
import ReceiptDetailScreen from '../screens/profile/ReceiptDetailScreen';

// Pantallas de emergencia
import EmergencyFormScreen from '../screens/main/EmergencyFormScreen';
import EmergencyVetMapScreen from '../screens/main/EmergencyVetMapScreen';
import EmergencyConfirmationScreen from '../screens/main/EmergencyConfirmationScreen';
import MisEmergenciasScreen from '../screens/main/EmergencyDetailScreen';

// Pantallas de consulta general
import ConsultaGeneralScreen from '../screens/main/ConsultaGeneralScreen';
import ConsultaConfirmacionScreen from '../screens/main/ConsultaConfirmacionScreen';

// Pantallas de citas
import AgendarCitaScreen from '../screens/main/AgendarCitaScreen';
import CitaConfirmacionScreen from '../screens/main/CitaConfirmacionScreen';

// Pantallas de pagos
import PaymentCheckoutScreen from '../screens/payment/PaymentCheckoutScreen';

// Pantallas de consejos de salud
import HealthTipsScreen from '../screens/main/HealthTipsScreen';
import HealthTipDetailScreen from '../screens/main/HealthTipDetailScreen';

// Pantallas de configuración / información
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import TermsConditionsScreen from '../screens/settings/TermsConditionsScreen';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';

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
          // Iconos para las pestañas
          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Mascotas') {
            iconName = focused ? 'paw' : 'paw-outline';
          } else if (route.name === 'Citas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E88E5', // Color de las pestañas activas
        tabBarInactiveTintColor: 'gray', // Color de las pestañas no activas
        headerShown: false, // Ocultar el header en todas las pestañas
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Mascotas" component={PetsScreen} />
      <Tab.Screen 
        name="Destacados" 
        component={PrestaDetailsScreen} 
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "star" : "star-outline"} color={color} size={size} />
          )
        }}
      />
      <Tab.Screen name="Citas" component={AppointmentsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      
    </Tab.Navigator>
  );
}

// Navegador principal (incluye tabs principales y pantallas de emergencia)
function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
      <Stack.Screen 
        name="PetDetailScreen" 
        component={PetDetailScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      <Stack.Screen 
        name="VetDetail" 
        component={VetDetailScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      <Stack.Screen 
        name="PrestaDetailsScreen" 
        component={PrestaDetailsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      <Stack.Screen 
        name="AllVetsScreen" 
        component={AllVetsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      {/* Pantallas de perfil */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      <Stack.Screen 
        name="Addresses" 
        component={AddressesScreen} 
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      <Stack.Screen 
        name="PaymentHistory" 
        component={PaymentHistoryScreen} 
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      <Stack.Screen 
        name="ReceiptDetail" 
        component={ReceiptDetailScreen} 
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      {/* Pantallas de configuración / información */}
      <Stack.Screen 
        name="HelpSupport" 
        component={HelpSupportScreen} 
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      <Stack.Screen 
        name="TermsConditions" 
        component={TermsConditionsScreen} 
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen} 
        options={{
          headerShown: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      />
      
      <Stack.Screen 
        name="EmergencyForm" 
        component={EmergencyFormScreen} 
        options={{
          // Usar animación simple tipo fade para evitar conflictos
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          // Forzar modo JS para las transiciones
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress, // Simple fade effect
            }
          }),
        }}
      />
      <Stack.Screen 
        name="EmergencyVetMap" 
        component={EmergencyVetMapScreen}
        options={{
          // Misma configuración para mantener consistencia
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
        }}
      />
      <Stack.Screen 
        name="EmergencyConfirmation" 
        component={EmergencyConfirmationScreen}
        options={{
          // Misma configuración para mantener consistencia
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
        }}
      />
      <Stack.Screen 
        name="MisEmergencias" 
        component={MisEmergenciasScreen}
        options={{
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
        }}
      />
      
      {/* Pantallas de Pagos */}
      <Stack.Screen 
        name="PaymentCheckout" 
        component={PaymentCheckoutScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
        }}
      />
      
      {/* Pantallas de Consulta General */}
      <Stack.Screen 
        name="ConsultaGeneral" 
        component={ConsultaGeneralScreen}
        options={{
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
        }}
      />
      <Stack.Screen 
        name="ConsultaConfirmacion" 
        component={ConsultaConfirmacionScreen}
        options={{
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
        }}
      />
      
      {/* Pantallas de Agendar Cita */}
      <Stack.Screen 
        name="AgendarCita" 
        component={AgendarCitaScreen}
        options={{
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
        }}
      />
      <Stack.Screen 
        name="CitaConfirmacion" 
        component={CitaConfirmacionScreen}
        options={{
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
        }}
      />
      
      {/* Pantallas de Consejos de Salud */}
      <Stack.Screen 
        name="HealthTips" 
        component={HealthTipsScreen}
        options={{
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
        }}
      />
      <Stack.Screen 
        name="HealthTipDetail" 
        component={HealthTipDetailScreen}
        options={{
          transitionSpec: {
            open: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
            close: { 
              animation: 'timing', 
              config: { 
                duration: 300 
              } 
            },
          },
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            }
          }),
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
  // Usar Zustand para el estado de autenticación
  const isInitializing = useAuthStore(state => state.isInitializing);
  const token = useAuthStore(state => state.token);
  const isFirstTime = useAuthStore(state => state.isFirstTime);
  const checkAuth = useAuthStore(state => state.checkAuth);
  
  // Verificar autenticación al iniciar
  useEffect(() => {
    checkAuth();
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token === null ? (
        <AuthNavigator />
      ) : isFirstTime ? (
        <OnboardingNavigator />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
