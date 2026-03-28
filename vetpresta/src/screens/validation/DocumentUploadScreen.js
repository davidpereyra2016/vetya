import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import useValidacionStore from '../../store/useValidacionStore';

const { width } = Dimensions.get('window');

const DocumentUploadScreen = ({ navigation }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Store de validación
  const {
    estadoValidacion,
    prestadorTipo,
    documentosRequeridos,
    documentosSubidos,
    isLoading,
    error,
    fetchEstadoValidacion,
    subirDocumento,
    eliminarDocumento,
    clearError,
    getDocumentosConErrores
  } = useValidacionStore();

  // Cargar estado al enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
      fetchEstadoValidacion();
    }, [])
  );

  // Solicitar permisos al cargar la pantalla
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permisos Requeridos',
        'Necesitamos acceso a la cámara y galería para subir documentos.',
        [{ text: 'OK' }]
      );
    }
  };

  const showImagePicker = (tipoDocumento) => {
    Alert.alert(
      'Seleccionar Documento',
      'Elige cómo quieres subir el documento',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cámara', onPress: () => openCamera(tipoDocumento) },
        { text: 'Galería', onPress: () => openImageLibrary(tipoDocumento) },
        { text: 'Archivo', onPress: () => openDocumentPicker(tipoDocumento) }
      ]
    );
  };

  const openCamera = async (tipoDocumento) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleDocumentUpload(tipoDocumento, result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  };

  const openImageLibrary = async (tipoDocumento) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleDocumentUpload(tipoDocumento, result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const openDocumentPicker = async (tipoDocumento) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handleDocumentUpload(tipoDocumento, result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleDocumentUpload = async (tipoDocumento, archivo) => {
    try {
      setUploadProgress(prev => ({ ...prev, [tipoDocumento]: 0 }));

      const onProgress = (progress) => {
        setUploadProgress(prev => ({ ...prev, [tipoDocumento]: progress }));
      };

      const result = await subirDocumento(tipoDocumento, archivo, '', onProgress);

      if (result.success) {
        Alert.alert('Éxito', 'Documento subido correctamente');
        setUploadProgress(prev => ({ ...prev, [tipoDocumento]: undefined }));
        await fetchEstadoValidacion(); // Refrescar estado
      } else {
        Alert.alert('Error', result.error || 'Error al subir documento');
        setUploadProgress(prev => ({ ...prev, [tipoDocumento]: undefined }));
      }
    } catch (error) {
      Alert.alert('Error', 'Error inesperado al subir documento');
      setUploadProgress(prev => ({ ...prev, [tipoDocumento]: undefined }));
    }
  };

  const handleDeleteDocument = async (tipoDocumento, indice = null) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await eliminarDocumento(tipoDocumento, indice);
            if (result.success) {
              Alert.alert('Éxito', 'Documento eliminado correctamente');
              await fetchEstadoValidacion(); // Refrescar estado
            } else {
              Alert.alert('Error', result.error || 'Error al eliminar documento');
            }
          }
        }
      ]
    );
  };

  const showImagePreview = (imageUri) => {
    setPreviewImage(imageUri);
    setPreviewVisible(true);
  };

  const getDocumentoEstado = (tipoDocumento) => {
    const documento = documentosSubidos?.find(doc => doc.tipo === tipoDocumento);
    if (!documento) return null;
    
    return {
      estado: documento.estado || 'pendiente',
      url: documento.url,
      observaciones: documento.observaciones,
      fechaSubida: documento.fechaSubida
    };
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'pendiente': '#FF9500',
      'aprobado': '#34C759',
      'rechazado': '#FF3B30',
      'requiere_revision': '#007AFF'
    };
    return colors[estado] || '#8E8E93';
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      'pendiente': 'time-outline',
      'aprobado': 'checkmark-circle-outline',
      'rechazado': 'close-circle-outline',
      'requiere_revision': 'warning-outline'
    };
    return icons[estado] || 'help-circle-outline';
  };

  const renderDocumentoCard = (tipoDocumento, index) => {
    const documentoEstado = getDocumentoEstado(tipoDocumento);
    const isUploading = uploadProgress[tipoDocumento] !== undefined;
    const progress = uploadProgress[tipoDocumento] || 0;

    return (
      <View key={index} style={styles.documentoCard}>
        <View style={styles.documentoHeader}>
          <Text style={styles.documentoTitulo}>{tipoDocumento}</Text>
          
          {documentoEstado && (
            <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(documentoEstado.estado) }]}>
              <Ionicons 
                name={getEstadoIcon(documentoEstado.estado)} 
                size={16} 
                color="#FFF" 
              />
              <Text style={styles.estadoText}>
                {documentoEstado.estado.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {documentoEstado && (
          <View style={styles.documentoInfo}>
            <Text style={styles.fechaSubida}>
              Subido: {new Date(documentoEstado.fechaSubida).toLocaleDateString()}
            </Text>
            
            {documentoEstado.observaciones && (
              <View style={styles.observacionesContainer}>
                <Ionicons name="information-circle-outline" size={16} color="#FF9500" />
                <Text style={styles.observacionesText}>{documentoEstado.observaciones}</Text>
              </View>
            )}

            {documentoEstado.url && (
              <View style={styles.previewContainer}>
                <TouchableOpacity 
                  style={styles.previewButton}
                  onPress={() => showImagePreview(documentoEstado.url)}
                >
                  <Image source={{ uri: documentoEstado.url }} style={styles.previewImage} />
                  <Ionicons name="eye-outline" size={20} color="#1E88E5" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {isUploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#1E88E5" />
            <Text style={styles.uploadingText}>Subiendo... {progress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.documentoAcciones}>
          <TouchableOpacity 
            style={[styles.accionButton, styles.subirButton]}
            onPress={() => showImagePicker(tipoDocumento)}
            disabled={isUploading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
            <Text style={styles.accionButtonText}>
              {documentoEstado ? 'Reemplazar' : 'Subir'}
            </Text>
          </TouchableOpacity>

          {documentoEstado && (
            <TouchableOpacity 
              style={[styles.accionButton, styles.eliminarButton]}
              onPress={() => handleDeleteDocument(tipoDocumento)}
              disabled={isUploading}
            >
              <Ionicons name="trash-outline" size={20} color="#FFF" />
              <Text style={styles.accionButtonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Verificar si hay documentos rechazados que requieren corrección
  const documentosConErrores = getDocumentosConErrores();
  const tieneDocumentosRechazados = documentosConErrores.length > 0;
  
  const canUploadDocuments = estadoValidacion === 'pendiente_documentos' || 
                            estadoValidacion === 'requiere_correccion' ||
                            tieneDocumentosRechazados;

  if (isLoading && !documentosRequeridos) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Cargando documentos...</Text>
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
        <Text style={styles.headerTitle}>Subir Documentos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}

        {!canUploadDocuments && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning-outline" size={24} color="#FF9500" />
            <Text style={styles.warningText}>
              {tieneDocumentosRechazados 
                ? `Tienes ${documentosConErrores.length} documento(s) rechazado(s) que puedes corregir y volver a subir.`
                : `No puedes subir documentos en el estado actual: ${estadoValidacion}`
              }
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Documentos Requeridos</Text>
          <Text style={styles.infoSubtitle}>Para prestador tipo: {prestadorTipo}</Text>
          <Text style={styles.infoText}>
            Sube todos los documentos requeridos para completar tu proceso de validación.
            Los documentos deben ser claros y legibles.
          </Text>
        </View>

        {tieneDocumentosRechazados && (
          <View style={[styles.infoCard, { borderLeftWidth: 4, borderLeftColor: '#FF3B30' }]}>
            <Text style={[styles.infoTitle, { color: '#FF3B30' }]}>
              ⚠️ Documentos Rechazados ({documentosConErrores.length})
            </Text>
            <Text style={styles.infoText}>
              Los siguientes documentos fueron rechazados y necesitan ser corregidos:
            </Text>
            {documentosConErrores.map((doc, index) => {
              // Mapeo de nombres técnicos a nombres amigables
              const nombreDocumentos = {
                'cedula': 'Cédula de Identidad',
                'matricula': 'Matrícula Profesional',
                'titulo': 'Título Universitario',
                'constanciaConsejo': 'Constancia del Consejo Profesional',
                'certificadoEspecialidad': 'Certificado de Especialidad',
                'cuit': 'CUIT/CUIL',
                'habilitacion': 'Habilitación Municipal',
                'responsableTecnico': 'Documentos del Responsable Técnico'
              };
              
              return (
                <Text key={index} style={[styles.infoText, { marginTop: 5, fontWeight: 'bold', color: '#FF3B30' }]}>
                  • {nombreDocumentos[doc.tipo] || doc.tipo}
                  {doc.observaciones && (
                    <Text style={{ fontWeight: 'normal', color: '#666' }}>
                      : {doc.observaciones}
                    </Text>
                  )}
                </Text>
              );
            })}
          </View>
        )}

        {documentosRequeridos?.map((tipoDocumento, index) => 
          renderDocumentoCard(tipoDocumento, index)
        )}
      </ScrollView>

      {/* Modal de previsualización */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={() => setPreviewVisible(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setPreviewVisible(false)}
              >
                <Ionicons name="close" size={30} color="#FFF" />
              </TouchableOpacity>
              
              {previewImage && (
                <Image source={{ uri: previewImage }} style={styles.previewImageLarge} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
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
    padding: 20,
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
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    flex: 1,
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningText: {
    color: '#856404',
    flex: 1,
    marginLeft: 10,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
  documentoCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  documentoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  estadoText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  documentoInfo: {
    marginBottom: 15,
  },
  fechaSubida: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  observacionesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  observacionesText: {
    color: '#856404',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewButton: {
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 5,
  },
  uploadingContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadingText: {
    color: '#1E88E5',
    fontSize: 14,
    marginLeft: 10,
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E88E5',
    borderRadius: 2,
  },
  documentoAcciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  subirButton: {
    backgroundColor: '#1E88E5',
  },
  eliminarButton: {
    backgroundColor: '#FF3B30',
  },
  accionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: width * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    zIndex: 1,
  },
  previewImageLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default DocumentUploadScreen;
