import type {
  ClickMessage,
  ControlMessage,
  CursorVisibilityMessage,
  ElevationRequestMessage,
  InputModeMessage,
  KeyMessage,
  MouseDownMessage,
  MouseMoveDeltaMessage,
  MouseMoveMessage,
  MouseUpMessage,
  NavigateMessage,
  ScrollMessage,
  ShortcutAction,
  ShortcutMessage,
  SystemShutdownMessage,
  SystemSleepMessage,
  TextMessage,
  VolumeAdjustMessage,
  VolumeMuteToggleMessage,
  VolumeSetMessage,
} from '../../shared/control';
import { BINARY_TAG, SHORTCUT_ACTIONS } from '../../shared/control';

const shortcutActionSet = new Set<string>(SHORTCUT_ACTIONS);

const isNormalizedNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

const isDeltaNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= -2 && value <= 2;

const isButton = (value: unknown): value is 'left' | 'middle' | 'right' =>
  value === undefined || value === 'left' || value === 'middle' || value === 'right';

const isString = (value: unknown): value is string => typeof value === 'string';

const BUTTON_NAMES: ReadonlyArray<'left' | 'middle' | 'right'> = ['left', 'middle', 'right'];

const parseMouseMove = (payload: Record<string, unknown>): MouseMoveMessage | null => {
  if (!isNormalizedNumber(payload.x) || !isNormalizedNumber(payload.y)) {
    return null;
  }
  return { type: 'mouse_move', x: payload.x, y: payload.y };
};

const parseMouseMoveDelta = (payload: Record<string, unknown>): MouseMoveDeltaMessage | null => {
  if (!isDeltaNumber(payload.dx) || !isDeltaNumber(payload.dy)) {
    return null;
  }
  return { type: 'mouse_move_delta', dx: payload.dx, dy: payload.dy };
};

const parseMouseDown = (payload: Record<string, unknown>): MouseDownMessage | null => {
  if (!isNormalizedNumber(payload.x) || !isNormalizedNumber(payload.y) || !isButton(payload.button)) {
    return null;
  }
  return { button: payload.button, type: 'mouse_down', x: payload.x, y: payload.y };
};

const parseMouseUp = (payload: Record<string, unknown>): MouseUpMessage | null => {
  if (!isNormalizedNumber(payload.x) || !isNormalizedNumber(payload.y) || !isButton(payload.button)) {
    return null;
  }
  return { button: payload.button, type: 'mouse_up', x: payload.x, y: payload.y };
};

const parseClick = (payload: Record<string, unknown>): ClickMessage | null => {
  if (!isNormalizedNumber(payload.x) || !isNormalizedNumber(payload.y) || !isButton(payload.button)) {
    return null;
  }
  return { button: payload.button, type: 'click', x: payload.x, y: payload.y };
};

const parseScroll = (payload: Record<string, unknown>): ScrollMessage | null => {
  if (typeof payload.deltaY !== 'number' || !Number.isFinite(payload.deltaY)) {
    return null;
  }
  return { deltaY: payload.deltaY, type: 'scroll' };
};

const parseKey = (payload: Record<string, unknown>): KeyMessage | null => {
  if (!isString(payload.key) || !payload.key.trim()) {
    return null;
  }
  return { key: payload.key, type: 'key' };
};

const parseText = (payload: Record<string, unknown>): TextMessage | null => {
  if (!isString(payload.text) || payload.text.length === 0) {
    return null;
  }
  return { text: payload.text, type: 'text' };
};

const parseNavigate = (payload: Record<string, unknown>): NavigateMessage | null => {
  if (!isString(payload.url) || !payload.url.trim()) {
    return null;
  }
  return { type: 'navigate', url: payload.url };
};

const parseShortcut = (payload: Record<string, unknown>): ShortcutMessage | null => {
  const action = payload.action;
  if (!isString(action) || !shortcutActionSet.has(action)) {
    return null;
  }
  return { action: action as ShortcutAction, type: 'shortcut' };
};

const parseVolumeSet = (payload: Record<string, unknown>): VolumeSetMessage | null => {
  const percent = payload.percent;
  if (typeof percent !== 'number' || !Number.isFinite(percent)) {
    return null;
  }
  return { percent: Math.min(100, Math.max(0, percent)), type: 'volume_set' };
};

const parseVolumeAdjust = (payload: Record<string, unknown>): VolumeAdjustMessage | null => {
  const delta = payload.delta;
  if (typeof delta !== 'number' || !Number.isFinite(delta)) {
    return null;
  }
  return { delta: Math.min(100, Math.max(-100, delta)), type: 'volume_adjust' };
};

