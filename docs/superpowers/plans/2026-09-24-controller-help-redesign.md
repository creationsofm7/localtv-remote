# Controller Help Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-lite:subagent-driven-development (recommended) or superpowers-lite:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the passive centered brand label with an accessible animated gesture tutorial, add adaptive PWA installation help, and make the controller's geometry and volume slider visually coherent.

**Architecture:** Add a small browser/Node-compatible help model for deterministic platform and carousel decisions, then let the existing dependency-free controller script own dialog state, swipe input, and install prompting. Keep artwork inline as semantic SVG in the existing page and build the visual system in the existing stylesheet so the PWA remains self-contained.

**Tech Stack:** HTML, inline SVG, CSS, vanilla JavaScript, Node's built-in test runner.

## Global Constraints

- Use no UI framework or runtime dependency.
- Use 12px compact-control, 18px grouped-surface, and 24px feature-surface radii; circles remain reserved for icon buttons, dots, and the volume knob.
- Use transform and opacity for animated movement, `cubic-bezier(0.23, 1, 0.32, 1)` for entrance/exit, and `cubic-bezier(0.77, 0, 0.175, 1)` for on-screen card movement.
- Respect `prefers-reduced-motion` and keep tutorial instructions legible without animation.
- Preserve every existing pointer, click, drag, scroll, navigation, keyboard, media, power, and volume message.
- Use feature detection for PWA installation; never open an install prompt without a user action.
- Do not copy code or artwork from the reference fork.
- Run exactly one final end-to-end verification after implementation; targeted TDD checks are not end-to-end verification.

## Visual Plan

- **Color:** Ink `#111318`, panel `#1A1D24`, raised `#252A33`, line `#343A45`, text `#F4F6F8`, signal `#56D6CF`.
- **Type:** Keep Plus Jakarta Sans and the system fallback; use sentence case and remove decorative uppercase where it does not encode a section.
- **Layout:** Reserve the visual center for Help, give the trackpad the largest uninterrupted area, and compress mouse tools into one segmented row.
- **Principle:** The controller is quiet hardware; the animated hand lesson is the single expressive surface.

```text
┌ mute ───────── Help ───── settings power ┐
│ ┌──────────────────────────────────────┐ │
│ │              trackpad                │ │
│ └──────────────────────────────────────┘ │
│ [ Hold ] [ Right ] [ Middle ] [ Capture ]│
│ [  Back  ] [  Home  ] [  Play/Pause  ]  │
│  vol  ━━━━━━━━━●━━━━━━━━━━━━━━━━  46      │
└───────────────────────────────────────────┘

                 Help opened
┌───────────────────────────────────────────┐
│                backdrop                   │
│ ┌───────────────────────────────────────┐ │
│ │ How to use the trackpad           ×   │ │
│ │      angled animated hand SVG         │ │
│ │ Move the pointer                       │ │
│ │ Glide one finger anywhere...           │ │
│ │       ● ○ ○ ○        Back   Next       │ │
│ └───────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

Self-review against the brief: the palette and card sheet avoid the generic gradient-card kit; sequencing is structurally justified because the help is an ordered lesson; animation is concentrated in the tutorial and removed from high-frequency controls.

---

### Task 1: Testable Tutorial and Install Model

**Files:**
- Create: `public/control/help.js`
- Create: `tests/controller-help.test.cjs`
- Modify: `public/control/sw.js`

**Interfaces:**
- Produces: `LocalTVHelp.detectInstallPlatform(environment)`, `LocalTVHelp.getInstallGuidance(platform, options)`, `LocalTVHelp.resolveSwipeIndex(input)`.
- `environment`: `{ userAgent: string, platform: string, maxTouchPoints: number }`.
- `options`: `{ canPrompt: boolean, isStandalone: boolean }`.
- `input`: `{ current: number, count: number, deltaX: number, width: number }`.

- [ ] **Step 1: Write failing tests for iOS/iPadOS detection, Android detection, standalone/prompt guidance, and clamped swipe thresholds.**

```js
test('detects touch-capable iPadOS desktop user agents as iOS', () => {
  assert.equal(help.detectInstallPlatform({
    userAgent: 'Mozilla/5.0 (Macintosh)',
    platform: 'MacIntel',
    maxTouchPoints: 5,
  }), 'ios');
});

