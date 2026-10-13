const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class EventTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  emit(type, properties = {}) {
    const event = {
      type,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      ...properties,
    };
    for (const listener of this.listeners.get(type) || []) listener(event);
    return event;
  }
}

function pairingHarness() {
  const source = fs.readFileSync(path.join(__dirname, '../public/control/controller.js'), 'utf8');
  const start = source.indexOf('/* ── Connect button');
  const end = source.indexOf('/* ── Auto-connect', start);
  assert.ok(start >= 0 && end > start, 'pairing event wiring must exist');
  const form = new EventTarget();
  const button = new EventTarget();
  const input = new EventTarget();
  const connections = [];
  let reconnectClears = 0;
  vm.runInNewContext(source.slice(start, end), {
    document: { getElementById: (id) => id === 'pair-form' ? form : null },
    connectBtn: button,
    pairInput: input,
    clearReconnect() { reconnectClears += 1; },
    connect(restore) { connections.push(restore); },
  });
  return { form, button, input, connections, reconnectClears: () => reconnectClears };
}

test('native Connect button click submits exactly one pairing request', () => {
  const harness = pairingHarness();
  const click = harness.button.emit('click');
  const submit = !click.defaultPrevented ? harness.form.emit('submit') : null;
  assert.equal(harness.connections.length, 1);
  assert.deepEqual(harness.connections, [false]);
  assert.equal(harness.reconnectClears(), 1);
  assert.equal(submit?.defaultPrevented, true, 'form submission must prevent browser navigation');
});

test('Enter in pairing input connects once and prevents native submission', () => {
  const harness = pairingHarness();
  const keydown = harness.input.emit('keydown', { key: 'Enter' });
  if (!keydown.defaultPrevented) harness.form.emit('submit');
  assert.deepEqual(harness.connections, [false]);
  assert.equal(harness.reconnectClears(), 1);
  assert.equal(keydown.defaultPrevented, true);
});

test('pairing form submission prevents browser navigation', () => {
  const harness = pairingHarness();
  const submit = harness.form.emit('submit');
  assert.equal(submit.defaultPrevented, true);
  assert.deepEqual(harness.connections, [false]);
});