const parseVolumeMuteToggle = (): VolumeMuteToggleMessage | null => {
  return { type: 'volume_mute_toggle' };
};

const parseSystemSleep = (): SystemSleepMessage | null => {
  return { type: 'system_sleep' };
};

const parseSystemShutdown = (): SystemShutdownMessage | null => {
  return { type: 'system_shutdown' };
};

const parseCursorVisibility = (payload: Record<string, unknown>): CursorVisibilityMessage | null => {
  if (typeof payload.visible !== 'boolean') {
    return null;
  }

  return { type: 'cursor_visibility', visible: payload.visible };
};

const parseInputMode = (payload: Record<string, unknown>): InputModeMessage | null => {
  const mode = payload.mode;
  if (mode !== 'app' && mode !== 'system') {
    return null;
  }
  return { mode, type: 'input_mode' };
};

const parseElevationRequest = (): ElevationRequestMessage | null => {
  return { type: 'elevation_request' };
};

type JsonParser = (payload: Record<string, unknown>) => ControlMessage | null;

const jsonParsers = new Map<string, JsonParser>([
  ['mouse_move_delta', parseMouseMoveDelta],
  ['mouse_move', parseMouseMove],
  ['mouse_down', parseMouseDown],
  ['mouse_up', parseMouseUp],
  ['click', parseClick],
  ['scroll', parseScroll],
  ['key', parseKey],
  ['text', parseText],
  ['navigate', parseNavigate],
  ['shortcut', parseShortcut],
  ['volume_set', parseVolumeSet],
  ['volume_adjust', parseVolumeAdjust],
  ['volume_mute_toggle', parseVolumeMuteToggle],
  ['system_sleep', parseSystemSleep],
  ['system_shutdown', parseSystemShutdown],
  ['cursor_visibility', parseCursorVisibility],
  ['input_mode', parseInputMode],
  ['elevation_request', parseElevationRequest],
]);

export const parseControlMessage = (rawValue: string): ControlMessage | null => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const payload = parsed as Record<string, unknown>;
  const type = payload.type;

  if (!isString(type)) {
    return null;
  }

  if (type === 'auth') {
    const pairCode = isString(payload.pairCode) ? payload.pairCode : undefined;
    const sessionToken = isString(payload.sessionToken) ? payload.sessionToken : undefined;

    if (!pairCode && !sessionToken) {
      return null;
    }

    return { pairCode, sessionToken, type: 'auth' };
  }

  const parser = jsonParsers.get(type);
  return parser?.(payload) ?? null;
};

export const parseBinaryMessage = (data: Buffer): Exclude<ControlMessage, { type: 'auth' }> | null => {
  if (data.length < 1) {
    return null;
  }

  const tag = data[0];

  switch (tag) {
    case BINARY_TAG.MOUSE_MOVE_DELTA: {
      if (data.length < 9) return null;
      const dx = data.readFloatLE(1);
      const dy = data.readFloatLE(5);
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
      return { type: 'mouse_move_delta', dx, dy };
    }
    case BINARY_TAG.MOUSE_MOVE: {
      if (data.length < 9) return null;
      const x = data.readFloatLE(1);
      const y = data.readFloatLE(5);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { type: 'mouse_move', x, y };
    }
    case BINARY_TAG.MOUSE_DOWN: {
      if (data.length < 10) return null;
      const button = BUTTON_NAMES[data[1]];
      if (!button) return null;
      const x = data.readFloatLE(2);
      const y = data.readFloatLE(6);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { type: 'mouse_down', button, x, y };
    }
    case BINARY_TAG.MOUSE_UP: {
      if (data.length < 10) return null;
      const button = BUTTON_NAMES[data[1]];
      if (!button) return null;
      const x = data.readFloatLE(2);
      const y = data.readFloatLE(6);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { type: 'mouse_up', button, x, y };
    }
    case BINARY_TAG.SCROLL: {
      if (data.length < 5) return null;
      const deltaY = data.readFloatLE(1);
      if (!Number.isFinite(deltaY)) return null;
      return { type: 'scroll', deltaY };
    }
    case BINARY_TAG.CLICK: {
      if (data.length < 10) return null;
      const button = BUTTON_NAMES[data[1]];
      if (!button) return null;
      const x = data.readFloatLE(2);
      const y = data.readFloatLE(6);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { type: 'click', button, x, y };
    }
    default:
      return null;
  }
};
