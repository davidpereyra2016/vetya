import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';

// The frame owns screen insets once. Navigation uses zero additional insets;
// native modals have their own safe area because they use a separate window.
export default function AppFrame({ children }) {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView style={styles.frame}>{children}</SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ frame: { flex: 1, backgroundColor: '#F5F7FA' } });
