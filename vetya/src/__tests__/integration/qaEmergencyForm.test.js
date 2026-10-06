import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EmergencyFormScreen from '../../screens/main/EmergencyFormScreen';
import { syncCurrentUserLocation } from '../../services/locationService';

// Expo resolves its nested icon dependency in Metro; this suite tests form behavior only.
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon', MaterialCommunityIcons: 'Icon' }), { virtual: true });
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('../../store/usePetStore', () => ({ __esModule: true, default: { getState: () => ({ fetchPets: async () => ({ success: true, data: [{ _id: 'pet-qa', nombre: 'Mascota QA', tipo: 'Perro' }] }) }) } }));
jest.mock('../../store/useEmergencyStore', () => ({ __esModule: true, default: () => ({ createEmergency: jest.fn() }) }));
jest.mock('../../store/useAuthStore', () => {
  const store = selector => selector({ updateUser: jest.fn() });
  store.getState = () => ({ user: null });
  return { __esModule: true, default: store };
});
jest.mock('../../services/locationService', () => ({ syncCurrentUserLocation: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  syncCurrentUserLocation.mockResolvedValue({ success: true, data: { latitude: -26.1775, longitude: -58.1781, direccion: 'Lugar QA', ciudad: 'Formosa' } });
});
const setup = async () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  const screen = render(<EmergencyFormScreen navigation={navigation} />);
  await waitFor(() => expect(screen.getByText('Mascota QA')).toBeTruthy());
  return { screen, navigation };
};
test.each(['empty', 'description only', 'pet only'])('blocks incomplete form: %s', async mode => {
  const { screen, navigation } = await setup();
  if (mode === 'description only') fireEvent.changeText(screen.getByPlaceholderText('Describe brevemente la emergencia'), 'Prueba');
  if (mode === 'pet only') fireEvent.press(screen.getByText('Mascota QA'));
  fireEvent.press(screen.getByText('Buscar Veterinario'));
  expect(navigation.navigate).not.toHaveBeenCalled();
});
test('valid form forwards actual payload to map, without creating an emergency yet', async () => {
  const { screen, navigation } = await setup();
  fireEvent.press(screen.getByText('Mascota QA'));
  fireEvent.changeText(screen.getByPlaceholderText('Describe brevemente la emergencia'), 'Mi perro está decaído 😢. ¿Pueden venir?');
  fireEvent.press(screen.getByText('Intoxicación'));
  fireEvent.press(screen.getByText('Buscar Veterinario'));
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('EmergencyVetMap', expect.objectContaining({ emergencyData: expect.objectContaining({ mascota: 'pet-qa', tipoEmergencia: 'Envenenamiento', ubicacion: { direccion: 'Lugar QA', ciudad: 'Formosa', coordenadas: { latitud: -26.1775, longitud: -58.1781 } } }) })));
});
test('denied GPS blocks navigation and shows permission message', async () => {
  const { screen, navigation } = await setup();
  syncCurrentUserLocation.mockResolvedValue({ success: false, permissionDenied: true });
  fireEvent.press(screen.getByText('Mascota QA'));
  fireEvent.changeText(screen.getByPlaceholderText('Describe brevemente la emergencia'), 'Prueba');
  fireEvent.press(screen.getByText('Buscar Veterinario'));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Permiso denegado', expect.any(String)));
  expect(navigation.navigate).not.toHaveBeenCalled();
});
