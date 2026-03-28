import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Colores de la aplicación (patrón Vetya)
const COLORS = {
  primary: '#1E88E5',
  primaryDark: '#1565C0',
  card: '#FFFFFF',
  dark: '#333333',
  grey: '#666666',
  lightGrey: '#F5F7FA',
  white: '#FFFFFF'
};

// Estilos globales para el header
const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGrey
  },
  header: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white
  }
};

const PrivacyPolicyScreen = ({ navigation }) => {
  const lastUpdated = "24 de Marzo de 2026";

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={globalStyles.header}>
        <View style={globalStyles.headerContent}>
          <TouchableOpacity
            style={{ padding: 5 }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={globalStyles.headerTitle}>Política de Privacidad</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.documentHeader}>
          <Text style={styles.title}>Política de Privacidad de VetYa!</Text>
          <Text style={styles.dateText}>Última actualización: {lastUpdated}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.introText}>
            En VetYa! valoramos y respetamos su privacidad. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y protegemos su información cuando utiliza nuestra aplicación móvil.
          </Text>

          <Text style={styles.heading}>1. Información que Recopilamos</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Datos Personales:</Text> Nombre, dirección de correo electrónico, número de teléfono y dirección física (necesaria para los servicios a domicilio).{'\n'}
            <Text style={styles.bold}>Información de las Mascotas:</Text> Nombres, raza, edad, historial médico básico e imágenes cargadas a la plataforma.{'\n'}
            <Text style={styles.bold}>Datos de Ubicación:</Text> Recopilamos datos de ubicación precisa o aproximada para mostrar los veterinarios cercanos y facilitar la llegada del profesional a su domicilio.
          </Text>

          <Text style={styles.heading}>2. Uso de la Información</Text>
          <Text style={styles.paragraph}>
            Utilizamos su información para:{'\n'}
            • Conectarlo con profesionales veterinarios.{'\n'}
            • Procesar pagos y mantener el historial de sus transacciones.{'\n'}
            • Mejorar la seguridad y fiabilidad de nuestros servicios.{'\n'}
            • Enviar notificaciones sobre sus citas, cambios en los servicios o actualizaciones de la aplicación.
          </Text>

          <Text style={styles.heading}>3. Compartir Información</Text>
          <Text style={styles.paragraph}>
            Compartimos su información personal (nombre, dirección y datos de la mascota) únicamente con el veterinario que usted haya seleccionado para brindar el servicio, con el único fin de que pueda llevar a cabo la atención solicitada. No vendemos ni alquilamos su información personal a terceros para fines de marketing.
          </Text>

          <Text style={styles.heading}>4. Permisos de la Aplicación</Text>
          <Text style={styles.paragraph}>
            La aplicación puede solicitar acceso a:{'\n'}
            <Text style={styles.bold}>• Cámara y Galería:</Text> Para subir fotos de perfil o de sus mascotas.{'\n'}
            <Text style={styles.bold}>• GPS / Ubicación:</Text> Para encontrar servicios cercanos. Usted puede habilitar o deshabilitar este permiso desde la configuración de su dispositivo en cualquier momento.
          </Text>

          <Text style={styles.heading}>5. Seguridad de los Datos</Text>
          <Text style={styles.paragraph}>
            Implementamos medidas de seguridad administrativas, técnicas y físicas diseñadas para proteger su información contra accesos no autorizados, pérdida o alteración. Sin embargo, ningún método de transmisión por Internet es 100% seguro.
          </Text>

          <Text style={styles.heading}>6. Derechos del Usuario</Text>
          <Text style={styles.paragraph}>
            Usted tiene derecho a acceder, corregir, actualizar o solicitar la eliminación de su información personal. Puede hacerlo directamente desde la configuración de su cuenta en la aplicación o contactándonos.
          </Text>

          <Text style={styles.heading}>7. Contacto para Dudas de Privacidad</Text>
          <Text style={styles.paragraph}>
            Si tiene alguna pregunta, inquietud o queja sobre nuestra Política de Privacidad o nuestras prácticas de manejo de datos, comuníquese con nuestro oficial de privacidad en: vetyaoficial@gmail.com.
          </Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  documentHeader: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.grey,
    fontStyle: 'italic',
  },
  textContainer: {
    padding: 20,
  },
  introText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 22,
    marginBottom: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.dark,
  }
});

export default PrivacyPolicyScreen;
