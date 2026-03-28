import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';

const EmailVerificationScreen = ({ navigation, route }) => {
  console.log('[VetPresta EmailVerificationScreen] Pantalla montada, params:', JSON.stringify(route?.params));
  const email = route?.params?.email || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  const verifyEmail = useAuthStore(state => state.verifyEmail);
  const resendVerification = useAuthStore(state => state.resendVerification);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  const handleCodeChange = (text, index) => {
    clearError();
    const newCode = [...code];
    
    if (text.length > 1) {
      const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
      const newFullCode = [...code];
      for (let i = 0; i < digits.length; i++) {
        newFullCode[i] = digits[i];
      }
      setCode(newFullCode);
      if (digits.length >= 6) {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    newCode[index] = text.replace(/[^0-9]/g, '');
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Error', 'Ingresa el código completo de 6 dígitos');
      return;
    }

    const result = await verifyEmail(email, fullCode);
    
    if (!result.success) {
      Alert.alert('Error', result.error || 'Código incorrecto');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    const result = await resendVerification(email);
    setIsResending(false);
    
    if (result.success) {
      setCountdown(60);
      Alert.alert('Éxito', 'Se ha reenviado el código a tu correo');
    } else {
      Alert.alert('Error', result.error || 'No se pudo reenviar el código');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E88E5" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={48} color="#1E88E5" />
            </View>
          </View>

          <Text style={styles.title}>Verificar correo electrónico</Text>
          <Text style={styles.subtitle}>
            Ingresa el código de 6 dígitos que enviamos a
          </Text>
          <Text style={styles.emailText}>{email}</Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                  error ? styles.codeInputError : null
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? 6 : 1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verificar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>¿No recibiste el código? </Text>
            {isResending ? (
              <ActivityIndicator size="small" color="#1E88E5" />
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={countdown > 0}
              >
                <Text style={[
                  styles.resendButton,
                  countdown > 0 && styles.resendButtonDisabled
                ]}>
                  {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.infoText}>
            El código expira en 15 minutos
          </Text>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E88E5',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#FFF',
  },
  codeInputFilled: {
    borderColor: '#1E88E5',
  },
  codeInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  verifyButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendButton: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resendButtonDisabled: {
    color: '#999',
  },
  infoText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default EmailVerificationScreen;
