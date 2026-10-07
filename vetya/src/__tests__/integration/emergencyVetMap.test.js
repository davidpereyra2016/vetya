import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import EmergencyVetMapScreen from '../../screens/main/EmergencyVetMapScreen';

const mockFitToCoordinates = jest.fn();
const mockLoadAvailableVets = jest.fn();

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon' }), { virtual: true });
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(({ children, onMapReady, initialRegion }, ref) => {
      React.useImperativeHandle(ref, () => ({ fitToCoordinates: mockFitToCoordinates }));
      return <View testID="map" onMapReady={onMapReady} initialRegion={initialRegion}>{children}</View>;
    }),
    Marker: ({ children, coordinate, onPress }) =>
      <View testID={`marker-${coordinate.latitude}-${coordinate.longitude}`} onPress={onPress}>{children}</View>,
  };
});
jest.mock('../../store/useEmergencyStore', () => {
  const store = () => ({ loadAvailableVets: mockLoadAvailableVets });
  store.getState = () => ({ availableVets: [] });
  return { __esModule: true, default: store };
});
jest.mock('../../store/useAuthStore', () => ({
  __esModule: true,
  default: { getState: () => ({ user: null }) },
}));
jest.mock('../../services/api', () => ({ emergenciaService: { getEmergencyDetails: jest.fn() } }));

const emergencyData = { ubicacion: { coordenadas: { latitud: -26.1775, longitud: -58.1781 } } };
const vets = [
  { _id: 'one', nombre: 'Uno', ubicacionActual: { coordenadas: { lat: -26.19, lng: -58.17 } } },
  { _id: 'two', nombre: 'Dos', ubicacionActual: { coordenadas: { lat: -26.2, lng: -58.2 } } },
  { _id: 'invalid', nombre: 'Inválido', ubicacionActual: { coordenadas: { lat: 'invalid', lng: -58.2 } } },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadAvailableVets.mockResolvedValue(vets);
});

test('renders real coordinates and reframes the map when the selected vet changes', async () => {
  const screen = render(<EmergencyVetMapScreen navigation={{ goBack: jest.fn() }} route={{ params: { emergencyData } }} />);

  await waitFor(() => expect(screen.getByTestId('marker--26.19--58.17')).toBeTruthy());
  expect(screen.getByTestId('marker--26.1775--58.1781')).toBeTruthy();
  expect(screen.queryByTestId('marker-NaN--58.2')).toBeNull();
  expect(screen.getByTestId('map').props.initialRegion).toEqual({
    latitude: -26.1775, longitude: -58.1781, latitudeDelta: 0.02, longitudeDelta: 0.02,
  });

  act(() => screen.getByTestId('map').props.onMapReady());
  expect(mockFitToCoordinates).toHaveBeenCalledWith(
    [{ latitude: -26.1775, longitude: -58.1781 }, { latitude: -26.19, longitude: -58.17 }],
    expect.objectContaining({ animated: false })
  );

  fireEvent.press(screen.getByTestId('marker--26.2--58.2'));
  await waitFor(() => expect(mockFitToCoordinates).toHaveBeenCalledWith(
    [{ latitude: -26.1775, longitude: -58.1781 }, { latitude: -26.2, longitude: -58.2 }],
    expect.objectContaining({ animated: true })
  ));
  screen.unmount();
});

test('keeps the screen usable without coordinates', async () => {
  mockLoadAvailableVets.mockResolvedValue([]);
  const screen = render(<EmergencyVetMapScreen navigation={{ goBack: jest.fn() }} route={{ params: {} }} />);
  await waitFor(() => expect(screen.getByText('Buscando veterinarios cercanos...')).toBeTruthy());
  expect(screen.getByTestId('map').props.initialRegion).toBeUndefined();
  expect(screen.queryAllByTestId(/^marker-/)).toHaveLength(0);
  screen.unmount();
});
