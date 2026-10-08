import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/maps/formosa');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.gridSize, 12);
assert.ok(manifest.sectors.length > 100, 'expected whole-city sector coverage');
assert.ok(manifest.sectors.reduce((sum, sector) => sum + sector.buildings, 0) > 30000, 'missing Formosa buildings');
for (const sector of manifest.sectors) {
  assert.match(sector.key, /^r\d+c\d+$/);
  assert.ok(sector.row < manifest.gridSize && sector.col < manifest.gridSize);
  const glb = fs.readFileSync(path.join(root, `${sector.key}.glb`));
  assert.equal(glb.toString('ascii', 0, 4), 'glTF', sector.key);
  assert.equal(glb.readUInt32LE(4), 2, sector.key);
  assert.equal(glb.readUInt32LE(8), glb.length, sector.key);
  assert.equal(glb.length, sector.bytes, sector.key);
}
console.log(`Verified ${manifest.sectors.length} local GLBs and ${manifest.sectors.reduce((sum, sector) => sum + sector.buildings, 0)} buildings`);
