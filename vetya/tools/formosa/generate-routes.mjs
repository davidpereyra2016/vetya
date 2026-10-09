import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const osmRoot = path.resolve(appRoot, '../map3d-source/osm');
const output = path.join(appRoot, 'assets/maps/formosa/roads.bin');
const driveable = new Set([
  'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link',
  'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'unclassified',
  'residential', 'living_street', 'service', 'road', 'track',
]);
const denied = new Set(['no', 'private', 'agricultural', 'forestry']);
const nodes = new Map();
const seenWays = new Set();

function allowed(tags) {
  return driveable.has(tags?.highway) && tags.area !== 'yes' &&
    ![tags.access, tags.vehicle, tags.motor_vehicle, tags.motorcar].some(value => denied.has(value));
}
function ensure(id, coordinate) {
  if (!nodes.has(id)) nodes.set(id, { lat: coordinate.lat, lon: coordinate.lon, outgoing: new Set(), linked: new Set() });
  return nodes.get(id);
}
function connect(fromId, toId) {
  nodes.get(fromId).outgoing.add(toId);
  nodes.get(fromId).linked.add(toId);
  nodes.get(toId).linked.add(fromId);
}

for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
  const file = path.join(osmRoot, `r${row}c${col}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing OSM source: ${file}`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const way of data.elements || []) {
    if (way.type !== 'way' || !allowed(way.tags) || seenWays.has(way.id) || way.nodes?.length !== way.geometry?.length) continue;
    seenWays.add(way.id);
    for (let i = 0; i < way.nodes.length; i++) ensure(way.nodes[i], way.geometry[i]);
    const direction = String(way.tags.oneway || '').toLowerCase();
    const reverse = direction === '-1';
    const forward = reverse || ['yes', 'true', '1'].includes(direction) ||
      (!direction && (way.tags.junction === 'roundabout' || ['motorway', 'motorway_link'].includes(way.tags.highway)));
    for (let i = 1; i < way.nodes.length; i++) {
      const a = way.nodes[i - 1], b = way.nodes[i];
      if (a === b) continue;
      if (!reverse) connect(a, b);
      if (!forward || reverse) connect(b, a);
    }
  }
}

// Keep the largest connected road network; tiny isolated driveways cannot form a useful city route.
const visited = new Set();
let largest = [];
for (const id of nodes.keys()) {
  if (visited.has(id)) continue;
  const component = [id];
  visited.add(id);
  for (let cursor = 0; cursor < component.length; cursor++) {
    for (const neighbor of nodes.get(component[cursor]).linked) {
      if (!visited.has(neighbor)) { visited.add(neighbor); component.push(neighbor); }
    }
  }
  if (component.length > largest.length) largest = component;
}
const index = new Map(largest.map((id, position) => [id, position]));
const graph = {
  version: 1,
  source: '© OpenStreetMap contributors · ODbL',
  nodes: largest.map(id => {
    const node = nodes.get(id);
    return [node.lat, node.lon, [...node.outgoing].filter(neighbor => index.has(neighbor)).map(neighbor => index.get(neighbor))];
  }),
};
fs.writeFileSync(output, JSON.stringify(graph));
console.log(`Saved ${graph.nodes.length} routing nodes, ${seenWays.size} roads, ${(fs.statSync(output).size / 1048576).toFixed(1)} MiB; ${nodes.size - largest.length} isolated nodes omitted`);
