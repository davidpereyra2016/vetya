import ScrollView from '../../components/common/AppScrollView';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.forgotPassword(email.trim().toLowerCase());

      if (result.success) {
        setEmailSent(true);
      } else {
        Alert.alert('Error', result.error || 'No se pudo enviar el correo de recuperación');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setEmailSent(false);
    await handleSendResetEmail();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          {/* Header con botón de regreso */}
          <View style={styles.header}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver" hitSlop={8}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#1E88E5" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recuperar Contraseña</Text>
          </View>

          {/* Icono principal */}
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={80} color="#1E88E5" />
          </View>

          {/* Contenido principal */}
          <View style={styles.contentContainer}>
            {!emailSent ? (
              <>
                <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                <Text style={styles.description}>
                  Ingresa tu correo electrónico y te enviaremos un código de 6 dígitos para restablecer tu contraseña.
                </Text>

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
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity accessibilityRole="button"
                  style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                  onPress={handleSendResetEmail}
                  disabled={isLoading}
                >
                  <Text style={styles.sendButtonText}>
                    {isLoading ? 'Enviando...' : 'Enviar Código de Recuperación'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>¡Código Enviado!</Text>
                <Text style={styles.description}>
                  Hemos enviado un código de 6 dígitos a {email}.{'\n'}
                  Revisa tu bandeja de entrada.
                </Text>

                <TouchableOpacity accessibilityRole="button"
                  style={[styles.sendButton]}
                  onPress={() => navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() })}
                >
                  <Text style={styles.sendButtonText}>
                    Ingresar Código y Nueva Contraseña
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity accessibilityRole="button"
                  style={styles.resendButton}
                  onPress={handleResendEmail}
                  disabled={isLoading}
                >
                  <Text style={styles.resendButtonText}>
                    {isLoading ? 'Reenviando...' : 'Reenviar Código'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity accessibilityRole="button"
                  style={styles.backToLoginButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backToLoginButtonText}>
                    Volver al Inicio de Sesión
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Información de seguridad */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#666" />
            <Text style={styles.securityText}>
              Por seguridad, el enlace expirará en 1 hora
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    flexShrink: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  inputContainer: {
    minHeight: 55,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 20,
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
  sendButton: {
    minHeight: 55,
    paddingVertical: 12,
    backgroundColor: '#1E88E5',
    borderRadius: 8,

    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    minHeight: 55,
    paddingVertical: 12,
    backgroundColor: '#FF9500',
    borderRadius: 8,

    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLoginButton: {
    minHeight: 55,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E88E5',
    borderRadius: 8,

    alignItems: 'center',
    justifyContent: 'center',
  },
  backToLoginButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
  },
  securityText: {
    flexShrink: 1,
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default ForgotPasswordScreen;
