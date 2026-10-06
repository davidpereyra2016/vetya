jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), removeItem: jest.fn() }));
test('development respects the isolated backend override', () => {
  const previous = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:3999/api';
  try {
    jest.isolateModules(() => {
      expect(require('../../config/axios').API_URL).toBe('http://127.0.0.1:3999/api');
    });
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previous;
  }
});
