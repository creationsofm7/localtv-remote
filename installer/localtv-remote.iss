; LocalTV Remote — Inno Setup installer script
; Produces: release/LocalTVRemote-Setup-{version}.exe
; Requires: release/app/ assembled by `npm run payload`

#define AppName      "LocalTV Remote"
; AppVersion is injected by build-installer.mjs via /DAppVersion=x.y.z
#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif
#define AppPublisher "LocalTV"
#define AppURL       "https://github.com/muditpandey2077/localtv-remote"
#define AppExeName   "LocalTVRemote.exe"
#define AppId        "{{A3B7C2D1-E4F5-6789-ABCD-EF0123456789}"

[Setup]
AppId={#AppId}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
LicenseFile=..\LICENSE
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
OutputDir=..\release
OutputBaseFilename=LocalTVRemote-Setup-{#AppVersion}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
DisableWelcomePage=no
; Require Windows 10 build 17134+ (WebView2 baseline)
MinVersion=10.0.17134

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon";   Description: "Create a &desktop shortcut";   GroupDescription: "Additional icons:"; Flags: unchecked
Name: "startup";       Description: "Start &automatically when Windows starts"; GroupDescription: "Startup:"; Flags: unchecked

[Files]
; Main executable
Source: "..\release\app\{#AppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; PWA controller UI (served by the daemon's Express server)
Source: "..\release\app\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs

; Assets (icon used by tray and uninstaller)
Source: "..\release\app\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

; MIT License
Source: "..\release\app\LICENSE"; DestDir: "{app}"; Flags: ignoreversion

; Native runtime packages (koffi FFI, WebView2 wrapper, systray helper)
Source: "..\release\app\node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Start Menu
Name: "{group}\{#AppName}";       Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\assets\icon.ico"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"

; Desktop shortcut (optional task)
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\assets\icon.ico"; Tasks: desktopicon

[Registry]
; Run-at-startup toggle (matches the tray "Start on login" toggle key name)
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; \
  ValueType: string; ValueName: "LocalTVRemote"; \
  ValueData: """{app}\{#AppExeName}"" --startup-launch"; \
  Flags: uninsdeletevalue; Tasks: startup

[Run]
; Add Windows Firewall inbound rule so the phone can reach the daemon on the LAN
; (program-scoped = port-agnostic; works with the free-port fallback)
Filename: "netsh"; \
  Parameters: "advfirewall firewall add rule name=""LocalTV Remote"" dir=in action=allow program=""{app}\{#AppExeName}"" enable=yes profile=private,domain"; \
  Flags: runhidden; StatusMsg: "Configuring firewall rule..."

; Launch the app after install (user can skip via checkbox)
Filename: "{app}\{#AppExeName}"; \
  Description: "Launch {#AppName} now"; \
  Flags: nowait postinstall skipifsilent

[UninstallRun]
; Kill any running instance before files are removed
Filename: "taskkill.exe"; \
  Parameters: "/F /IM {#AppExeName}"; \
  RunOnceId: "KillApp"; \
  Flags: runhidden; StatusMsg: "Stopping {#AppName}..."

; Remove the firewall rule on uninstall
Filename: "netsh"; \
  Parameters: "advfirewall firewall delete rule name=""LocalTV Remote"""; \
  RunOnceId: "RemoveFirewallRule"; \
  Flags: runhidden

[Code]
{ Extra safety: kill the process in Pascal before Inno touches any files.
  UninstallRun runs after file deletion begins; this fires before it. }
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
    Exec('taskkill.exe', '/F /IM {#AppExeName}', '', SW_HIDE,
         ewWaitUntilTerminated, ResultCode);
end;
