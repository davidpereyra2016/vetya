import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Colores consistentes con la app
const COLORS = {
  primary: '#1E88E5',
  white: '#FFFFFF',
  background: '#F5F7FA',
  dark: '#333333',
  grey: '#999999',
  success: '#4CAF50',
  warning: '#FF9800',
  mercadoPago: '#009EE3',
};

const ReceiptDetailScreen = ({ route, navigation }) => {
  // Recibimos los datos del pago desde PaymentHistoryScreen
  const { payment } = route.params || {};

  // Fallbacks seguros
  const isCompleted = payment?.estado === 'completado';
  const monto = payment?.monto || 0;
  const transaccionId =
    payment?.transaccionId || payment?.referencia || '#TXN-000000';
  const prestador = payment?.prestadorData || {
    nombre: payment?.prestador || 'Prestador',
    tipo: 'Servicio veterinario',
    imagen: null,
  };
  const fechaDisplay = payment?.fechaLarga || payment?.fecha || '---';
  const concepto = payment?.servicio || payment?.concepto || '---';
  const mascota = payment?.mascota || '---';
  const metodoPago = payment?.metodoPago || 'No especificado';

  // Formatear moneda
  const formatCurrency = (amount) =>
    `$${Number(amount || 0).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
    })}`;

  // Icono del método de pago
  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'mercadopago':
        return 'card';
      case 'efectivo':
        return 'cash';
      default:
        return 'wallet';
    }
  };
  const getPaymentMethodColor = (method) => {
    switch (method?.toLowerCase()) {
      case 'mercadopago':
        return COLORS.mercadoPago;
      case 'efectivo':
        return COLORS.success;
      default:
        return COLORS.grey;
    }
  };

  // Copiar ID (sin dependencias extra): mostramos un Alert con el ID completo
  const copyTransactionId = () => {
    Alert.alert(
      'ID de Transacción',
      `${transaccionId}\n\nMantén pulsado para copiar.`,
      [{ text: 'OK' }]
    );
  };

  // Compartir recibo
  const handleShare = async () => {
    try {
      const mensaje =
        `Recibo Vetya\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `Concepto: ${concepto}\n` +
        `Prestador: ${prestador?.nombre}\n` +
        `Paciente: ${mascota}\n` +
        `Método de pago: ${metodoPago}\n` +
        `ID: ${transaccionId}\n` +
        `Fecha: ${fechaDisplay}\n` +
        `Total: ${formatCurrency(monto)}\n` +
        `Estado: ${isCompleted ? 'Completado' : 'Pendiente'}`;
      await Share.share({ message: mensaje });
    } catch (error) {
      console.error('Error al compartir recibo:', error);
    }
  };

  const handleDownload = () => {
    Alert.alert(
      'Descargar PDF',
      'La descarga del recibo estará disponible próximamente.',
      [{ text: 'Entendido' }]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Reportar un problema',
      '¿Deseas reportar un problema con este pago? Nuestro equipo te contactará a la brevedad.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reportar',
          onPress: () =>
            Alert.alert(
              'Reporte enviado',
              'Gracias. Un asesor se comunicará contigo.'
            ),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ─── HEADER PREMIUM (mismo estilo del resto de la app) ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recibo</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── CONTENIDO (debajo del header, no flotante) ─── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticketCard}>
          {/* Icono de Estado en el Top del ticket (NO sobre el header) */}
          <View style={styles.floatingIconWrapper}>
            <View
              style={[
                styles.floatingIconInner,
                {
                  backgroundColor: isCompleted
                    ? COLORS.success
                    : COLORS.warning,
                },
              ]}
            >
              <Ionicons
                name={isCompleted ? 'checkmark' : 'time'}
                size={32}
                color={COLORS.white}
              />
            </View>
          </View>

          {/* Sección 1: Monto y Estado */}
          <View style={styles.ticketSectionTop}>
            <Text
              style={[
                styles.statusLabel,
                { color: isCompleted ? COLORS.success : COLORS.warning },
              ]}
            >
              {isCompleted ? 'Pago Completado' : 'Pago Pendiente'}
            </Text>
            <Text style={styles.montoText}>{formatCurrency(monto)}</Text>
            <Text style={styles.fechaText}>
              {isCompleted ? 'Pagado el ' : 'Solicitado el '}
              {fechaDisplay}
            </Text>
          </View>

          {/* Separador tipo ticket (línea punteada + recortes laterales) */}
          <View style={styles.separatorContainer}>
            <View style={styles.dashedLine} />
            <View style={styles.cutoutLeft} />
            <View style={styles.cutoutRight} />
          </View>

          {/* Sección 2: Detalles de la Transacción */}
          <View style={styles.ticketSectionDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Concepto</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {concepto}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Método de pago</Text>
              <View style={styles.methodValueRow}>
                <View
                  style={[
                    styles.methodIcon,
                    {
                      backgroundColor:
                        getPaymentMethodColor(metodoPago) + '20',
                    },
                  ]}
                >
                  <Ionicons
                    name={getPaymentMethodIcon(metodoPago)}
                    size={14}
                    color={getPaymentMethodColor(metodoPago)}
                  />
                </View>
                <Text style={styles.detailValue}>{metodoPago}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID de Transacción</Text>
              <View style={styles.transactionRow}>
                <Text style={styles.detailValue}>{transaccionId}</Text>
                <TouchableOpacity
                  onPress={copyTransactionId}
                  style={styles.copyBtn}
                >
                  <Ionicons
                    name="copy-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Paciente</Text>
              <Text style={styles.detailValue}>{mascota}</Text>
            </View>
          </View>

          <View style={styles.solidLine} />

          {/* Sección 3: Info del Prestador */}
          <View style={styles.ticketSectionProvider}>
            <Text style={styles.providerLabel}>Información del Prestador</Text>
            <View style={styles.providerMiniCard}>
              {prestador?.imagen ? (
                <Image
                  source={{ uri: prestador.imagen }}
                  style={styles.providerImg}
                />
              ) : (
                <View style={[styles.providerImg, styles.providerImgFallback]}>
                  <Ionicons name="person" size={22} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.providerInfo}>
                <Text style={styles.providerName} numberOfLines={1}>
                  {prestador?.nombre || 'Prestador'}
                </Text>
                <Text style={styles.providerType} numberOfLines={1}>
                  {prestador?.tipo || 'Servicio veterinario'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── BOTONES DE ACCIÓN ─── */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.btnDownload}
            activeOpacity={0.85}
            onPress={handleDownload}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color={COLORS.white}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.btnDownloadText}>Descargar PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnReport}
            activeOpacity={0.85}
            onPress={handleReport}
          >
            <Ionicons
              name="help-buoy-outline"
              size={20}
              color={COLORS.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.btnReportText}>Reportar un problema</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── HEADER (igual que el resto de la app) ───
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },

  // ─── SCROLL Y TICKET ───
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    // Espacio para que el icono flotante del ticket respire (no se monta sobre el header)
    paddingTop: 50,
    paddingBottom: 40,
  },
  ticketCard: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 25,
    position: 'relative',
  },

  // Icono flotante en el top del ticket
  floatingIconWrapper: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 20,
  },
  floatingIconInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sección 1 (Top: monto + estado)
  ticketSectionTop: {
    paddingTop: 45,
    paddingBottom: 25,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  montoText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1A237E',
    marginBottom: 4,
  },
  fechaText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },

  // Separador tipo ticket
  separatorContainer: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
  },
  dashedLine: {
    height: 1,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  cutoutLeft: {
    position: 'absolute',
    left: -15,
    top: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.background,
  },
  cutoutRight: {
    position: 'absolute',
    right: -15,
    top: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.background,
  },

  // Sección 2 (Detalles)
  ticketSectionDetails: {
    paddingVertical: 20,
    paddingHorizontal: 25,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    maxWidth: '60%',
    textAlign: 'right',
  },
  methodValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyBtn: {
    marginLeft: 8,
    padding: 2,
  },

  solidLine: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 25,
  },

  // Sección 3 (Prestador)
  ticketSectionProvider: {
    padding: 25,
  },
  providerLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  providerMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  providerImg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
  },
  providerImgFallback: {
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  providerType: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },

  // ─── BOTONES ───
  actionsContainer: {
    gap: 12,
  },
  btnDownload: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 12,
  },
  btnDownloadText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnReport: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  btnReportText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default ReceiptDetailScreen;
