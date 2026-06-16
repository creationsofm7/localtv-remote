import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

export type AudioState = { level: number; muted: boolean };

/**
 * One long-lived PowerShell process that talks to the Windows Core Audio
 * `IAudioEndpointVolume` COM interface. Commands come in on stdin, the
 * resulting `{level,muted}` comes back on stdout — one line per command.
 *
 * This replaces spawning a fresh `powershell.exe` for every volume change
 * (100–300 ms each) and the drift-prone keypress estimate: we read and set the
 * *real* master volume, so the reported level always matches reality.
 *
 * The COM script is passed via `-EncodedCommand` so the child's stdin stays
 * free for the command loop (no temp files, no quoting hazards).
 */

const PS_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
// 64-bit-correct COM signatures: pointer params are IntPtr (8 bytes), the
// activation interface comes back via IUnknown marshalling, and the GUID event
// context is passed as a null pointer (IntPtr.Zero). Using 'int'/by-value GUID
// for these corrupts the x64 call (E_INVALIDARG).
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int RegisterControlChangeNotify(IntPtr n);
  int UnregisterControlChangeNotify(IntPtr n);
  int GetChannelCount(out uint c);
  int SetMasterVolumeLevel(float f, IntPtr ctx);
  int SetMasterVolumeLevelScalar(float f, IntPtr ctx);
  int GetMasterVolumeLevel(out float f);
  int GetMasterVolumeLevelScalar(out float f);
  int SetChannelVolumeLevel(uint n, float f, IntPtr ctx);
  int SetChannelVolumeLevelScalar(uint n, float f, IntPtr ctx);
  int GetChannelVolumeLevel(uint n, out float f);
  int GetChannelVolumeLevelScalar(uint n, out float f);
  int SetMute(int b, IntPtr ctx);
  int GetMute(out int b);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int EnumAudioEndpoints(int df, int mask, IntPtr p);
  int GetDefaultAudioEndpoint(int df, int role, out IMMDevice dev);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid iid, int ctx, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object o);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
public static class Audio {
  static IAudioEndpointVolume Epv() {
    var en = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
    IMMDevice dev; Marshal.ThrowExceptionForHR(en.GetDefaultAudioEndpoint(0, 1, out dev));
    Guid iid = typeof(IAudioEndpointVolume).GUID; object o;
    Marshal.ThrowExceptionForHR(dev.Activate(ref iid, 1, IntPtr.Zero, out o));
    return (IAudioEndpointVolume)o;
  }
  public static void SetLevel(double pct) {
    float v = (float)(Math.Max(0, Math.Min(100, pct)) / 100.0);
    Marshal.ThrowExceptionForHR(Epv().SetMasterVolumeLevelScalar(v, IntPtr.Zero));
  }
  public static void Adjust(double d) {
    var e = Epv(); float l; Marshal.ThrowExceptionForHR(e.GetMasterVolumeLevelScalar(out l));
    SetLevel(l * 100 + d);
  }
  public static void ToggleMute() {
    var e = Epv(); int m; Marshal.ThrowExceptionForHR(e.GetMute(out m));
    Marshal.ThrowExceptionForHR(e.SetMute(m != 0 ? 0 : 1, IntPtr.Zero));
  }
  // Quote-free "level|muted" (e.g. "42|0") to avoid string-escaping hazards.
  public static string Read() {
    var e = Epv(); float l; int m;
    Marshal.ThrowExceptionForHR(e.GetMasterVolumeLevelScalar(out l));
    Marshal.ThrowExceptionForHR(e.GetMute(out m));
    return Math.Round(l * 100) + "|" + (m != 0 ? "1" : "0");
  }
}
"@
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  $p = $line.Trim() -split '\\s+'
  try {
    switch ($p[0]) {
      'SET'    { [Audio]::SetLevel([double]$p[1]) }
      'ADJUST' { [Audio]::Adjust([double]$p[1]) }
      'MUTE'   { [Audio]::ToggleMute() }
      default  { }
    }
    [Console]::Out.WriteLine([Audio]::Read())
  } catch {
    [Console]::Error.WriteLine('AUDIOERR ' + $_.Exception.Message)
    [Console]::Out.WriteLine('ERR')
  }
}
`;

export class AudioHost {
  private child: ChildProcessWithoutNullStreams | null = null;
  private stdoutBuffer = '';
  private readonly pending: Array<(state: AudioState | null) => void> = [];
  private cached: AudioState = { level: 0, muted: false };
  private _available = false;

  get available(): boolean {
    return this._available;
  }

  getCached(): AudioState {
    return this.cached;
  }

  start(): boolean {
    if (process.platform !== 'win32') return false;
    try {
      const encoded = Buffer.from(PS_SCRIPT, 'utf16le').toString('base64');
      const child = spawn(
        'powershell.exe',
        // -Sta is required: Core Audio COM (MMDeviceEnumerator) fails in the MTA
        // apartment PowerShell uses for non-interactive sessions.
        ['-NoProfile', '-NonInteractive', '-Sta', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
        { windowsHide: true },
      );
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => this.onStdout(chunk));
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk: string) => {
        const text = String(chunk).trim();
        // PowerShell streams CLIXML progress records to stderr; ignore those.
        if (text && !text.startsWith('#< CLIXML')) {
          console.warn('[LocalTV][audio]', text.slice(0, 300));
        }
      });
      child.on('exit', () => {
        this._available = false;
        this.child = null;
        this.flushPending(null);
      });
      child.on('error', () => {
        this._available = false;
      });
      this.child = child;
      this._available = true;
      // Seed the cache with the real current volume.
      void this.send('GET');
      return true;
    } catch {
      this._available = false;
      return false;
    }
  }

  setLevel(pct: number): Promise<AudioState | null> {
    return this.send(`SET ${Math.round(Math.max(0, Math.min(100, pct)))}`);
  }

  adjust(delta: number): Promise<AudioState | null> {
    return this.send(`ADJUST ${Math.round(delta)}`);
  }

  toggleMute(): Promise<AudioState | null> {
    return this.send('MUTE');
  }

  refresh(): Promise<AudioState | null> {
    return this.send('GET');
  }

  dispose(): void {
    this._available = false;
    try { this.child?.stdin.end(); } catch { /* ignore */ }
    try { this.child?.kill(); } catch { /* ignore */ }
    this.child = null;
  }

  private send(command: string): Promise<AudioState | null> {
    if (!this.child || !this._available) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      this.pending.push(resolve);
      try {
        this.child!.stdin.write(command + '\n');
      } catch {
        // Drop this resolver back out as a failure.
        const idx = this.pending.indexOf(resolve);
        if (idx >= 0) this.pending.splice(idx, 1);
        resolve(null);
      }
    });
  }

  private onStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    let nl: number;
    while ((nl = this.stdoutBuffer.indexOf('\n')) >= 0) {
      const line = this.stdoutBuffer.slice(0, nl).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(nl + 1);
      if (!line) continue;
      let state: AudioState | null = null;
      // Format: "level|muted" e.g. "42|0"; "ERR" or anything else → null.
      const parts = line.split('|');
      if (parts.length === 2) {
        const level = Number(parts[0]);
        if (Number.isFinite(level)) {
          state = { level: Math.max(0, Math.min(100, Math.round(level))), muted: parts[1].trim() === '1' };
          this.cached = state;
        }
      }
      const resolve = this.pending.shift();
      if (resolve) resolve(state);
    }
  }

  private flushPending(state: AudioState | null): void {
    while (this.pending.length) {
      const resolve = this.pending.shift();
      resolve?.(state);
    }
  }
}
