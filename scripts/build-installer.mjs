// Compile the Inno Setup installer.
// Installs Inno Setup via winget if ISCC is not already on PATH or at the default location.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const iss = path.join(root, 'installer', 'localtv-remote.iss');
const payload = path.join(root, 'release', 'app', 'LocalTVRemote.exe');

if (!fs.existsSync(payload)) {
  throw new Error('Payload not assembled — run `npm run payload` first.');
}

const ISCC_CANDIDATES = [
  `${process.env.LOCALAPPDATA}\\Programs\\Inno Setup 6\\ISCC.exe`,
  'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
  'C:\\Program Files\\Inno Setup 6\\ISCC.exe',
];

function findIscc() {
  const r = spawnSync('where', ['ISCC'], { encoding: 'utf8', shell: true });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split('\n')[0].trim();
  for (const c of ISCC_CANDIDATES) if (fs.existsSync(c)) return c;
  return null;
}

let iscc = findIscc();
if (!iscc) {
  console.log('Inno Setup not found — installing via winget...');
  // winget exits 0 on success or -1946335477 (0x8A150059) for "no upgrade available"
  // Use spawnSync so we can tolerate those non-zero codes gracefully.
  const r = spawnSync(
    'winget',
    ['install', '-e', '--id', 'JRSoftware.InnoSetup', '--silent',
     '--accept-package-agreements', '--accept-source-agreements'],
    { shell: true, stdio: 'inherit' },
  );
  const ok = r.status === 0 || r.status === -1946335477 || r.status === 2316632107;
  if (!ok) throw new Error(`winget exited with code ${r.status}`);
  iscc = findIscc();
  if (!iscc) throw new Error('ISCC not found after winget install. Restart your terminal and retry, or add Inno Setup to PATH.');
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;

console.log(`Using ISCC: ${iscc}`);
// Pass version as a preprocessor define so the .iss doesn't need GetFileVersion
execFileSync(iscc, [iss, `/DAppVersion=${version}`], { stdio: 'inherit' });

const out = path.join(root, 'release', `LocalTVRemote-Setup-${version}.exe`);
if (fs.existsSync(out)) {
  const mb = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
  console.log(`installer → ${out} (${mb} MB)`);
} else {
  console.log('installer built (check release/ for output file)');
}
