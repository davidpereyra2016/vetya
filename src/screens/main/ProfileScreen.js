import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Switch,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import { userService } from '../../services/api';
import { useEffect } from 'react';
import axios from 'axios';

const ProfileScreen = (props) => {
  // Usar el hook useNavigation para asegurar que siempre tengamos acceso a navigation
  const navigation = useNavigation();
  
  // Usar Zustand en lugar de AuthContext
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const updateUser = useAuthStore(state => state.updateUser);
  
  // Cargar datos del perfil cuando se monta el componente
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const result = await userService.getProfile();
        if (result.success) {
          updateUser(result.data);
        }
      } catch (error) {
        console.log('Error al cargar perfil:', error);
      }
    };
    
    loadUserProfile();
  }, []);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Cerrar sesión", 
          onPress: () => logout(),
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header con información del usuario */}
        <View style={styles.header}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              {user?.profilePicture ? (
                <Image 
                  source={{ uri: user.profilePicture }} 
                  style={styles.profileImage} 
                  onError={() => console.log('Error cargando imagen:', user.profilePicture)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.username || 'Usuario'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'usuario@example.com'}</Text>
          </View>
        </View>

        {/* Sección de cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi cuenta</Text>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="person-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Información personal</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={styles.optionIconContainer}>
              <Ionicons name="key-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Cambiar contraseña</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="card-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Métodos de pago</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="location-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Direcciones</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Sección de notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <View style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="notifications-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Notificaciones push</Text>
              <Switch
                trackColor={{ false: "#E0E0E0", true: "#90CAF9" }}
                thumbColor={notificationsEnabled ? "#1E88E5" : "#f4f3f4"}
                ios_backgroundColor="#E0E0E0"
                onValueChange={() => setNotificationsEnabled(!notificationsEnabled)}
                value={notificationsEnabled}
              />
            </View>
          </View>
          <View style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="location-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Ubicación en segundo plano</Text>
              <Switch
                trackColor={{ false: "#E0E0E0", true: "#90CAF9" }}
                thumbColor={locationEnabled ? "#1E88E5" : "#f4f3f4"}
                ios_backgroundColor="#E0E0E0"
                onValueChange={() => setLocationEnabled(!locationEnabled)}
                value={locationEnabled}
              />
            </View>
          </View>
        </View>

        {/* Sección de más opciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Más</Text>
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="help-circle-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Ayuda y soporte</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="star-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Calificar la app</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="document-text-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Términos y condiciones</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#1E88E5" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Política de privacidad</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#F44336" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Versión de la app */}
        <Text style={styles.versionText}>Versión 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E88E5',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    margin: 15,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    margin: 15,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginLeft: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ProfileScreen;
