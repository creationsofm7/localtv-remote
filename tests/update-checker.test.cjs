const assert = require('node:assert/strict');
const test = require('node:test');

let updates = {};
try {
  updates = require('../dist/daemon/update-checker.js');
} catch {
  // Red phase: the update checker does not exist yet.
}

test('recognizes only a newer LocalTV version in winget upgrade listings', () => {
  const output = [
    'Name           Id             Version Available Source',
    '------------------------------------------------------',
    'LocalTV Remote LocalTV.Remote 1.1.3   1.1.5     winget',
    'Other App      Other.App      2.0     9.0       winget',
  ].join('\r\n');

  assert.equal(updates.parseAvailableVersion(output, '1.1.4'), '1.1.5');
  assert.equal(updates.parseAvailableVersion(output, '1.1.5'), null);
  assert.equal(updates.parseAvailableVersion(output, '1.2.0'), null);
});

test('ignores no-match, malformed, and unrelated winget output', () => {
  assert.equal(updates.parseAvailableVersion('No installed package found matching input criteria.', '1.1.4'), null);
  assert.equal(updates.parseAvailableVersion('Other App Other.App 1.0 2.0 winget', '1.1.4'), null);
  assert.equal(updates.parseAvailableVersion('LocalTV Remote LocalTV.Remote Unknown Unknown winget', '1.1.4'), null);
});

test('compares numeric version components rather than strings', () => {
  assert.equal(updates.isNewerVersion('1.1.10', '1.1.9'), true);
  assert.equal(updates.isNewerVersion('1.1.4', '1.1.4'), false);
  assert.equal(updates.isNewerVersion('1.1.3', '1.1.4'), false);
  assert.equal(updates.isNewerVersion('unknown', '1.1.4'), false);
});
