const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

test('uses 6776 as the default control-server port everywhere', () => {
  const constants = read('src/daemon/constants.ts');
  const server = read('src/core/main/control/remote-control-server.ts');
  const volumeScript = read('scripts/test-volume.js');
  const injectScript = read('scripts/test-inject.js');
  const readme = read('README.md');

  assert.match(constants, /LOCALTV_REMOTE_PORT\) \|\| 6776/);
  assert.match(server, /const DEFAULT_PORT = 6776/);
  assert.match(volumeScript, /Number\(portArg\) \|\| 6776/);
  assert.match(injectScript, /Number\(portArg\) \|\| 6776/);
  assert.doesNotMatch(readme, /3000/);
  assert.match(readme, /6776/);
});
