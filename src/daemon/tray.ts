import { readFileSync } from 'node:fs';

export type TrayHandlers = {
  onShow: () => void;
  onToggleStartup: (enabled: boolean) => Promise<boolean> | boolean;
  onQuit: () => void;
  startupEnabled: boolean;
  iconIcoPath: string;
};

export type TrayHandle = { kill: () => void } | null;

/**
 * Best-effort system tray via `systray2` (spawns a tiny helper binary; no
 * Chromium). Any failure here is non-fatal: the daemon and the pairing window
 * keep working without a tray. Replaces the Electron `Tray` used by the old
 * remote-host window.
 */
export async function startTray(handlers: TrayHandlers): Promise<TrayHandle> {
  try {
    const mod: any = await import('systray2');
    const SysTray = mod.default ?? mod;

    let iconBase64 = '';
    try {
      iconBase64 = readFileSync(handlers.iconIcoPath).toString('base64');
    } catch {
      /* icon optional */
    }

    const showItem = { title: 'Show pairing screen', tooltip: '', checked: false, enabled: true };
    const startupItem = {
      title: 'Start on login',
      tooltip: '',
      checked: handlers.startupEnabled,
      enabled: true,
    };
    const quitItem = { title: 'Quit', tooltip: '', checked: false, enabled: true };

    const systray = new SysTray({
      menu: {
        icon: iconBase64,
        isTemplateIcon: false,
        title: 'LocalTV Remote',
        tooltip: 'LocalTV Remote',
        items: [showItem, startupItem, SysTray.separator ?? { title: '<SEPARATOR>' }, quitItem],
      },
      debug: false,
      copyDir: true,
    });

    systray.onClick(async (action: any) => {
      const title = action?.item?.title;
      if (title === showItem.title) {
        handlers.onShow();
      } else if (title === startupItem.title) {
        const next = !startupItem.checked;
        const applied = await handlers.onToggleStartup(next);
        startupItem.checked = applied;
        systray.sendAction({ type: 'update-item', item: startupItem, seq_id: action.seq_id });
      } else if (title === quitItem.title) {
        handlers.onQuit();
      }
    });

    await systray.ready();
    return { kill: () => systray.kill(false) };
  } catch (err) {
    console.warn('[LocalTV] Tray unavailable (continuing without it):', err);
    return null;
  }
}
