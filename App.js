import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import 'react-native-gesture-handler';

// Navegación
import AppNavigator from './src/navigation/AppNavigator';

// Contexto
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        style="auto" 
        backgroundColor="#1E88E5" 
        barStyle="light-content"
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
