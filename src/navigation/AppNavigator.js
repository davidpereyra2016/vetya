import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, Text } from 'react-native';

// Estado global con Zustand
import useAuthStore from '../store/useAuthStore';

// Pantallas de autenticación
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

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

// Componentes temporales para pantallas que aún no existen
// Se reemplazarán con las implementaciones reales en futuras iteraciones
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
    <Text>
      <Ionicons name="construct-outline" size={80} color="#1E88E5" />
    </Text>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, color: '#333' }}>
      {route.name}
    </Text>
    <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginHorizontal: 40, marginTop: 10 }}>
      Esta pantalla está en construcción y estará disponible pronto
    </Text>
  </View>
);

// Declaraciones temporales para pantallas que aún no existen
const EmergencyDetailsScreen = PlaceholderScreen;
const ReviewsScreen = PlaceholderScreen;
const EarningsScreen = PlaceholderScreen;

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

          return <Text><Ionicons name={iconName} size={size} color={color} /></Text>;
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
      <Tab.Screen name="Servicios" component={ServicesScreen} />
      <Tab.Screen name="Citas" component={AppointmentsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
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
        name="EmergencyDetails" 
        component={EmergencyDetailsScreen}
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
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }}/>
      
      {/* Pantallas de servicios */}
      <Stack.Screen name="Services" component={ServicesScreen} options={{ headerShown: false }}/>
      
      {/* Otras pantallas */}
      <Stack.Screen name="Availability" component={AvailabilityScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Earnings" component={EarningsScreen} options={{ headerShown: false }}/>
      
      {/* Pantallas de citas */}
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} options={{ headerShown: false }}/>
      
      {/* Otras pantallas para futuras implementaciones */}
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
