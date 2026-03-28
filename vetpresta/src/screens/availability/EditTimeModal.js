import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/globalStyles';

/**
 * Componente para seleccionar una hora en formato "HH:MM"
 * @param {boolean} visible - Si el modal es visible
 * @param {function} onClose - Función para cerrar el modal
 * @param {string} timeValue - Valor actual de la hora (formato "HH:MM")
 * @param {function} onTimeChange - Función que recibe el nuevo valor de hora seleccionado
 * @param {string} title - Título descriptivo para el selector
 */
const EditTimeModal = ({ visible, onClose, timeValue, onTimeChange, title }) => {
  // Convertir el string de hora a un objeto Date
  const getTimeAsDate = () => {
    const today = new Date();
    const [hours, minutes] = timeValue.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);
    return today;
  };

  // Manejar cambio de hora
  const handleTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      if (!selectedDate) {
        onClose();
        return;
      }
    }

    const date = selectedDate || getTimeAsDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    onTimeChange(`${hours}:${minutes}`);
    
    // En iOS no cerramos automáticamente
    if (Platform.OS === 'android') {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Cabecera */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
          
          {/* Cuerpo */}
          <View style={styles.modalBody}>
            <DateTimePicker
              value={getTimeAsDate()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              minuteInterval={5}
              is24Hour={true}
              style={styles.timePicker}
            />
          </View>
          
          {/* Botones (solo para iOS) */}
          {Platform.OS === 'ios' && (
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => {
                  onClose();
                }}
              >
                <Text style={styles.confirmButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    width: '90%',
    maxWidth: 400,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  timePicker: {
    width: 250,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 15,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default EditTimeModal;
