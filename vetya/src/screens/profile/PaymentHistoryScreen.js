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
          const prestadorNombre = pago.prestador?.nombre || "Prestador";
          const prestadorTipo = pago.prestador?.tipo || "Servicio veterinario";
          const prestadorImagen =
            pago.prestador?.usuario?.profilePicture ||
            pago.prestador?.imagen ||
            null;

          // Determinar servicio según el concepto
          let servicio = pago.concepto || "Servicio";
          if (pago.referencia?.id?.tipoServicio) {
            servicio = pago.referencia.id.tipoServicio;
          } else if (pago.referencia?.id?.tipoEmergencia) {
            servicio = `Emergencia - ${pago.referencia.id.tipoEmergencia}`;
          }

          // Determinar mascota si está disponible
          const mascotaNombre =
            pago.referencia?.id?.mascota?.nombre || "N/A";
          const mascotaTipo =
            pago.referencia?.id?.mascota?.tipo || null;
          const mascotaLabel = mascotaTipo
            ? `${mascotaNombre} (${mascotaTipo})`
            : mascotaNombre;

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

          // Fecha larga para el recibo
          const meses = [
            "Ene",
            "Feb",
            "Mar",
            "Abr",
            "May",
            "Jun",
            "Jul",
            "Ago",
            "Sep",
            "Oct",
            "Nov",
            "Dic",
          ];
          const fechaLarga = `${fecha.getDate().toString().padStart(2, "0")} ${
            meses[fecha.getMonth()]
          } ${fecha.getFullYear()}, ${fecha
            .getHours()
            .toString()
            .padStart(2, "0")}:${fecha
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;

          return {
            id: pago._id,
            prestador: prestadorNombre,
            prestadorData: {
              nombre: prestadorNombre,
              tipo: prestadorTipo,
              imagen: prestadorImagen,
            },
            mascota: mascotaLabel,
            servicio: servicio,
            concepto: pago.concepto || servicio,
            monto: pago.monto,
            fecha: fechaFormateada,
            fechaLarga,
            fechaISO: fecha.toISOString(),
            estado: estadoUI,
            referencia: `#${pago._id.slice(-8).toUpperCase()}`,
            transaccionId: `#${pago._id.slice(-8).toUpperCase()}`,
            metodoPago: pago.metodoPago || "No especificado",
          };
        });

        // Calcular estadísticas
        const completados = paymentsData.filter(
          (p) => p.estado === "completado"
        );
        const pendientes = paymentsData.filter(
          (p) => p.estado === "pendiente"
        );

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

  // Obtener transacciones filtradas
  const getFilteredTransactions = () => {
    if (filterPeriod === "all") return transactions;
    if (filterPeriod === "completado") {
      return transactions.filter((t) => t.estado === "completado");
    }
    if (filterPeriod === "pendiente") {
      return transactions.filter((t) => t.estado === "pendiente");
    }
    return transactions;
  };

  // Formatear montos
  const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toLocaleString("es-AR")}`;
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  // Abrir detalle del recibo
  const handleTransactionDetails = (transaction) => {
    navigation.navigate("ReceiptDetail", { payment: transaction });
  };

  // ─── RENDER DE CADA PAGO ───
  const renderPaymentCard = ({ item }) => {
    const isCompleted = item.estado === "completado";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => handleTransactionDetails(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isCompleted ? "#E8F5E9" : "#FFF3E0",
                },
              ]}
            >
              <Ionicons
                name="receipt"
                size={20}
                color={isCompleted ? COLORS.success : COLORS.warning}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.concepto} numberOfLines={1}>
                {item.servicio}
              </Text>
              <Text style={styles.fecha}>{item.fecha}</Text>
            </View>
          </View>
          <Text style={styles.monto}>{formatCurrency(item.monto)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompleted ? "#E8F5E9" : "#FFF3E0",
              },
            ]}
          >
            <Ionicons
              name={isCompleted ? "checkmark-circle" : "time"}
              size={12}
              color={isCompleted ? COLORS.success : COLORS.warning}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.statusText,
                { color: isCompleted ? "#2E7D32" : "#E65100" },
              ]}
            >
              {isCompleted ? "Completado" : "Pendiente"}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Text style={styles.verReciboText}>Ver recibo</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── FILTROS ───
  const filtrosDisponibles = [
    { key: "all", label: "Todos" },
    { key: "completado", label: "Completados" },
    { key: "pendiente", label: "Pendientes" },
  ];

  // ─── HEADER DE LA LISTA (stats) ───
  const ListHeader = () => (
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
        <View style={styles.detailCard}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: COLORS.success + "15" },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={26}
              color={COLORS.success}
            />
          </View>
          <Text style={styles.detailCardLabel}>Completado</Text>
          <Text style={[styles.detailCardValue, { color: COLORS.success }]}>
            {formatCurrency(totalPayments.completado)}
          </Text>
        </View>

        <View style={styles.detailCard}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: COLORS.warning + "15" },
            ]}
          >
            <Ionicons name="time" size={26} color={COLORS.warning} />
          </View>
          <Text style={styles.detailCardLabel}>Pendiente</Text>
          <Text style={[styles.detailCardValue, { color: COLORS.warning }]}>
            {formatCurrency(totalPayments.pendiente)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Historial de pagos</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ─── HEADER PREMIUM ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Pagos</Text>
          <View style={styles.headerBtnPlaceholder} />
        </View>
      </View>

      {/* ─── FILTROS PILL ─── */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filtrosDisponibles.map((filtro) => {
            const isActive = filterPeriod === filtro.key;
            return (
              <TouchableOpacity
                key={filtro.key}
                activeOpacity={0.8}
                style={[
                  styles.filterPill,
                  isActive
                    ? styles.filterPillActive
                    : styles.filterPillInactive,
                ]}
                onPress={() => setFilterPeriod(filtro.key)}
              >
                <Text
                  style={
                    isActive ? styles.filterTextActive : styles.filterTextInactive
                  }
                >
                  {filtro.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── LISTA ─── */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando historial de pagos...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredTransactions()}
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentCard}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={70} color="#DDD" />
              </View>
              <Text style={styles.emptyStateTitle}>
                Sin pagos registrados
              </Text>
              <Text style={styles.emptyStateText}>
                Aquí aparecerán los recibos de tus pagos por servicios
                veterinarios
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ─── HEADER PREMIUM ───
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "ios" ? 30 : 20,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBtn: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBtnPlaceholder: {
    width: 44,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
    flex: 1,
    textAlign: "center",
  },

  // ─── FILTROS PILL ───
  filtersWrapper: {
    paddingVertical: 15,
    backgroundColor: COLORS.background,
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  filterPillInactive: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  filterTextActive: { color: COLORS.white, fontWeight: "bold", fontSize: 13 },
  filterTextInactive: { color: "#666", fontWeight: "bold", fontSize: 13 },

  // ─── STATS OVERVIEW ───
  paymentsOverview: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    fontWeight: "600",
    opacity: 0.95,
  },
  totalCardValue: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  overviewDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  detailCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  detailCardLabel: {
    fontSize: 12,
    color: COLORS.grey,
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailCardValue: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1A237E",
    letterSpacing: 0.2,
    marginBottom: 12,
    marginTop: 4,
  },

  // ─── LISTA ───
  listContainer: {
    paddingBottom: 40,
    paddingHorizontal: 0,
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  concepto: { fontSize: 15, fontWeight: "bold", color: "#333", marginBottom: 2 },
  fecha: { fontSize: 12, color: "#888", fontWeight: "500" },
  monto: { fontSize: 18, fontWeight: "900", color: "#1A237E" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: "bold", textTransform: "uppercase" },
  actionRow: { flexDirection: "row", alignItems: "center" },
  verReciboText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.primary,
    marginRight: 2,
  },

  // ─── LOADING / EMPTY ───
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.grey,
    marginTop: 12,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
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
