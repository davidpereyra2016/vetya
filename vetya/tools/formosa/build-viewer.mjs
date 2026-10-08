import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = path.resolve(appRoot, '../map3d-source');
const { build } = await import(pathToFileURL(path.join(sourceRoot, 'node_modules/esbuild/lib/main.js')).href);
const result = await build({
  entryPoints: [path.join(appRoot, 'tools/formosa/viewer.js')],
  nodePaths: [path.join(sourceRoot, 'node_modules')],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  write: false,
  target: ['es2020'],
});
const script = result.outputFiles[0].text;
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f8fbff}canvas{display:block}</style></head><body><script>${script.replaceAll('</script>', '<\\/script>')}</script></body></html>`;
const output = path.join(appRoot, 'assets/maps/formosa/viewerHtml.js');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `export default ${JSON.stringify(html)};\n`);
console.log(`Built offline 3D viewer: ${script.length} bytes`);
