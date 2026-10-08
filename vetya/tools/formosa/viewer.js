import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f8fbff');
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 1, 100000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x91a5b8, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(-700, 1700, 500);
scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(50000, 50000), new THREE.MeshBasicMaterial({ color: '#e9f0ec' }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -.12;
scene.add(ground);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.08;
controls.minDistance = 60;
controls.maxDistance = 35000;
const loader = new GLTFLoader();
const tiles = new Map();
let wantedTiles = new Set();
const reference = { lat: -26.2037942, lon: -58.2190497, latScale: 111320, lonScale: 99700 };
const point = ({ latitude, longitude }) => new THREE.Vector3((longitude - reference.lon) * reference.lonScale, 8, -(latitude - reference.lat) * reference.latScale);
const marker = color => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 12), new THREE.MeshBasicMaterial({ color }));
  scene.add(mesh);
  return mesh;
};
const clientMarker = marker('#1269d3');
const vetMarker = marker('#e6443b');
let clientPoint, vetPoint, route, startedAt;

function post(type, extra = {}) { window.ReactNativeWebView?.postMessage(JSON.stringify({ type, ...extra })); }
function currentView() {
  post('view', { latitude: reference.lat - controls.target.z / reference.latScale, longitude: reference.lon + controls.target.x / reference.lonScale });
}
let viewTimer;
controls.addEventListener('change', () => { clearTimeout(viewTimer); viewTimer = setTimeout(currentView, 350); });

window.setMapData = data => {
  Object.assign(reference, data.reference);
  clientPoint = point(data.client);
  vetPoint = point(data.vet);
  clientMarker.position.copy(clientPoint);
  vetMarker.position.copy(vetPoint);
  if (route) { scene.remove(route); route.geometry.dispose(); }
  const geometry = new THREE.BufferGeometry().setFromPoints([vetPoint.clone().setY(5), clientPoint.clone().setY(5)]);
  route = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: '#e6443b', dashSize: 55, gapSize: 35, linewidth: 2 }));
  route.computeLineDistances();
  scene.add(route);
  const middle = vetPoint.clone().add(clientPoint).multiplyScalar(.5);
  const distance = Math.max(500, vetPoint.distanceTo(clientPoint));
  controls.target.set(middle.x, 0, middle.z);
  camera.position.set(middle.x + distance * .38, Math.max(700, distance * .7), middle.z + distance * .75);
  camera.lookAt(controls.target);
  controls.update();
  startedAt = performance.now();
  currentView();
};

window.loadTile = (key, base64) => {
  if (tiles.has(key) || !wantedTiles.has(key)) return;
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  loader.parse(bytes.buffer, '', result => {
    if (tiles.has(key) || !wantedTiles.has(key)) return;
    tiles.set(key, result.scene);
    scene.add(result.scene);
    post('tileLoaded', { key });
  }, error => post('tileError', { key, message: String(error) }));
};

window.keepTiles = keys => {
  const wanted = new Set(keys);
  wantedTiles = wanted;
  for (const [key, root] of tiles) if (!wanted.has(key)) {
    scene.remove(root);
    root.traverse(object => { object.geometry?.dispose(); if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose()); });
    tiles.delete(key);
  }
};

function frame(now) {
  requestAnimationFrame(frame);
  if (clientPoint && vetPoint) {
    // shortcut: straight-line demonstration, replace with routed geometry if a licensed routing service is added.
    const fraction = Math.min(1, (now - startedAt) / 60000);
    vetMarker.position.copy(vetPoint).lerp(clientPoint, fraction);
  }
  controls.update();
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
post('ready');
