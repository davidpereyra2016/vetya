import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [providerType, setProviderType] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSpecialtiesModal, setShowSpecialtiesModal] = useState(false);
  
  // Tipos de prestadores disponibles
  const providerTypes = [
    'Veterinario',  
    'Centro Veterinario', 
    'Otro'
  ];
  
  // Especialidades disponibles según el tipo
  const availableSpecialties = [
    'Animales exóticos',
    'Cardiología',
    'Cirugía',
    'Cuidado felino',
    'Dermatología',
    'Fisioterapia',
    'Medicina general',
    'Nutrición',
    'Odontología',
    'Oftalmología',
    'Oncología',
    'Ortopedia',
    'Peluquería canina',
    'Peluquería felina',
    'Radiología',
    'Reproducción',
    'Urgencias 24h',
    'Vacunación'
  ];
  
  // Función para agregar una especialidad
  const addSpecialty = (specialty) => {
    if (!specialties.includes(specialty)) {
      setSpecialties([...specialties, specialty]);
    }
    setShowSpecialtiesModal(false);
  };
  
  // Función para eliminar una especialidad
  const removeSpecialty = (specialty) => {
    setSpecialties(specialties.filter(item => item !== specialty));
  };
  
  // Usar la tienda de Zustand en lugar del contexto
  const registerProvider = useAuthStore(state => state.registerProvider);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);

  const handleRegister = async () => {
    clearError(); // Limpiar errores anteriores
    
    if (!name || !email || !password || !confirmPassword || !phone || !providerType) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    
    if (specialties.length === 0) {
      Alert.alert('Error', 'Debe seleccionar al menos una especialidad');
      return;
    }
    
    const result = await registerProvider({
      name,
      email,
      password, 
      confirmPassword, 
      phone, 
      providerType, 
      specialties
    });
    
    if (!result.success) {
      Alert.alert('Error de registro', result.error || 'No se pudo completar el registro');
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E88E5" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Crear Cuenta de Prestador</Text>
            <Text style={styles.subHeaderText}>Registra tus datos como prestador de servicios</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre o razón social"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
              />
            </View>
            
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
              <Ionicons name="call-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Teléfono de contacto"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setShowTypeModal(true)}
            >
              <Ionicons name="briefcase-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <Text style={providerType ? styles.input : [styles.input, {color: '#888'}]}>
                {providerType || "Tipo de prestador"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#888" style={{marginRight: 10}} />
            </TouchableOpacity>
            
            <View style={styles.specialtiesContainer}>
              <Text style={styles.specialtiesTitle}>Especialidades:</Text>
              {specialties.length > 0 ? (
                <View style={styles.specialtyChips}>
                  {specialties.map((specialty, index) => (
                    <View key={index} style={styles.specialtyChip}>
                      <Text style={styles.specialtyChipText}>{specialty}</Text>
                      <TouchableOpacity onPress={() => removeSpecialty(specialty)}>
                        <Ionicons name="close-circle" size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noSpecialtiesText}>No hay especialidades seleccionadas</Text>
              )}
              <TouchableOpacity 
                style={styles.addSpecialtyButton}
                onPress={() => setShowSpecialtiesModal(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#1E88E5" />
                <Text style={styles.addSpecialtyText}>Agregar especialidad</Text>
              </TouchableOpacity>
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
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#1E88E5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
            
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Registrando...' : 'Registrarse como prestador'}
              </Text>
            </TouchableOpacity>
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes una cuenta de prestador? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginButtonText}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Modal para seleccionar tipo de prestador */}
          <Modal
            visible={showTypeModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTypeModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Seleccionar tipo de prestador</Text>
                <ScrollView>
                  {providerTypes.map((type, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.modalItem}
                      onPress={() => {
                        setProviderType(type);
                        setShowTypeModal(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowTypeModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          {/* Modal para seleccionar especialidades */}
          <Modal
            visible={showSpecialtiesModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowSpecialtiesModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Seleccionar especialidad</Text>
                <ScrollView>
                  {availableSpecialties
                    .filter(specialty => !specialties.includes(specialty))
                    .map((specialty, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.modalItem}
                        onPress={() => addSpecialty(specialty)}
                      >
                        <Text style={styles.modalItemText}>{specialty}</Text>
                      </TouchableOpacity>
                    ))
                  }
                </ScrollView>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowSpecialtiesModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  backButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  headerContainer: {
    marginBottom: 30,
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  subHeaderText: {
    fontSize: 16,
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
  registerButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  specialtiesContainer: {
    marginBottom: 15,
  },
  specialtiesTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  specialtyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  specialtyChip: {
    backgroundColor: '#1E88E5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialtyChipText: {
    color: 'white',
    marginRight: 6,
  },
  noSpecialtiesText: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  addSpecialtyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSpecialtyText: {
    color: '#1E88E5',
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1E88E5',
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#333',
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginButtonText: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
