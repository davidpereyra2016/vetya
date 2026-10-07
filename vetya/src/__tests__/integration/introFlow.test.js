import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AppState, BackHandler } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { VideoView } from 'expo-video';
import IntroScreen from '../../screens/onboarding/IntroScreen';

jest.mock('../../../assets/videos/zuvia-intro.mp4', () => 1);
jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn(() => Promise.resolve()) }));

let mockPlayer;
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: (source, setup) => {
    const React = require('react');
    return React.useMemo(() => {
      setup(mockPlayer);
      return mockPlayer;
    }, [source]);
  },
}));

const mockAuthState = {
  token: null, isFirstTime: false, isInitializing: true, checkAuth: jest.fn(),
};
jest.mock('../../store/useAuthStore', () => ({
  __esModule: true, default: selector => selector(mockAuthState),
}));
jest.mock('../../components/common/AppFrame', () => 'AppFrame');
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon' }));
jest.mock('@react-navigation/native', () => ({ NavigationContainer: 'NavigationContainer' }));
const mockNavigator = () => {
  const React = require('react');
  return {
    Navigator: ({ children }) => React.createElement(React.Children.toArray(children)[0].props.component),
    Screen: () => null,
  };
};
jest.mock('@react-navigation/stack', () => ({ createStackNavigator: mockNavigator }));
jest.mock('@react-navigation/bottom-tabs', () => ({ createBottomTabNavigator: mockNavigator }));

// Aislar las pantallas de negocio, conservando el selector real de rutas y la intro real.
const fs = require('fs');
const path = require('path');
const navigationPath = path.resolve(__dirname, '../../navigation/AppNavigator.js');
const imports = fs.readFileSync(navigationPath, 'utf8').matchAll(/import (\w+) from '(\.\.\/screens\/[^']+)';/g);
for (const [, name, relativePath] of imports) {
  if (name !== 'IntroScreen') {
    jest.doMock(path.resolve(path.dirname(navigationPath), relativePath), () => ({
      __esModule: true, default: name,
    }));
  }
}
const AppNavigator = require('../../navigation/AppNavigator').default;

let listeners;
let appStateListener;
let renderer;
let removed;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  listeners = {};
  removed = [];
  mockPlayer = {
    status: 'readyToPlay', play: jest.fn(), pause: jest.fn(),
    addListener: jest.fn((event, listener) => {
      listeners[event] = listener;
      const remove = jest.fn();
      removed.push(remove);
      return { remove };
    }),
  };
  AppState.currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, listener) => {
    appStateListener = listener;
    return { remove: jest.fn() };
  });
});

afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  renderer = null;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

async function mount(element) {
  await act(async () => { renderer = TestRenderer.create(element); });
}

async function ready() {
  await act(async () => {
    renderer.root.findByType(VideoView).props.onFirstFrameRender();
    renderer.root.findAllByType(require('react-native').View)[0].props.onLayout();
  });
}

test('espera layout y primer fotograma; reproduce sin controles, sin audio y por fin real', async () => {
  const onFinish = jest.fn();
  await mount(<IntroScreen onFinish={onFinish} />);
  expect(mockPlayer.play).not.toHaveBeenCalled();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  const video = renderer.root.findByType(VideoView);
  expect(video.props).toMatchObject({ contentFit: 'contain', nativeControls: false, allowsPictureInPicture: false });
  expect(mockPlayer).toMatchObject({ muted: true, volume: 0, loop: false, audioMixingMode: 'mixWithOthers' });
  await ready();
  expect(SplashScreen.hideAsync).toHaveBeenCalled();
  expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  expect(onFinish).not.toHaveBeenCalled();
  await act(async () => { listeners.playToEnd(); listeners.playToEnd(); });
  expect(onFinish).toHaveBeenCalledTimes(1);
  await act(async () => renderer.unmount());
  renderer = null;
  expect(removed.every(remove => remove.mock.calls.length === 1)).toBe(true);
});

test('pausa en segundo plano y continúa sin reiniciar al volver', async () => {
  const onFinish = jest.fn();
  await mount(<IntroScreen onFinish={onFinish} />);
  await ready();
  await act(async () => appStateListener('background'));
  expect(mockPlayer.pause).toHaveBeenCalled();
  await act(async () => appStateListener('active'));
  expect(mockPlayer.play).toHaveBeenCalled();
  expect(mockPlayer.currentTime).toBeUndefined();
  expect(onFinish).not.toHaveBeenCalled();
});

test('un error de decodificación retira el splash y permite continuar una sola vez', async () => {
  const onFinish = jest.fn();
  await mount(<IntroScreen onFinish={onFinish} />);
  await act(async () => {
    listeners.statusChange({ status: 'error' });
    listeners.playToEnd();
  });
  expect(SplashScreen.hideAsync).toHaveBeenCalled();
  expect(onFinish).toHaveBeenCalledTimes(1);
});

test('15 segundos son solo protección de carga; no cortan un video ya preparado', async () => {
  jest.useFakeTimers();
  const onFinish = jest.fn();
  await mount(<IntroScreen onFinish={onFinish} />);
  await ready();
  await act(async () => jest.advanceTimersByTime(20000));
  expect(onFinish).not.toHaveBeenCalled();
  await act(async () => listeners.playToEnd());
  expect(onFinish).toHaveBeenCalledTimes(1);
});

test('la carga bloqueada tiene salida y no depende de internet para obtener el MP4', async () => {
  jest.useFakeTimers();
  const onFinish = jest.fn();
  await mount(<IntroScreen onFinish={onFinish} />);
  await act(async () => jest.advanceTimersByTime(15000));
  expect(SplashScreen.hideAsync).toHaveBeenCalled();
  expect(onFinish).toHaveBeenCalledTimes(1);
});

test('intro → espera blanca → Login/Home/Onboarding, sin repetir tras logout o remontaje', async () => {
  const backRemove = jest.fn();
  const back = jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({ remove: backRemove });
  await mount(<AppNavigator />);
  expect(mockAuthState.checkAuth).toHaveBeenCalledTimes(1);
  expect(back.mock.calls[0][1]()).toBe(true);
  expect(renderer.root.findAllByType('NavigationContainer')).toHaveLength(0);
  await ready();
  await act(async () => listeners.playToEnd());
  expect(renderer.root.findAllByType(VideoView)).toHaveLength(0);
  expect(renderer.root.findAllByType('NavigationContainer')).toHaveLength(0);
  mockAuthState.isInitializing = false;
  await act(async () => renderer.update(<AppNavigator />));
  expect(renderer.root.findAllByType('LoginScreen')).toHaveLength(1);
  expect(backRemove).toHaveBeenCalled();
  mockAuthState.token = 'local-test-token';
  await act(async () => renderer.update(<AppNavigator />));
  expect(renderer.root.findAllByType('HomeScreen')).toHaveLength(1);
  mockAuthState.isFirstTime = true;
  await act(async () => renderer.update(<AppNavigator />));
  expect(renderer.root.findAllByType('OnboardingScreen')).toHaveLength(1);
  mockAuthState.token = null;
  await act(async () => renderer.update(<AppNavigator />));
  expect(renderer.root.findAllByType('LoginScreen')).toHaveLength(1);
  await act(async () => renderer.unmount());
  await mount(<AppNavigator />);
  expect(renderer.root.findAllByType(VideoView)).toHaveLength(0);
  expect(renderer.root.findAllByType('LoginScreen')).toHaveLength(1);
});
