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

const TermsConditionsScreen = ({ navigation }) => {
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
          <Text style={globalStyles.headerTitle}>Términos y Condiciones</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.documentHeader}>
          <Text style={styles.title}>Términos de Uso de VetYa!</Text>
          <Text style={styles.dateText}>Última actualización: {lastUpdated}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.heading}>1. Aceptación de los Términos</Text>
          <Text style={styles.paragraph}>
            Al descargar, instalar y utilizar la aplicación VetYa! ("la Aplicación"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestra plataforma.
          </Text>

          <Text style={styles.heading}>2. Naturaleza del Servicio</Text>
          <Text style={styles.paragraph}>
            VetYa! es una plataforma tecnológica que facilita la conexión entre usuarios que requieren servicios veterinarios y profesionales veterinarios independientes que ofrecen dichos servicios a domicilio o en clínica. VetYa! no provee servicios veterinarios de manera directa y no se hace responsable por las acciones, diagnósticos o tratamientos aplicados por los profesionales registrados en la plataforma.
          </Text>

          <Text style={styles.heading}>3. Registro y Cuentas de Usuario</Text>
          <Text style={styles.paragraph}>
            Para utilizar ciertas funciones de la aplicación, deberá registrarse creando una cuenta. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que ocurran bajo su cuenta. La información proporcionada debe ser veraz y actualizada.
          </Text>

          <Text style={styles.heading}>4. Obligaciones de los Profesionales (Prestadores)</Text>
          <Text style={styles.paragraph}>
            Los veterinarios registrados declaran poseer las licencias, certificaciones y permisos vigentes requeridos por la ley para ejercer su profesión. VetYa! se reserva el derecho de suspender o cancelar cuentas de profesionales que no cumplan con estos requisitos o que reciban quejas fundadas por parte de los usuarios.
          </Text>

          <Text style={styles.heading}>5. Tarifas y Pagos</Text>
          <Text style={styles.paragraph}>
            Los precios de los servicios son establecidos por los profesionales o acordados a través de la plataforma. VetYa! puede cobrar comisiones o tarifas de servicio por el uso de la plataforma, las cuales serán comunicadas de manera transparente antes de confirmar cualquier transacción.
          </Text>

          <Text style={styles.heading}>6. Limitación de Responsabilidad</Text>
          <Text style={styles.paragraph}>
            VetYa! no será responsable por daños indirectos, incidentales, especiales, ejemplares o consecuentes, incluyendo la pérdida de datos, lesiones personales o daños a la propiedad, relacionados con el uso de los servicios coordinados a través de nuestra aplicación.
          </Text>

          <Text style={styles.heading}>7. Modificaciones</Text>
          <Text style={styles.paragraph}>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en la Aplicación. Su uso continuado de VetYa! constituye su aceptación de los términos modificados.
          </Text>

          <Text style={styles.heading}>8. Contacto</Text>
          <Text style={styles.paragraph}>
            Si tiene alguna pregunta sobre estos Términos, por favor contáctenos a través de: vetyaoficial@gmail.com.
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
  }
});

export default TermsConditionsScreen;
