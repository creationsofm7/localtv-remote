const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  isBrowserNavigationShortcut,
  resolveShortcutKey,
} = require('../dist/core/main/input/shortcut-keys.js');
const { SystemInputRouter } = require('../dist/daemon/system-input-router.js');

const expectedMediaKeys = {
  play_pause: 'MediaPlayPause',
  seek_back: 'j',
  seek_forward: 'l',
  fullscreen: 'f',
  mute: 'm',
  captions: 'c',
  speed_up: '>',
  speed_down: '<',
};

test('resolves every media command through the keyboard registry', () => {
  for (const [action, key] of Object.entries(expectedMediaKeys)) {
    assert.equal(resolveShortcutKey(action), key);
    assert.equal(isBrowserNavigationShortcut(action), false);
  }
});

test('keeps browser navigation outside the keyboard registry', () => {
  for (const action of ['go_home', 'go_back', 'go_forward', 'reload']) {
    assert.equal(resolveShortcutKey(action), null);
    assert.equal(isBrowserNavigationShortcut(action), true);
  }
});

test('injects the registered key once for a semantic media command', async () => {
  const injectedKeys = [];
  const backend = {
    available: true,
    injectKeyPress: (key) => injectedKeys.push(key),
  };
  const volume = {
    getState: () => ({ available: false, level: 0, muted: false }),
  };
  const router = new SystemInputRouter(backend, volume);

  await router.route({ type: 'shortcut', action: 'play_pause' });

  assert.deepEqual(injectedKeys, ['MediaPlayPause']);
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
