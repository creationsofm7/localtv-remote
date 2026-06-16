import type { KeyMessage, ShortcutAction } from '../../shared/control';

const isAppShortcut = (action: ShortcutAction): boolean =>
  action === 'go_home' ||
  action === 'go_back' ||
  action === 'go_forward' ||
  action === 'reload';

export const isBrowserKeyShortcut = (action: ShortcutAction): boolean => !isAppShortcut(action);

export const shortcutToKeyMessages = (action: ShortcutAction): KeyMessage[] | null => {
  if (isAppShortcut(action)) {
    return null;
  }

  const key = (k: string): KeyMessage => ({ key: k, type: 'key' });

  switch (action) {
    case 'play_pause':
      return [key('k')];
    case 'seek_back':
      return [key('j')];
    case 'seek_forward':
      return [key('l')];
    case 'fullscreen':
      return [key('f')];
    case 'mute':
      return [key('m')];
    case 'captions':
      return [key('c')];
    case 'speed_up':
      return [key('>')];
    case 'speed_down':
      return [key('<')];
    default:
      return null;
  }
};
