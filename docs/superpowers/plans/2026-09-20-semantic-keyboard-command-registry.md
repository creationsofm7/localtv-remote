# Semantic Keyboard Command Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-lite:subagent-driven-development (recommended) or superpowers-lite:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route remote-mode media controls as semantic shortcut commands through one typed backend registry of real keyboard keys.

**Architecture:** The phone controller always emits semantic `shortcut` messages. `shortcut-keys.ts` becomes the single command-to-key registry, and `SystemInputRouter` resolves registered media commands before injecting one keypress. Browser navigation retains its current semantic routing behavior, while Win32 gains support for the `MediaPlayPause` virtual key.

**Tech Stack:** TypeScript 5, browser JavaScript, Node.js built-in test runner, Win32 `SendInput` through koffi

## Global Constraints

- Scope is remote mode media controls only.
- Keep browser navigation behavior for `go_home`, `go_back`, `go_forward`, and `reload` unchanged.
- Do not add per-site shortcut profiles or user-configurable bindings.
- Use `MediaPlayPause` for `play_pause`.
- Keep invalid or unmapped commands as no-ops.

## File Structure

- Modify `src/core/main/input/shortcut-keys.ts`: own the typed media command registry and its resolver.
- Modify `src/daemon/system-input-router.ts`: consume the registry resolver and inject the resulting key.
- Modify `src/core/main/native/win32/input-injector.ts`: register the Windows `MediaPlayPause` virtual key.
- Modify `public/control/controller.js`: remove client-side key mapping and always send semantic shortcut messages.
- Modify `package.json`: expose the Node test command.
- Create `tests/shortcut-command-registry.test.cjs`: test command resolution, router injection, and controller protocol behavior.

---

### Task 1: Central media command registry

**Files:**
- Create: `tests/shortcut-command-registry.test.cjs`
- Modify: `package.json:11-20`
- Modify: `src/core/main/input/shortcut-keys.ts:1-38`
- Modify: `src/daemon/system-input-router.ts:1-103`

**Interfaces:**
- Consumes: `ShortcutAction` from `src/core/shared/control.ts`.
- Produces: `isBrowserNavigationShortcut(action: ShortcutAction): boolean` and `resolveShortcutKey(action: ShortcutAction): string | null`.

- [ ] **Step 1: Add the test command and failing registry/router tests**

Add this script to `package.json`:

```json
"test": "npm run build && node --test tests/*.test.cjs"
```

Create `tests/shortcut-command-registry.test.cjs` with registry and routing coverage:

```js
const assert = require('node:assert/strict');
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
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`

Expected: build succeeds, then the test process fails because `resolveShortcutKey` and `isBrowserNavigationShortcut` are not exported.

- [ ] **Step 3: Replace the switch with an exhaustive typed registry**

Replace `src/core/main/input/shortcut-keys.ts` with:

```ts
import type { ShortcutAction } from '../../shared/control';

type BrowserNavigationShortcut = 'go_home' | 'go_back' | 'go_forward' | 'reload';
type MediaShortcut = Exclude<ShortcutAction, BrowserNavigationShortcut>;

const BROWSER_NAVIGATION_SHORTCUTS: ReadonlySet<ShortcutAction> = new Set([
  'go_home',
  'go_back',
  'go_forward',
  'reload',
]);

const MEDIA_SHORTCUT_KEYS: Readonly<Record<MediaShortcut, string>> = {
  play_pause: 'MediaPlayPause',
  seek_back: 'j',
  seek_forward: 'l',
  fullscreen: 'f',
  mute: 'm',
  captions: 'c',
  speed_up: '>',
  speed_down: '<',
};

export const isBrowserNavigationShortcut = (action: ShortcutAction): boolean =>
  BROWSER_NAVIGATION_SHORTCUTS.has(action);

export const resolveShortcutKey = (action: ShortcutAction): string | null =>
  isBrowserNavigationShortcut(action) ? null : MEDIA_SHORTCUT_KEYS[action as MediaShortcut];
```

The `Record<MediaShortcut, string>` ensures a newly added media action causes a compile error until it receives a real key registration.

