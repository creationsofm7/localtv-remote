import type { ControlMessage, InputMode, VolumeState } from '../../shared/control';

/**
 * Minimal contract the RemoteControlServer needs from whatever routes input.
 *
 * The Electron app implements this with a browser-aware coordinator; the
 * headless daemon implements it with a system-only router (see
 * SystemInputRouter in the daemon package). Keeping the server typed against
 * this interface is what lets the same server run with or without Electron.
 */
export interface InputRouter {
  route(message: Exclude<ControlMessage, { type: 'auth' }>): Promise<void>;
  getInputMode(): InputMode;
  isSystemModeAvailable(): boolean;
  getCursorVisible(): boolean;
  getVolumeState(): VolumeState;
}
