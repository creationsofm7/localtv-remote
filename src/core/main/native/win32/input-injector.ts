/**
 * Low-level Win32 input injection via koffi FFI.
 *
 * Uses SendInput to synthesize global mouse/keyboard events, matching the
 * approach used by Chrome Remote Desktop's input_injector_win.cc.
 *
 * This module is Windows-only and will throw at import time on other platforms.
 */

import koffi from 'koffi/indirect';

if (process.platform !== 'win32') {
  throw new Error('win32/input-injector is only available on Windows.');
}

// ── Win32 constants ─────────────────────────────────────────────────────────

const INPUT_MOUSE = 0;
const INPUT_KEYBOARD = 1;

const MOUSEEVENTF_MOVE = 0x0001;
const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;
const MOUSEEVENTF_MIDDLEDOWN = 0x0020;
const MOUSEEVENTF_MIDDLEUP = 0x0040;
const MOUSEEVENTF_WHEEL = 0x0800;
const MOUSEEVENTF_ABSOLUTE = 0x8000;
const MOUSEEVENTF_VIRTUALDESK = 0x4000;

const KEYEVENTF_KEYUP = 0x0002;
const KEYEVENTF_UNICODE = 0x0004;

const SM_CXVIRTUALSCREEN = 78;
const SM_CYVIRTUALSCREEN = 79;
const SM_XVIRTUALSCREEN = 76;
const SM_YVIRTUALSCREEN = 77;
const SM_SWAPBUTTON = 23;

const MAPVK_VK_TO_VSC = 0;
const ES_SYSTEM_REQUIRED = 0x00000001;
const WHEEL_DELTA = 120;

// ── VK code table ───────────────────────────────────────────────────────────

const VK_MAP: Readonly<Record<string, number>> = {
  Backspace: 0x08,
  Tab: 0x09,
  Enter: 0x0d,
  Shift: 0xa0,
  Control: 0xa2,
  Alt: 0xa4,
  Meta: 0x5b,
  Pause: 0x13,
  CapsLock: 0x14,
  Escape: 0x1b,
  Space: 0x20,
  ' ': 0x20,
  PageUp: 0x21,
  PageDown: 0x22,
  End: 0x23,
  Home: 0x24,
  ArrowLeft: 0x25,
  ArrowUp: 0x26,
  ArrowRight: 0x27,
  ArrowDown: 0x28,
  PrintScreen: 0x2c,
  Insert: 0x2d,
  Delete: 0x2e,
  F1: 0x70,
  F2: 0x71,
  F3: 0x72,
  F4: 0x73,
  F5: 0x74,
  F6: 0x75,
  F7: 0x76,
  F8: 0x77,
  F9: 0x78,
  F10: 0x79,
  F11: 0x7a,
  F12: 0x7b,
  BrowserBack: 0xa6,
  BrowserForward: 0xa7,
  BrowserRefresh: 0xa8,
  BrowserHome: 0xac,
  NumLock: 0x90,
  ScrollLock: 0x91,
};

const EXTENDED_VK = new Set<number>([
  0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x2d, 0x2e, 0x5b, 0x5c,
  0x5d, 0xa3, 0xa5, 0xa6, 0xa7, 0xa8, 0xac,
]);

// ── koffi struct / function declarations ────────────────────────────────────

const MOUSEINPUT = koffi.struct('MOUSEINPUT', {
  dx: 'int32',
  dy: 'int32',
  mouseData: 'uint32',
  dwFlags: 'uint32',
  time: 'uint32',
  dwExtraInfo: 'uintptr',
});

const KEYBDINPUT = koffi.struct('KEYBDINPUT', {
  wVk: 'uint16',
  wScan: 'uint16',
  dwFlags: 'uint32',
  time: 'uint32',
  dwExtraInfo: 'uintptr',
});

const HARDWAREINPUT = koffi.struct('HARDWAREINPUT', {
  uMsg: 'uint32',
  wParamL: 'uint16',
  wParamH: 'uint16',
});

const INPUT_UNION = koffi.union('INPUT_UNION', {
  mi: MOUSEINPUT,
  ki: KEYBDINPUT,
  hi: HARDWAREINPUT,
});

