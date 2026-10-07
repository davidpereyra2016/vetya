import axios from '../../config/axios';
import { veterinarioService } from '../../services/api';
import logger from '../../utils/logger';

jest.mock('../../config/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), defaults: { baseURL: 'http://local-test/api' } },
  setAuthToken: jest.fn(),
}));

afterEach(() => { jest.restoreAllMocks(); jest.clearAllTimers(); jest.useRealTimers(); });

test('una cancelación conserva el fallo para la UI sin emitir un error de consola', async () => {
  jest.useFakeTimers();
  const error = Object.assign(new Error('canceled'), { code: 'ERR_CANCELED', name: 'CanceledError' });
  axios.get.mockRejectedValueOnce(error);
  const output = jest.spyOn(logger, 'error');
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ status: 200 });
  try {
    const result = await veterinarioService.getAvailableForEmergencies();
    expect(result.success).toBe(false);
    expect(result.errorDetails.code).toBe('ERR_CANCELED');
    expect(output).not.toHaveBeenCalled();
  } finally { global.fetch = originalFetch; }
});

test('los fallos reales siguen disponibles como diagnóstico de desarrollo', async () => {
  jest.useFakeTimers();
  axios.get.mockRejectedValueOnce(Object.assign(new Error('server failure'), { response: { status: 500 } }));
  const output = jest.spyOn(logger, 'error').mockImplementation(() => {});
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ status: 200 });
  try {
    expect((await veterinarioService.getAvailableForEmergencies()).success).toBe(false);
    expect(output).toHaveBeenCalledTimes(1);
  } finally { global.fetch = originalFetch; }
});

test('producción no imprime datos aunque las banderas de depuración estén habilitadas', () => {
  const originalDev = global.__DEV__;
  const originalDebug = process.env.EXPO_PUBLIC_DEBUG_LOGS;
  const originalNetwork = process.env.EXPO_PUBLIC_DEBUG_NETWORK;
  const outputs = ['log', 'warn', 'error'].map(method => jest.spyOn(console, method).mockImplementation(() => {}));
  try {
    global.__DEV__ = false;
    process.env.EXPO_PUBLIC_DEBUG_LOGS = '1';
    process.env.EXPO_PUBLIC_DEBUG_NETWORK = '1';
    jest.isolateModules(() => {
      const productionLogger = require('../../utils/logger').default;
      for (const method of ['debug', 'network', 'warn', 'error']) productionLogger[method]('private-test-data');
    });
    for (const output of outputs) expect(output).not.toHaveBeenCalled();
  } finally {
    global.__DEV__ = originalDev;
    if (originalDebug === undefined) delete process.env.EXPO_PUBLIC_DEBUG_LOGS;
    else process.env.EXPO_PUBLIC_DEBUG_LOGS = originalDebug;
    if (originalNetwork === undefined) delete process.env.EXPO_PUBLIC_DEBUG_NETWORK;
    else process.env.EXPO_PUBLIC_DEBUG_NETWORK = originalNetwork;
  }
});
