import * as Location from 'expo-location';
import { syncCurrentUserLocation } from '../../services/locationService';
import { userService } from '../../services/api';
jest.mock('../../services/api', () => ({ userService: { updateCurrentLocation: jest.fn() } }));
jest.mock('expo-location', () => ({ Accuracy: { High: 4 }, requestForegroundPermissionsAsync: jest.fn(), getForegroundPermissionsAsync: jest.fn(), getCurrentPositionAsync: jest.fn(), reverseGeocodeAsync: jest.fn() }));

beforeEach(() => {
  jest.resetAllMocks();
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: -26.1775, longitude: -58.1781 } });
  Location.reverseGeocodeAsync.mockResolvedValue([{ street: 'Calle de prueba', streetNumber: '123', city: 'Formosa' }]);
  userService.updateCurrentLocation.mockResolvedValue({ success: true });
});

test('preserves exact GPS coordinates and reverse geocoded address', async () => {
  const result = await syncCurrentUserLocation();
  expect(result.success).toBe(true);
  expect(result.data).toMatchObject({ latitude: -26.1775, longitude: -58.1781, direccion: 'Calle de prueba 123', ciudad: 'Formosa' });
  expect(userService.updateCurrentLocation).toHaveBeenCalledWith(-26.1775, -58.1781);
});
test('denied permission never reads or sends coordinates', async () => {
  Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
  expect(await syncCurrentUserLocation()).toMatchObject({ success: false, permissionDenied: true });
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  expect(userService.updateCurrentLocation).not.toHaveBeenCalled();
});
test('disabled GPS failure is handled without an invented location', async () => {
  Location.getCurrentPositionAsync.mockRejectedValue(new Error('GPS disabled'));
  expect(await syncCurrentUserLocation()).toMatchObject({ success: false });
  expect(userService.updateCurrentLocation).not.toHaveBeenCalled();
});
test('geocoder failure retains GPS without inventing address', async () => {
  Location.reverseGeocodeAsync.mockRejectedValue(new Error('offline'));
  expect(await syncCurrentUserLocation()).toMatchObject({ success: true, data: { latitude: -26.1775, longitude: -58.1781, direccion: 'Dirección no disponible' } });
});
test.each([400, 401, 403, 404, 422, 500, 'timeout', 'offline'])('backend failure %s is returned to the form', async status => {
  userService.updateCurrentLocation.mockResolvedValue({ success: false, error: String(status) });
  expect(await syncCurrentUserLocation()).toEqual({ success: false, error: String(status) });
});
