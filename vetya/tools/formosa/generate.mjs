// Rebuild with: git clone https://github.com/cartesiancs/map3d ../map3d-source && npm ci --prefix ../map3d-source && node tools/formosa/generate.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = path.resolve(appRoot, '../map3d-source');
const THREE = await import(pathToFileURL(path.join(sourceRoot, 'node_modules/three/build/three.module.js')).href);
const { GLTFExporter } = await import(pathToFileURL(path.join(sourceRoot, 'node_modules/three/examples/jsm/exporters/GLTFExporter.js')).href);
const osmRoot = path.join(sourceRoot, 'osm');
const outRoot = path.join(appRoot, 'assets/maps/formosa');
const south = -26.3116251;
const west = -58.3342335;
const north = -26.0959633;
const east = -58.1038659;
const count = 12;
const centerLat = (south + north) / 2;
const centerLon = (west + east) / 2;
const lonScale = 111320 * Math.cos(centerLat * Math.PI / 180);
const latScale = 111320;
const project = (lat, lon) => [(lon - centerLon) * lonScale, -(lat - centerLat) * latScale];
const bins = new Map();
const seen = new Set();

function binFor(lat, lon) {
  const row = Math.max(0, Math.min(count - 1, Math.floor((lat - south) / (north - south) * count)));
  const col = Math.max(0, Math.min(count - 1, Math.floor((lon - west) / (east - west) * count)));
  const key = `r${row}c${col}`;
  if (!bins.has(key)) bins.set(key, { buildings: [], roads: [], buildingCount: 0, roadCount: 0 });
  return bins.get(key);
}

function triangle(target, a, b, c) { target.push(...a, ...b, ...c); }
function height(tags) {
  const explicit = parseFloat(String(tags.height || '').replace(',', '.'));
  const levels = parseFloat(tags['building:levels']);
  return Math.max(2, Math.min(120, Number.isFinite(explicit) ? explicit : Number.isFinite(levels) ? levels * 3 : 8));
}

function addBuilding(way, bin) {
  const target = bin.buildings;
  const points = way.geometry?.map(p => project(p.lat, p.lon));
  if (!points || points.length < 4) return;
  if (Math.hypot(points[0][0] - points.at(-1)[0], points[0][1] - points.at(-1)[1]) < 0.01) points.pop();
  if (points.length < 3) return;
  const shape = points.map(([x, z]) => new THREE.Vector2(x, z));
  const roof = THREE.ShapeUtils.triangulateShape(shape, []);
  const h = height(way.tags);
  for (const [a, b, c] of roof) triangle(target, [points[a][0], h, points[a][1]], [points[b][0], h, points[b][1]], [points[c][0], h, points[c][1]]);
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    triangle(target, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], h, b[1]]);
    triangle(target, [a[0], 0, a[1]], [b[0], h, b[1]], [a[0], h, a[1]]);
  }
  bin.buildingCount++;
}

function addRoad(way) {
  const geometry = way.geometry;
  if (!geometry || geometry.length < 2) return;
  const width = ['motorway', 'trunk', 'primary'].includes(way.tags.highway) ? 10 : ['secondary', 'tertiary'].includes(way.tags.highway) ? 7 : 4;
  for (let i = 1; i < geometry.length; i++) {
    const bin = binFor((geometry[i - 1].lat + geometry[i].lat) / 2, (geometry[i - 1].lon + geometry[i].lon) / 2);
    const target = bin.roads;
    const a = project(geometry[i - 1].lat, geometry[i - 1].lon), b = project(geometry[i].lat, geometry[i].lon);
    const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
    if (!length || length > 2000) continue;
    const nx = -dz / length * width / 2, nz = dx / length * width / 2;
    const p = [a[0] + nx, .08, a[1] + nz], q = [a[0] - nx, .08, a[1] - nz];
    const r = [b[0] + nx, .08, b[1] + nz], s = [b[0] - nx, .08, b[1] - nz];
    triangle(target, p, q, r); triangle(target, r, q, s);
    bin.roadCount++;
  }
}

for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
  const file = path.join(osmRoot, `r${row}c${col}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing OSM sector ${file}`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const way of data.elements || []) {
    if (way.type !== 'way' || seen.has(way.id) || !way.geometry?.length) continue;
    seen.add(way.id);
    const average = way.geometry.reduce((sum, p) => [sum[0] + p.lat, sum[1] + p.lon], [0, 0]).map(v => v / way.geometry.length);
    const bin = binFor(...average);
    if (way.tags?.building) addBuilding(way, bin);
    if (way.tags?.highway) addRoad(way);
  }
  console.log(`Read OSM ${row},${col}`);
}

if (typeof FileReader === 'undefined') globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); }, error => this.onerror?.(error)); }
};
fs.mkdirSync(outRoot, { recursive: true });
const exporter = new GLTFExporter();
const assets = [];
let totalBytes = 0;
for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
  const key = `r${row}c${col}`;
  const bin = bins.get(key);
  if (!bin || (!bin.buildings.length && !bin.roads.length)) continue;
  const scene = new THREE.Scene();
  for (const [positions, color] of [[bin.buildings, 0xb8c5d0], [bin.roads, 0x8197a6]]) {
    if (!positions.length) continue;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    scene.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 1 })));
  }
  const glb = Buffer.from(await exporter.parseAsync(scene, { binary: true, onlyVisible: true }));
  if (glb.toString('ascii', 0, 4) !== 'glTF') throw new Error(`Invalid GLB ${key}`);
  fs.writeFileSync(path.join(outRoot, `${key}.glb`), glb);
  totalBytes += glb.length;
  assets.push({ key, row, col, buildings: bin.buildingCount, roads: bin.roadCount, bytes: glb.length });
  console.log(`${key}: ${bin.buildingCount} buildings, ${bin.roadCount} roads, ${glb.length} bytes`);
  scene.traverse(object => object.geometry?.dispose());
}
fs.writeFileSync(path.join(outRoot, 'manifest.json'), JSON.stringify({ bounds: { south, west, north, east }, gridSize: count, center: [centerLat, centerLon], metersPerDegree: [latScale, lonScale], generatedAt: new Date().toISOString(), source: '© OpenStreetMap contributors · ODbL', project: 'cartesiancs/map3d (MIT)', sectors: assets }, null, 2));
fs.writeFileSync(path.join(outRoot, 'assets.js'), `export default {\n${assets.map(a => `  '${a.key}': require('./${a.key}.glb'),`).join('\n')}\n};\n`);
console.log(`Generated ${assets.length} GLBs, ${(totalBytes / 1048576).toFixed(1)} MiB`);
