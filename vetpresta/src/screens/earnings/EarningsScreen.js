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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOWS } from "../../styles/globalStyles";
import useAuthStore from "../../store/useAuthStore";
import usePagoStore from "../../store/usePagoStore";

const EarningsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("all"); // 'all', 'month', 'week'
  const [totalEarnings, setTotalEarnings] = useState({
    total: 0,
    pendiente: 0,
    completado: 0,
  });
  const [transactions, setTransactions] = useState([]);

  // Obtener información del prestador desde el store
  const user = useAuthStore((state) => state.user);
  const provider = useAuthStore((state) => state.provider);

  // Store de pagos
  const { obtenerMisPagos } = usePagoStore();

  // Cargar ganancias al iniciar
  useEffect(() => {
    loadEarnings();
  }, []);

  // Función para cargar las ganancias desde el backend
  const loadEarnings = async () => {
    try {
      setLoading(true);

      console.log("🔄 Cargando pagos del prestador...");

      // Obtener pagos reales del backend
      const result = await obtenerMisPagos();

      if (result.success) {
        const { pagos, estadisticas } = result.data;

        console.log("✅ Pagos cargados:", pagos.length);
        console.log("📊 Estadísticas:", estadisticas);

        // Transformar pagos del backend al formato de la UI
        const earningsData = pagos.map((pago) => {
          // Determinar nombre del cliente
          const clienteNombre = pago.usuario?.nombre || "Cliente";

          // Determinar servicio según el concepto
          let servicio = pago.concepto || "Servicio";
          if (pago.referencia?.id?.tipoServicio) {
            servicio = pago.referencia.id.tipoServicio;
          } else if (pago.referencia?.id?.tipoEmergencia) {
            servicio = `Emergencia - ${pago.referencia.id.tipoEmergencia}`;
          }

          // Determinar mascota si está disponible
          const mascota = pago.referencia?.id?.mascota?.nombre
            ? `${pago.referencia.id.mascota.nombre}`
            : "N/A";

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
            cliente: clienteNombre,
            mascota: mascota,
            servicio: servicio,
            monto: pago.monto,
            fecha: fechaFormateada,
            estado: estadoUI,
            referencia: `#${pago._id.slice(-8).toUpperCase()}`,
            metodoPago: pago.metodoPago || "No especificado",
            // En una implementación real, calcularíamos la comisión
            comision: 0,
            montoNeto: pago.monto,
          };
        });

        // Establecer estadísticas
        setTotalEarnings({
          total: estadisticas.completado,
          pendiente: estadisticas.pendiente,
          completado: estadisticas.completado,
        });

        setTransactions(earningsData);
      } else {
        console.error("❌ Error al cargar pagos:", result.error);
        Alert.alert("Error", result.error || "No pudimos cargar tus ganancias");
        setTransactions([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar ganancias:", error);
      Alert.alert(
        "Error",
        "No pudimos cargar tus ganancias. Intenta nuevamente."
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
      const transDate = parseDate(trans.fecha);
      return transDate >= cutoffDate;
    });
  };

  // Función para formatear montos en pesos argentinos
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString("es-AR")}`;
  };

  // Función para parsear fecha en formato dd/mm/yyyy
  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadEarnings();
  };

  // Renderizar cada transacción
  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => handleTransactionDetails(item)}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.servicio}</Text>
          <Text style={styles.transactionDate}>{item.fecha}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatCurrency(item.montoNeto)}</Text>
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
              {item.estado === "completado" ? "Cobrado" : "Pendiente"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Cliente:</Text>
          <Text style={styles.detailValue}>{item.cliente}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Mascota:</Text>
          <Text style={styles.detailValue}>{item.mascota}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Método de pago:</Text>
          <Text style={styles.detailValue}>{item.metodoPago}</Text>
        </View>
      </View>

      <View style={styles.transactionFooter}>
        <View style={styles.referenceContainer}>
          <Text style={styles.referenceLabel}>Referencia:</Text>
          <Text style={styles.referenceValue}>{item.referencia}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
      </View>
    </TouchableOpacity>
  );

  // Función para mostrar detalles de una transacción
  const handleTransactionDetails = (transaction) => {
    Alert.alert(
      "Detalles de la transacción",
      `
Referencia: ${transaction.referencia}
Cliente: ${transaction.cliente}
Servicio: ${transaction.servicio}
Fecha: ${transaction.fecha}
Método de pago: ${transaction.metodoPago}

Monto bruto: ${formatCurrency(transaction.monto)}
Comisión VetYa (10%): ${formatCurrency(transaction.comision)}
Monto neto: ${formatCurrency(transaction.montoNeto)}

Estado: ${transaction.estado === "completado" ? "Cobrado" : "Pendiente"}
      `,
      [{ text: "Cerrar" }]
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'Perfil' });
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Ganancias</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Resumen de ganancias */}
      <View style={styles.earningsOverview}>
        {/* Total ganado - Card principal */}
        <View style={styles.totalCard}>
          <View style={styles.totalCardHeader}>
            <Ionicons name="wallet" size={28} color={COLORS.white} />
            <Text style={styles.totalCardLabel}>Total ganado</Text>
          </View>
          <Text style={styles.totalCardValue}>
            {formatCurrency(totalEarnings.total)}
          </Text>
        </View>

        {/* Tarjetas de detalle */}
        <View style={styles.overviewDetails}>
          {/* Cobrado */}
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
            <Text style={styles.detailCardLabel}>Cobrado</Text>
            <Text style={[styles.detailCardValue, { color: COLORS.success }]}>
              {formatCurrency(totalEarnings.completado)}
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
              {formatCurrency(totalEarnings.pendiente)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filtro de período */}
      {renderPeriodFilter()}

      {/* Lista de transacciones */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Historial de transacciones</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Cargando historial de ganancias...
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
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="cash-outline" size={70} color="#DDD" />
            <Text style={styles.emptyStateText}>
              No tienes transacciones en este período
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    ...SHADOWS.medium,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerRight: {
    width: 40,
  },
  earningsOverview: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    ...SHADOWS.medium,
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
    ...SHADOWS.small,
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
    ...SHADOWS.small,
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
  transactionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...SHADOWS.small,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
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
  transactionDetails: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.grey,
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
  },
  transactionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  referenceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  referenceLabel: {
    fontSize: 12,
    color: COLORS.grey,
    marginRight: 5,
  },
  referenceValue: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
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
  emptyStateText: {
    fontSize: 16,
    color: COLORS.grey,
    textAlign: "center",
    marginTop: 15,
  },
});

export default EarningsScreen;
