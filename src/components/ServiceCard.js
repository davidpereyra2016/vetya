import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you use Expo icons

const ServiceCard = ({ item, onPress }) => {
  const [pressed, setPressed] = useState(false);
  const animatedScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.timing(animatedScale, {
      toValue: 0.95,
      duration: 150,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.timing(animatedScale, {
      toValue: 1,
      duration: 150,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  // Use icon and color from the item prop directly
  const iconName = item.icon; 
  const iconColor = item.color; // Use item.color for the icon
  // Determine if it's an emergency card for specific styling (e.g., border)
  // This assumes your emergency service item in HomeScreen.js will have an id 'emergencias'
  // or you adapt this condition. Let's assume 'emergencias' id for border for now.
  const isEmergency = item.id === 'emergencias' || item.isEmergency;

  return (
    <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
      <TouchableOpacity
        style={[styles.card, pressed && styles.cardPressed, isEmergency && styles.emergencyCard]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1} // Use custom animation instead of default opacity
      >
        <Ionicons name={iconName} size={40} color={isEmergency ? '#F44336' : iconColor} />
        <Text style={[styles.cardText, isEmergency && styles.emergencyText]}>
          {item.title} {/* Display item.title instead of item.name */}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 5, // Added horizontal margin for spacing
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120, // Ensure cards have a minimum height
    flex: 1, // Make cards take available space in the row
  },
  cardPressed: {
    // Optional: Add styles for pressed state if needed beyond scale
  },
  emergencyCard: {
    borderColor: '#F44336',
    borderWidth: 1,
  },
  cardText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  emergencyText: {
    color: '#F44336',
  },
});

export default ServiceCard;