const INPUT_STRUCT = koffi.struct('INPUT_STRUCT', {
  type: 'uint32',
  u: INPUT_UNION,
});

koffi.struct('POINT_STRUCT', {
  x: 'int32',
  y: 'int32',
});

const user32 = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');

const _SendInput = user32.func(
  'uint32 __stdcall SendInput(uint32 cInputs, INPUT_STRUCT *pInputs, int32 cbSize)',
);
const _GetSystemMetrics = user32.func(
  'int32 __stdcall GetSystemMetrics(int32 nIndex)',
);
const _MapVirtualKeyW = user32.func(
  'uint32 __stdcall MapVirtualKeyW(uint32 uCode, uint32 uMapType)',
);
const _GetCursorPos = user32.func(
  'int32 __stdcall GetCursorPos(_Out_ POINT_STRUCT *pt)',
);
const _SetCursorPos = user32.func(
  'int32 __stdcall SetCursorPos(int32 X, int32 Y)',
);
const _SetThreadExecutionState = kernel32.func(
  'uint32 __stdcall SetThreadExecutionState(uint32 esFlags)',
);

const INPUT_CB = koffi.sizeof(INPUT_STRUCT);

// ── Helpers ─────────────────────────────────────────────────────────────────

// SetThreadExecutionState only needs to fire periodically to keep the system
// awake; calling it on every input event is pure FFI overhead.
let lastIdleReset = 0;
const IDLE_RESET_INTERVAL_MS = 30_000;

function resetIdleTimer(): void {
  const now = Date.now();
  if (now - lastIdleReset < IDLE_RESET_INTERVAL_MS) {
    return;
  }
  lastIdleReset = now;
  _SetThreadExecutionState(ES_SYSTEM_REQUIRED);
}

// Virtual-screen bounds change rarely (resolution / monitor changes) but are
// read on every mouse event. Cache them and refresh at most once per second to
// avoid 4–8 GetSystemMetrics FFI calls per cursor move.
type ScreenMetrics = { vx: number; vy: number; vw: number; vh: number; ts: number };
let cachedMetrics: ScreenMetrics = { vx: 0, vy: 0, vw: 0, vh: 0, ts: 0 };
const METRICS_TTL_MS = 1000;

function getScreenMetrics(): ScreenMetrics {
  const now = Date.now();
  if (cachedMetrics.vw > 0 && now - cachedMetrics.ts < METRICS_TTL_MS) {
    return cachedMetrics;
  }
  cachedMetrics = {
    vx: _GetSystemMetrics(SM_XVIRTUALSCREEN),
    vy: _GetSystemMetrics(SM_YVIRTUALSCREEN),
    vw: _GetSystemMetrics(SM_CXVIRTUALSCREEN),
    vh: _GetSystemMetrics(SM_CYVIRTUALSCREEN),
    ts: now,
  };
  return cachedMetrics;
}

function sendInputs(inputs: unknown[]): void {
  if (_SendInput(inputs.length, inputs, INPUT_CB) === 0) {
    console.error('[LocalTV] SendInput failed for', inputs.length, 'event(s).');
  }
}

function makeMouseInput(
  flags: number,
  dx: number,
  dy: number,
  mouseData = 0,
): unknown {
  return {
    type: INPUT_MOUSE,
    u: {
      mi: { dx, dy, mouseData, dwFlags: flags, time: 0, dwExtraInfo: 0 },
    },
  };
}

function makeKeyInput(vk: number, scan: number, flags: number): unknown {
  return {
    type: INPUT_KEYBOARD,
    u: {
      ki: { wVk: vk, wScan: scan, dwFlags: flags, time: 0, dwExtraInfo: 0 },
    },
  };
}

function toAbsolute(
  screenX: number,
  screenY: number,
): { dx: number; dy: number } {
  const { vx, vy, vw, vh } = getScreenMetrics();
  return {
    dx: Math.round(((screenX - vx) * 65535) / Math.max(vw - 1, 1)),
    dy: Math.round(((screenY - vy) * 65535) / Math.max(vh - 1, 1)),
  };
}

