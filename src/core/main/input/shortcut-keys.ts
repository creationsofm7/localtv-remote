import type { ShortcutAction } from '../../shared/control';
import type { InputModifiers } from './backends/input-backend';

export type ShortcutCommand = {
  key: string;
  modifiers?: InputModifiers;
};

const SHORTCUT_COMMANDS: Readonly<Record<ShortcutAction, ShortcutCommand>> = {
  play_pause: { key: 'MediaPlayPause' },
  seek_back: { key: 'KeyJ' },
  seek_forward: { key: 'KeyL' },
  fullscreen: { key: 'KeyF' },
  mute: { key: 'KeyM' },
  captions: { key: 'KeyC' },
  speed_up: { key: 'Period', modifiers: { shift: true } },
  speed_down: { key: 'Comma', modifiers: { shift: true } },
  go_home: { key: 'BrowserHome' },
  go_back: { key: 'BrowserBack' },
  go_forward: { key: 'BrowserForward' },
  reload: { key: 'BrowserRefresh' },
};

export const resolveShortcutCommand = (action: ShortcutAction): ShortcutCommand =>
  SHORTCUT_COMMANDS[action];
