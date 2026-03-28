import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Alert
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

// Sombras reutilizables
const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  }
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

const HelpSupportScreen = ({ navigation }) => {
  const contactEmail = 'vetyaoficial@gmail.com';

  const handleEmailSupport = async () => {
    const subject = 'Consulta de Soporte - VetYa!';
    const body = 'Hola equipo de VetYa!,\n\nTengo la siguiente consulta:\n\n';
    const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Error', 'No se pudo abrir el cliente de correo. Por favor, escríbenos a ' + contactEmail);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al intentar abrir el correo.');
    }
  };

  const faqs = [
    {
      question: '¿Cómo solicito un veterinario a domicilio?',
      answer: 'Desde la pantalla principal, selecciona el servicio que necesitas, busca a los profesionales disponibles en tu área y agenda una cita en el horario de tu preferencia.'
    },
    {
      question: '¿Qué métodos de pago aceptan?',
      answer: 'Aceptamos pagos en efectivo directamente con el profesional, así como transferencias y tarjetas a través de la plataforma (sujeto a disponibilidad del veterinario).'
    },
    {
      question: '¿Qué hago en caso de una emergencia?',
      answer: 'En la sección de búsqueda puedes filtrar por "Servicio de Emergencia". Los veterinarios disponibles te atenderán a la brevedad. Ten en cuenta que estos servicios pueden tener una tarifa diferenciada.'
    }
  ];

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
          <Text style={globalStyles.headerTitle}>Ayuda y Soporte</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contáctanos</Text>
          <Text style={styles.sectionSubtitle}>
            ¿Tienes algún problema con VetYa! o necesitas asistencia adicional? Estamos aquí para ayudarte.
          </Text>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Envíanos un correo</Text>
              <Text style={styles.contactDetail}>{contactEmail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <View style={styles.faqHeader}>
                <Ionicons name="help-circle" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.faqQuestion}>{faq.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 15,
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
    color: COLORS.grey,
  },
  faqCard: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 20,
    paddingLeft: 28,
  }
});

export default HelpSupportScreen;
