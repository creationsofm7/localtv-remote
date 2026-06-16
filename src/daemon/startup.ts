import { execFile } from 'node:child_process';

/**
 * Start-on-login via the Windows registry Run key (HKCU). Ported from the
 * Electron app's `WindowsStartupManager`, which used Electron's
 * `app.setLoginItemSettings`; here we write the Run key directly so the daemon
 * needs no Electron dependency.
 */

const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const VALUE_NAME = 'LocalTVRemote';
export const STARTUP_LAUNCH_ARG = '--startup-launch';

export const isStartupLaunch = (): boolean => process.argv.includes(STARTUP_LAUNCH_ARG);

/** Command the Run key should execute. In a packaged SEA build this is the exe. */
const startupCommand = (): string => {
  const exe = process.execPath;
  // `process.argv[1]` is the bundled entry when running via `node dist/...`.
  const script = process.argv[1];
  const isNodeHost = /node(\.exe)?$/i.test(exe) && script;
  const base = isNodeHost ? `"${exe}" "${script}"` : `"${exe}"`;
  return `${base} ${STARTUP_LAUNCH_ARG}`;
};

const reg = (args: string[]): Promise<{ ok: boolean; stdout: string }> =>
  new Promise((resolve) => {
    execFile('reg.exe', args, { windowsHide: true, timeout: 10_000 }, (err, stdout) => {
      resolve({ ok: !err, stdout: stdout ?? '' });
    });
  });

export const getStartupEnabled = async (): Promise<boolean> => {
  if (process.platform !== 'win32') return false;
  const { ok } = await reg(['query', RUN_KEY, '/v', VALUE_NAME]);
  return ok;
};

export const setStartupEnabled = async (enabled: boolean): Promise<boolean> => {
  if (process.platform !== 'win32') return false;
  if (enabled) {
    const { ok } = await reg(['add', RUN_KEY, '/v', VALUE_NAME, '/t', 'REG_SZ', '/d', startupCommand(), '/f']);
    return ok;
  }
  const { ok } = await reg(['delete', RUN_KEY, '/v', VALUE_NAME, '/f']);
  return ok;
};
