import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
  
  // Usar la tienda de Zustand en lugar del contexto
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);
  
  // Limpiar errores al cargar la pantalla
  useEffect(() => {
    clearError();
    setHasAttemptedLogin(false);
  }, [clearError]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }
    
    console.log('[VetPresta LoginScreen] Iniciando login para:', email);
    setHasAttemptedLogin(true); // Marcar que se intentó hacer login
    clearError(); // Limpiar errores anteriores
    const result = await login(email, password);
    console.log('[VetPresta LoginScreen] Resultado login:', JSON.stringify(result));
    
    if (!result.success) {
      const needsVerification = result.requiresVerification || 
        (result.error && result.error.toLowerCase().includes('verificar'));
      console.log('[VetPresta LoginScreen] needsVerification:', needsVerification);
      
      if (needsVerification) {
        console.log('[VetPresta LoginScreen] Navegando a EmailVerification con email:', result.email || email);
        navigation.navigate('EmailVerification', { email: result.email || email });
      } else {
        Alert.alert('Error de inicio de sesión', result.error || 'No se pudo iniciar sesión');
      }
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
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo/logo_vetpresta_splash.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>VetPresta</Text>
            <Text style={styles.tagline}>Portal de Prestadores</Text>
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
              <TouchableOpacity 
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
            
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            
            <Text style={styles.providerNote}>Acceso exclusivo para prestadores de servicios veterinarios,
            pet shops y centros veterinarios.</Text>
            
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>
            
            {error && hasAttemptedLogin ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerButtonText}>Regístrate como prestador</Text>
              </TouchableOpacity>
            </View>
            
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  providerNote: {
    color: '#666',
    fontSize: 13,
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
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
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginTop: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#1E88E5',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    height: 55,
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
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
  registerButtonText: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
});

export default LoginScreen;
