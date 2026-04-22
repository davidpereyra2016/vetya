import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Switch,
  Alert,
  Platform
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

      {/* ─── HEADER FIJO (fuera del ScrollView, patrón HomeScreen) ─── */}
      <View style={styles.header}>
        {/* Top bar: Título + ícono ajustes */}
        <View style={styles.headerTopBar}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="settings-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Info Usuario */}
        <View style={styles.profileInfoContainer}>
          <View style={styles.profileImageWrapper}>
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profileImage}
                onError={() => console.log('Error cargando imagen:', user.profilePicture)}
              />
            ) : (
              <View style={[styles.profileImage, styles.profilePlaceholder]}>
                <Text style={styles.profileInitial}>
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editPhotoBtn}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.username || 'Usuario'}</Text>
          <View style={styles.emailContainer}>
            <Ionicons name="mail" size={14} color="#C5CAE9" style={{ marginRight: 4 }} />
            <Text style={styles.userEmail}>{user?.email || 'usuario@example.com'}</Text>
          </View>
        </View>
      </View>

      {/* ─── CONTENIDO SCROLLEABLE (se desliza bajo el header por zIndex/elevation) ─── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* SECCIÓN 1: Mi cuenta */}
        <Text style={styles.sectionTitle}>Mi cuenta</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="person" size={20} color="#1E88E5" />
            </View>
            <Text style={styles.optionText}>Información personal</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="lock-closed" size={20} color="#FF9800" />
            </View>
            <Text style={styles.optionText}>Cambiar contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PaymentHistory')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="card" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.optionText}>Mis pagos</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionRow, styles.lastOptionRow]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Addresses')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="location" size={20} color="#9C27B0" />
            </View>
            <Text style={styles.optionText}>Direcciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        {/* SECCIÓN 2: Notificaciones */}
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.cardGroup}>
          <View style={styles.optionRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="notifications" size={20} color="#9C27B0" />
            </View>
            <Text style={styles.optionText}>Notificaciones push</Text>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={notificationsEnabled ? '#1E88E5' : '#f4f3f4'}
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => setNotificationsEnabled(!notificationsEnabled)}
              value={notificationsEnabled}
            />
          </View>

          <View style={[styles.optionRow, styles.lastOptionRow]}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F7FA' }]}>
              <Ionicons name="navigate" size={20} color="#00BCD4" />
            </View>
            <Text style={styles.optionText}>Ubicación en segundo plano</Text>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
              thumbColor={locationEnabled ? '#1E88E5' : '#f4f3f4'}
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => setLocationEnabled(!locationEnabled)}
              value={locationEnabled}
            />
          </View>
        </View>

        {/* SECCIÓN 3: Más */}
        <Text style={styles.sectionTitle}>Más</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F5F5F5' }]}>
              <Ionicons name="help-buoy" size={20} color="#757575" />
            </View>
            <Text style={styles.optionText}>Ayuda y soporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="star" size={20} color="#FFB300" />
            </View>
            <Text style={styles.optionText}>Calificar la app</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TermsConditions')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F5F5F5' }]}>
              <Ionicons name="document-text" size={20} color="#757575" />
            </View>
            <Text style={styles.optionText}>Términos y condiciones</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionRow, styles.lastOptionRow]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F5F5F5' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#757575" />
            </View>
            <Text style={styles.optionText}>Política de privacidad</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#D32F2F" style={{ marginRight: 8 }} />
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

  // ─── HEADER FIJO (patrón HomeScreen: fuera del ScrollView, con zIndex + elevation) ───
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 25 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
    alignItems: 'center',
  },
  headerTopBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // ─── INFO DEL USUARIO ───
  profileInfoContainer: {
    alignItems: 'center',
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profilePlaceholder: {
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '800',
  },
  editPhotoBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFB300',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 13,
    color: '#E3F2FD',
    fontWeight: '500',
  },

  // ─── SCROLL ÁREA (sin marginTop negativo; el contenido scrollea "bajo" el header por zIndex) ───
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // ─── SECCIONES Y TARJETAS ───
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 4,
  },
  cardGroup: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  lastOptionRow: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },

  // ─── BOTÓN CERRAR SESIÓN ───
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
});

export default ProfileScreen;
