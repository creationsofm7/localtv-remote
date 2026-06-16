import path from 'node:path';
import { createRequire } from 'node:module';

import type { VolumeState } from '../../shared/control';
import { AudioHost } from './audio-host';

type NativeMixer = {
  getMasterVolumeLevelScalar: () => number;
  isMasterMuted: () => boolean;
  muteMaster: (muted: boolean) => void;
  setMasterVolumeLevelScalar: (value: number) => void;
};

/**
 * Load the optional native Windows volume mixer.
 *
 * Decoupled from Electron: resolve `node-audio-volume-mixer` relative to this
 * module and the CWD (works for dev runs and a packaged daemon). When it isn't
 * present (the common case — it needs a native build), we fall back to the
 * persistent {@link AudioHost}, which is just as accurate.
 */
const loadNativeMixer = (): NativeMixer | null => {
  const candidates: string[] = [__filename, path.join(process.cwd(), 'package.json')];

  for (const base of candidates) {
    try {
      const nodeRequire = createRequire(base);
      return nodeRequire('node-audio-volume-mixer') as NativeMixer;
    } catch {
      continue;
    }
  }

  return null;
};

/**
 * Master-volume control with two accurate backends and a clear preference:
 *   1. `node-audio-volume-mixer` (native NAPI) — fastest, used if it loaded.
 *   2. {@link AudioHost} — one persistent PowerShell + Core Audio COM process.
 *
 * Both read/set the *real* system volume, so the reported level always matches
 * the OS (fixing the old keypress-estimate drift). Mutating methods are async
 * and resolve once the backend confirms the new state; the Electron caller may
 * ignore the returned promise (fire-and-forget), while the daemon awaits it so
 * the follow-up `volume_state` it sends to the phone is already fresh.
 */
export class VolumeController {
  private readonly native: NativeMixer | null;
  private readonly host: AudioHost | null;

  constructor() {
    this.native = loadNativeMixer();
    if (this.native) {
      this.host = null;
    } else {
      this.host = new AudioHost();
      this.host.start();
    }
  }

  getState(): VolumeState {
    if (this.native) {
      try {
        return {
          available: true,
          level: Math.round(this.native.getMasterVolumeLevelScalar() * 100),
          muted: this.native.isMasterMuted(),
        };
      } catch {
        /* fall through */
      }
    }

    if (this.host?.available) {
      const { level, muted } = this.host.getCached();
      return { available: true, level, muted };
    }

    return { available: false, level: 0, muted: false };
  }

  async setLevel(percent: number): Promise<void> {
    const next = Math.min(100, Math.max(0, Math.round(percent)));
    if (this.native) {
      try {
        this.native.setMasterVolumeLevelScalar(next / 100);
        return;
      } catch {
        /* fall through */
      }
    }
    await this.host?.setLevel(next);
  }

  async adjust(deltaPercent: number): Promise<void> {
    const delta = Math.round(deltaPercent);
    if (delta === 0) return;
    if (this.native) {
      try {
        const current = this.native.getMasterVolumeLevelScalar() * 100;
        this.native.setMasterVolumeLevelScalar(Math.min(100, Math.max(0, current + delta)) / 100);
        return;
      } catch {
        /* fall through */
      }
    }
    await this.host?.adjust(delta);
  }

  async toggleMute(): Promise<void> {
    if (this.native) {
      try {
        this.native.muteMaster(!this.native.isMasterMuted());
        return;
      } catch {
        /* fall through */
      }
    }
    await this.host?.toggleMute();
  }

  dispose(): void {
    this.host?.dispose();
  }
}
