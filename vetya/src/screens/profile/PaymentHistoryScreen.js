import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "../../store/useAuthStore";
import usePagoStore from "../../store/usePagoStore";

// Colores consistentes con la app
const COLORS = {
  primary: "#1E88E5",
  white: "#FFFFFF",
  background: "#F5F7FA",
  dark: "#333333",
  grey: "#999999",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
};

const PaymentHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [totalPayments, setTotalPayments] = useState({
    total: 0,
    completado: 0,
    pendiente: 0,
  });
  const [transactions, setTransactions] = useState([]);

  // Store de usuario y pagos
  const user = useAuthStore((state) => state.user);
  const { obtenerPagos, pagos } = usePagoStore();

  // Cargar pagos al iniciar
  useEffect(() => {
    loadPayments();
  }, []);

  // Función para cargar los pagos desde el backend
  const loadPayments = async () => {
    try {
      setLoading(true);
      console.log("🔄 Cargando historial de pagos del cliente...");

      await obtenerPagos();
      
      // Obtener pagos del store después de la llamada
      const result = usePagoStore.getState().pagos;
      
      if (result && result.length > 0) {
        console.log("✅ Pagos cargados:", result.length);

        // Transformar pagos del backend al formato de la UI
        const paymentsData = result.map((pago) => {
          // Determinar nombre del prestador
          const prestadorNombre = pago.prestador?.nombre || "Prestador";

          // Determinar servicio según el concepto
          let servicio = pago.concepto || "Servicio";
          if (pago.referencia?.id?.tipoServicio) {
            servicio = pago.referencia.id.tipoServicio;
          } else if (pago.referencia?.id?.tipoEmergencia) {
            servicio = `Emergencia - ${pago.referencia.id.tipoEmergencia}`;
          }

          // Determinar mascota si está disponible
          const mascota = pago.referencia?.id?.mascota?.nombre || "N/A";

          // Determinar estado para la UI
          let estadoUI = "pendiente";
          if (
            pago.estado === "Completado" ||
            pago.estado === "Capturado" ||
            pago.estado === "Pagado"
          ) {
            estadoUI = "completado";
          }

          // Formatear fecha
          const fecha = new Date(pago.createdAt || pago.fechaPago);
          const fechaFormateada = `${fecha
            .getDate()
            .toString()
            .padStart(2, "0")}/${(fecha.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${fecha.getFullYear()}`;

          return {
            id: pago._id,
            prestador: prestadorNombre,
            mascota: mascota,
            servicio: servicio,
            monto: pago.monto,
            fecha: fechaFormateada,
            fechaObj: fecha,
            estado: estadoUI,
            referencia: `#${pago._id.slice(-8).toUpperCase()}`,
            metodoPago: pago.metodoPago || "No especificado",
            concepto: pago.concepto,
          };
        });

        // Calcular estadísticas
        const completados = paymentsData.filter(p => p.estado === "completado");
        const pendientes = paymentsData.filter(p => p.estado === "pendiente");
        
        setTotalPayments({
          total: paymentsData.reduce((sum, p) => sum + p.monto, 0),
          completado: completados.reduce((sum, p) => sum + p.monto, 0),
          pendiente: pendientes.reduce((sum, p) => sum + p.monto, 0),
        });

        setTransactions(paymentsData);
      } else {
        console.log("📭 No hay pagos registrados");
        setTransactions([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar pagos:", error);
      Alert.alert(
        "Error",
        "No pudimos cargar tu historial de pagos. Intenta nuevamente."
      );
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para filtrar transacciones por período
  const filterByPeriod = (period) => {
    setFilterPeriod(period);
  };

  // Obtener transacciones filtradas por período
  const getFilteredTransactions = () => {
    if (filterPeriod === "all") return transactions;

    const now = new Date();
    let cutoffDate = new Date();

    if (filterPeriod === "week") {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (filterPeriod === "month") {
      cutoffDate.setMonth(now.getMonth() - 1);
    }

    return transactions.filter((trans) => {
      return trans.fechaObj >= cutoffDate;
    });
  };

  // Función para formatear montos en pesos argentinos
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString("es-AR")}`;
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  // Función para obtener el ícono del método de pago
  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case "mercadopago":
        return "card";
      case "efectivo":
        return "cash";
      default:
        return "wallet";
    }
  };

  // Función para obtener el color del método de pago
  const getPaymentMethodColor = (method) => {
    switch (method?.toLowerCase()) {
      case "mercadopago":
        return "#009EE3";
      case "efectivo":
        return "#4CAF50";
      default:
        return COLORS.grey;
    }
  };

  // Renderizar cada transacción (recibo)
  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => handleTransactionDetails(item)}
      activeOpacity={0.7}
    >
      {/* Header del recibo */}
      <View style={styles.receiptHeader}>
        <View style={styles.receiptLogoContainer}>
          <Ionicons name="receipt" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.receiptTitleContainer}>
          <Text style={styles.receiptTitle}>Recibo de Pago</Text>
          <Text style={styles.receiptRef}>{item.referencia}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.estado === "completado"
              ? styles.completedBadge
              : styles.pendingBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.estado === "completado"
                ? styles.completedText
                : styles.pendingText,
            ]}
          >
            {item.estado === "completado" ? "Pagado" : "Pendiente"}
          </Text>
        </View>
      </View>

      {/* Línea divisoria */}
      <View style={styles.divider} />

      {/* Detalles del servicio */}
      <View style={styles.receiptBody}>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Servicio:</Text>
          <Text style={styles.receiptValue}>{item.servicio}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Prestador:</Text>
          <Text style={styles.receiptValue}>{item.prestador}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Mascota:</Text>
          <Text style={styles.receiptValue}>{item.mascota}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Fecha:</Text>
          <Text style={styles.receiptValue}>{item.fecha}</Text>
        </View>
      </View>

      {/* Línea divisoria */}
      <View style={styles.divider} />

      {/* Método de pago y monto */}
      <View style={styles.receiptFooter}>
        <View style={styles.paymentMethodContainer}>
          <View
            style={[
              styles.paymentMethodIcon,
              { backgroundColor: getPaymentMethodColor(item.metodoPago) + "20" },
            ]}
          >
            <Ionicons
              name={getPaymentMethodIcon(item.metodoPago)}
              size={20}
              color={getPaymentMethodColor(item.metodoPago)}
            />
          </View>
          <Text style={styles.paymentMethodText}>{item.metodoPago}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.monto)}</Text>
        </View>
      </View>

      {/* Indicador de ver más */}
      <View style={styles.viewMoreContainer}>
        <Text style={styles.viewMoreText}>Ver detalles</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  // Función para mostrar detalles de una transacción
  const handleTransactionDetails = (transaction) => {
    Alert.alert(
      "📄 Detalle del Recibo",
      `
━━━━━━━━━━━━━━━━━━━━━━━━
Referencia: ${transaction.referencia}
━━━━━━━━━━━━━━━━━━━━━━━━

📋 SERVICIO
${transaction.servicio}

🏥 PRESTADOR
${transaction.prestador}

🐾 MASCOTA
${transaction.mascota}

📅 FECHA
${transaction.fecha}

💳 MÉTODO DE PAGO
${transaction.metodoPago}

━━━━━━━━━━━━━━━━━━━━━━━━
💰 TOTAL PAGADO
${formatCurrency(transaction.monto)}
━━━━━━━━━━━━━━━━━━━━━━━━

Estado: ${transaction.estado === "completado" ? "✅ Pagado" : "⏳ Pendiente"}
      `,
      [{ text: "Cerrar", style: "default" }]
    );
  };

  // Renderizar el filtro de período
  const renderPeriodFilter = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Mostrar:</Text>
      <View style={styles.filterButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === "all" && styles.activeFilterButton,
          ]}
          onPress={() => filterByPeriod("all")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterPeriod === "all" && styles.activeFilterButtonText,
            ]}
          >
            Todo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === "month" && styles.activeFilterButton,
          ]}
          onPress={() => filterByPeriod("month")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterPeriod === "month" && styles.activeFilterButtonText,
            ]}
          >
            Último mes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === "week" && styles.activeFilterButton,
          ]}
          onPress={() => filterByPeriod("week")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterPeriod === "week" && styles.activeFilterButtonText,
            ]}
          >
            Última semana
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Pagos</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Resumen de pagos */}
      <View style={styles.paymentsOverview}>
        {/* Total pagado - Card principal */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardHeader}>
            <Ionicons name="wallet" size={28} color={COLORS.white} />
            <Text style={styles.totalCardLabel}>Total pagado</Text>
          </View>
          <Text style={styles.totalCardValue}>
            {formatCurrency(totalPayments.total)}
          </Text>
        </View>

        {/* Tarjetas de detalle */}
        <View style={styles.overviewDetails}>
          {/* Completado */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons
                  name="checkmark-circle"
                  size={28}
                  color={COLORS.success}
                />
              </View>
            </View>
            <Text style={styles.detailCardLabel}>Completado</Text>
            <Text style={[styles.detailCardValue, { color: COLORS.success }]}>
              {formatCurrency(totalPayments.completado)}
            </Text>
          </View>

          {/* Pendiente */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: COLORS.warning + '15' }]}>
                <Ionicons 
                  name="time" 
                  size={28} 
                  color={COLORS.warning} 
                />
              </View>
            </View>
            <Text style={styles.detailCardLabel}>Pendiente</Text>
            <Text style={[styles.detailCardValue, { color: COLORS.warning }]}>
              {formatCurrency(totalPayments.pendiente)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filtro de período */}
      {renderPeriodFilter()}

      {/* Lista de transacciones */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Historial de pagos</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Cargando historial de pagos...
            </Text>
          </View>
        ) : getFilteredTransactions().length > 0 ? (
          <FlatList
            data={getFilteredTransactions()}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={70} color="#DDD" />
            </View>
            <Text style={styles.emptyStateTitle}>Sin pagos registrados</Text>
            <Text style={styles.emptyStateText}>
              Aquí aparecerán los recibos de tus pagos por servicios veterinarios
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBackButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  paymentsOverview: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  totalCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  totalCardLabel: {
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 10,
    fontWeight: "500",
    opacity: 0.9,
  },
  totalCardValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  overviewDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailCardHeader: {
    marginBottom: 12,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  detailCardLabel: {
    fontSize: 13,
    color: COLORS.grey,
    marginBottom: 6,
    fontWeight: "500",
  },
  detailCardValue: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  filterContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  filterButtonsContainer: {
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  activeFilterButtonText: {
    color: COLORS.white,
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 30,
  },
  // Estilos del recibo
  transactionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  receiptLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  receiptTitleContainer: {
    flex: 1,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  receiptRef: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: COLORS.success + "20",
  },
  pendingBadge: {
    backgroundColor: COLORS.warning + "20",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  completedText: {
    color: COLORS.success,
  },
  pendingText: {
    color: COLORS.warning,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  receiptBody: {
    marginBottom: 4,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 14,
    color: COLORS.grey,
  },
  receiptValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  receiptFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  paymentMethodText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "500",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.grey,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  viewMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  viewMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    marginRight: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.grey,
    marginTop: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.grey,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default PaymentHistoryScreen;
