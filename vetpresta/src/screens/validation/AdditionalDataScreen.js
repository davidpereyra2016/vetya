import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useValidacionStore from '../../store/useValidacionStore';
import useAuthStore from '../../store/useAuthStore';

const AdditionalDataScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    // Campos comunes (contacto y dirección)
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    // Campos específicos para veterinarios
    numeroMatricula: '',
    fechaGraduacion: '',
    universidad: '',
    especialidades: '',
    experienciaAnios: '',
    // Campos específicos para centros
    cuit_cuil: '',
    razonSocial: '',
    numeroHabilitacion: '',
    fechaHabilitacion: '',
    responsableTecnicoNombre: '',
    responsableTecnicoMatricula: '',
    responsableTecnicoDocumento: '',
    telefonoAlternativo: '',
    horarioAtencion: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store de validación
  const {
    estadoValidacion,
    prestadorTipo,
    datosAdicionales,
    isLoading,
    error,
    fetchEstadoValidacion,
    updateDatosAdicionales,
    clearError
  } = useValidacionStore();

  // Store de auth para obtener info del prestador
  const { provider } = useAuthStore();

  // Cargar estado al enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    console.log('🔄 Cargando datos iniciales...');
    await fetchEstadoValidacion();
    
    console.log('Datos adicionales obtenidos:', datosAdicionales);
    console.log('Datos del provider:', provider);
    
    // Pre-llenar formulario con datos de validación existentes
    if (datosAdicionales) {
      setFormData(prev => ({
        ...prev,
        ...datosAdicionales
      }));
    }

    // Pre-llenar con datos del prestador (información de contacto)
    if (provider) {
      setFormData(prev => ({
        ...prev,
        telefono: provider.telefono || prev.telefono,
        direccion: provider.direccion?.calle || prev.direccion,
        ciudad: provider.direccion?.ciudad || prev.ciudad,
        provincia: provider.direccion?.estado || prev.provincia,
        codigoPostal: provider.direccion?.codigoPostal || prev.codigoPostal
      }));
    }
    
    console.log('Datos del formulario después de cargar:', formData);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones comunes
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida';
    }

    if (!formData.provincia.trim()) {
      newErrors.provincia = 'La provincia es requerida';
    }

    if (!formData.codigoPostal.trim()) {
      newErrors.codigoPostal = 'El código postal es requerido';
    }

    // Validaciones específicas para veterinarios
    if (prestadorTipo === 'Veterinario') {
      if (!formData.numeroMatricula.trim()) {
        newErrors.numeroMatricula = 'El número de matrícula es requerido';
      }

      // if (!formData.especialidades.trim()) {
      //   newErrors.especialidades = 'Las especialidades son requeridas';
      // }

      // if (!formData.experienciaAnios.trim()) {
      //   newErrors.experienciaAnios = 'Los años de experiencia son requeridos';
      // } else if (isNaN(formData.experienciaAnios) || parseInt(formData.experienciaAnios) < 0) {
      //   newErrors.experienciaAnios = 'Debe ser un número válido';
      // }
    }

    // Validaciones específicas para centros
    if (prestadorTipo === 'Centro Veterinario' || prestadorTipo === 'Veterinaria') {
      if (!formData.cuit_cuil.trim()) {
        newErrors.cuit_cuil = 'El CUIT/CUIL es requerido';
      } else if (!/^\d{2}-\d{8}-\d{1}$/.test(formData.cuit_cuil)) {
        newErrors.cuit_cuil = 'Formato de CUIT/CUIL inválido (XX-XXXXXXXX-X)';
      }

      if (!formData.razonSocial.trim()) {
        newErrors.razonSocial = 'La razón social es requerida';
      }

      if (!formData.numeroHabilitacion.trim()) {
        newErrors.numeroHabilitacion = 'El número de habilitación es requerido';
      }

      if (!formData.horarioAtencion.trim()) {
        newErrors.horarioAtencion = 'El horario de atención es requerido';
      }
    }

    // Validaciones para tipo "Otro"
    // Solo requiere información de contacto (ya validada arriba)
    // Los campos adicionales son opcionales

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setIsSubmitting(true);
    
    console.log('=== ENVIANDO DATOS ADICIONALES ===');
    console.log('Tipo de prestador:', prestadorTipo);
    console.log('Datos del formulario:', formData);
    
    // Filtrar datos: eliminar campos vacíos, nulos y objetos vacíos
    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => {
        // Eliminar campos vacíos
        if (value === null || value === undefined || value === '') return false;
        // Eliminar objetos vacíos (como responsableTecnico: {})
        if (typeof value === 'object' && Object.keys(value).length === 0) return false;
        return true;
      })
    );
    
    console.log('Datos filtrados (sin campos vacíos):', filteredData);

    try {
      const result = await updateDatosAdicionales(filteredData);
      
      console.log('Resultado de la API:', result);

      if (result.success) {
        console.log('✅ Datos guardados exitosamente');
        Alert.alert(
          'Éxito',
          'Datos adicionales guardados correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('ValidationDashboard');
                }
              }
            }
          ]
        );
      } else {
        console.log('❌ Error al guardar:', result.error);
        Alert.alert('Error', result.error || 'Error al guardar datos');
      }
    } catch (error) {
      console.log('❌ Error inesperado:', error);
      Alert.alert('Error', 'Error inesperado al guardar datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo al escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const renderInput = (field, label, placeholder, options = {}) => {
    const {
      multiline = false,
      keyboardType = 'default',
      autoCapitalize = 'sentences',
      maxLength = null
    } = options;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            errors[field] && styles.textInputError
          ]}
          value={formData[field]}
          onChangeText={(value) => updateField(field, value)}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={true}
          selectTextOnFocus={true}
          underlineColorAndroid="transparent"
        />
        {errors[field] && (
          <Text style={styles.errorText}>{errors[field]}</Text>
        )}
      </View>
    );
  };

  const renderCommonFields = () => (
    <>
      <Text style={styles.sectionTitle}>Información de Contacto</Text>
      
      {renderInput('telefono', 'Teléfono *', '+54 11 1234-5678', {
        keyboardType: 'phone-pad'
      })}

      {renderInput('direccion', 'Dirección *', 'Calle y número')}

      {renderInput('ciudad', 'Ciudad *', 'Ciudad')}

      {renderInput('provincia', 'Provincia *', 'Provincia')}

      {renderInput('codigoPostal', 'Código Postal *', '1234', {
        keyboardType: 'numeric'
      })}
    </>
  );

  const renderVeterinarioFields = () => (
    <>
      <Text style={styles.sectionTitle}>Información Profesional</Text>
      
      {renderInput('numeroMatricula', 'Número de Matrícula *', 'MP 12345')}

      {renderInput('universidad', 'Universidad', 'Universidad donde se graduó')}

      {renderInput('fechaGraduacion', 'Fecha de Graduación', 'YYYY-MM-DD', {
        placeholder: 'Ej: 2015-12-15'
      })}

      {/* {renderInput('especialidades', 'Especialidades *', 'Ej: Clínica general, Cirugía', {
        multiline: true
      })} */}

      {/* {renderInput('experienciaAnios', 'Años de Experiencia *', '5', {
        keyboardType: 'numeric'
      })} */}
    </>
  );

  const renderCentroFields = () => (
    <>
      <Text style={styles.sectionTitle}>Información del Establecimiento</Text>
      
      {renderInput('cuit_cuil', 'CUIT/CUIL *', '20-12345678-9')}

      {renderInput('razonSocial', 'Razón Social *', 'Nombre legal del establecimiento')}

      {renderInput('numeroHabilitacion', 'Número de Habilitación *', 'Número municipal o provincial')}

      {renderInput('fechaHabilitacion', 'Fecha de Habilitación', 'YYYY-MM-DD', {
        placeholder: 'Ej: 2020-01-15'
      })}

      {renderInput('telefonoAlternativo', 'Teléfono Alternativo', 'Teléfono secundario de contacto')}
      
      <Text style={styles.sectionTitle}>Responsable Técnico</Text>
      
      {renderInput('responsableTecnicoNombre', 'Nombre del Responsable Técnico', 'Nombre completo del veterinario responsable')}
      
      {renderInput('responsableTecnicoMatricula', 'Matrícula del Responsable', 'MP 12345')}
      
      {renderInput('responsableTecnicoDocumento', 'Documento del Responsable', 'DNI o documento de identidad')}

      {renderInput('horarioAtencion', 'Horario de Atención *', 'Ej: Lun-Vie 8:00-18:00, Sáb 8:00-12:00')}
    </>
  );

  const renderOtroFields = () => (
    <>
      <Text style={styles.sectionTitle}>Información Adicional</Text>
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={24} color="#1E88E5" />
        <Text style={styles.infoBoxText}>
          Como prestador de tipo "Otro", solo necesitas completar la información de contacto básica.
          Puedes agregar información adicional opcional si lo deseas.
        </Text>
      </View>

      {renderInput('especialidades', 'Servicios que Ofreces', 'Describe brevemente los servicios que brindas', {
        multiline: true
      })}

      {renderInput('horarioAtencion', 'Horario de Atención', 'Ej: Lun-Vie 9:00-18:00', {
        multiline: true
      })}

      {renderInput('telefonoAlternativo', 'Teléfono Alternativo', 'Teléfono secundario de contacto', {
        keyboardType: 'phone-pad'
      })}
    </>
  );

  if (isLoading && !prestadorTipo) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('ValidationDashboard');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Datos Adicionales</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Ionicons name="close" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Completar Información</Text>
            <Text style={styles.infoSubtitle}>Prestador tipo: {prestadorTipo}</Text>
            <Text style={styles.infoText}>
              Completa la información adicional requerida para tu proceso de validación.
              Los campos marcados con * son obligatorios.
            </Text>
          </View>

          <View style={styles.formContainer}>
            {renderCommonFields()}
            
            {prestadorTipo === 'Veterinario' && renderVeterinarioFields()}
            {(prestadorTipo === 'Centro Veterinario' || prestadorTipo === 'Veterinaria') && renderCentroFields()}
            {prestadorTipo === 'Otro' && renderOtroFields()}
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>Guardar Datos</Text>
              </>
            )}
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 45,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 20,
  },
  errorText: {
    color: '#FF3B30',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#333',
    minHeight: 50,
  },
  textInputMultiline: {
    height: 100,
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  textInputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 10,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default AdditionalDataScreen;
