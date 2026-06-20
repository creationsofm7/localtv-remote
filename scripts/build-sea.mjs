// Build a branded, no-console single executable from the bundle using Node's
// Single Executable Application support.
//   1. generate the SEA blob
//   2. copy node.exe → LocalTVRemote.exe
//   3. set icon + version metadata with rcedit CLI  ← BEFORE postject (clean PE)
//   4. inject the blob with postject
//   5. flip the PE subsystem to GUI (2) so no console window appears
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'build');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const bundle = path.join(buildDir, 'localtv-remote.cjs');
const blob = path.join(buildDir, 'sea-prep.blob');
const exeOut = path.join(buildDir, 'LocalTVRemote.exe');
const seaConfigPath = path.join(buildDir, 'sea-config.json');
const SENTINEL = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

// rcedit CLI — use the x64 binary directly; must run BEFORE postject injection
// because postject corrupts the PE signature and rcedit hangs on an invalid PE.
const rceditBin = path.join(root, 'node_modules', 'rcedit', 'bin', 'rcedit-x64.exe');

if (!fs.existsSync(bundle)) throw new Error('Run `npm run bundle` first (missing build/localtv-remote.cjs).');

// 1. SEA blob
fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(
  seaConfigPath,
  JSON.stringify({ main: bundle, output: blob, disableExperimentalSEAWarning: true }),
);
execFileSync(process.execPath, ['--experimental-sea-config', seaConfigPath], { stdio: 'inherit' });

// 2. copy the running node binary as the launcher
fs.copyFileSync(process.execPath, exeOut);

// 3. icon + version metadata — runs on the clean node.exe copy (valid PE)
const [major, minor, patch] = pkg.version.split('.').map(Number);
execFileSync(rceditBin, [
  exeOut,
  '--set-icon', path.join(root, 'assets', 'icon.ico'),
  '--set-file-version', `${major}.${minor}.${patch}.0`,
  '--set-product-version', pkg.version,
  '--set-version-string', 'ProductName', 'LocalTV Remote',
  '--set-version-string', 'FileDescription', 'LocalTV Remote - phone-as-remote daemon',
  '--set-version-string', 'CompanyName', 'LocalTV',
  '--set-version-string', 'LegalCopyright', 'Copyright 2026 Mudit Pandey. Apache License 2.0',
  '--set-version-string', 'OriginalFilename', 'LocalTVRemote.exe',
], { stdio: 'inherit' });
console.log('rcedit: icon + version applied');

// 4. inject the SEA blob (invalidates the Authenticode signature — expected for unsigned builds)
const postjectCli = path.join(root, 'node_modules', 'postject', 'dist', 'cli.js');
execFileSync(
  process.execPath,
  [postjectCli, exeOut, 'NODE_SEA_BLOB', blob, '--sentinel-fuse', SENTINEL],
  { stdio: 'inherit' },
);

// 5. PE subsystem: CUI (3) → GUI (2) so Windows allocates no console
const buf = fs.readFileSync(exeOut);
const peOff = buf.readUInt32LE(0x3c);
const subsystemOff = peOff + 0x5c; // optional header (e_lfanew + 0x18) + 0x44
const before = buf.readUInt16LE(subsystemOff);
buf.writeUInt16LE(2, subsystemOff);
fs.writeFileSync(exeOut, buf);

console.log(`built → ${exeOut} (subsystem ${before} → 2 GUI)`);
