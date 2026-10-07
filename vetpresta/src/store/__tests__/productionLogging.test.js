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
      const logger = require('../../utils/logger').default;
      for (const method of ['debug', 'network', 'warn', 'error']) logger[method]('private-test-data');
    });
    for (const output of outputs) expect(output).not.toHaveBeenCalled();
  } finally {
    global.__DEV__ = originalDev;
    if (originalDebug === undefined) delete process.env.EXPO_PUBLIC_DEBUG_LOGS;
    else process.env.EXPO_PUBLIC_DEBUG_LOGS = originalDebug;
    if (originalNetwork === undefined) delete process.env.EXPO_PUBLIC_DEBUG_NETWORK;
    else process.env.EXPO_PUBLIC_DEBUG_NETWORK = originalNetwork;
    jest.restoreAllMocks();
  }
});
