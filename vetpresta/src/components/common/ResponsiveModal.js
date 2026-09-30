import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Keep the native Modal API; its content must supply a bounded scrollable body.
export default function ResponsiveModal({ children, ...props }) {
  return (
    <Modal {...props}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.frame}>{children}</SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({ frame: { flex: 1 } });
