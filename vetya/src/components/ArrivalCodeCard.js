import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useEmergencyStore from '../store/useEmergencyStore';

export default function ArrivalCodeCard({ emergencyId, status }) {
  const arrival = useEmergencyStore(state => state.arrivalCodes[emergencyId]);
  const loadArrivalCode = useEmergencyStore(state => state.loadArrivalCode);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setError(null);
    setLoading(true);
    loadArrivalCode(emergencyId).then(result => {
      if (active) {
        setError(result.success ? null : result.error);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [emergencyId, status, loadArrivalCode]));
  const retry = async () => {
    setLoading(true);
    const result = await loadArrivalCode(emergencyId);
    setError(result.success ? null : result.error);
    setLoading(false);
  };
  if (['En atención', 'Atendida', 'Cancelada'].includes(status)) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu código de llegada</Text>
      <Text style={styles.instructions}>Dale este código al veterinario solo cuando llegue a tu domicilio. Al validarlo, comenzará la atención.</Text>
      {loading ? <ActivityIndicator color="#1E88E5" /> : error ? (
        <TouchableOpacity accessibilityRole="button" onPress={retry}>
          <Text style={styles.instructions}>{error}. Toca para reintentar.</Text>
        </TouchableOpacity>
      ) : (
        <Text accessibilityLabel={`Código de llegada: ${(arrival?.codigo || '').split('').join(' ')}`} style={styles.code}>
          {arrival?.codigo || '— — — —'}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { backgroundColor: '#EAF5FF', borderColor: '#B6DDFC', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16, gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#243D5D' },
  instructions: { fontSize: 14, lineHeight: 21, color: '#36546A' },
  code: { fontSize: 36, fontWeight: '800', letterSpacing: 10, textAlign: 'center', color: '#1E88E5' },
});