function resolveButton(
  button: 'left' | 'middle' | 'right',
): { down: number; up: number } {
  const swapped = _GetSystemMetrics(SM_SWAPBUTTON) !== 0;
  let effective = button;
  if (swapped) {
    if (button === 'left') effective = 'right';
    else if (button === 'right') effective = 'left';
  }
  switch (effective) {
    case 'left':
      return { down: MOUSEEVENTF_LEFTDOWN, up: MOUSEEVENTF_LEFTUP };
    case 'right':
      return { down: MOUSEEVENTF_RIGHTDOWN, up: MOUSEEVENTF_RIGHTUP };
    case 'middle':
      return { down: MOUSEEVENTF_MIDDLEDOWN, up: MOUSEEVENTF_MIDDLEUP };
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function sendMouseMoveAbsolute(screenX: number, screenY: number): void {
  resetIdleTimer();
  if (!_SetCursorPos(Math.round(screenX), Math.round(screenY))) {
    const { dx, dy } = toAbsolute(screenX, screenY);
    sendInputs([
      makeMouseInput(
        MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK,
        dx,
        dy,
      ),
    ]);
  }
}

export function sendMouseMoveDelta(dx: number, dy: number): void {
  resetIdleTimer();
  sendInputs([
    makeMouseInput(MOUSEEVENTF_MOVE, dx, dy),
  ]);
}

export function sendMouseButton(
  button: 'left' | 'middle' | 'right',
  action: 'down' | 'up',
  screenX: number,
  screenY: number,
): void {
  resetIdleTimer();
  const { dx, dy } = toAbsolute(screenX, screenY);
  const flags = resolveButton(button);
  const eventFlag = action === 'down' ? flags.down : flags.up;
  sendInputs([
    makeMouseInput(
      eventFlag | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK,
      dx,
      dy,
    ),
  ]);
}

export function sendScroll(
  deltaY: number,
  screenX: number,
  screenY: number,
): void {
  resetIdleTimer();
  const { dx, dy } = toAbsolute(screenX, screenY);
  const mouseData = Math.round(deltaY * WHEEL_DELTA);
  sendInputs([
    makeMouseInput(
      MOUSEEVENTF_WHEEL | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK,
      dx,
      dy,
      mouseData,
    ),
  ]);
}

export function sendKeyDown(key: string): void {
  resetIdleTimer();

  if (key.length === 1) {
    const charCode = key.charCodeAt(0);
    sendInputs([makeKeyInput(0, charCode, KEYEVENTF_UNICODE)]);
    return;
  }

  const vk = VK_MAP[key];
  if (vk === undefined) return;

  const scan = _MapVirtualKeyW(vk, MAPVK_VK_TO_VSC) & 0xff;
  let flags = 0;
  if (EXTENDED_VK.has(vk)) flags |= 0x0001; // KEYEVENTF_EXTENDEDKEY
  sendInputs([makeKeyInput(vk, scan, flags)]);
}

export function sendKeyUp(key: string): void {
  if (key.length === 1) {
    const charCode = key.charCodeAt(0);
    sendInputs([
      makeKeyInput(0, charCode, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP),
    ]);
    return;
  }

  const vk = VK_MAP[key];
  if (vk === undefined) return;

  const scan = _MapVirtualKeyW(vk, MAPVK_VK_TO_VSC) & 0xff;
  let flags = KEYEVENTF_KEYUP;
  if (EXTENDED_VK.has(vk)) flags |= 0x0001;
  sendInputs([makeKeyInput(vk, scan, flags)]);
}

export function sendKeyPress(key: string): void {
  sendKeyDown(key);
  sendKeyUp(key);
}

export function getVirtualScreenBounds(): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const { vx, vy, vw, vh } = getScreenMetrics();
  return { x: vx, y: vy, width: vw, height: vh };
}

export function getCursorPosition(): { x: number; y: number } {
  const pt: { x?: number; y?: number } = {};
  if (!_GetCursorPos(pt)) {
    return { x: 0, y: 0 };
  }
  return {
    x: typeof pt.x === 'number' ? pt.x : 0,
    y: typeof pt.y === 'number' ? pt.y : 0,
  };
}
