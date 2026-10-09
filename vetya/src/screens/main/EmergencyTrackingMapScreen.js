import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { emergenciaService } from '../../services/api';
import tileAssets from '../../../assets/maps/formosa/assets';
import viewerHtml from '../../../assets/maps/formosa/viewerHtml';
import manifest from '../../../assets/maps/formosa/manifest.json';
import { findRoadRoute } from '../../utils/formosaRoute';

const coordinate = value => {
  const latitude = Number(value?.lat ?? value?.latitud ?? value?.latitude);
  const longitude = Number(value?.lng ?? value?.longitud ?? value?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
};
const inside = point => point && point.latitude >= manifest.bounds.south && point.latitude <= manifest.bounds.north && point.longitude >= manifest.bounds.west && point.longitude <= manifest.bounds.east;
const sector = point => ({
  row: Math.max(0, Math.min(manifest.gridSize - 1, Math.floor((point.latitude - manifest.bounds.south) / (manifest.bounds.north - manifest.bounds.south) * manifest.gridSize))),
  col: Math.max(0, Math.min(manifest.gridSize - 1, Math.floor((point.longitude - manifest.bounds.west) / (manifest.bounds.east - manifest.bounds.west) * manifest.gridSize))),
});
const nearby = point => {
  const { row, col } = sector(point);
  const keys = [];
  for (let r = Math.max(0, row - 1); r <= Math.min(manifest.gridSize - 1, row + 1); r++)
    for (let c = Math.max(0, col - 1); c <= Math.min(manifest.gridSize - 1, col + 1); c++)
      if (tileAssets[`r${r}c${c}`]) keys.push(`r${r}c${c}`);
  return keys;
};
const approximate = point => {
  // A 1 km grid keeps the marker approximate; the animation is only a preview.
  const latStep = 1 / 111.32;
  const lonStep = 1 / (111.32 * Math.cos(point.latitude * Math.PI / 180));
  return { latitude: Math.round(point.latitude / latStep) * latStep, longitude: Math.round(point.longitude / lonStep) * lonStep };
};

export default function EmergencyTrackingMapScreen({ navigation, route }) {
  const emergencyId = route.params?.emergencyId;
  const webRef = useRef(null);
  const webReady = useRef(false);
  const mounted = useRef(true);
  const requested = useRef(new Set());
  const desired = useRef([]);
  const loadingTiles = useRef(false);
  const [details, setDetails] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [roadRoute, setRoadRoute] = useState(undefined);

  const inject = useCallback(script => webRef.current?.injectJavaScript(`${script};true;`), []);
  const loadAround = useCallback(point => {
    if (!inside(point) || !webReady.current) return;
    const keys = nearby(point);
    desired.current = keys;
    requested.current = new Set([...requested.current].filter(key => keys.includes(key)));
    inject(`window.keepTiles(${JSON.stringify(keys)})`);
    if (loadingTiles.current) return;
    loadingTiles.current = true;
    (async () => {
      while (mounted.current) {
        const key = desired.current.find(item => !requested.current.has(item));
        if (!key) break;
        requested.current.add(key);
        try {
          const asset = await Asset.fromModule(tileAssets[key]).downloadAsync();
          const base64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
          if (mounted.current && desired.current.includes(key)) inject(`window.loadTile(${JSON.stringify(key)},${JSON.stringify(base64)})`);
        } catch (error) {
          requested.current.delete(key);
          if (mounted.current) { setMapError('No se pudo cargar un sector del mapa 3D.'); break; }
        }
      }
      loadingTiles.current = false;
    })();
  }, [inject]);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    const fetchDetails = async () => {
      const response = await emergenciaService.getEmergencyDetails(emergencyId);
      if (cancelled) return;
      if (!response?.success) { setMapError(response?.error || 'No se pudo consultar la emergencia.'); setLoading(false); return; }
      setDetails(response.data);
      const current = await emergenciaService.getVetLocationUpdate(emergencyId);
      if (!cancelled) { setLocation(current?.success ? current.data : null); setLoading(false); }
    };
    if (emergencyId) fetchDetails();
    else { setMapError('Falta el identificador de la emergencia.'); setLoading(false); }
    return () => { cancelled = true; mounted.current = false; };
  }, [emergencyId]);

  const client = coordinate(details?.ubicacion?.coordenadas);
  const exactVet = coordinate(details?.veterinario?.ubicacionActual?.coordenadas);
  const vet = exactVet ? approximate(exactVet) : null;
  const use3D = inside(client) && inside(vet) && !mapError;
  useEffect(() => {
    if (!client || !vet) return;
    if (!inside(client) || !inside(vet)) { setRoadRoute(null); return; }
    let cancelled = false;
    setRoadRoute(undefined);
    (async () => {
      try {
        const asset = await Asset.fromModule(require('../../../assets/maps/formosa/roads.bin')).downloadAsync();
        const graph = JSON.parse(await FileSystem.readAsStringAsync(asset.localUri));
        if (!cancelled) setRoadRoute(findRoadRoute(graph, vet, client));
      } catch {
        if (!cancelled) setRoadRoute(null);
      }
    })();
    return () => { cancelled = true; };
  }, [client?.latitude, client?.longitude, vet?.latitude, vet?.longitude]);
  const readyData = client && vet ? {
    client, vet, route: roadRoute?.coordinates,
    reference: { lat: manifest.center[0], lon: manifest.center[1], latScale: manifest.metersPerDegree[0], lonScale: manifest.metersPerDegree[1] },
  } : null;

  useEffect(() => {
    if (!readyData || !webReady.current || !use3D) return;
    inject(`window.setMapData(${JSON.stringify(readyData)})`);
    loadAround({ latitude: (client.latitude + vet.latitude) / 2, longitude: (client.longitude + vet.longitude) / 2 });
  }, [details, roadRoute, use3D, inject, loadAround]);

  const onMessage = useCallback(event => {
    let message;
    try { message = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (message.type === 'ready') {
      webReady.current = true;
      if (readyData) {
        inject(`window.setMapData(${JSON.stringify(readyData)})`);
        loadAround({ latitude: (client.latitude + vet.latitude) / 2, longitude: (client.longitude + vet.longitude) / 2 });
      }
    } else if (message.type === 'view') {
      loadAround({ latitude: message.latitude, longitude: message.longitude });
    } else if (message.type === 'tileError') {
      requested.current.delete(message.key);
      setMapError('No se pudo mostrar el mapa 3D.');
    }
  }, [readyData, inject, loadAround]);

  return <SafeAreaView style={styles.root}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver" onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={24} color="#172c41" /></TouchableOpacity>
      <View style={styles.headerText}>
        <Text style={styles.title}>Mapa de la emergencia</Text>
        <Text style={styles.subtitle}>{details?.veterinario?.nombre || 'Veterinario'} · {location?.distancia?.texto || 'Distancia pendiente'} · {location?.tiempoEstimado?.texto || 'Tiempo pendiente'}</Text>
      </View>
    </View>
    {loading || (use3D && roadRoute === undefined) ? <View style={styles.center}><ActivityIndicator color="#1269d3" /></View> : client && vet ? (
      use3D ? <WebView ref={webRef} source={{ html: viewerHtml }} onMessage={onMessage} onError={() => setMapError('No se pudo abrir el mapa 3D.')} javaScriptEnabled scrollEnabled={false} originWhitelist={['*']} style={styles.map} />
        : <MapView style={styles.map} initialRegion={{ latitude: (client.latitude + vet.latitude) / 2, longitude: (client.longitude + vet.longitude) / 2, latitudeDelta: Math.max(.02, Math.abs(client.latitude - vet.latitude) * 2), longitudeDelta: Math.max(.02, Math.abs(client.longitude - vet.longitude) * 2) }}><Marker coordinate={client} title="Cliente" /><Marker coordinate={vet} title="Veterinario (aproximado)" pinColor="red" /><Polyline coordinates={roadRoute?.coordinates || [vet, client]} strokeColor="#e6443b" strokeWidth={3} lineDashPattern={[8, 6]} /></MapView>
    ) : <View style={styles.center}><Text style={styles.message}>{mapError || 'Aún no hay ubicación disponible del veterinario.'}</Text></View>}
    <View style={styles.notice}><Text style={styles.noticeText}>Azul: tu ubicación · rojo: {details?.veterinario?.nombre || 'veterinario'} (aprox.).</Text><Text style={styles.noticeText}>{roadRoute === undefined ? 'Calculando recorrido por calles...' : roadRoute ? `Recorrido simulado por calles OSM: ${(roadRoute.distanceMeters / 1000).toFixed(1)} km.` : 'Sin conexión vial calculable: trazo lineal de referencia.'} No indica navegación ni viaje en tiempo real.</Text><Text style={styles.credit} onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}>{manifest.source}</Text></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff' },
  back: { padding: 8, marginRight: 8 },
  headerText: { flex: 1 },
  title: { color: '#172c41', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#556b7b', fontSize: 12, marginTop: 3 },
  map: { flex: 1, backgroundColor: '#f8fbff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { color: '#556b7b', textAlign: 'center' },
  notice: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  noticeText: { color: '#34495b', fontSize: 12, lineHeight: 16 },
  credit: { color: '#718096', fontSize: 10, marginTop: 3 },
});
