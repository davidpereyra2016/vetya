import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ArrivalCodeCard from '../../components/ArrivalCodeCard';
import useEmergencyStore from '../../store/useEmergencyStore';
import { emergenciaService } from '../../services/api';

jest.mock('../../services/api', () => ({ emergenciaService: { getArrivalCode: jest.fn() }, veterinarioService: {} }));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
}));
beforeEach(() => { jest.clearAllMocks(); useEmergencyStore.getState().reset(); });

test('cliente ve cuatro dígitos con ceros iniciales durante la espera', async () => {
  emergenciaService.getArrivalCode.mockResolvedValue({ success: true, data: { codigo: '0042', confirmadaEn: null } });
  const screen = render(<ArrivalCodeCard emergencyId="arrival-qa" status="Solicitada" />);
  await waitFor(() => expect(screen.getByText('0042')).toBeTruthy());
  expect(screen.getByLabelText('Código de llegada: 0 0 4 2')).toBeTruthy();
  expect(emergenciaService.getArrivalCode).toHaveBeenCalledWith('arrival-qa');
});

test('el código deja de mostrarse al comenzar atención aunque quede en caché', async () => {
  emergenciaService.getArrivalCode.mockResolvedValue({ success: true, data: { codigo: null, confirmadaEn: '2026-10-05T00:00:00Z' } });
  useEmergencyStore.setState({ arrivalCodes: { 'arrival-qa': { codigo: '0042' } } });
  const screen = render(<ArrivalCodeCard emergencyId="arrival-qa" status="En atención" />);
  await waitFor(() => expect(useEmergencyStore.getState().arrivalCodes['arrival-qa'].codigo).toBeNull());
  expect(screen.queryByText('0042')).toBeNull();
});

test('fallo de red ofrece reintento sin inventar un código', async () => {
  emergenciaService.getArrivalCode.mockResolvedValue({ success: false, error: 'Sin conexión' });
  const screen = render(<ArrivalCodeCard emergencyId="arrival-qa" status="En camino" />);
  await waitFor(() => expect(screen.getByText('Sin conexión. Toca para reintentar.')).toBeTruthy());
  expect(screen.queryByText('0042')).toBeNull();
});
