import assert from 'node:assert/strict';
import fs from 'node:fs';
import { findRoadRoute, distanceMeters } from '../../src/utils/formosaRoute.js';

const point = (latitude, longitude) => ({ latitude, longitude });
const graph = { nodes: [
  [0, 0, [1, 2]],
  [0, .01, [3]],
  [.01, 0, [3]],
  [0, .02, []],
] };
const result = findRoadRoute(graph, point(0, 0), point(0, .02));
assert.deepEqual(result.coordinates.slice(1, -1), [point(0, 0), point(0, .01), point(0, .02)]);
assert.ok(result.distanceMeters >= distanceMeters(point(0, 0), point(0, .02)));
assert.equal(findRoadRoute(graph, point(0, .02), point(0, 0)), null, 'one-way edges must be respected');
assert.equal(findRoadRoute(graph, point(2, 2), point(0, 0)), null, 'faraway points must not snap to Formosa streets');

const realGraph = JSON.parse(fs.readFileSync(new URL('../../assets/maps/formosa/roads.bin', import.meta.url), 'utf8'));
let oneWayEdges = 0;
for (let i = 0; i < realGraph.nodes.length; i++)
  for (const neighbor of realGraph.nodes[i][2])
    if (!realGraph.nodes[neighbor][2].includes(i)) oneWayEdges++;
assert.ok(oneWayEdges > 100, 'OSM one-way streets must remain directed');
const real = findRoadRoute(realGraph, point(-26.175, -58.17), point(-26.18, -58.175));
assert.ok(real?.coordinates.length > 3, 'expected a street route in central Formosa');
assert.ok(real.distanceMeters > distanceMeters(point(-26.175, -58.17), point(-26.18, -58.175)));
console.log(`A* verified: ${realGraph.nodes.length} nodes, ${oneWayEdges} directed edges, ${real.coordinates.length} route points, ${Math.round(real.distanceMeters)} m`);
