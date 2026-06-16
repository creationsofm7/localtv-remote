import type { ScreenBounds, SystemInputBackend } from './input-backend';

type Injector = typeof import('../../native/win32/input-injector');

/**
 * System-wide input backend for Windows.
 *
 * Delegates to the koffi-based Win32 SendInput wrapper for the normal desktop,
 * and can optionally route through an elevated helper for UAC/elevated targets.
 */
export class WindowsSystemBackend implements SystemInputBackend {
  private injector: Injector | null = null;
  private _available = false;

  get available(): boolean {
    return this._available;
  }

  async initialize(): Promise<boolean> {
    if (process.platform !== 'win32') return false;

    try {
      this.injector = await import('../../native/win32/input-injector');
      this._available = true;
      return true;
    } catch (err) {
      console.error('[LocalTV] Win32 input injector unavailable:', err);
      return false;
    }
  }

  injectMouseMove(screenX: number, screenY: number): void {
    this.injector?.sendMouseMoveAbsolute(screenX, screenY);
  }

  injectMouseMoveDelta(dx: number, dy: number): void {
    this.injector?.sendMouseMoveDelta(dx, dy);
  }

  injectMouseButton(
    button: 'left' | 'middle' | 'right',
    action: 'down' | 'up',
    screenX: number,
    screenY: number,
  ): void {
    this.injector?.sendMouseButton(button, action, screenX, screenY);
  }

  injectScroll(deltaY: number, screenX: number, screenY: number): void {
    this.injector?.sendScroll(deltaY, screenX, screenY);
  }

  injectKeyDown(key: string): void {
    this.injector?.sendKeyDown(key);
  }

  injectKeyUp(key: string): void {
    this.injector?.sendKeyUp(key);
  }

  injectKeyPress(key: string): void {
    this.injector?.sendKeyPress(key);
  }

  getVirtualScreenBounds(): ScreenBounds {
    return (
      this.injector?.getVirtualScreenBounds() ?? {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      }
    );
  }

  getCursorPosition(): { x: number; y: number } {
    return this.injector?.getCursorPosition() ?? { x: 0, y: 0 };
  }

  dispose(): void {
    this._available = false;
    this.injector = null;
  }
}
