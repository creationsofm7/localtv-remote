import path from 'node:path';
import net from 'node:net';
import { existsSync } from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';

import QRCode from 'qrcode';

import { WindowsSystemBackend } from '../core/main/input/backends/windows-system-backend';
import { VolumeController } from '../core/main/audio/volume-controller';
import { resolveLanAddress, type LanAddress } from '../core/main/control/lan';
import { nativeRequire } from '../core/main/native-require';
import { SystemInputRouter } from './system-input-router';
import {
  DaemonControlServer,
  type NetworkSelection,
} from './control-server';
import { buildHostHtml } from './host-page';
import { openInDefaultBrowser } from './open-url';
import { startTray, type TrayHandle } from './tray';
import { getStartupEnabled, setStartupEnabled, isStartupLaunch } from './startup';
import { APP_NAME, DEFAULT_PORT } from './constants';
import { acquireSingleInstance, requestActivation } from './single-instance';

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
  let showPairingWindow: ((forceVisible?: boolean) => void) | null = null;
  let activationPending = false;
  const lock = await acquireSingleInstance(SINGLE_INSTANCE_LOCK_PORT, () => {
    if (showPairingWindow) showPairingWindow(true);
    else activationPending = true;
  });
  if (!lock) {
    if (!isStartupLaunch() && await requestActivation(SINGLE_INSTANCE_LOCK_PORT)) {
      console.log('[LocalTV] Reopened the existing pairing screen.');
    } else if (!isStartupLaunch()) {
      console.error('[LocalTV] Another process owns the LocalTV lock but did not respond.');
      process.exitCode = 1;
    }
    return;
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
  let networkMode: 'automatic' | 'manual' = 'automatic';
  let network = await resolveLanAddress();
  let networkRefresh: ReturnType<typeof setInterval> | null = null;
  let networkRefreshRunning = false;
  let server: DaemonControlServer;

  let quitting = false;
  let webviewChild: ChildProcess | null = null;
  const quit = () => {
    if (quitting) return;
    quitting = true;
    console.log('[LocalTV] Shutting down…');
    try { webviewChild?.kill(); } catch { /* ignore */ }
    try { tray?.kill(); } catch { /* ignore */ }
    try { lock.close(); } catch { /* ignore */ }
    if (networkRefresh) clearInterval(networkRefresh);
    void server.stop().finally(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  };

  const renderHostPage = async () => {
    const state = server.getState();
    const qrDataUrl = await QRCode.toDataURL(state.pairingUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#0a0e1a', light: '#ffffff' },
    });
    server.setHostHtml(buildHostHtml(qrDataUrl, state.pairCode, state.controllerUrl, {
      addresses: network.addresses,
      mode: networkMode,
      selectedAddress: network.address,
    }));
  };

  const applyNetworkSelection = async (selection: NetworkSelection) => {
    const manualAddress = selection.mode === 'manual' ? selection.address : null;
    const next = await resolveLanAddress(manualAddress);

    if (
      manualAddress
      && !next.addresses.some((item: LanAddress) => item.address === manualAddress)
    ) {
      throw new Error('That network adapter is no longer available.');
    }

    networkMode = selection.mode;
    network = next;
    server.setLanAddress(next.address);
    await renderHostPage();
  };

  server = new DaemonControlServer(router, {
    staticDir: resolveStaticDir(),
    lanAddress: network.address,
    port,
    onQuit: quit,
    onNetworkSelection: applyNetworkSelection,
  });

  await renderHostPage();

  await server.start();
  const state = server.getState();
  console.log(`[LocalTV] ${APP_NAME} ready.`);
  console.log(`[LocalTV]   Controller : ${state.controllerUrl}`);
  console.log(`[LocalTV]   Pair code  : ${state.pairCode}`);

  const hostUrl = `http://127.0.0.1:${port}/host`;

  // Follow active-route changes in automatic mode. If a manually selected
  // adapter disappears, recover to automatic rather than showing a dead QR.
  networkRefresh = setInterval(() => {
    if (networkRefreshRunning) return;
    networkRefreshRunning = true;
    void resolveLanAddress(networkMode === 'manual' ? network.address : null)
      .then(async (next) => {
        const manualStillAvailable = next.addresses.some(
          (item) => item.address === network.address,
        );
        if (networkMode === 'manual' && !manualStillAvailable) {
          networkMode = 'automatic';
          next = await resolveLanAddress();
        }

        const addressesChanged = JSON.stringify(next.addresses) !== JSON.stringify(network.addresses);
        if (next.address !== network.address || addressesChanged) {
          network = next;
          server.setLanAddress(next.address);
          await renderHostPage();
        }
      })
      .catch((error) => console.warn('[LocalTV] Network refresh failed:', error))
      .finally(() => { networkRefreshRunning = false; });
  }, 5000);
  networkRefresh.unref();

  // Desktop pairing window: re-invoke this executable in `--webview` mode so
  // the blocking webview loop runs in its own process. SEA → [exe, --webview];
  // dev → [node, mainScript, --webview].
  showPairingWindow = (forceVisible = false) => {
    if (webviewChild && !webviewChild.killed) {
      if (forceVisible) openInDefaultBrowser(hostUrl);
      return;
    }
    const args = isSea() ? ['--webview', hostUrl] : [process.argv[1], '--webview', hostUrl];
    const child = spawn(process.execPath, args, { stdio: 'ignore', windowsHide: false });
    webviewChild = child;
    child.on('exit', (code) => {
      webviewChild = null;
      if (code !== 0 && !quitting) openInDefaultBrowser(hostUrl);
    });
    child.on('error', () => {
      webviewChild = null;
      if (!quitting) openInDefaultBrowser(hostUrl);
    });
  };

  // Start minimized to tray when launched at login.
  if (!isStartupLaunch()) {
    showPairingWindow();
  }
  if (activationPending) showPairingWindow(true);

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
