import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../styles/globalStyles';
import useAuthStore from '../../store/useAuthStore';

const EarningsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'month', 'week'
  const [totalEarnings, setTotalEarnings] = useState({
    total: 0,
    pendiente: 0,
    completado: 0
  });
  const [transactions, setTransactions] = useState([]);
  
  // Obtener información del prestador desde el store
  const user = useAuthStore(state => state.user);
  const provider = useAuthStore(state => state.provider);

  // Cargar ganancias al iniciar
  useEffect(() => {
    loadEarnings();
  }, []);

  // Función para cargar las ganancias desde el backend
  const loadEarnings = async () => {
    try {
      setLoading(true);
      
      // En una implementación real, aquí llamaríamos a la API
      // Por ejemplo:
      // const response = await fetch(`https://api.example.com/prestadores/${provider?.id}/ganancias`);
      // const data = await response.json();
      
      // Simular una llamada a la API
      setTimeout(() => {
        // Datos de ejemplo
        const earningsData = [
          {
            id: 'trans1',
            cliente: 'María González',
            mascota: 'Fido (Perro)',
            servicio: 'Consulta general',
            monto: 5000,
            fecha: '12/05/2025',
            estado: 'completado',
            referencia: '#PAY-12345',
            comision: 500, // 10% de comisión para la plataforma
            montoNeto: 4500,
            metodoPago: 'Tarjeta de crédito'
          },
          {
            id: 'trans2',
            cliente: 'Carlos López',
            mascota: 'Michi (Gato)',
            servicio: 'Vacunación',
            monto: 3500,
            fecha: '08/05/2025',
            estado: 'completado',
            referencia: '#PAY-12346',
            comision: 350, // 10% de comisión para la plataforma
            montoNeto: 3150,
            metodoPago: 'Mercado Pago'
          },
          {
            id: 'trans3',
            cliente: 'Ana Martínez',
            mascota: 'Pelusa (Conejo)',
            servicio: 'Control',
            monto: 4200,
            fecha: '03/05/2025',
            estado: 'completado',
            referencia: '#PAY-12347',
            comision: 420, // 10% de comisión para la plataforma
            montoNeto: 3780,
            metodoPago: 'Efectivo'
          },
          {
            id: 'trans4',
            cliente: 'Javier Rodríguez',
            mascota: 'Rocky (Perro)',
            servicio: 'Emergencia',
            monto: 7500,
            fecha: '28/04/2025',
            estado: 'completado',
            referencia: '#PAY-12348',
            comision: 750, // 10% de comisión para la plataforma
            montoNeto: 6750,
            metodoPago: 'Tarjeta de débito'
          },
          {
            id: 'trans5',
            cliente: 'Laura Sánchez',
            mascota: 'Tom (Gato)',
            servicio: 'Desparasitación',
            monto: 2800,
            fecha: '22/04/2025',
            estado: 'pendiente',
            referencia: '#PAY-12349',
            comision: 280, // 10% de comisión para la plataforma
            montoNeto: 2520,
            metodoPago: 'Mercado Pago'
          },
          {
            id: 'trans6',
            cliente: 'Pedro Díaz',
            mascota: 'Luna (Perro)',
            servicio: 'Consulta general',
            monto: 5000,
            fecha: '15/04/2025',
            estado: 'pendiente',
            referencia: '#PAY-12350',
            comision: 500, // 10% de comisión para la plataforma
            montoNeto: 4500,
            metodoPago: 'Transferencia bancaria'
          },
          {
            id: 'trans7',
            cliente: 'Sofía Ramírez',
            mascota: 'Max (Perro)',
            servicio: 'Control',
            monto: 4200,
            fecha: '10/04/2025',
            estado: 'completado',
            referencia: '#PAY-12351',
            comision: 420, // 10% de comisión para la plataforma
            montoNeto: 3780,
            metodoPago: 'Efectivo'
          },
        ];

        // Calcular estadísticas
        const totalAmount = earningsData.reduce((sum, trans) => sum + trans.montoNeto, 0);
        const pendingAmount = earningsData
          .filter(trans => trans.estado === 'pendiente')
          .reduce((sum, trans) => sum + trans.montoNeto, 0);
        const completedAmount = earningsData
          .filter(trans => trans.estado === 'completado')
          .reduce((sum, trans) => sum + trans.montoNeto, 0);

        setTotalEarnings({
          total: totalAmount,
          pendiente: pendingAmount,
          completado: completedAmount
        });

        setTransactions(earningsData);
        setLoading(false);
        setRefreshing(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error al cargar ganancias:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'No pudimos cargar tus ganancias. Intenta nuevamente.');
    }
  };

  // Función para filtrar transacciones por período
  const filterByPeriod = (period) => {
    setFilterPeriod(period);
  };

  // Obtener transacciones filtradas por período
  const getFilteredTransactions = () => {
    if (filterPeriod === 'all') return transactions;

    const now = new Date();
    let cutoffDate = new Date();

    if (filterPeriod === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (filterPeriod === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    }

    return transactions.filter(trans => {
      const transDate = parseDate(trans.fecha);
      return transDate >= cutoffDate;
    });
  };

  // Función para formatear montos en pesos argentinos
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('es-AR')}`;
  };

  // Función para parsear fecha en formato dd/mm/yyyy
  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/').map(Number);
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
          <View style={[
            styles.statusBadge,
            item.estado === 'completado' ? styles.completedBadge : styles.pendingBadge
          ]}>
            <Text style={[
              styles.statusText,
              item.estado === 'completado' ? styles.completedText : styles.pendingText
            ]}>
              {item.estado === 'completado' ? 'Cobrado' : 'Pendiente'}
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
      'Detalles de la transacción',
      `
Referencia: ${transaction.referencia}
Cliente: ${transaction.cliente}
Servicio: ${transaction.servicio}
Fecha: ${transaction.fecha}
Método de pago: ${transaction.metodoPago}

Monto bruto: ${formatCurrency(transaction.monto)}
Comisión VetYa (10%): ${formatCurrency(transaction.comision)}
Monto neto: ${formatCurrency(transaction.montoNeto)}

Estado: ${transaction.estado === 'completado' ? 'Cobrado' : 'Pendiente'}
      `,
      [{ text: 'Cerrar' }]
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
            filterPeriod === 'all' && styles.activeFilterButton
          ]}
          onPress={() => filterByPeriod('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filterPeriod === 'all' && styles.activeFilterButtonText
          ]}>Todo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'month' && styles.activeFilterButton
          ]}
          onPress={() => filterByPeriod('month')}
        >
          <Text style={[
            styles.filterButtonText,
            filterPeriod === 'month' && styles.activeFilterButtonText
          ]}>Último mes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'week' && styles.activeFilterButton
          ]}
          onPress={() => filterByPeriod('week')}
        >
          <Text style={[
            styles.filterButtonText,
            filterPeriod === 'week' && styles.activeFilterButtonText
          ]}>Última semana</Text>
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Ganancias</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Resumen de ganancias */}
      <View style={styles.earningsOverview}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Total ganado</Text>
          <Text style={styles.overviewValue}>{formatCurrency(totalEarnings.total)}</Text>
        </View>

        <View style={styles.overviewDetails}>
          <View style={styles.overviewDetailCard}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Cobrado</Text>
              <Text style={styles.detailValue}>{formatCurrency(totalEarnings.completado)}</Text>
            </View>
          </View>

          <View style={styles.overviewDetailCard}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Pendiente</Text>
              <Text style={styles.detailValue}>{formatCurrency(totalEarnings.pendiente)}</Text>
            </View>
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
            <Text style={styles.loadingText}>Cargando historial de ganancias...</Text>
          </View>
        ) : getFilteredTransactions().length > 0 ? (
          <FlatList
            data={getFilteredTransactions()}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerRight: {
    width: 40,
  },
  earningsOverview: {
    margin: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    ...SHADOWS.small,
  },
  overviewCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewLabel: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 5,
  },
  overviewValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  overviewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewDetailCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
  },
  detailIconContainer: {
    marginRight: 10,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.grey,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  filterContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
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
    fontWeight: 'bold',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
  },
  completedBadge: {
    backgroundColor: COLORS.success + '20',
  },
  pendingBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: 12,
    color: COLORS.grey,
    marginRight: 5,
  },
  referenceValue: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.grey,
    marginTop: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: 15,
  },
});

export default EarningsScreen;
