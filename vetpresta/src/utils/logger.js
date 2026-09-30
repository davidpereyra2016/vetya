const getEnv = (key) => {
  if (typeof process === 'undefined' || !process.env) return undefined;
  return process.env[key];
};

const flagEnabled = (value) => value === true || value === 'true' || value === '1';
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : getEnv('NODE_ENV') !== 'production';
const debugLogsEnabled = flagEnabled(getEnv('EXPO_PUBLIC_DEBUG_LOGS'));
const networkLogsEnabled = flagEnabled(getEnv('EXPO_PUBLIC_DEBUG_NETWORK'));

const logger = {
  debug: (...args) => {
    if (isDev && debugLogsEnabled) console.log(...args);
  },
  network: (...args) => {
    if (isDev && (debugLogsEnabled || networkLogsEnabled)) console.log(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
  },
};

export default logger;
