import type { ShortcutAction } from '../../shared/control';

type BrowserNavigationShortcut = 'go_home' | 'go_back' | 'go_forward' | 'reload';
type MediaShortcut = Exclude<ShortcutAction, BrowserNavigationShortcut>;

const BROWSER_NAVIGATION_SHORTCUTS: ReadonlySet<ShortcutAction> = new Set([
  'go_home',
  'go_back',
  'go_forward',
  'reload',
]);

const MEDIA_SHORTCUT_KEYS: Readonly<Record<MediaShortcut, string>> = {
  play_pause: 'MediaPlayPause',
  seek_back: 'j',
  seek_forward: 'l',
  fullscreen: 'f',
  mute: 'm',
  captions: 'c',
  speed_up: '>',
  speed_down: '<',
};

export const isBrowserNavigationShortcut = (action: ShortcutAction): boolean =>
  BROWSER_NAVIGATION_SHORTCUTS.has(action);

export const resolveShortcutKey = (action: ShortcutAction): string | null =>
  isBrowserNavigationShortcut(action) ? null : MEDIA_SHORTCUT_KEYS[action as MediaShortcut];
