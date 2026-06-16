import type { ControlMessage, InputMode, ShortcutAction, VolumeState } from '../core/shared/control';
import type { SystemInputBackend } from '../core/main/input/backends/input-backend';
import type { VolumeController } from '../core/main/audio/volume-controller';
import type { InputRouter } from '../core/main/input/input-router';
import { isBrowserKeyShortcut, shortcutToKeyMessages } from '../core/main/input/shortcut-keys';
import { systemShutdown, systemSleep } from '../core/main/system/power';

const MOUSE_DELTA_SENSITIVITY = 1.8;

/**
 * Headless, system-only input router for the daemon.
 *
 * This is the daemon's replacement for the Electron `InputCoordinator`. It has
 * no window and no embedded browser: every pointer/keyboard event is injected
 * OS-wide through the Win32 `SystemInputBackend`. The routing math mirrors
 * `InputCoordinator.routeToSystemBackend()` in the Electron app so behaviour is
 * identical in system mode.
 *
 * Browser-only actions degrade gracefully:
 *  - `navigate` is a no-op (there is no embedded browser).
 *  - `shortcut` actions that map to media keys (play/pause, seek, mute, …) are
 *    injected as the corresponding keystrokes; pure app-navigation shortcuts
 *    (go_home/back/forward/reload) are dropped.
 */
export class SystemInputRouter implements InputRouter {
  private cursorVisible = true;

  constructor(
    private readonly backend: SystemInputBackend,
    private readonly volume: VolumeController,
  ) {}

  getInputMode(): InputMode {
    return 'system';
  }

  isSystemModeAvailable(): boolean {
    return this.backend.available;
  }

  getCursorVisible(): boolean {
    return this.cursorVisible;
  }

  getVolumeState(): VolumeState {
    return this.volume.getState();
  }

  async route(message: Exclude<ControlMessage, { type: 'auth' }>): Promise<void> {
    switch (message.type) {
      // ── OS-level actions (work without a backend) ──────────────────────────
      case 'volume_set':
        await this.volume.setLevel(message.percent);
        return;
      case 'volume_adjust':
        await this.volume.adjust(message.delta);
        return;
      case 'volume_mute_toggle':
        await this.volume.toggleMute();
        return;
      case 'system_sleep':
        systemSleep();
        return;
      case 'system_shutdown':
        systemShutdown();
        return;
      case 'cursor_visibility':
        this.cursorVisible = message.visible;
        return;
      case 'input_mode':
      case 'elevation_request':
        // Daemon is always in system mode; nothing to switch or elevate here.
        return;
      case 'navigate':
        // No embedded browser in the daemon.
        return;
    }

    if (!this.backend.available) {
      return;
    }

    if (message.type === 'shortcut') {
      this.routeShortcut(message.action);
      return;
    }

    this.routeToBackend(message);
  }

  private routeShortcut(action: ShortcutAction): void {
    if (!isBrowserKeyShortcut(action)) {
      // go_home / go_back / go_forward / reload have no system-wide meaning.
      return;
    }
    const keys = shortcutToKeyMessages(action);
    if (!keys?.length) {
      return;
    }
    for (const keyMessage of keys) {
      this.backend.injectKeyPress(keyMessage.key);
    }
  }

  private routeToBackend(
    message: Exclude<
      ControlMessage,
      | { type: 'auth' }
      | { type: 'input_mode' }
      | { type: 'elevation_request' }
      | { type: 'volume_set' }
      | { type: 'volume_adjust' }
      | { type: 'volume_mute_toggle' }
      | { type: 'system_sleep' }
      | { type: 'system_shutdown' }
      | { type: 'cursor_visibility' }
      | { type: 'navigate' }
      | { type: 'shortcut' }
    >,
  ): void {
    const backend = this.backend;
    const bounds = backend.getVirtualScreenBounds();

    switch (message.type) {
      case 'mouse_move': {
        const x = bounds.x + bounds.width * message.x;
        const y = bounds.y + bounds.height * message.y;
        backend.injectMouseMove(Math.round(x), Math.round(y));
        break;
      }
      case 'mouse_move_delta': {
        const dx = message.dx * bounds.width * MOUSE_DELTA_SENSITIVITY;
        const dy = message.dy * bounds.height * MOUSE_DELTA_SENSITIVITY;
        const cursor = backend.getCursorPosition();

        // Convert to an absolute target to bypass OS mouse acceleration.
        const newX = Math.round(Math.min(Math.max(cursor.x + dx, bounds.x), bounds.x + bounds.width));
        const newY = Math.round(Math.min(Math.max(cursor.y + dy, bounds.y), bounds.y + bounds.height));

        backend.injectMouseMove(newX, newY);
        break;
      }
      case 'mouse_down': {
        const cursor = backend.getCursorPosition();
        backend.injectMouseButton(message.button ?? 'left', 'down', cursor.x, cursor.y);
        break;
      }
      case 'mouse_up': {
        const cursor = backend.getCursorPosition();
        backend.injectMouseButton(message.button ?? 'left', 'up', cursor.x, cursor.y);
        break;
      }
      case 'click': {
        const cursor = backend.getCursorPosition();
        const button = message.button ?? 'left';
        backend.injectMouseButton(button, 'down', cursor.x, cursor.y);
        backend.injectMouseButton(button, 'up', cursor.x, cursor.y);
        break;
      }
      case 'scroll': {
        const cursor = backend.getCursorPosition();
        backend.injectScroll(message.deltaY, cursor.x, cursor.y);
        break;
      }
      case 'key':
        backend.injectKeyPress(message.key);
        break;
      case 'text':
        for (const char of message.text) {
          if (char === '\r') {
            continue;
          }
          backend.injectKeyPress(char === '\n' ? 'Enter' : char);
        }
        break;
    }
  }
}
