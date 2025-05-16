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

// Pantallas de onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Pantallas principales
import HomeScreen from '../screens/main/HomeScreen';
import PetsScreen from '../screens/main/PetsScreen';
import PetDetailScreen from '../screens/main/PetDetailScreen';
import VetDetailScreen from '../screens/main/VetDetailScreen';
import AppointmentsScreen from '../screens/main/AppointmentsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Pantallas de perfil
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';

// Pantallas de emergencia
import EmergencyFormScreen from '../screens/main/EmergencyFormScreen';
import EmergencyVetMapScreen from '../screens/main/EmergencyVetMapScreen';
import EmergencyConfirmationScreen from '../screens/main/EmergencyConfirmationScreen';

// Pantallas de consulta general
import ConsultaGeneralScreen from '../screens/main/ConsultaGeneralScreen';
import ConsultaConfirmacionScreen from '../screens/main/ConsultaConfirmacionScreen';

// Pantallas de citas
import AgendarCitaScreen from '../screens/main/AgendarCitaScreen';
import CitaConfirmacionScreen from '../screens/main/CitaConfirmacionScreen';

// Pantallas de consejos de salud
import HealthTipsScreen from '../screens/main/HealthTipsScreen';
import HealthTipDetailScreen from '../screens/main/HealthTipDetailScreen';

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
          } else if (route.name === 'Mascotas') {
            iconName = focused ? 'paw' : 'paw-outline';
          } else if (route.name === 'Citas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#1E88E5',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Mascotas" component={PetsScreen} />
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
        name="VetDetailScreen" 
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
  const isLoading = useAuthStore(state => state.isLoading);
  const token = useAuthStore(state => state.token);
  const isFirstTime = useAuthStore(state => state.isFirstTime);
  const checkAuth = useAuthStore(state => state.checkAuth);
  
  // Verificar autenticación al iniciar
  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
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
