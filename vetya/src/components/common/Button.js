import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Button = ({
  title,
  onPress,
  style,
  textStyle,
  iconName,
  iconColor = '#fff',
  iconSize = 20,
  loading = false,
  disabled = false,
  outline = false,
  small = false,
  danger = false,
}) => {

  return (
    <TouchableOpacity
      style={[
        styles.button,
        outline && styles.outlineButton,
        small && styles.smallButton,
        danger && styles.dangerButton,
        danger && outline && styles.dangerOutlineButton,
        disabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={outline ? '#1E88E5' : '#fff'} />
      ) : (
        <>
          {iconName && (
            <Ionicons
              name={iconName}
              size={iconSize}
              color={iconColor}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              outline && styles.outlineText,
              small && styles.smallText,
              danger && styles.dangerText,
              danger && outline && styles.dangerOutlineText,
              disabled && styles.disabledText,
              textStyle
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexShrink: 1,
    maxWidth: '100%',
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  dangerOutlineButton: {
    borderColor: '#F44336',
    backgroundColor: 'transparent',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
    opacity: 0.75,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  outlineText: {
    color: '#1E88E5',
  },
  smallText: {
    fontSize: 14,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  dangerOutlineText: {
    color: '#F44336',
  },
  disabledText: {
    color: '#9E9E9E',
  },
  icon: {
    marginRight: 0,
  },
});

export default Button;
