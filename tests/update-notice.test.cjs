const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('places an accessible, dismissible PC update notice only on the phone remote', () => {
  const html = read('public/control/index.html');
  const remoteStart = html.indexOf('id="remote-screen"');
  const notice = html.indexOf('id="update-notice"');
  const help = html.indexOf('id="help-dialog"');

  assert.ok(remoteStart >= 0 && remoteStart < notice && notice < help);
  assert.match(html, /id="update-notice"[^>]*hidden[^>]*aria-live="polite"/);
  assert.match(html, /id="update-version"/);
  assert.match(html, /id="update-dismiss"/);
  assert.match(html, /winget upgrade --id LocalTV\.Remote --exact/);
});

test('sends update state only over authenticated phone sessions', () => {
  const server = read('src/core/main/control/remote-control-server.ts');
  const controller = read('public/control/controller.js');

  assert.match(server, /setAvailableUpdateVersion\(/);
  assert.match(server, /type: 'update_available'/);
  assert.match(controller, /payload\.type === 'update_available'/);
  assert.match(controller, /update-dismiss/);
});

test('includes update state when an authenticated phone repeats auth', () => {
  const server = read('src/core/main/control/remote-control-server.ts');
  const repeatAuth = server.match(/if \(message\.type === 'auth'\) \{([\s\S]*?)return;/);
  assert.ok(repeatAuth);
  assert.match(repeatAuth[1], /availableUpdateVersion: this\.availableUpdateVersion/);
});

test('keeps notice handling usable when phone storage is unavailable', () => {
  const controller = read('public/control/controller.js');
  assert.match(controller, /const getDismissedUpdate = \(\) => \{[\s\S]*?try \{/);
  assert.match(controller, /const rememberDismissedUpdate = \(version\) => \{[\s\S]*?try \{/);
});