test('moves one tutorial card only after a meaningful swipe', () => {
  assert.equal(help.resolveSwipeIndex({ current: 1, count: 4, deltaX: -80, width: 320 }), 2);
  assert.equal(help.resolveSwipeIndex({ current: 1, count: 4, deltaX: -20, width: 320 }), 1);
});
```

- [ ] **Step 2: Run `node --test tests/controller-help.test.cjs` and confirm it fails because `public/control/help.js` does not exist.**
- [ ] **Step 3: Implement the three pure functions in a browser/Node UMD wrapper with no DOM access.**
- [ ] **Step 4: Run `node --test tests/controller-help.test.cjs` and confirm all model tests pass.**
- [ ] **Step 5: Add `/help.js` to service-worker precaching and bump the cache key to `localtv-remote-v5`.**

### Task 2: Accessible Animated Help Sheet

**Files:**
- Modify: `public/control/index.html`
- Modify: `public/control/controller.js`
- Modify: `public/control/controller.css`
- Modify: `tests/controller-help.test.cjs`

**Interfaces:**
- Consumes: the `window.LocalTVHelp` API from Task 1.
- Produces: native dialog controls `help-open`, `help-dialog`, `help-close`, `help-prev`, `help-next`, `help-install`, and platform buttons carrying `data-help-platform`.

- [ ] **Step 1: Add failing source-contract tests for a centered Help trigger, native modal dialog, four tutorial cards, inline gesture SVGs, platform switch controls, install action, Escape/backdrop behavior hooks, and reduced-motion CSS.**
- [ ] **Step 2: Run the targeted help test and confirm the new source-contract tests fail for missing markup and handlers.**
- [ ] **Step 3: Replace the centered LocalTV badge with the Help trigger and add the native `<dialog>` bottom sheet with four inline SVG lesson cards.**
- [ ] **Step 4: Load `/help.js` before `/controller.js`; implement dialog open/close, focus restoration, Back/Next/dots/keyboard navigation, pointer swipe, platform selection, `beforeinstallprompt`, and installed-state handling.**
- [ ] **Step 5: Style the dialog, carousel, slanted finger artwork, platform instructions, and explanatory animations using only transform/opacity movement and static reduced-motion states.**
- [ ] **Step 6: Run the targeted help test and confirm all tutorial behavior contracts pass.**

### Task 3: Controller Geometry and Volume Refinement

**Files:**
- Modify: `public/control/index.html`
- Modify: `public/control/controller.js`
- Modify: `public/control/controller.css`
- Modify: `tests/controller-help.test.cjs`

**Interfaces:**
- Preserves the existing IDs consumed by controller behavior and adds `volume-thumb` as a presentational descendant of `volume-fill`.

- [ ] **Step 1: Add failing source-contract tests for the three-radius token hierarchy, single-row tool group, absent centered `header__device-name`, and a visible volume thumb.**
- [ ] **Step 2: Run the targeted help test and confirm the visual-contract assertions fail.**
- [ ] **Step 3: Apply the approved palette and radius tokens, true three-column header centering, hardware-like trackpad surface, compact tool group, consistent control states, and a visible volume thumb with a generous hit area.**
- [ ] **Step 4: Update tool labels without changing their IDs or message behavior and make coarse-pointer layouts hide only pointer-lock capture.**
- [ ] **Step 5: Run the targeted help test and confirm the visual contracts pass.**

### Task 4: Single Integrated Verification

**Files:**
- Verify: `public/control/index.html`
- Verify: `public/control/help.js`
- Verify: `public/control/controller.js`
- Verify: `public/control/controller.css`
- Verify: `public/control/sw.js`
- Verify: `tests/controller-help.test.cjs`

**Interfaces:**
- Consumes all completed tasks and produces final evidence only; no source edits unless verification reveals a defect.

- [ ] **Step 1: Build and run the complete automated suite once with `npm test`; expected result is TypeScript build success and every Node test passing.**
- [ ] **Step 2: Launch the local controller once and exercise one end-to-end browser path at a 390×844 mobile viewport: open Help, navigate/swipe all four cards, switch install platforms, close with Escape, move/click/right-click/scroll on the trackpad, and drag the volume knob.**
- [ ] **Step 3: Inspect one final mobile screenshot for centered Help, unclipped tutorial artwork/copy, consistent rounding, and aligned volume thumb.**

