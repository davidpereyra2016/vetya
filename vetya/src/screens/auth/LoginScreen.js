import ScrollView from '../../components/common/AppScrollView';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Usar la tienda de Zustand en lugar del contexto
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    clearError();
    try {
      console.log('[LoginScreen] Iniciando login para:', email);
      const result = await login(email, password);
      console.log('[LoginScreen] Resultado login:', JSON.stringify(result));

      if (!result.success) {
        const needsVerification = result.requiresVerification ||
          (result.error && result.error.toLowerCase().includes('verificar'));
        console.log('[LoginScreen] needsVerification:', needsVerification, 'requiresVerification:', result.requiresVerification);

        if (needsVerification) {
          console.log('[LoginScreen] Navegando a EmailVerification con email:', result.email || email);
          navigation.navigate('EmailVerification', { email: result.email || email });
        } else {
          Alert.alert('Error de inicio de sesión', result.error || 'No se pudo iniciar sesión');
        }
      }
    } catch (err) {
      console.error('[LoginScreen] Error inesperado en handleLogin:', err);
      Alert.alert('Error', 'Ocurrió un error inesperado: ' + (err.message || ''));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/icons/zuvia_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Zuvia. Servicios veterinarios a domicilio"
            />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity accessibilityRole="button" hitSlop={8}
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity accessibilityRole="button"
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity accessibilityRole="button"
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerButtonText}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Estilo para mensajes de error
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1000 / 700,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  inputContainer: {
    minHeight: 55,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,

  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 8,
    flex: 1,

    color: '#333',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#1E88E5',
    fontSize: 14,
  },
  loginButton: {
    minHeight: 55,
    paddingVertical: 12,
    backgroundColor: '#1E88E5',
    borderRadius: 8,

    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexWrap: 'wrap',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    flexShrink: 1,
    color: '#666',
    fontSize: 14,
  },
  registerButtonText: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
