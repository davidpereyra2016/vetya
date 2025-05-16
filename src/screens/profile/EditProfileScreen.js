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
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';
import { userService } from '../../services/api';
import axios from 'axios';

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
    
    // Cargar datos actualizados del backend
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
      setError('El nombre de usuario es obligatorio');
      return;
    }

    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Primero subir la imagen si ha cambiado
      let updatedProfilePicture = user?.profilePicture;
      if (profileImage && profileImage !== user?.profilePicture) {
        try {
          updatedProfilePicture = await handleUploadImage();
        } catch (error) {
          Alert.alert('Error', 'No se pudo subir la imagen. Se guardará el resto de la información.');
        }
      }

      // Actualizar el perfil
      const userData = {
        username,
        email,
        ...(updatedProfilePicture && { profilePicture: updatedProfilePicture })
      };

      const result = await userService.updateProfile(userData);
      
      if (result.success) {
        // Actualizar el estado global con los nuevos datos
        updateUser(result.data);
        Alert.alert('Éxito', 'Perfil actualizado correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Error al actualizar el perfil. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto de perfil */}
        <View style={styles.profileImageContainer}>
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
            style={styles.changePhotoButton}
            onPress={handleSelectImage}
            disabled={isLoading}
          >
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre de usuario</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Nombre de usuario"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#1E88E5',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: '#FFF',
    fontSize: 24,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F7FA',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E88E5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F5F7FA',
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: 20,
  },
});

export default EditProfileScreen;
