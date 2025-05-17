import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import { prestadorService } from '../../services/api';
import globalStyles, { COLORS, SIZES } from '../../styles/globalStyles';

const ProfileScreen = ({ navigation }) => {
  // Estado global con Zustand
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);
  const logout = useAuthStore(state => state.logout);
  
  // Estados locales
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableForEmergencies, setAvailableForEmergencies] = useState(false);
  const [providerStats, setProviderStats] = useState({
    valoraciones: 0,
    emergenciasAtendidas: 0,
    citasCompletadas: 0,
    clientesAtendidos: 0
  });

  // Efectos para cargar datos del prestador
  useEffect(() => {
    loadProviderData();
  }, []);

  useEffect(() => {
    if (provider) {
      setAvailableForEmergencies(provider.disponibleEmergencias || false);
    }
  }, [provider]);

  // Función para cargar datos del prestador
  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) return;
      
      // En una implementación real, se obtendría el perfil completo del prestador
      // y las estadísticas desde el backend
      const result = await prestadorService.getByUserId(user.id);
      
      if (result.success && result.data) {
        // Las estadísticas serían parte de la respuesta del backend
        setProviderStats({
          valoraciones: result.data.opiniones?.length || 0,
          emergenciasAtendidas: 12, // Valor de prueba
          citasCompletadas: 36, // Valor de prueba
          clientesAtendidos: 28 // Valor de prueba
        });
      }
    } catch (error) {
      console.log('Error al cargar datos del perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar disponibilidad para emergencias
  const handleToggleAvailability = async () => {
    if (!provider?.id) return;

    try {
      setIsRefreshing(true);
      const newAvailability = !availableForEmergencies;
      
      const result = await prestadorService.updateEmergencyAvailability(
        provider.id,
        newAvailability
      );
      
      if (result.success) {
        setAvailableForEmergencies(newAvailability);
        Alert.alert(
          newAvailability ? 'Disponibilidad activada' : 'Disponibilidad desactivada',
          newAvailability 
            ? 'Ahora recibirás notificaciones de emergencias cercanas' 
            : 'Ya no recibirás notificaciones de emergencias'
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar tu disponibilidad');
      }
    } catch (error) {
      console.log('Error al actualizar disponibilidad:', error);
      Alert.alert('Error', 'Ocurrió un problema al actualizar tu disponibilidad');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={globalStyles.centeredContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar style="light" />
      
      {/* Header con información básica */}
      <View style={globalStyles.header}>
        <View style={globalStyles.headerContent}>
          <Text style={globalStyles.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de perfil */}
        <View style={[globalStyles.card, { 
          marginHorizontal: 20,
          marginTop: -20,
          paddingVertical: 20,
          alignItems: 'center'
        }]}>
          <View style={[globalStyles.avatarContainer, { marginBottom: 15 }]}>
            {provider?.imagen ? (
              <Image
                source={{ uri: provider.imagen }}
                style={globalStyles.avatar}
              />
            ) : (
              <View style={[globalStyles.avatar, { 
                backgroundColor: COLORS.primary,
                justifyContent: 'center',
                alignItems: 'center'
              }]}>
                <Ionicons name="business" size={40} color="#FFF" />
              </View>
            )}
          </View>
          
          <Text style={[globalStyles.title, { marginBottom: 5 }]}>
            {provider?.nombre || user?.username || 'Prestador de servicios'}
          </Text>
          
          <View style={{ 
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 5
          }}>
            <Ionicons name="location" size={16} color={COLORS.grey} />
            <Text style={[globalStyles.captionText, { marginLeft: 5 }]}>
              {provider?.direccion?.ciudad || 'Ciudad no especificada'}
            </Text>
          </View>
          
          {provider?.tipo && (
            <View style={{
              backgroundColor: COLORS.primary + '20',
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 15,
              marginTop: 5
            }}>
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                {provider.tipo}
              </Text>
            </View>
          )}
          
          <View style={{ 
            flexDirection: 'row', 
            marginTop: 15,
            backgroundColor: availableForEmergencies ? COLORS.success + '15' : COLORS.accent + '15',
            padding: 10,
            borderRadius: 10,
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontWeight: 'bold',
                color: availableForEmergencies ? COLORS.success : COLORS.accent,
                marginBottom: 3
              }}>
                {availableForEmergencies ? 'Disponible para emergencias' : 'No disponible para emergencias'}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.dark }}>
                {availableForEmergencies 
                  ? 'Está recibiendo solicitudes de emergencia' 
                  : 'No está recibiendo solicitudes de emergencia'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: COLORS.success + '50' }}
              thumbColor={availableForEmergencies ? COLORS.success : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={handleToggleAvailability}
              value={availableForEmergencies}
              disabled={isRefreshing}
            />
          </View>
          
          <TouchableOpacity 
            style={[globalStyles.primaryButton, { marginTop: 20, width: '100%' }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={globalStyles.primaryButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>
        
        {/* Estadísticas */}
        <View style={globalStyles.sectionContainer}>
          <Text style={globalStyles.sectionTitle}>Estadísticas</Text>
          
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            marginTop: 15,
            flexWrap: 'wrap'
          }}>
            <StatItem 
              value={providerStats.valoraciones}
              label="Valoraciones"
              icon="star"
              color={COLORS.warning}
            />
            <StatItem 
              value={providerStats.emergenciasAtendidas}
              label="Emergencias"
              icon="alert-circle"
              color={COLORS.accent}
            />
            <StatItem 
              value={providerStats.citasCompletadas}
              label="Citas completadas"
              icon="calendar-check"
              color={COLORS.success}
            />
            <StatItem 
              value={providerStats.clientesAtendidos}
              label="Clientes atendidos"
              icon="people"
              color={COLORS.info}
            />
          </View>
        </View>
        
        {/* Especialidades */}
        {provider?.especialidades && provider.especialidades.length > 0 && (
          <View style={globalStyles.sectionContainer}>
            <Text style={globalStyles.sectionTitle}>Especialidades</Text>
            
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap',
              marginTop: 10
            }}>
              {provider.especialidades.map((especialidad, index) => (
                <View 
                  key={index}
                  style={{
                    backgroundColor: COLORS.primary + '15',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    marginRight: 8,
                    marginBottom: 8
                  }}
                >
                  <Text style={{ color: COLORS.primary }}>{especialidad}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Opciones del perfil */}
        <View style={globalStyles.sectionContainer}>
          <Text style={globalStyles.sectionTitle}>Opciones</Text>
          
          <ProfileOption 
            icon="list" 
            title="Mis servicios" 
            subtitle="Gestiona los servicios que ofreces"
            onPress={() => navigation.navigate('Services')}
          />
          
          <ProfileOption 
            icon="time" 
            title="Disponibilidad" 
            subtitle="Configura tus horarios disponibles"
            onPress={() => navigation.navigate('Availability')}
          />
          
          <ProfileOption 
            icon="calendar" 
            title="Historial de citas" 
            subtitle="Revisa tus citas pasadas y futuras"
            onPress={() => navigation.navigate('Citas')}
          />
          
          <ProfileOption 
            icon="star" 
            title="Valoraciones" 
            subtitle="Ver opiniones de tus clientes"
            onPress={() => navigation.navigate('Reviews')}
          />
          
          <ProfileOption 
            icon="cash" 
            title="Ganancias" 
            subtitle="Gestiona tus ingresos y pagos"
            onPress={() => navigation.navigate('Earnings')}
          />
          
          <ProfileOption 
            icon="lock-closed" 
            title="Cambiar contraseña" 
            subtitle="Actualiza tu contraseña de acceso"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>
        
        {/* Botón de soporte */}
        <TouchableOpacity 
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 20,
            marginTop: 20
          }}
          onPress={() => Alert.alert('Soporte', 'Contacta a soporte@vetpresta.com para cualquier consulta o problema con la aplicación.')}
        >
          <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
          <Text style={{ 
            color: COLORS.primary,
            marginLeft: 8,
            fontWeight: '500'
          }}>
            Contactar soporte
          </Text>
        </TouchableOpacity>
        
        {/* Versión de la app */}
        <Text style={{ 
          textAlign: 'center',
          marginTop: 30,
          color: COLORS.lightGrey,
          fontSize: 12
        }}>
          VetPresta v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// Componente para las estadísticas
const StatItem = ({ value, label, icon, color }) => {
  return (
    <View style={{
      width: '48%',
      backgroundColor: '#FFF',
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: color + '30',
    }}>
      <View style={{ 
        width: 40, 
        height: 40, 
        borderRadius: 20,
        backgroundColor: color + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
      }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ 
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.dark
      }}>
        {value}
      </Text>
      <Text style={{ 
        fontSize: 14,
        color: COLORS.grey
      }}>
        {label}
      </Text>
    </View>
  );
};

// Componente para las opciones del perfil
const ProfileOption = ({ icon, title, subtitle, onPress }) => {
  return (
    <TouchableOpacity 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
      }}
      onPress={onPress}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
      }}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ 
          fontSize: 16,
          fontWeight: '600',
          color: COLORS.dark
        }}>
          {title}
        </Text>
        <Text style={{ 
          fontSize: 13,
          color: COLORS.grey,
          marginTop: 2
        }}>
          {subtitle}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
    </TouchableOpacity>
  );
};

export default ProfileScreen;
