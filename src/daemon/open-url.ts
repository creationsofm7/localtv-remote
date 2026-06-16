import { spawn } from 'node:child_process';

/** Open a URL in the user's default browser (fallback when no webview window). */
export function openInDefaultBrowser(url: string): void {
  if (process.platform === 'win32') {
    // `start` is a cmd builtin; the empty "" is the window title arg.
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  } else if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  }
}
