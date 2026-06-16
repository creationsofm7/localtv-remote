# LocalTV Remote

Turn your phone into a wireless mouse, keyboard, and media remote for your
Windows PC — over your local network, with no app store install on the phone
(it's a PWA you open in the browser).

This is the **open-source, remote-control-only** sibling of LocalTV. It contains
**no embedded browser, no DRM, and no TV/streaming mode** — just the remote
control daemon. As a result it runs as a single lightweight Node process instead
of a full Electron/Chromium app.

## Why it's small

The original LocalTV is an Electron app (~410 MB packaged) because it embeds
Chromium for DRM streaming. Remote control never needed any of that: it's an
HTTP + WebSocket server plus Win32 `SendInput`. This project ships only that, so
the runtime is a single Node process (~25–40 MB RAM at idle) and the download is
dominated by the Node runtime (~50–90 MB) rather than a bundled browser.

The desktop pairing window uses the **system WebView2 runtime** (already present
on Windows 10/11) — not a bundled Chromium — and falls back to your default
browser if WebView2 isn't available.

## How it works

1. The daemon starts an Express + `ws` server on `0.0.0.0:3000`.
2. It shows a pairing window with a QR code and a stable 6-digit code.
3. On your phone (same Wi-Fi), scan the QR or open `http://<pc-ip>:3000` and
   enter the code.
4. Input from the phone is injected OS-wide via koffi → Win32 `SendInput`.

### Security model
- LAN-only; binds the local network interface.
- Pairing requires a 6-digit code derived from the machine identity; trusted
  sessions resume via a stored token.
- WebSocket upgrades are origin-checked; messages are rate-limited
  (500/sec/client) with auth + inactivity timeouts.
- The pairing page (`/host`, `/api/state`, `/api/quit`) is restricted to
  loopback, so the pair code is never served to LAN peers.

## Develop / run

```bash
npm install
npm run build
npm start
```

Or for a quick dev loop: `npm run dev` (uses `tsx`).

Environment:
- `LOCALTV_REMOTE_PORT` — server port (default `3000`).
- `LOCALTV_REMOTE_STATIC_DIR` — override the controller PWA directory.

## Cross-platform

Windows is the only supported target today. The input layer is abstracted behind
`SystemInputBackend` (`src/core/main/input/backends/input-backend.ts`); adding
macOS/Linux is a matter of implementing that interface and wiring it in
`SystemInputRouter`.

## Project layout

- `src/core/` — modules shared with the (proprietary) LocalTV TV app, decoupled
  from Electron. The server is typed against an `InputRouter` interface so it
  runs with or without Electron.
- `src/daemon/` — the headless daemon: `SystemInputRouter`, the control server
  with the desktop pairing routes, the WebView2 window shell, and the tray.
- `public/control/` — the phone controller PWA (served as-is).

## License

MIT. Contains no Widevine/CastLabs/DRM code.
