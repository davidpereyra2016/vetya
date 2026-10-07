import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StatusBar, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useVideoPlayer, VideoView } from 'expo-video';

const introVideo = require('../../../assets/videos/zuvia-intro.mp4');

export default function IntroScreen({ onFinish }) {
  const [layoutReady, setLayoutReady] = useState(false);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const mounted = useRef(true);
  const finished = useRef(false);
  const canPlay = useRef(false);
  const player = useVideoPlayer(introVideo, videoPlayer => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
    videoPlayer.volume = 0;
    videoPlayer.audioMixingMode = 'mixWithOthers';
    videoPlayer.staysActiveInBackground = false;
    if (Platform.OS === 'ios') videoPlayer.allowsExternalPlayback = false;
    // El primer fotograma se prepara pausado detrás del splash nativo.
  });

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    canPlay.current = false;
    player.pause();
    try {
      await SplashScreen.hideAsync();
    } catch {
      // Expo Go o un splash ya oculto no deben impedir abrir la aplicación.
    }
    if (mounted.current) onFinish();
  }, [onFinish, player]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const end = player.addListener('playToEnd', finish);
    const status = player.addListener('statusChange', ({ status: nextStatus }) => {
      if (nextStatus === 'error') finish();
    });
    if (player.status === 'error') finish();
    return () => {
      end.remove();
      status.remove();
    };
  }, [player, finish]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setAppState(nextState);
      if (nextState !== 'active') player.pause();
      else if (canPlay.current && !finished.current) player.play();
    });
    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    if (!layoutReady || !firstFrameReady || appState !== 'active' || finished.current) return;
    let cancelled = false;
    const start = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // Continuar si el entorno ya retiró el splash.
      }
      if (cancelled || !mounted.current || finished.current) return;
      canPlay.current = true;
      player.play();
    };
    start();
    return () => { cancelled = true; };
  }, [layoutReady, firstFrameReady, appState, player]);

  useEffect(() => {
    if (firstFrameReady || appState !== 'active') return;
    // Salvaguarda de carga fallida; la duración normal depende de playToEnd.
    const loadingTimeout = setTimeout(finish, 15000);
    return () => clearTimeout(loadingTimeout);
  }, [firstFrameReady, appState, finish]);

  return (
    <View style={styles.screen} onLayout={() => setLayoutReady(true)}
      pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <StatusBar hidden />
      <VideoView
        style={styles.video}
        player={player}
        contentFit="contain"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        startsPictureInPictureAutomatically={false}
        surfaceType="textureView"
        useExoShutter={false}
        onFirstFrameRender={() => setFirstFrameReady(true)}
      />
      {!firstFrameReady && <View style={styles.cover} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  video: { flex: 1, backgroundColor: '#FFFFFF' },
  cover: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF' },
});
