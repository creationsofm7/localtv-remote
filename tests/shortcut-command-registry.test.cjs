const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  resolveShortcutCommand,
} = require('../dist/core/main/input/shortcut-keys.js');
const { SystemInputRouter } = require('../dist/daemon/system-input-router.js');
const { resolveNativeMixer } = require('../dist/core/main/audio/volume-controller.js');

const expectedMediaCommands = {
  play_pause: { key: 'MediaPlayPause' },
  seek_back: { key: 'KeyJ' },
  seek_forward: { key: 'KeyL' },
  fullscreen: { key: 'KeyF' },
  mute: { key: 'KeyM' },
  captions: { key: 'KeyC' },
  speed_up: { key: 'Period', modifiers: { shift: true } },
  speed_down: { key: 'Comma', modifiers: { shift: true } },
};

test('resolves every media command to a physical keyboard command', () => {
  for (const [action, command] of Object.entries(expectedMediaCommands)) {
    assert.deepEqual(resolveShortcutCommand(action), command);
  }
});

test('preserves browser navigation as registered semantic commands', () => {
  assert.deepEqual(resolveShortcutCommand('go_home'), { key: 'BrowserHome' });
  assert.deepEqual(resolveShortcutCommand('go_back'), { key: 'BrowserBack' });
  assert.deepEqual(resolveShortcutCommand('go_forward'), { key: 'BrowserForward' });
  assert.deepEqual(resolveShortcutCommand('reload'), { key: 'BrowserRefresh' });
});

test('injects the registered key once for a semantic media command', async () => {
  const injectedKeys = [];
  const backend = {
    available: true,
    injectKeyPress: (key, modifiers) => injectedKeys.push({ key, modifiers }),
  };
  const volume = {
    getState: () => ({ available: false, level: 0, muted: false }),
  };
  const router = new SystemInputRouter(backend, volume);

  await router.route({ type: 'shortcut', action: 'speed_up' });

  assert.deepEqual(injectedKeys, [
    { key: 'Period', modifiers: { shift: true } },
  ]);
});

test('controller sends shortcut actions without a duplicate key map', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../public/control/controller.js'),
    'utf8',
  );

  assert.doesNotMatch(source, /REMOTE_SHORTCUT_KEY_MAP/);
  assert.match(
    source,
    /const sendRemoteAction = \(action\) => \{\s*sendMessage\(\{ action, type: 'shortcut' \}\);\s*\};/,
  );
});

test('service worker invalidates the controller help and volume cache', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../public/control/sw.js'),
    'utf8',
  );

  assert.match(source, /CACHE_VERSION = 'localtv-remote-v5'/);
  assert.match(source, /'\/help\.js'/);
});

test('Win32 injector registers the MediaPlayPause virtual key', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/core/main/native/win32/input-injector.ts'),
    'utf8',
  );

  assert.match(source, /MediaPlayPause:\s*0xb3/i);
  assert.match(source, /KeyJ:\s*0x4a/i);
  assert.match(source, /KeyL:\s*0x4c/i);
  assert.match(source, /KeyF:\s*0x46/i);
  assert.match(source, /KeyM:\s*0x4d/i);
  assert.match(source, /KeyC:\s*0x43/i);
  assert.match(source, /Comma:\s*0xbc/i);
  assert.match(source, /Period:\s*0xbe/i);
  assert.match(source, /EXTENDED_VK[\s\S]*0xb3/i);
});

test('unwraps the node-audio-volume-mixer package export', () => {
  const mixer = {
    getMasterVolumeLevelScalar() {},
    isMasterMuted() {},
    muteMaster() {},
    setMasterVolumeLevelScalar() {},
  };

  assert.equal(resolveNativeMixer({ NodeAudioVolumeMixer: mixer }), mixer);
  assert.equal(resolveNativeMixer(mixer), mixer);
  assert.equal(resolveNativeMixer({}), null);
});
