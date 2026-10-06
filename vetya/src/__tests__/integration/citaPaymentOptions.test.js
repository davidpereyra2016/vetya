import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CitaConfirmacionScreen from '../../screens/main/CitaConfirmacionScreen';
import axios from '../../config/axios';

const mockCreateAppointment = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback) => require('react').useEffect(callback, [callback]),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }), { virtual: true });
jest.mock('../../config/axios', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../store/usePagoStore', () => ({
  __esModule: true,
  default: () => ({ obtenerEstadoEfectivoPrestador: jest.fn().mockResolvedValue({ success: true, data: { canAcceptCash: true } }) }),
}));
jest.mock('../../store/useCitaStore', () => ({
  __esModule: true,
  default: () => ({ createAppointment: mockCreateAppointment }),
}));
jest.mock('../../utils/idempotency', () => ({ createIdempotencyKey: () => 'test-key' }));

const props = {
  navigation: { navigate: jest.fn() },
  route: { params: {
    appointmentData: { prestador: 'provider-id' },
    provider: { _id: 'provider-id', nombre: 'Veterinaria' },
    service: { nombre: 'Consulta', precio: 1000 },
  } },
};

test.each([
  [false, false],
  [true, true],
])('Mercado Pago disponible=%s se muestra=%s', async (disponible, visible) => {
  axios.get.mockResolvedValue({ data: { disponible } });
  const screen = render(<CitaConfirmacionScreen {...props} />);
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/pagos/mercadopago/prestador/provider-id/disponible'));
  expect(screen.getByText('Efectivo')).toBeTruthy();
  if (visible) await waitFor(() => expect(screen.getByText('Mercado Pago')).toBeTruthy());
  else expect(screen.queryByText('Mercado Pago')).toBeNull();
});

test('si se desvincula antes de pagar, no crea la cita', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { disponible: true } })
    .mockResolvedValueOnce({ data: { disponible: false } });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const screen = render(<CitaConfirmacionScreen {...props} />);
  await waitFor(() => expect(screen.getByText('Mercado Pago')).toBeTruthy());
  fireEvent.press(screen.getByText('Mercado Pago'));
  fireEvent.press(screen.getByText('Pagar con Mercado Pago'));
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Mercado Pago no disponible', expect.any(String)));
  expect(mockCreateAppointment).not.toHaveBeenCalled();
  alert.mockRestore();
});
