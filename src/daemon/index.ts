import path from 'node:path';
import { existsSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';

import QRCode from 'qrcode';

import { WindowsSystemBackend } from '../core/main/input/backends/windows-system-backend';
import { VolumeController } from '../core/main/audio/volume-controller';
import { SystemInputRouter } from './system-input-router';
import { DaemonControlServer } from './control-server';
import { buildHostHtml } from './host-page';
import { openInDefaultBrowser } from './open-url';
import { startTray, type TrayHandle } from './tray';
import { getStartupEnabled, setStartupEnabled, isStartupLaunch } from './startup';
import { APP_NAME, DEFAULT_PORT } from './constants';

const firstExisting = (candidates: string[], fallback: string): string =>
  candidates.find((c) => existsSync(c)) ?? fallback;

/** Locate the controller PWA dir for both dev (src) and packaged (next to exe) layouts. */
const resolveStaticDir = (): string => {
  const candidates = [
    process.env.LOCALTV_REMOTE_STATIC_DIR,
    path.join(__dirname, '..', '..', 'public', 'control'), // dist/daemon → project root
    path.join(__dirname, '..', '..', '..', 'public', 'control'), // src/daemon (tsx)
    path.join(path.dirname(process.execPath), 'public', 'control'), // packaged
    path.join(process.cwd(), 'public', 'control'),
  ].filter((c): c is string => Boolean(c));
  return firstExisting(candidates, candidates[0]);
};

const resolveIconIco = (): string => {
  const candidates = [
    path.join(__dirname, '..', '..', 'assets', 'icon.ico'),
    path.join(__dirname, '..', '..', '..', 'assets', 'icon.ico'),
    path.join(path.dirname(process.execPath), 'assets', 'icon.ico'),
    path.join(process.cwd(), 'assets', 'icon.ico'),
  ];
  return firstExisting(candidates, candidates[0]);
};

async function main(): Promise<void> {
  const port = DEFAULT_PORT;

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
  const quit = () => {
    if (quitting) return;
    quitting = true;
    console.log('[LocalTV] Shutting down…');
    try { webviewChild?.kill(); } catch { /* ignore */ }
    try { tray?.kill(); } catch { /* ignore */ }
    void server.stop().finally(() => process.exit(0));
    // Hard exit safety net.
    setTimeout(() => process.exit(0), 1500).unref();
  };

  const server = new DaemonControlServer(router, {
    staticDir: resolveStaticDir(),
    port,
    onQuit: quit,
  });

  // Build the pairing page (QR is generated from the stable pairing URL).
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

  // ── Desktop pairing window (WebView2 in a child process; browser fallback) ──
  const webviewEntry = path.join(__dirname, 'webview-host.js');
  let webviewChild: ChildProcess | null = null;

  const showPairingWindow = () => {
    if (webviewChild && !webviewChild.killed) {
      // Already open; nothing to do (the window can't easily be re-focused
      // cross-process, so we just avoid spawning duplicates).
      return;
    }
    if (!existsSync(webviewEntry)) {
      openInDefaultBrowser(hostUrl);
      return;
    }
    const child = spawn(process.execPath, [webviewEntry, hostUrl], {
      stdio: 'inherit',
      windowsHide: false,
    });
    webviewChild = child;
    child.on('exit', (code) => {
      webviewChild = null;
      if (code === 1) {
        // WebView2 unavailable → fall back to the browser.
        openInDefaultBrowser(hostUrl);
      }
    });
  };

  // Don't pop the window when launched at login (start minimized to tray).
  if (!isStartupLaunch()) {
    showPairingWindow();
  }

  // ── Tray (best-effort) ──────────────────────────────────────────────────────
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

main().catch((err) => {
  console.error('[LocalTV] Fatal:', err);
  process.exit(1);
});
