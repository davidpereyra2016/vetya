// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock react-native modules that might cause issues
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock expo modules
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

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn((uri) => Promise.resolve({ uri })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

// Global test timeout
jest.setTimeout(10000);
