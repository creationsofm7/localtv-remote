# Controller Input Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-lite:subagent-driven-development (recommended) or superpowers-lite:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe desktop/touch mouse controls and direct volume-track dragging to the existing controller PWA without copying or merging the contributor fork.

**Architecture:** Extend the current event-driven controller in place, reusing its existing WebSocket protocol, delta batching, tap threshold, and volume debounce. Test the real browser script through a dependency-free Node `vm` harness that supplies the DOM and WebSocket surfaces used by the controller, then add only the markup and CSS needed by the new controls.

**Tech Stack:** Browser JavaScript, HTML, CSS, Service Worker API, Node.js `node:test`, `node:vm`

## Global Constraints

- Add only controller features and fixes; do not add fork branding, release automation, installer changes, or a package-version bump.
- Do not cherry-pick or copy the fork implementation.
- Preserve the existing touch gestures, volume buttons, pointer-speed behavior, keyboard input, and reconnect flow.
- Reuse `MOUSE_DOWN`, `MOUSE_UP`, `CLICK`, and `volume_set`; do not change server or native-input code.
- Release any host-side left-button state when input is cancelled, the socket closes, or the page exits.
- Do not stage or edit the user's existing network-selection changes.
- Run exactly one final end-to-end verification command: `npm test`.

---

## File Structure

- Create `tests/controller-input.test.cjs`: dependency-free browser harness and behavioral regression tests for the real controller script.
- Modify `public/control/controller.js`: input state, pointer lock, mouse-button frames, drag lifecycle, sticky-left cleanup, and volume-track events.
- Modify `public/control/index.html`: accessible controller tool buttons and volume-track semantics.
- Modify `public/control/controller.css`: compact tool layout, active states, and coarse-pointer visibility.
- Modify `public/control/sw.js`: cache-key bump for changed PWA assets.
- Modify `tests/shortcut-command-registry.test.cjs`: update the expected cache key.

---

### Task 1: Build the controller behavior harness and desktop controls

**Files:**
- Create: `tests/controller-input.test.cjs`
- Modify: `public/control/index.html:123-127`
- Modify: `public/control/controller.css:339-349,402-444`
- Modify: `public/control/controller.js:129-150,627-662`

**Interfaces:**
- Consumes: existing `BINARY_TAG`, `BUTTON_INDEX`, `sendClick()`, `queueMouseDelta()`, `flashTrackpad()`, and authenticated WebSocket send path.
- Produces: elements `btn-left-drag`, `btn-lock`, `btn-right-click`, and `btn-middle-click`; pointer-lock UI state; right/middle click frames.

- [ ] **Step 1: Add a dependency-free browser harness and failing desktop-control tests**

  Implement `createControllerHarness()` with small fake `EventTarget`, `Element`, `document`, `window`, `localStorage`, and `WebSocket` objects. Seed a session token, evaluate `public/control/controller.js` with `vm.runInNewContext`, deliver `open` and `auth_ok`, and expose helpers that dispatch events and decode sent `ArrayBuffer` frames.

  Add tests with these exact behavioral expectations:

  ```js
  test('desktop right and middle presses emit click frames', () => {
    const app = createControllerHarness();
    app.trackpad.emit('pointerdown', pointer({ button: 2 }));
    app.trackpad.emit('pointerdown', pointer({ button: 1 }));
    assert.deepEqual(app.binaryTagsAndButtons(), [[0x06, 2], [0x06, 1]]);
  });

  test('pointer lock uses relative movement and never captures the pointer', () => {
    const app = createControllerHarness();
    app.lockButton.emit('click', event());
    assert.equal(app.document.pointerLockElement, app.trackpad);
    app.trackpad.emit('pointerdown', pointer({ button: 0 }));
    assert.equal(app.trackpad.pointerCaptureCalls, 0);
    app.trackpad.emit('mousemove', event({ movementX: 20, movementY: -10 }));
    app.flushAnimationFrames();
    assert.equal(app.binaryFrames().at(-1).getUint8(0), 0x01);
  });
  ```

- [ ] **Step 2: Delegate the focused test command and verify RED**

  Run: `node --test tests/controller-input.test.cjs`

  Expected: FAIL because the tool elements and pointer-lock/right/middle handlers do not exist.

