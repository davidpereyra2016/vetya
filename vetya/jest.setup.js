// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock react-native modules that might cause issues
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock expo modules
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'expo-push-token-test' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getBadgeCountAsync: jest.fn(() => Promise.resolve(0)),
  setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
  AndroidImportance: {
    MAX: 5,
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: 'standalone',
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test-project-id',
        },
      },
    },
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: -34.6037, longitude: -58.3816 }
  })),
  watchPositionAsync: jest.fn(),
  Accuracy: {
    High: 4,
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  documentDirectory: 'file://mock/document/',
  EncodingType: {
    Base64: 'base64',
    UTF8: 'utf8',
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  documentDirectory: 'file://mock/document/',
  EncodingType: {
    Base64: 'base64',
    UTF8: 'utf8',
  },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn((uri) => Promise.resolve({ uri })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

jest.mock('expo-notifications', () => ({
  __esModule: true,
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExpoPushToken[test]' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getBadgeCountAsync: jest.fn(() => Promise.resolve(0)),
  setBadgeCountAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('expo-device', () => ({
  __esModule: true,
  default: { isDevice: true },
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: 'standalone',
    expoConfig: { extra: { eas: { projectId: 'test-project' } } },
  },
}));

// Global test timeout
jest.setTimeout(10000);
