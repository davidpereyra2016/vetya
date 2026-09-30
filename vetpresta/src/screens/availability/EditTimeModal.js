import ScrollView from '../../components/common/AppScrollView';
import Modal from '../../components/common/ResponsiveModal';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={8} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          {/* Cuerpo */}
          <ScrollView contentContainerStyle={styles.modalBody}>
            <DateTimePicker
              value={getTimeAsDate()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              minuteInterval={5}
              is24Hour={true}
              style={styles.timePicker}
            />
          </ScrollView>

          {/* Botones (solo para iOS) */}
          {Platform.OS === 'ios' && (
            <View style={styles.modalFooter}>
              <TouchableOpacity accessibilityRole="button"
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity accessibilityRole="button"
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
    maxHeight: '90%',
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
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalBody: {
    flexShrink: 1,
    padding: 12,
    alignItems: 'center',
  },
  timePicker: {
    maxWidth: 250,
    width: '100%',
  },
  modalFooter: {
    flexWrap: 'wrap',
    gap: 8,
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