- [ ] **Step 3: Add accessible tool markup and responsive styling**

  Add a `.trackpad-tools` row above `#trackpad` containing four `button.trackpad-tool` elements. Each toggle gets `aria-pressed="false"`; each click button gets an explicit `aria-label`. Make `.trackpad-wrap` a column flex container, give the trackpad `min-height: 0`, style `.trackpad-tool--active` with `var(--accent)`, and hide only `#btn-lock` inside `@media (hover: none) and (pointer: coarse)`.

- [ ] **Step 4: Implement desktop pointer lock and right/middle click**

  Add DOM references for the four buttons. In the trackpad `pointerdown` handler:

  ```js
  if (e.button === 2 || e.button === 1) {
    e.preventDefault();
    sendClick(e.button === 2 ? 'right' : 'middle');
    flashTrackpad();
    return;
  }
  if (e.button !== 0) return;
  if (document.pointerLockElement !== trackpad) {
    try { trackpad.setPointerCapture(e.pointerId); } catch { /* non-fatal */ }
  }
  ```

  Prevent the trackpad context menu. Toggle `requestPointerLock()`/`exitPointerLock()`, synchronize button text and `aria-pressed` from `pointerlockchange`, handle `pointerlockerror`, and send normalized `movementX`/`movementY` through `queueMouseDelta()` only while the trackpad owns pointer lock.

- [ ] **Step 5: Delegate the focused test and verify GREEN**

  Run: `node --test tests/controller-input.test.cjs`

  Expected: both desktop-control tests PASS.

- [ ] **Step 6: Commit the task**

  Stage only `tests/controller-input.test.cjs`, `public/control/index.html`, `public/control/controller.css`, and `public/control/controller.js` and commit with `feat: add desktop controller mouse tools`.

---

### Task 2: Add real dragging and fail-safe sticky left hold

**Files:**
- Modify: `tests/controller-input.test.cjs`
- Modify: `public/control/controller.js:184-220,557-662`

**Interfaces:**
- Consumes: `TAP_MOVE_PX`, current normalized pointer coordinates, `sendBinary()`, and `btn-left-drag` from Task 1.
- Produces: `sendMouseButton(isDown, button)`, press/drag state, sticky-left state, and idempotent `releaseLeftButton()` cleanup.

- [ ] **Step 1: Add failing drag and cleanup tests**

  Add tests asserting:

  ```js
  test('movement beyond the threshold wraps deltas in left down and up', () => {
    const app = createControllerHarness();
    app.trackpad.emit('pointerdown', pointer({ button: 0, clientX: 10, clientY: 10 }));
    app.trackpad.emit('pointermove', pointer({ button: 0, clientX: 30, clientY: 10 }));
    app.flushAnimationFrames();
    app.trackpad.emit('pointerup', pointer({ button: 0, clientX: 30, clientY: 10 }));
    assert.deepEqual(app.binaryTags(), [0x03, 0x01, 0x04]);
  });

  test('a stationary press remains a click', () => {
    const app = createControllerHarness();
    app.trackpad.emit('pointerdown', pointer({ button: 0, clientX: 10, clientY: 10 }));
    app.trackpad.emit('pointerup', pointer({ button: 0, clientX: 10, clientY: 10 }));
    assert.deepEqual(app.binaryTags(), [0x06]);
  });

  test('sticky left is released when the socket closes', () => {
    const app = createControllerHarness();
    app.leftDragButton.emit('click', event());
    app.socket.emit('close', event());
    assert.deepEqual(app.binaryTags(), [0x03, 0x04]);
    assert.equal(app.leftDragButton.getAttribute('aria-pressed'), 'false');
  });
  ```

  Include equivalent release assertions for `pointercancel` and `pagehide`, and verify touch tap-click is suppressed while sticky left is active.

- [ ] **Step 2: Delegate the focused test command and verify RED**

  Run: `node --test tests/controller-input.test.cjs`

  Expected: the new drag/sticky tests FAIL because only `CLICK` frames exist.

- [ ] **Step 3: Implement button frames and the press state machine**

  Add one 10-byte button buffer and encode tag, button index, and current normalized coordinates in `sendMouseButton(isDown, button)`. Track `pressActive`, `pressDragActive`, and cumulative movement. Crossing `TAP_MOVE_PX` sends left down exactly once. Pointer release sends up for a drag or click for a stationary press. Pointer cancellation sends up before clearing state.

