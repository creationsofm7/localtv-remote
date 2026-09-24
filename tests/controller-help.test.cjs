const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const modelPath = path.join(__dirname, '..', 'public', 'control', 'help.js');
let help = {};
try {
  help = require(modelPath);
} catch {
  // The first TDD run intentionally reaches this branch before help.js exists.
}

test('detects iPhone and touch-capable iPadOS desktop user agents as iOS', () => {
  assert.equal(typeof help.detectInstallPlatform, 'function');
  assert.equal(help.detectInstallPlatform({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    platform: 'iPhone',
    maxTouchPoints: 5,
  }), 'ios');
  assert.equal(help.detectInstallPlatform({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    platform: 'MacIntel',
    maxTouchPoints: 5,
  }), 'ios');
});

test('detects Android separately and leaves desktop browsers as other', () => {
  assert.equal(help.detectInstallPlatform({
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9)',
    platform: 'Linux armv8l',
    maxTouchPoints: 5,
  }), 'android');
  assert.equal(help.detectInstallPlatform({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    platform: 'Win32',
    maxTouchPoints: 0,
  }), 'other');
});

test('returns installed, native prompt, and manual platform guidance', () => {
  assert.deepEqual(
    help.getInstallGuidance('android', { canPrompt: false, isStandalone: true }),
    { mode: 'installed', primaryAction: null },
  );
  assert.deepEqual(
    help.getInstallGuidance('android', { canPrompt: true, isStandalone: false }),
    { mode: 'prompt', primaryAction: 'install' },
  );
  assert.equal(
    help.getInstallGuidance('android', { canPrompt: false, isStandalone: false }).mode,
    'android-manual',
  );
  assert.equal(
    help.getInstallGuidance('ios', { canPrompt: false, isStandalone: false }).mode,
    'ios-manual',
  );
});

test('moves one tutorial card only after a meaningful swipe and clamps the ends', () => {
  assert.equal(help.resolveSwipeIndex({ current: 1, count: 4, deltaX: -80, width: 320 }), 2);
  assert.equal(help.resolveSwipeIndex({ current: 1, count: 4, deltaX: -20, width: 320 }), 1);
  assert.equal(help.resolveSwipeIndex({ current: 0, count: 4, deltaX: 100, width: 320 }), 0);
  assert.equal(help.resolveSwipeIndex({ current: 3, count: 4, deltaX: -100, width: 320 }), 3);
});

test('ships a native four-card help dialog with gesture artwork and install controls', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'control', 'index.html'), 'utf8');
  const cards = html.match(/<article class="help-card"/g) || [];
  const gestureSvgs = html.match(/class="gesture-svg"/g) || [];

  assert.doesNotMatch(html, /header__device-name[^>]*>\s*LocalTV\s*</);
  assert.match(html, /id="help-open"[^>]*aria-haspopup="dialog"/);
  assert.match(html, /<dialog[^>]*id="help-dialog"[^>]*aria-modal="true"/);
  assert.equal(cards.length, 4);
  assert.equal(gestureSvgs.length, 4);
  assert.match(html, /data-help-platform="ios"/);
  assert.match(html, /data-help-platform="android"/);
  assert.match(html, /id="help-install"/);
  assert.match(html, />Add to Home Screen</);
  assert.match(html, /src="\/help\.js"/);
});

test('wires dialog lifecycle, swipe navigation, adaptive installation, and reduced motion', () => {
  const script = fs.readFileSync(path.join(__dirname, '..', 'public', 'control', 'controller.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'control', 'controller.css'), 'utf8');

  assert.match(script, /helpDialog\.showModal\(\)/);
  assert.match(script, /helpDialog\.addEventListener\('cancel'/);
  assert.match(script, /beforeinstallprompt/);
  assert.match(script, /deferredInstallPrompt\.prompt\(\)/);
  assert.match(script, /helpViewport\?\.addEventListener\('pointerdown'/);
  assert.match(script, /resolveSwipeIndex/);
  assert.match(css, /\.help-sheet[\s\S]*cubic-bezier\(0\.23, 1, 0\.32, 1\)/);
  assert.match(css, /\.gesture-hand/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.gesture-hand/);
});

test('uses one radius hierarchy, a compact tool row, and a visible volume thumb', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'control', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'control', 'controller.css'), 'utf8');

  assert.match(css, /--radius-control:\s*12px/);
  assert.match(css, /--radius-surface:\s*18px/);
  assert.match(css, /--radius-feature:\s*24px/);
  assert.doesNotMatch(css, /--radius-(?:sm|md|lg|xl):/);
  assert.match(css, /\.trackpad-tools\s*{[^}]*display:\s*grid;[^}]*grid-template-columns:/s);
  assert.match(html, /id="btn-left-drag"[^>]*>Hold<\/button>/);
  assert.match(html, /id="btn-lock"[^>]*>Capture<\/button>/);
  assert.match(html, /<span class="vol-thumb" id="volume-thumb" aria-hidden="true"><\/span>/);
  assert.match(css, /\.vol-thumb\s*{[^}]*border-radius:\s*50%;/s);
  assert.match(css, /grid-template-columns:\s*88px minmax\(0, 1fr\) 88px/);
});

test('keeps carousel gestures, focus, short screens, and reduced motion safe', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'control', 'index.html'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '..', 'public', 'control', 'controller.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'control', 'controller.css'), 'utf8');

  assert.match(html, /id="help-step"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(script, /closest\?\.\('button, input, select, textarea, a\[href\]'\)/);
  assert.match(script, /startY:\s*event\.clientY/);
  assert.match(script, /helpSwipe\.axis\s*=\s*Math\.abs\(deltaX\)\s*>\s*Math\.abs\(deltaY\)/);
  assert.match(script, /edgeResistance/);
  assert.match(css, /\.help-sheet\s*{[^}]*overflow-y:\s*auto;/s);
  assert.match(css, /\.help-dots button\s*{[^}]*width:\s*24px;[^}]*height:\s*24px;/s);
  assert.doesNotMatch(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.gesture-contact[^}]*transform:\s*none/);
  assert.doesNotMatch(css, /@keyframes proSheen|animation:\s*proSheen/);
  assert.doesNotMatch(css, /animation:\s*fadeUp/);
  assert.match(html, /gesture-object--start" x="107"/);
  assert.match(css, /translateX\(111px\)/);
});
