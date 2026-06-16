export type ScreenBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type InputModifiers = {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
};

export type InputMode = 'app' | 'system';

/**
 * Contract for system-wide input injection backends.
 *
 * Backends inject mouse/keyboard events at the OS level (e.g. Win32 SendInput)
 * rather than into a specific Electron webContents.
 */
export interface SystemInputBackend {
  readonly available: boolean;

  injectMouseMove(screenX: number, screenY: number): void;
  injectMouseMoveDelta(dx: number, dy: number): void;

  injectMouseButton(
    button: 'left' | 'middle' | 'right',
    action: 'down' | 'up',
    screenX: number,
    screenY: number,
  ): void;

  injectScroll(deltaY: number, screenX: number, screenY: number): void;

  injectKeyDown(key: string, modifiers?: InputModifiers): void;
  injectKeyUp(key: string, modifiers?: InputModifiers): void;
  injectKeyPress(key: string, modifiers?: InputModifiers): void;

  getVirtualScreenBounds(): ScreenBounds;
  getCursorPosition(): { x: number; y: number };

  dispose(): void;
}