- [ ] **Step 4: Implement sticky-left state and cleanup**

  Toggle sticky left from `#btn-left-drag`, synchronize its active class, label, and `aria-pressed`, and suppress ordinary one-finger tap clicks while active. Add an idempotent cleanup function that sends a left-up frame before authentication is cleared on WebSocket close and on `pagehide`; use it from pointer cancellation as appropriate. Avoid sending duplicate up frames when neither drag nor sticky hold is active.

- [ ] **Step 5: Delegate the focused test and verify GREEN**

  Run: `node --test tests/controller-input.test.cjs`

  Expected: all desktop, drag, tap, sticky, and cleanup tests PASS.

- [ ] **Step 6: Commit the task**

  Stage only `tests/controller-input.test.cjs` and `public/control/controller.js`; commit with `feat: add safe controller drag handling`.

---

### Task 3: Add direct volume control and invalidate cached assets

**Files:**
- Modify: `tests/controller-input.test.cjs`
- Modify: `tests/shortcut-command-registry.test.cjs`
- Modify: `public/control/index.html:139-146`
- Modify: `public/control/controller.js:385-456`
- Modify: `public/control/controller.css` near `.vol-track`
- Modify: `public/control/sw.js:7`

**Interfaces:**
- Consumes: `updateVolumeUI()`, `pendingVolumeTarget`, `flushVolumeTarget()`, and the current 120 ms `volume_set` debounce.
- Produces: interactive `#volume-track` mapping horizontal pointer positions to integer percentages from 0 through 100.

- [ ] **Step 1: Add failing volume and asset tests**

  Add tests that give the track bounds `{ left: 100, width: 200 }`, then assert pointer positions 50, 150, and 350 clamp to JSON `volume_set` values 0, 25, and 100 after timers flush. Assert `pointercancel` stops subsequent move updates, the track has `role="slider"`, and `aria-valuenow` follows displayed state. Change the service-worker assertion to expect `localtv-remote-v4` before production code is updated.

- [ ] **Step 2: Delegate focused tests and verify RED**

  Run: `node --test tests/controller-input.test.cjs tests/shortcut-command-registry.test.cjs`

  Expected: FAIL because `#volume-track`, slider behavior, and cache version `v4` are absent.

- [ ] **Step 3: Implement the interactive volume track**

  Give the existing track `id="volume-track"`, `role="slider"`, `tabindex="0"`, `aria-valuemin="0"`, `aria-valuemax="100"`, and a current `aria-valuenow`. Map `(clientX - left) / width` to a clamped rounded percent, update local UI immediately, and reuse `pendingVolumeTarget` plus the current timer. Capture the pointer defensively on down; handle move only while dragging; finalize on up; stop on cancel. Add ArrowLeft/ArrowDown and ArrowRight/ArrowUp keyboard adjustment through the existing `adjustVolume()` function.

- [ ] **Step 4: Bump the service-worker cache key**

  Change only `CACHE_VERSION` from `localtv-remote-v3` to `localtv-remote-v4` and update the existing test expectation.

- [ ] **Step 5: Delegate focused tests and verify GREEN**

  Run: `node --test tests/controller-input.test.cjs tests/shortcut-command-registry.test.cjs`

  Expected: all focused tests PASS.

- [ ] **Step 6: Commit the task**

  Stage only the five task files and commit with `feat: add draggable controller volume`.

---

### Task 4: Final verification and review

**Files:**
- Review only; modify files only if verification exposes a defect, then repeat that task's RED/GREEN cycle before the final command.

**Interfaces:**
- Consumes: all completed controller behavior and tests.
- Produces: one evidence-backed completion result.

- [ ] **Step 1: Inspect the final diff for scope and accidental overlap**

  Confirm only the planned controller/test/spec files changed in our commits and the user's pre-existing network-selection files remain unstaged and unmodified by this work.

- [ ] **Step 2: Delegate exactly one end-to-end verification**

  Run: `npm test`

  Expected: TypeScript build succeeds and every `tests/*.test.cjs` test passes with exit code 0.

- [ ] **Step 3: Review browser-specific failure safety**

  Confirm from code and tests that rejected pointer lock, failed pointer capture, pointer cancellation, socket closure, and page exit cannot leave the host left button pressed.

