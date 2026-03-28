import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useNotificacionStore from '../store/useNotificacionStore';

/**
 * Componente que muestra un ícono de notificación con un badge
 * para el conteo de notificaciones no leídas
 */
const NotificacionBadge = ({ size = 24, color = '#fff' }) => {
  const navigation = useNavigation();
  const { conteoNoLeidas, updateUnreadCount } = useNotificacionStore();
  
  // Actualizar conteo al montar el componente
  useEffect(() => {
    const loadConteo = async () => {
      await updateUnreadCount();
    };
    
    loadConteo();
    
    // Actualizar cada vez que se enfoca la pantalla
    const unsubscribe = navigation.addListener('focus', () => {
      loadConteo();
    });
    
    return unsubscribe;
  }, []);
  
  const handlePress = () => {
    navigation.navigate('Notificaciones');
  };
  
  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      
      {conteoNoLeidas > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {conteoNoLeidas > 99 ? '99+' : conteoNoLeidas}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 5,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificacionBadge;
