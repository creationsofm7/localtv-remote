import path from 'node:path';
import net from 'node:net';
import { existsSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';

import QRCode from 'qrcode';

import { WindowsSystemBackend } from '../core/main/input/backends/windows-system-backend';
import { VolumeController } from '../core/main/audio/volume-controller';
import { nativeRequire } from '../core/main/native-require';
import { SystemInputRouter } from './system-input-router';
import { DaemonControlServer } from './control-server';
import { buildHostHtml } from './host-page';
import { openInDefaultBrowser } from './open-url';
import { startTray, type TrayHandle } from './tray';
import { getStartupEnabled, setStartupEnabled, isStartupLaunch } from './startup';
import { APP_NAME, DEFAULT_PORT } from './constants';

/** Loopback port used purely as a single-instance lock (not the control port). */
const SINGLE_INSTANCE_LOCK_PORT = 47633;

function isSea(): boolean {
  try {
    return Boolean((require('node:sea') as { isSea?: () => boolean }).isSea?.());
  } catch {
    return false;
  }
}

const firstExisting = (candidates: string[], fallback: string): string =>
  candidates.find((c) => existsSync(c)) ?? fallback;

/** Locate the controller PWA dir for both dev (src) and packaged (next to exe) layouts. */
const resolveStaticDir = (): string => {
  const candidates = [
    process.env.LOCALTV_REMOTE_STATIC_DIR,
    path.join(path.dirname(process.execPath), 'public', 'control'), // packaged (next to exe)
    path.join(__dirname, '..', '..', 'public', 'control'), // dist/daemon → project root
    path.join(__dirname, '..', '..', '..', 'public', 'control'), // src/daemon (tsx)
    path.join(process.cwd(), 'public', 'control'),
  ].filter((c): c is string => Boolean(c));
  return firstExisting(candidates, candidates[0]);
};

const resolveIconIco = (): string => {
  const candidates = [
    path.join(path.dirname(process.execPath), 'assets', 'icon.ico'), // packaged
    path.join(__dirname, '..', '..', 'assets', 'icon.ico'),
    path.join(__dirname, '..', '..', '..', 'assets', 'icon.ico'),
    path.join(process.cwd(), 'assets', 'icon.ico'),
  ];
  return firstExisting(candidates, candidates[0]);
};

/** WebView2 pairing window — runs in a re-invocation of this exe (`--webview`). */
function runWebviewWindow(url: string): void {
  try {
    const mod: any = nativeRequire('webview-nodejs');
    const Webview = mod.Webview ?? mod.default?.Webview ?? mod.default;
    const SizeHint = mod.SizeHint ?? mod.default?.SizeHint ?? {};
    const w = new Webview(false);
    w.title('LocalTV Remote');
    w.size(380, 560, SizeHint.FIXED ?? 3);
    w.navigate(url);
    w.show(); // blocks until the window is closed
    process.exit(0);
  } catch (err) {
    console.error('[LocalTV] WebView2 unavailable —', err);
    process.exit(1); // parent falls back to the default browser
  }
}

/** Resolve true if we acquired the lock; false if another instance holds it. */
function acquireSingleInstanceLock(): Promise<net.Server | null> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(null));
    srv.listen(SINGLE_INSTANCE_LOCK_PORT, '127.0.0.1', () => resolve(srv));
  });
}

/** Probe a port by binding+closing; returns true if it was free. */
function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.listen(port, '0.0.0.0', () => s.close(() => resolve(true)));
  });
}

async function findFreePort(start: number, attempts = 20): Promise<number> {
  for (let p = start; p < start + attempts; p += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await portIsFree(p)) return p;
  }
  return start;
}

async function runDaemon(): Promise<void> {
  // Single-instance guard (before binding the control port).
  const lock = await acquireSingleInstanceLock();
  if (!lock) {
    console.log('[LocalTV] LocalTV Remote is already running. Exiting.');
    process.exit(0);
  }

  const port = await findFreePort(DEFAULT_PORT);

  const backend = new WindowsSystemBackend();
  const backendReady = await backend.initialize();
  if (!backendReady) {
    console.warn(
      '[LocalTV] System input backend unavailable — remote input will not reach the desktop. (Windows only.)',
    );
  }

  const volume = new VolumeController();
  const router = new SystemInputRouter(backend, volume);

  let quitting = false;
  let webviewChild: ChildProcess | null = null;
  const quit = () => {
    if (quitting) return;
    quitting = true;
    console.log('[LocalTV] Shutting down…');
    try { webviewChild?.kill(); } catch { /* ignore */ }
    try { tray?.kill(); } catch { /* ignore */ }
    try { lock.close(); } catch { /* ignore */ }
    void server.stop().finally(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  };

  const server = new DaemonControlServer(router, {
    staticDir: resolveStaticDir(),
    port,
    onQuit: quit,
  });

  // Build the pairing page (QR is generated from the resolved pairing URL).
  const state = server.getState();
  const qrDataUrl = await QRCode.toDataURL(state.pairingUrl, {
    width: 280,
    margin: 2,
    color: { dark: '#0a0e1a', light: '#ffffff' },
  });
  server.setHostHtml(buildHostHtml(qrDataUrl, state.pairCode, state.controllerUrl));

  await server.start();
  console.log(`[LocalTV] ${APP_NAME} ready.`);
  console.log(`[LocalTV]   Controller : ${state.controllerUrl}`);
  console.log(`[LocalTV]   Pair code  : ${state.pairCode}`);

  const hostUrl = `http://127.0.0.1:${port}/host`;

  // Desktop pairing window: re-invoke this executable in `--webview` mode so
  // the blocking webview loop runs in its own process. SEA → [exe, --webview];
  // dev → [node, mainScript, --webview].
  const showPairingWindow = () => {
    if (webviewChild && !webviewChild.killed) return;
    const args = isSea() ? ['--webview', hostUrl] : [process.argv[1], '--webview', hostUrl];
    const child = spawn(process.execPath, args, { stdio: 'ignore', windowsHide: false });
    webviewChild = child;
    child.on('exit', (code) => {
      webviewChild = null;
      if (code === 1) openInDefaultBrowser(hostUrl); // WebView2 missing → browser
    });
    child.on('error', () => openInDefaultBrowser(hostUrl));
  };

  // Start minimized to tray when launched at login.
  if (!isStartupLaunch()) {
    showPairingWindow();
  }

  const tray: TrayHandle = await startTray({
    onShow: showPairingWindow,
    onToggleStartup: (enabled) => setStartupEnabled(enabled),
    onQuit: quit,
    startupEnabled: await getStartupEnabled(),
    iconIcoPath: resolveIconIco(),
  });

  process.on('SIGINT', quit);
  process.on('SIGTERM', quit);
}

// ── Entry ────────────────────────────────────────────────────────────────────
const webviewIdx = process.argv.indexOf('--webview');
if (webviewIdx >= 0) {
  // Window sub-process. Never touches the single-instance lock.
  runWebviewWindow(process.argv[webviewIdx + 1]);
} else {
  runDaemon().catch((err) => {
    console.error('[LocalTV] Fatal:', err);
    process.exit(1);
  });
}
