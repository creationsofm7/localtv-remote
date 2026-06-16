import { execFile } from 'node:child_process';

export const systemSleep = (): void => {
  switch (process.platform) {
    case 'win32':
      execFile(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)',
        ],
        { windowsHide: true, timeout: 10_000 },
      );
      break;

    case 'darwin':
      execFile('pmset', ['sleepnow'], { timeout: 10_000 });
      break;

    case 'linux':
      execFile('systemctl', ['suspend'], { timeout: 10_000 });
      break;
  }
};

export const systemShutdown = (): void => {
  switch (process.platform) {
    case 'win32':
      execFile('shutdown.exe', ['/s', '/t', '0'], { windowsHide: true, timeout: 10_000 });
      break;

    case 'darwin':
      execFile('osascript', ['-e', 'tell app "System Events" to shut down'], { timeout: 10_000 });
      break;

    case 'linux':
      execFile('systemctl', ['poweroff'], { timeout: 10_000 });
      break;
  }
};
