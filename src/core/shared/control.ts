export type AppMode = 'remote_control' | 'tv';

export type RemoteControlState = {
  appMode: AppMode;
  clientCount: number;
  controllerUrl: string;
  hasTrustedSession: boolean;
  inputMode: InputMode;
  pairingUrl: string;
  pairCode: string;
  systemModeAvailable: boolean;
};

export type RemoteCursorTarget = 'browser' | 'shell';

export type RemoteCursorState = {
  target: RemoteCursorTarget | null;
  visible: boolean;
  x: number;
  y: number;
};

export type VolumeState = {
  available: boolean;
  level: number;
  muted: boolean;
};

export type VolumeStateMessage = {
  state: VolumeState;
  type: 'volume_state';
};

export type AuthMessage = {
  pairCode?: string;
  sessionToken?: string;
  type: 'auth';
};

export type MouseMoveMessage = {
  type: 'mouse_move';
  x: number;
  y: number;
};

export type MouseMoveDeltaMessage = {
  type: 'mouse_move_delta';
  dx: number;
  dy: number;
};

export type MouseDownMessage = {
  button?: 'left' | 'middle' | 'right';
  type: 'mouse_down';
  x: number;
  y: number;
};

export type MouseUpMessage = {
  button?: 'left' | 'middle' | 'right';
  type: 'mouse_up';
  x: number;
  y: number;
};

export type ClickMessage = {
  button?: 'left' | 'middle' | 'right';
  type: 'click';
  x: number;
  y: number;
};

export type ScrollMessage = {
  deltaY: number;
  type: 'scroll';
};

export type KeyMessage = {
  key: string;
  type: 'key';
};

export type TextMessage = {
  text: string;
  type: 'text';
};

export type NavigateMessage = {
  type: 'navigate';
  url: string;
};

export const SHORTCUT_ACTIONS = [
  'play_pause',
  'seek_back',
  'seek_forward',
  'fullscreen',
  'mute',
  'captions',
  'speed_up',
  'speed_down',
  'go_home',
  'go_back',
  'go_forward',
  'reload',
] as const;

export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number];

export type ShortcutMessage = {
  action: ShortcutAction;
  type: 'shortcut';
};

export type VolumeSetMessage = {
  percent: number;
  type: 'volume_set';
};

export type VolumeAdjustMessage = {
  delta: number;
  type: 'volume_adjust';
};

export type VolumeMuteToggleMessage = {
  type: 'volume_mute_toggle';
};

export type SystemSleepMessage = {
  type: 'system_sleep';
};

export type SystemShutdownMessage = {
  type: 'system_shutdown';
};

export type CursorVisibilityMessage = {
  type: 'cursor_visibility';
  visible: boolean;
};

export type InputMode = 'app' | 'system';

export type InputModeMessage = {
  mode: InputMode;
  type: 'input_mode';
};

export type ElevationRequestMessage = {
  type: 'elevation_request';
};

export type ControlMessage =
  | AuthMessage
  | ClickMessage
  | MouseMoveMessage
  | MouseMoveDeltaMessage
  | MouseDownMessage
  | MouseUpMessage
  | ScrollMessage
  | KeyMessage
  | TextMessage
  | NavigateMessage
  | ShortcutMessage
  | SystemSleepMessage
  | SystemShutdownMessage
  | CursorVisibilityMessage
  | VolumeSetMessage
  | VolumeAdjustMessage
  | VolumeMuteToggleMessage
  | InputModeMessage
  | ElevationRequestMessage;

export const BINARY_TAG = {
  MOUSE_MOVE_DELTA: 0x01,
  MOUSE_MOVE: 0x02,
  MOUSE_DOWN: 0x03,
  MOUSE_UP: 0x04,
  SCROLL: 0x05,
  CLICK: 0x06,
} as const;
