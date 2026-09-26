const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { once } = require('node:events');
const { acquireSingleInstance, requestActivation } = require('../dist/daemon/single-instance.js');

const close = (server) => new Promise((resolve) => server.close(resolve));

test('acquires a loopback lock and acknowledges activation exactly once', async (t) => {
  let activations = 0;
  const server = await acquireSingleInstance(0, () => { activations++; });
  t.after(() => close(server));
  assert.equal(server.address().address, '127.0.0.1');
  assert.equal(await requestActivation(server.address().port), true);
  assert.equal(activations, 1);
});

test('duplicate acquisition returns null without replacing the owner', async (t) => {
  const server = await acquireSingleInstance(0, () => {});
  t.after(() => close(server));
  assert.equal(await acquireSingleInstance(server.address().port, () => {}), null);
});

test('invalid or oversized input closes without activating', async (t) => {
  let activations = 0;
  const server = await acquireSingleInstance(0, () => { activations++; });
  t.after(() => close(server));
  for (const input of ['SHOW\nEXTRA', 'HELLO\n', 'x'.repeat(1024)]) {
    const socket = net.connect(server.address().port, '127.0.0.1');
    socket.on('error', () => {});
    const closed = new Promise((resolve) => socket.once('close', resolve));
    socket.on('connect', () => socket.end(input));
    await closed;
  }
  assert.equal(activations, 0);
});

test('unreachable activation returns false', async () => {
  const server = await acquireSingleInstance(0, () => {});
  const port = server.address().port;
  await close(server);
  assert.equal(await requestActivation(port), false);
});

test('invalid bind errors reject instead of pretending another instance exists', async () => {
  await assert.rejects(acquireSingleInstance(-1, () => {}), { code: 'ERR_SOCKET_BAD_PORT' });
});

test('unresponsive servers cannot keep activation waiting indefinitely', async (t) => {
  const peers = new Set();
  const server = net.createServer((socket) => {
    peers.add(socket);
    socket.on('error', () => {});
    socket.on('close', () => peers.delete(socket));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { for (const peer of peers) peer.destroy(); await close(server); });
  assert.equal(await requestActivation(server.address().port), false);
});
