import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/api';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  const evaluatePasswordStrength = (password) => {
    if (!password || password.length < 6) {
      return { strength: 'Muy débil', color: '#FF3B30', score: 0 };
    }
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    score = Object.values(checks).filter(Boolean).length;
    if (score < 2) return { strength: 'Débil', color: '#FF9500', score };
    if (score < 4) return { strength: 'Media', color: '#FFCC02', score };
    return { strength: 'Fuerte', color: '#34C759', score };
  };

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(evaluatePasswordStrength(newPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSave = async () => {
    if (!currentPassword) {
      Alert.alert('Campo requerido', 'Ingresa tu contraseña actual');
      return;
    }
    if (!newPassword) {
      Alert.alert('Campo requerido', 'Ingresa la nueva contraseña');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Contraseña corta', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    const evaluation = evaluatePasswordStrength(newPassword);
    if (evaluation.score < 2) {
      Alert.alert(
        'Contraseña débil',
        'Tu contraseña debe incluir al menos:\n• 8 caracteres\n• Letras mayúsculas y minúsculas\n• Números'
      );
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert('Error', 'La nueva contraseña debe ser diferente a la actual');
      return;
    }

    try {
      setIsLoading(true);
      const result = await userService.changePassword({
        currentPassword,
        newPassword
      });

      if (result.success) {
        Alert.alert(
          '¡Contraseña Actualizada!', 
          'Tu contraseña ha sido cambiada exitosamente.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo cambiar la contraseña');
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
            <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
            <View style={styles.headerRight} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Icono principal */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={50} color="#1E88E5" />
            </View>
          </View>

          {/* Card principal */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actualizar Contraseña</Text>
            <Text style={styles.cardDescription}>
              Ingresa tu contraseña actual y elige una nueva contraseña segura.
            </Text>

            {/* Contraseña actual */}
            <Text style={styles.inputLabel}>Contraseña actual</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-open-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tu contraseña actual"
                placeholderTextColor="#888"
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons 
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>

            {/* Separador visual */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Nueva contraseña</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Nueva contraseña */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nueva contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>

            {/* Indicador de fortaleza */}
            {passwordStrength && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarBg}>
                  <View style={[
                    styles.strengthBar, 
                    { backgroundColor: passwordStrength.color, width: `${(passwordStrength.score / 5) * 100}%` }
                  ]} />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.strength}
                </Text>
              </View>
            )}

            {/* Confirmar contraseña */}
            <View style={[
              styles.inputContainer, 
              passwordsMatch && styles.inputContainerSuccess,
              passwordsMismatch && styles.inputContainerError
            ]}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={passwordsMatch ? '#34C759' : passwordsMismatch ? '#FF3B30' : '#1E88E5'} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {passwordsMatch ? (
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                ) : (
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={passwordsMismatch ? '#FF3B30' : '#888'} 
                  />
                )}
              </TouchableOpacity>
            </View>

            {passwordsMismatch && (
              <Text style={styles.mismatchText}>Las contraseñas no coinciden</Text>
            )}

            {/* Botón guardar */}
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isLoading}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tips de seguridad */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={20} color="#FF9500" />
              <Text style={styles.tipsTitle}>Consejos de seguridad</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.tipText}>Usa al menos 8 caracteres</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.tipText}>Combina mayúsculas y minúsculas</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.tipText}>Incluye números y símbolos</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.tipText}>No reutilices contraseñas anteriores</Text>
            </View>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
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
  inputContainerSuccess: {
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  inputContainerError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
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
  eyeIcon: {
    padding: 10,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E88E5',
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: -5,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 60,
  },
  mismatchText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
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
  tipsCard: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
});

export default ChangePasswordScreen;
