jest.mock('../../services/api', () => ({ emergenciaService: { updateEmergencyLocation: jest.fn(), acceptEmergency: jest.fn() } }));
import { emergenciaService } from '../../services/api';
import useEmergencyStore from '../useEmergencyStore';

beforeEach(() => {
  jest.clearAllMocks();
  useEmergencyStore.setState({ emergencies: [], emergencias: [], activeEmergencies: [], currentEmergency: null, emergenciaActual: null });
});

test('location action used by details screen forwards coordinates', async () => {
  emergenciaService.updateEmergencyLocation.mockResolvedValue({ success: true });
  expect(typeof useEmergencyStore.getState().updateEmergencyLocation).toBe('function');
  expect(await useEmergencyStore.getState().updateEmergencyLocation('emergency', 0, -58)).toEqual({ success: true });
  expect(emergenciaService.updateEmergencyLocation).toHaveBeenCalledWith('emergency', 0, -58);
});

test('acceptance updates the existing assigned emergency without duplicating it', async () => {
  const emergency = { _id: 'emergency', estado: 'Confirmada', ubicacion: { coordenadas: { lat: -26, lng: -58 } } };
  useEmergencyStore.setState({ emergencies: [{ ...emergency, estado: 'Asignada' }], emergencias: [{ ...emergency, estado: 'Asignada' }] });
  emergenciaService.acceptEmergency.mockResolvedValue({ success: true, data: emergency });
  await useEmergencyStore.getState().acceptEmergency('emergency');
  expect(useEmergencyStore.getState().emergencies).toEqual([emergency]);
  expect(useEmergencyStore.getState().emergencias).toEqual([emergency]);
});
