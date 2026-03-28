import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Input = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  keyboardType, 
  autoCapitalize,
  multiline,
  numberOfLines,
  error,
  iconName,
  style,
  inputStyle,
  required,
  editable = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      
      <View 
        style={[
          styles.inputContainer, 
          isFocused && styles.focusedInput,
          error && styles.errorInput,
          !editable && styles.disabledInput
        ]}
      >
        {iconName && (
          <Ionicons 
            name={iconName} 
            size={20} 
            color={isFocused ? '#1E88E5' : '#888'} 
            style={styles.icon} 
          />
        )}
        
        <TextInput
          style={[
            styles.input, 
            multiline && styles.multilineInput,
            inputStyle
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={hidePassword}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setHidePassword(!hidePassword)}
          >
            <Ionicons 
              name={hidePassword ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#888" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  required: {
    color: '#F44336',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  focusedInput: {
    borderColor: '#1E88E5',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  errorInput: {
    borderColor: '#F44336',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 5,
  },
});

export default Input;
