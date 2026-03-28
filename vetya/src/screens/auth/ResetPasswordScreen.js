import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/api';

const ResetPasswordScreen = ({ navigation, route }) => {
  const email = route.params?.email || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'No se proporcionó el correo electrónico', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [email, navigation]);

  const evaluatePasswordStrength = (password) => {
    if (password.length < 6) {
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

  const handleCodeChange = (text, index) => {
    if (text.length > 1) {
      // Handle paste of full code
      const digits = text.replace(/[^0-9]/g, '').split('').slice(0, 6);
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (i < 6) newCode[i] = d;
      });
      setCode(newCode);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = text.replace(/[^0-9]/g, '');
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleResetPassword = async () => {
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
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

    setIsLoading(true);

    try {
      const result = await authService.resetPassword(email, codeString, newPassword);
      
      if (result.success) {
        Alert.alert(
          '¡Contraseña Actualizada!',
          'Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión.',
          [
            {
              text: 'Iniciar Sesión',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo restablecer la contraseña');
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
        <ScrollView contentContainerStyle={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#1E88E5" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nueva Contraseña</Text>
          </View>

          {/* Icono principal */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={50} color="#1E88E5" />
            </View>
          </View>

          {/* Contenido principal */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Restablecer Contraseña</Text>
            <Text style={styles.description}>
              Ingresa el código de 6 dígitos enviado a{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            {/* Código de 6 dígitos */}
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => inputRefs.current[index] = ref}
                  style={[styles.codeInput, digit && styles.codeInputFilled]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleCodeKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? 6 : 1}
                  selectTextOnFocus
                  editable={!isLoading}
                />
              ))}
            </View>

            {/* Campo de nueva contraseña */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nueva contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
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
                <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color, width: `${(passwordStrength.score / 5) * 100}%` }]} />
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  Fortaleza: {passwordStrength.strength}
                </Text>
              </View>
            )}

            {/* Campo de confirmar contraseña */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>

            {/* Botón de restablecer */}
            <TouchableOpacity 
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]} 
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.resetButtonText}>
                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Consejos de seguridad */}
          <View style={styles.securityTips}>
            <Text style={styles.securityTitle}>Contraseña segura:</Text>
            <View style={styles.tipContainer}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.tipText}>Al menos 8 caracteres</Text>
            </View>
            <View style={styles.tipContainer}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.tipText}>Letras mayúsculas y minúsculas</Text>
            </View>
            <View style={styles.tipContainer}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.tipText}>Incluye números y símbolos</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
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
  contentContainer: {
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
    gap: 8,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#F5F7FA',
  },
  codeInputFilled: {
    borderColor: '#1E88E5',
    backgroundColor: '#E3F2FD',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 55,
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
  strengthContainer: {
    marginBottom: 15,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 5,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  resetButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityTips: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 10,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

export default ResetPasswordScreen;
