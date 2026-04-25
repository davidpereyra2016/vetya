import React, { useEffect, useState } from 'react';
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
import { prestadorService, userService } from '../../services/api';

const EditProfileScreen = ({ navigation }) => {
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);
  const updateUser = useAuthStore(state => state.updateUser);
  const updateProvider = useAuthStore(state => state.updateProvider);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const syncUserData = (userData) => {
    setUsername(userData?.username || '');
    setEmail(userData?.email || '');
    setProfileImage(userData?.profilePicture || null);
  };

  const syncProviderAddress = (providerData) => {
    setStreet(providerData?.direccion?.calle || '');
    setStreetNumber(providerData?.direccion?.numero || '');
    setCity(providerData?.direccion?.ciudad || '');
    setStateRegion(providerData?.direccion?.estado || '');
    setPostalCode(providerData?.direccion?.codigoPostal || '');
  };

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);

        if (user) {
          syncUserData(user);
        }

        if (provider) {
          syncProviderAddress(provider);
        }

        const profileResult = await userService.getProfile();
        if (profileResult.success && profileResult.data) {
          updateUser(profileResult.data);
          syncUserData(profileResult.data);
        }

        const userId =
          user?.id ||
          user?._id ||
          profileResult?.data?.id ||
          profileResult?.data?._id;

        if (userId) {
          const providerResult = await prestadorService.getByUserId(userId);
          if (providerResult.success && providerResult.data) {
            updateProvider(providerResult.data);
            syncProviderAddress(providerResult.data);
          }
        }
      } catch (loadError) {
        console.log('Error al cargar perfil para edicion:', loadError);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
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
    } catch (selectError) {
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
      }

      throw new Error(result.error);
    } catch (uploadError) {
      throw uploadError;
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
        } catch (uploadError) {
          Alert.alert('Error', 'No se pudo subir la imagen. Se guardará el resto de la información.');
        }
      }

      const userPayload = {
        username: username.trim(),
        email: email.trim(),
        ...(updatedProfilePicture && { profilePicture: updatedProfilePicture })
      };

      const userResult = await userService.updateProfile(userPayload);
      if (!userResult.success) {
        Alert.alert('Error', userResult.error || 'No se pudo actualizar el perfil');
        return;
      }

      updateUser(userResult.data);

      if (provider?._id) {
        const providerPayload = {
          direccion: {
            ...(provider?.direccion || {}),
            calle: street.trim(),
            numero: streetNumber.trim(),
            ciudad: city.trim(),
            estado: stateRegion.trim(),
            codigoPostal: postalCode.trim(),
            coordenadas: provider?.direccion?.coordenadas
          }
        };

        const providerResult = await prestadorService.update(provider._id, providerPayload);
        if (!providerResult.success) {
          Alert.alert(
            'Perfil parcialmente actualizado',
            providerResult.error || 'Se actualizo el usuario, pero no se pudo guardar la direccion.'
          );
          return;
        }

        updateProvider(providerResult.data);
      }

      Alert.alert(
        'Perfil actualizado',
        'Tu información ha sido guardada exitosamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (saveError) {
      console.log('Error al guardar perfil:', saveError);
      Alert.alert('Error', 'Ocurrio un error inesperado. Intentalo de nuevo.');
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImagePlaceholderText}>
                    {username ? username.charAt(0).toUpperCase() : 'U'}
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

          <View style={styles.card}>
            <Text style={styles.cardTitle}>información Personal</Text>
            <Text style={styles.cardDescription}>
              Actualiza tu nombre de usuario, correo electronico y direccion del perfil profesional.
            </Text>

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

            <Text style={styles.inputLabel}>Dirección</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Calle"
                placeholderTextColor="#888"
                value={street}
                onChangeText={setStreet}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.inputLabel}>Número</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="home-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Número"
                placeholderTextColor="#888"
                value={streetNumber}
                onChangeText={setStreetNumber}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.inputLabel}>Ciudad</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ciudad"
                placeholderTextColor="#888"
                value={city}
                onChangeText={setCity}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.inputLabel}>Provincia / Estado</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="map-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Provincia o estado"
                placeholderTextColor="#888"
                value={stateRegion}
                onChangeText={setStateRegion}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.inputLabel}>Código Postal</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-open-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Código postal"
                placeholderTextColor="#888"
                value={postalCode}
                onChangeText={setPostalCode}
                editable={!isLoading}
              />
            </View>

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

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#1E88E5" />
              <Text style={styles.infoTitle}>información</Text>
            </View>
            <Text style={styles.infoText}>
              La dirección se guarda en el perfil del prestador. Esto permite mostrar la ubicación del establecimiento
              y que pueda editarse desde información personal.
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
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
