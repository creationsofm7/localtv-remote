import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PACKAGE_ID = 'LocalTV.Remote';
const CHECK_EVERY_MS = 3 * 24 * 60 * 60 * 1000;
const RETRY_AFTER_MS = 6 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 15_000;
const APP_VERSION = (require('../../package.json') as { version: string }).version;

type CachedCheck = {
  checkedAt: number;
  availableVersion: string | null;
};

const cachePath = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'LocalTV Remote',
  'update-check.json',
);

/** Compare dotted numeric versions; WinGet's installed record may lag this exe. */
export function isNewerVersion(candidate: string, current: string): boolean {
  const pattern = /^\d+(?:\.\d+)+$/;
  if (!pattern.test(candidate) || !pattern.test(current)) return false;

  const next = candidate.split('.').map(Number);
  const installed = current.split('.').map(Number);
  for (let index = 0; index < Math.max(next.length, installed.length); index += 1) {
    const difference = (next[index] || 0) - (installed[index] || 0);
    if (difference !== 0) return difference > 0;
  }
  return false;
}

/** Return only a newer version from the exact LocalTV row in WinGet's table. */
export function parseAvailableVersion(output: string, currentVersion: string): string | null {
  const clean = output.replace(/\x1b\[[0-9;]*m/g, '').replace(/\r/g, '');
  for (const line of clean.split('\n')) {
    const row = line.match(/(?:^|\s)LocalTV\.Remote\s+(\S+)\s+(\S+)/i);
    if (row && isNewerVersion(row[2], currentVersion)) return row[2];
  }
  return null;
}

async function readCache(): Promise<CachedCheck | null> {
  try {
    const value = JSON.parse(await fs.readFile(cachePath, 'utf8')) as Partial<CachedCheck>;
    if (
      typeof value.checkedAt === 'number'
      && Number.isFinite(value.checkedAt)
      && (value.availableVersion === null || typeof value.availableVersion === 'string')
    ) {
      return value as CachedCheck;
    }
  } catch {
    // Missing or damaged cache simply causes a fresh check.
  }
  return null;
}

async function writeCache(value: CachedCheck): Promise<void> {
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(value), 'utf8');
}

/** Run a read-only WinGet listing. Never invoke `winget upgrade --id`, which installs. */
async function queryAvailableVersion(): Promise<string | null> {
  const { stdout } = await execFileAsync('winget', [
    'list', '--upgrade-available', '--id', PACKAGE_ID, '--exact',
    '--source', 'winget', '--accept-source-agreements', '--disable-interactivity',
  ], { encoding: 'utf8', maxBuffer: 512 * 1024, timeout: 45_000, windowsHide: true });
  return parseAvailableVersion(stdout, APP_VERSION);
}

/** Keep one low-frequency check alive while the desktop daemon is running. */
export async function startUpdateChecks(onChange: (version: string | null) => void): Promise<() => void> {
  if (process.platform !== 'win32') return () => {};

  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cached = await readCache();
  if (cached?.availableVersion && isNewerVersion(cached.availableVersion, APP_VERSION)) {
    onChange(cached.availableVersion);
  }

  const schedule = (delay: number) => {
    if (stopped) return;
    timer = setTimeout(() => { void check(); }, delay);
    timer.unref();
  };

  const check = async () => {
    try {
      const version = await queryAvailableVersion();
      if (stopped) return;
      onChange(version);
      try {
        await writeCache({ checkedAt: Date.now(), availableVersion: version });
      } catch (error) {
        console.warn('[LocalTV] Could not save update check:', error instanceof Error ? error.message : error);
      }
      schedule(CHECK_EVERY_MS);
    } catch (error) {
      if (stopped) return;
      console.warn('[LocalTV] Update check unavailable:', error instanceof Error ? error.message : error);
      schedule(RETRY_AFTER_MS);
    }
  };

  const age = cached ? Date.now() - cached.checkedAt : Infinity;
  schedule(age >= 0 && age < CHECK_EVERY_MS
    ? Math.max(STARTUP_DELAY_MS, CHECK_EVERY_MS - age)
    : STARTUP_DELAY_MS);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
