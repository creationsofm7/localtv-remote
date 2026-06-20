// Assemble the install payload in release/app/: the exe, the PWA, icon, license,
// and a minimal node_modules holding only the native packages (+ their
// transitive deps) that can't be embedded in the SEA blob.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcNm = path.join(root, 'node_modules');
const appDir = path.join(root, 'release', 'app');
const dstNm = path.join(appDir, 'node_modules');

const exe = path.join(root, 'build', 'LocalTVRemote.exe');
if (!fs.existsSync(exe)) throw new Error('Run `npm run build:sea` first (missing build/LocalTVRemote.exe).');

// Fresh payload dir.
fs.rmSync(appDir, { recursive: true, force: true });
fs.mkdirSync(dstNm, { recursive: true });

// Core files.
fs.copyFileSync(exe, path.join(appDir, 'LocalTVRemote.exe'));
fs.cpSync(path.join(root, 'public', 'control'), path.join(appDir, 'public', 'control'), { recursive: true });
fs.mkdirSync(path.join(appDir, 'assets'), { recursive: true });
fs.copyFileSync(path.join(root, 'assets', 'icon.ico'), path.join(appDir, 'assets', 'icon.ico'));
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(appDir, 'LICENSE'));

// Native runtime packages + their dependency closure.
const copyClosure = (roots) => {
  const seen = new Set();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    seen.add(name);
    const src = path.join(srcNm, name);
    if (!fs.existsSync(src)) {
      console.warn('  (skip, not found):', name);
      continue;
    }
    fs.cpSync(src, path.join(dstNm, name), { recursive: true });
    try {
      const pj = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
      for (const dep of Object.keys(pj.dependencies || {})) queue.push(dep);
    } catch {
      /* no package.json deps */
    }
  }
  return seen;
};

const copied = copyClosure(['koffi', 'webview-nodejs', 'systray2']);
console.log('  packages:', [...copied].join(', '));

// Strip koffi to win32_x64 only.
const koffiPlatforms = path.join(dstNm, 'koffi', 'build', 'koffi');
if (fs.existsSync(koffiPlatforms)) {
  let stripped = 0;
  for (const entry of fs.readdirSync(koffiPlatforms, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'win32_x64') {
      fs.rmSync(path.join(koffiPlatforms, entry.name), { recursive: true, force: true });
      stripped += 1;
    }
  }
  console.log(`  koffi: kept win32_x64, removed ${stripped} other platform dir(s)`);
}

const size = (dir) => {
  let total = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? size(p) : fs.statSync(p).size;
  }
  return total;
};
console.log(`payload → release/app (${(size(appDir) / 1024 / 1024).toFixed(1)} MB)`);