- [ ] **Step 4: Route semantic shortcuts through the resolver**

In `src/daemon/system-input-router.ts`, replace the shortcut helper import with:

```ts
import { resolveShortcutKey } from '../core/main/input/shortcut-keys';
```

Replace `routeShortcut` with:

```ts
private routeShortcut(action: ShortcutAction): void {
  const key = resolveShortcutKey(action);
  if (key) {
    this.backend.injectKeyPress(key);
  }
}
```

This preserves browser navigation as a no-op in the headless system router while making all media actions use the central registry.

- [ ] **Step 5: Run tests and verify the registry behavior passes**

Run: `npm test`

Expected: all three tests pass.

- [ ] **Step 6: Commit the registry and router change**

```bash
git add package.json tests/shortcut-command-registry.test.cjs src/core/main/input/shortcut-keys.ts src/daemon/system-input-router.ts
git commit -m "refactor: centralize semantic media key commands"
```

---

### Task 2: Semantic controller messages

**Files:**
- Modify: `tests/shortcut-command-registry.test.cjs`
- Modify: `public/control/controller.js:182-195,324-333`

**Interfaces:**
- Consumes: existing WebSocket `ShortcutMessage` shape `{ type: 'shortcut', action: ShortcutAction }`.
- Produces: `sendRemoteAction(action)` that sends only semantic shortcut messages.

- [ ] **Step 1: Add a failing source-level protocol regression test**

Append to `tests/shortcut-command-registry.test.cjs`:

```js
const fs = require('node:fs');
const path = require('node:path');

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
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm test`

Expected: the controller regression test fails because `REMOTE_SHORTCUT_KEY_MAP` still exists.

- [ ] **Step 3: Remove client-side key resolution**

Delete `REMOTE_SHORTCUT_KEY_MAP` from `public/control/controller.js`, then replace `sendRemoteAction` with:

```js
const sendRemoteAction = (action) => {
  sendMessage({ action, type: 'shortcut' });
};
```

Do not alter the existing `data-shortcut` button listeners or direct `data-key` keyboard buttons.

- [ ] **Step 4: Run tests and verify semantic protocol behavior**

Run: `npm test`

Expected: all four tests pass.

- [ ] **Step 5: Commit the controller cleanup**

```bash
git add public/control/controller.js tests/shortcut-command-registry.test.cjs
git commit -m "refactor: send semantic media commands from controller"
```

---

### Task 3: Win32 hardware media-key support

**Files:**
- Modify: `src/core/main/native/win32/input-injector.ts:51-90`
- Modify: `tests/shortcut-command-registry.test.cjs`

**Interfaces:**
- Consumes: registered key name `MediaPlayPause` from `resolveShortcutKey('play_pause')`.
- Produces: Win32 virtual-key mapping `MediaPlayPause: 0xb3` used by existing `sendKeyDown` and `sendKeyUp` functions.

- [ ] **Step 1: Add a failing Win32 registration regression test**

Append to `tests/shortcut-command-registry.test.cjs`:

```js
test('Win32 injector registers the MediaPlayPause virtual key', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/core/main/native/win32/input-injector.ts'),
    'utf8',
  );

  assert.match(source, /MediaPlayPause:\s*0xb3/i);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test`

Expected: the Win32 registration test fails because `MediaPlayPause` is absent from `VK_MAP`.

- [ ] **Step 3: Register the Windows virtual key**

Add this entry to `VK_MAP` in `src/core/main/native/win32/input-injector.ts`:

```ts
MediaPlayPause: 0xb3,
```

The existing named-key branch in `sendKeyDown` and `sendKeyUp` will resolve and inject this virtual key without additional special handling.

- [ ] **Step 4: Run complete verification**

Run: `npm test`

Expected: all five tests pass and the TypeScript build succeeds.

Run: `npm run typecheck`

Expected: exits with code 0 and no diagnostics.

Run: `git diff --check`

Expected: exits with code 0 and no whitespace errors.

- [ ] **Step 5: Commit Win32 support**

```bash
git add src/core/main/native/win32/input-injector.ts tests/shortcut-command-registry.test.cjs
git commit -m "feat: support play pause media key injection"
```
