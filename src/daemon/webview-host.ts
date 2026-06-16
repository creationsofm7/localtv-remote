/**
 * Child-process entry that opens the desktop pairing window using the system
 * WebView2 runtime (via `webview-nodejs`) — no bundled Chromium.
 *
 * It runs in its own process on purpose: `webview`'s event loop is blocking,
 * so keeping it out of the daemon process leaves the HTTP/WS server fully
 * responsive. The window simply points at the daemon's local `/host` URL.
 *
 * Exit codes:
 *   0  window opened and was closed normally
 *   1  webview unavailable → the parent falls back to the default browser
 *
 * Usage: node webview-host.js <url>
 */

const url = process.argv[2];

if (!url) {
  console.error('[LocalTV] webview-host: missing url argument');
  process.exit(1);
}

void (async () => {
  try {
    // Dynamic import so a missing/broken WebView2 dependency degrades to the
    // browser fallback instead of crashing the daemon.
    const mod: any = await import('webview-nodejs');
    const Webview = mod.Webview ?? mod.default?.Webview ?? mod.default;
    const SizeHint = mod.SizeHint ?? mod.default?.SizeHint ?? {};

    const w = new Webview(false);
    w.title('LocalTV Remote');
    // FIXED so the small pairing card isn't resizable; fall back to 3 if enum absent.
    w.size(380, 560, SizeHint.FIXED ?? 3);
    w.navigate(url);
    w.show(); // blocks until the window is closed
    process.exit(0);
  } catch (err) {
    console.error('[LocalTV] webview-host: WebView2 unavailable —', err);
    process.exit(1);
  }
})();
