const assert = require('node:assert/strict');
const test = require('node:test');

const { buildHostHtml } = require('../dist/daemon/host-page.js');

test('host page exposes automatic and manual network selection behind settings', () => {
  const html = buildHostHtml('data:image/png;base64,qr', '123456', 'http://172.20.10.2:6776', {
    addresses: [
      { address: '172.20.10.2', name: 'WiFi' },
      { address: '172.23.64.1', name: 'vEthernet (WSL)' },
    ],
    mode: 'automatic',
    selectedAddress: '172.20.10.2',
  });

  assert.match(html, /aria-label="Network settings"/);
  assert.match(html, /Automatic \(recommended\)/);
  assert.match(html, /WiFi — 172\.20\.10\.2/);
  assert.match(html, /vEthernet \(WSL\) — 172\.23\.64\.1/);
  assert.match(html, /aria-checked="true"/);
  assert.match(html, /fetch\('\/api\/network'/);
});

