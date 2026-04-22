import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import { userService } from '../../services/api';

const EditProfileScreen = ({ navigation }) => {
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        const result = await userService.getProfile();
        if (result.success) {
          updateUser(result.data);
          setUsername(result.data.username || '');
          setEmail(result.data.email || '');
          setProfileImage(result.data.profilePicture || null);
        }
      } catch (error) {
        console.log('Error al cargar perfil para edición:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setProfileImage(user.profilePicture || null);
    }
    
    loadUserProfile();
  }, []);

  const handleSelectImage = async () => {
    try {
      setIsLoading(true);
      const result = await userService.pickImage();
      
      if (result.success) {
        setProfileImage(result.data.uri);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImage = async () => {
    if (!profileImage || profileImage === user?.profilePicture) return null;
    
    try {
      setIsLoading(true);
      const result = await userService.uploadProfilePicture(profileImage);
      
      if (result.success) {
        return result.data.profilePicture;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Campo requerido', 'El nombre de usuario es obligatorio');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Campo requerido', 'El correo electrónico es obligatorio');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      let updatedProfilePicture = user?.profilePicture;
      if (profileImage && profileImage !== user?.profilePicture) {
        try {
          updatedProfilePicture = await handleUploadImage();
        } catch (error) {
          Alert.alert('Error', 'No se pudo subir la imagen. Se guardará el resto de la información.');
        }
      }

      const userData = {
        username,
        email,
        ...(updatedProfilePicture && { profilePicture: updatedProfilePicture })
      };

      const result = await userService.updateProfile(userData);
      
      if (result.success) {
        updateUser(result.data);
        Alert.alert(
          '¡Perfil Actualizado!', 
          'Tu información ha sido guardada exitosamente.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <View style={styles.headerRight} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Foto de perfil */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage} 
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImagePlaceholderText}>
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={handleSelectImage}
                disabled={isLoading}
              >
                <Ionicons name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleSelectImage} disabled={isLoading}>
              <Text style={styles.changePhotoText}>Cambiar foto de perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Card principal */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información Personal</Text>
            <Text style={styles.cardDescription}>
              Actualiza tu nombre de usuario y correo electrónico.
            </Text>

            {/* Nombre de usuario */}
            <Text style={styles.inputLabel}>Nombre de usuario</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre de usuario"
                placeholderTextColor="#888"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Correo electrónico */}
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tu correo electrónico"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Botón guardar */}
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#1E88E5" />
              <Text style={styles.infoTitle}>Información</Text>
            </View>
            <Text style={styles.infoText}>
              Al cambiar tu correo electrónico, es posible que necesites verificarlo nuevamente para mantener el acceso a tu cuenta.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  profileImagePlaceholderText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#1E88E5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  changePhotoText: {
    fontSize: 15,
    color: '#1E88E5',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 55,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#B0BEC5',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});

export default EditProfileScreen;
