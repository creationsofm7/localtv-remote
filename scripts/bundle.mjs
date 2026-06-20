// Bundle the daemon (and its pure-JS deps: express, ws, qrcode) into a single
// CJS file for the SEA blob. Native packages stay external — they're shipped on
// disk next to the exe and loaded via `nativeRequire`.
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [path.join(root, 'src/daemon/index.ts')],
  outfile: path.join(root, 'build/localtv-remote.cjs'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  legalComments: 'none',
  // Native addons (load real files at runtime) + ws's optional native speedups.
  external: [
    'koffi',
    'koffi/indirect',
    'webview-nodejs',
    'systray2',
    'node-audio-volume-mixer',
    'bufferutil',
    'utf-8-validate',
  ],
});

console.log('bundled → build/localtv-remote.cjs');
