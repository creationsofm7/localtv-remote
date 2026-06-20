<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:a855f7&height=200&section=header&text=LocalTV%20Remote&fontSize=60&fontColor=ffffff&fontAlignY=38&animation=fadeIn&desc=Phone%20→%20Windows%20Remote%20Control&descSize=20&descAlignY=58&descColor=e2e8f0" width="100%" />

<a href="https://readme-typing-svg.demolab.com">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=20&pause=1000&color=6366F1&center=true&vCenter=true&width=620&lines=Turn+your+phone+into+a+Windows+remote;Scan+a+QR+code+%E2%80%94+no+app+install+needed;Mouse+%E2%80%A2+Keyboard+%E2%80%A2+Scroll+%E2%80%A2+Volume;LAN-only+%E2%80%94+no+cloud%2C+no+accounts%2C+no+Chromium" alt="Typing animation" />
</a>

<br/>
<br/>

[![License](https://img.shields.io/badge/License-Apache%202.0-6366f1?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078d4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/creationsofm7/localtv-remote/releases)
[![Release](https://img.shields.io/github/v/release/creationsofm7/localtv-remote?style=for-the-badge&color=a855f7&label=Release)](https://github.com/creationsofm7/localtv-remote/releases/latest)
[![Download](https://img.shields.io/github/downloads/creationsofm7/localtv-remote/total?style=for-the-badge&color=22c55e&label=Downloads)](https://github.com/creationsofm7/localtv-remote/releases/latest)
[![Stars](https://img.shields.io/github/stars/creationsofm7/localtv-remote?style=for-the-badge&color=f59e0b)](https://github.com/creationsofm7/localtv-remote/stargazers)

</div>

---

## What is this?

**LocalTV Remote** is a lightweight Windows daemon that turns your phone into a wireless remote — mouse, keyboard, scroll wheel, and volume control — over your local Wi-Fi. Your phone opens a PWA in the browser (no app store install). The PC runs a single Node process at ~25–40 MB RAM.

> This is the **open-source, remote-only** sibling of LocalTV. It contains no Chromium, no DRM, and no TV/streaming mode — just the remote control daemon.

---

## Features

| | |
|---|---|
| 🖱️ **Mouse control** | Move, click, right-click, scroll — with DPI-aware scaling |
| ⌨️ **Keyboard input** | Type text and send key combos from your phone |
| 🔊 **Volume control** | Accurate system volume via Windows Core Audio (COM) |
| 📱 **PWA — no install** | Phone opens a web page, installs as a home-screen app |
| 🔗 **QR pairing** | Scan once, token is remembered for future sessions |
| 🔒 **LAN-only** | No cloud relay, no accounts, no data leaves your network |
| 🪶 **Tiny footprint** | ~27 MB installer, ~25–40 MB RAM at idle, no Chromium |
| 🖥️ **System tray** | Sits in the tray; optional start-on-login toggle |
| 🔌 **Auto port** | Free-port fallback if 3000 is occupied — QR auto-updates |

---

## Install

### Option 1 — Installer (recommended)

Download **[LocalTVRemote-Setup-0.1.0.exe](https://github.com/creationsofm7/localtv-remote/releases/latest)** from the latest release and run it.

The setup wizard will:
- Install to `%ProgramFiles%\LocalTV Remote`
- Create a Start Menu shortcut
- Add a Windows Firewall inbound rule (so your phone can reach the daemon without a popup)
- Optionally create a desktop shortcut and enable start-on-login

### Option 2 — winget *(coming soon)*

```
winget install LocalTV.Remote
```

---

## How to use

1. **Launch** — double-click the tray icon or start from the Start Menu
2. **Pair** — a pairing window opens with a QR code and a 6-digit PIN
3. **Scan** — open your phone camera, scan the QR code
4. **Control** — the phone browser opens the controller UI; swipe to move, tap to click

Your phone remembers the pairing token — next time it reconnects automatically.

---

## How it works

```
Phone browser (PWA)
      │  WebSocket + HTTP  (LAN)
      ▼
LocalTVRemote.exe  ←── Express + ws server on 0.0.0.0:3000
      │
      ├── Mouse / Keyboard → koffi → Win32 SendInput
      ├── Volume           → PowerShell COM → IAudioEndpointVolume
      └── Pairing window   → WebView2 (system runtime, not bundled Chromium)
```

- Input is injected OS-wide via `SendInput` — works in any app including games and full-screen windows
- Volume uses a persistent PowerShell STA process talking to Windows Core Audio COM directly — accurate to the system tray to within ±1%
- The pairing window uses the **system WebView2 runtime** (pre-installed on Windows 11, auto-installed on Windows 10) — no bundled browser

---

## Security

- **LAN-only** — binds `0.0.0.0` for control but restricts pairing routes (`/host`, `/api/state`) to loopback, so the PIN is never served to other devices on the network
- **6-digit pairing PIN** derived from machine identity; trusted sessions resume via a stored token
- **WebSocket origin checks** on every upgrade
- **Rate limiting** — 500 messages/sec/client; idle clients are disconnected after inactivity
- **Single-instance lock** — second launch exits cleanly instead of conflicting

---

## Build from source

**Requirements:** Node.js 22+, Windows 10/11

```bash
git clone https://github.com/creationsofm7/localtv-remote
cd localtv-remote
npm install
```

**Dev mode** (TypeScript, no build step):
```bash
npm run dev
```

**Full production build** (SEA exe + payload):
```bash
npm run dist        # typecheck + bundle + branded exe + payload
npm run installer   # compile Inno Setup → release/LocalTVRemote-Setup-x.y.z.exe
```

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `LOCALTV_REMOTE_PORT` | `3000` | Preferred server port (auto-increments if occupied) |
| `LOCALTV_REMOTE_STATIC_DIR` | `public/control` | Override the controller PWA directory |

---

## Project layout

```
src/
├── core/
│   ├── server/          # Express + WebSocket control server
│   ├── main/
│   │   ├── audio/       # Persistent PowerShell Core Audio host
│   │   ├── input/       # SystemInputRouter + Win32 SendInput backend
│   │   └── native/      # koffi FFI bindings, native-require loader
│   └── shared/          # Protocol types, pairing logic
└── daemon/
    ├── index.ts         # Entry: daemon mode or --webview child mode
    ├── tray.ts          # systray2 tray icon + menu
    └── startup.ts       # Run-at-login registry toggle

public/control/          # Phone controller PWA (HTML/CSS/JS + SW + manifest)
scripts/
├── bundle.mjs           # esbuild → build/localtv-remote.cjs
├── build-sea.mjs        # Node SEA blob + rcedit + PE subsystem flip
├── assemble-payload.mjs # release/app/ with koffi stripped to win32_x64
└── build-installer.mjs  # Inno Setup compile → release/LocalTVRemote-Setup-*.exe
installer/
└── localtv-remote.iss   # Inno Setup script
```

---

## Cross-platform

Windows is the only supported target today. The input layer is abstracted behind `SystemInputBackend` (`src/core/main/input/backends/input-backend.ts`). Adding macOS/Linux means implementing that interface — contributions welcome.

---

## Contributing

1. Fork and clone
2. `npm install && npm run dev`
3. Make changes, run `npm run typecheck` to verify
4. Open a PR — CI will typecheck on push

---

## License

Apache 2.0 — see [LICENSE](LICENSE).  
Copyright 2026 Mudit Pandey. Contains no Widevine/CastLabs/DRM code.

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:a855f7,100:6366f1&height=100&section=footer" width="100%" />

</div>
