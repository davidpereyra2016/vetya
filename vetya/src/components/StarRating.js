import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente reutilizable para mostrar y seleccionar valoraciones por estrellas
 * @param {Object} props - Propiedades del componente
 * @param {number} props.rating - Valoración actual (1-5)
 * @param {function} props.onRatingChange - Función a llamar cuando cambia la valoración
 * @param {boolean} props.readOnly - Si es true, el componente será solo para mostrar
 * @param {number} props.size - Tamaño de las estrellas (default: 20)
 * @param {string} props.color - Color de las estrellas (default: #FFD700)
 * @param {string} props.emptyColor - Color de las estrellas vacías (default: #D3D3D3)
 */
const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  readOnly = false, 
  size = 20, 
  color = '#FFD700', 
  emptyColor = '#D3D3D3',
  style
}) => {
  // Normalizar rating para asegurar que está entre 0-5
  const normalizedRating = Math.min(Math.max(rating, 0), 5);
  
  // Manejar el cambio de valoración
  const handleRatingChange = (selectedRating) => {
    if (readOnly || !onRatingChange) return;
    
    // Si ya estaba seleccionada esta estrella, permitir deseleccionar
    if (normalizedRating === selectedRating) {
      onRatingChange(0);
    } else {
      onRatingChange(selectedRating);
    }
  };
  
  // Renderizar las 5 estrellas
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      // Determinar qué icono mostrar basado en la valoración actual
      let iconName = 'star';
      
      if (i > Math.floor(normalizedRating)) {
        // Si la valoración tiene decimales, mostrar media estrella
        if (i === Math.ceil(normalizedRating) && normalizedRating % 1 >= 0.5) {
          iconName = 'star-half';
        } else {
          iconName = 'star-outline';
        }
      }
      
      stars.push(
        <TouchableOpacity
          key={i}
          style={styles.starContainer}
          activeOpacity={readOnly ? 1 : 0.7}
          onPress={() => handleRatingChange(i)}
          disabled={readOnly}
        >
          <Ionicons 
            name={iconName} 
            size={size} 
            color={iconName !== 'star-outline' ? color : emptyColor} 
          />
        </TouchableOpacity>
      );
    }
    
    return stars;
  };
  
  return (
    <View style={[styles.container, style]}>
      {renderStars()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    padding: 2,
  },
});

export default StarRating;
