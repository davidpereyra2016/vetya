import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useValidacionStore from '../store/useValidacionStore';

const ValidationStatusBanner = ({ navigation, style }) => {
  const { estadoValidacion, getEstadoMessage } = useValidacionStore();

  // No mostrar banner si está aprobado o no hay estado
  if (!estadoValidacion || estadoValidacion === 'aprobado') {
    return null;
  }

  const getBannerConfig = () => {
    switch (estadoValidacion) {
      case 'pendiente_documentos':
        return {
          backgroundColor: '#FFF3CD',
          borderColor: '#FF9500',
          textColor: '#856404',
          icon: 'document-text-outline',
          actionText: 'Completar'
        };
      case 'en_revision':
        return {
          backgroundColor: '#E3F2FD',
          borderColor: '#007AFF',
          textColor: '#0D47A1',
          icon: 'time-outline',
          actionText: 'Ver Estado'
        };
      case 'rechazado':
        return {
          backgroundColor: '#FFE5E5',
          borderColor: '#FF3B30',
          textColor: '#721C24',
          icon: 'close-circle-outline',
          actionText: 'Ver Detalles'
        };
      case 'requiere_correccion':
        return {
          backgroundColor: '#FFF3CD',
          borderColor: '#FF9500',
          textColor: '#856404',
          icon: 'warning-outline',
          actionText: 'Corregir'
        };
      default:
        return {
          backgroundColor: '#F0F0F0',
          borderColor: '#8E8E93',
          textColor: '#666',
          icon: 'help-circle-outline',
          actionText: 'Ver Estado'
        };
    }
  };

  const config = getBannerConfig();
  const message = getEstadoMessage();

  const handlePress = () => {
    navigation.navigate('ValidationDashboard');
  };

  return (
    <TouchableOpacity 
      style={[
        styles.banner,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Ionicons 
          name={config.icon} 
          size={20} 
          color={config.textColor} 
          style={styles.icon}
        />
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.textColor }]}>
            Validación {estadoValidacion.replace('_', ' ')}
          </Text>
          <Text style={[styles.message, { color: config.textColor }]} numberOfLines={2}>
            {message}
          </Text>
        </View>
        
        <View style={styles.actionContainer}>
          <Text style={[styles.actionText, { color: config.textColor }]}>
            {config.actionText}
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={config.textColor} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default ValidationStatusBanner;
