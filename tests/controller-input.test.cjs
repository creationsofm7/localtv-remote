const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class FakeEventTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  emit(type, properties = {}) {
    const event = { type, preventDefault() { this.defaultPrevented = true; }, ...properties };
    for (const listener of this.listeners.get(type) || []) listener(event);
    return event;
  }
}

class FakeElement extends FakeEventTarget {
  constructor(id, document) {
    super();
    this.id = id;
    this.document = document;
    this.dataset = {};
    this.style = {};
    this.classList = { add() {}, remove() {}, toggle() {} };
    this.hidden = false;
    this.value = '';
    this.checked = false;
    this.textContent = '';
    this.pointerCaptureCalls = 0;
    this.bounds = { left: 0, width: 100, height: 100 };
  }
  setAttribute(name, value) { this[name] = String(value); }
  getAttribute(name) { return this[name] || null; }
  appendChild() {}
  contains() { return false; }
  focus() {}
  setPointerCapture() { this.pointerCaptureCalls += 1; }
  getBoundingClientRect() { return this.bounds; }
  get offsetWidth() { return 100; }
  requestPointerLock() {
    this.document.pointerLockElement = this;
    this.document.emit('pointerlockchange');
  }
}

const event = (properties = {}) => ({ preventDefault() {}, ...properties });
const pointer = (properties = {}) => event({ pointerType: 'mouse', pointerId: 1, clientX: 10, clientY: 10, ...properties });

const createControllerHarness = () => {
  const document = new FakeEventTarget();
  const elements = new Map();
  document.getElementById = (id) => {
    if (!elements.has(id)) elements.set(id, new FakeElement(id, document));
    return elements.get(id);
  };
  document.querySelectorAll = () => [];
  document.createElementNS = () => new FakeElement('', document);
  document.exitPointerLock = () => {
    document.pointerLockElement = null;
    document.emit('pointerlockchange');
  };

  const animationFrames = [];
  const timers = [];
  const sent = [];
  const localStorage = new Map([['localtv.remote.sessionToken', 'session-token']]);
  class FakeWebSocket extends FakeEventTarget {
    static OPEN = 1;
    constructor() { super(); this.readyState = FakeWebSocket.OPEN; this.sent = sent; FakeWebSocket.instance = this; }
    send(value) { sent.push(value instanceof ArrayBuffer ? value.slice(0) : value); }
    close() { this.readyState = 3; this.emit('close'); }
  }
  const window = new FakeEventTarget();
  window.location = { host: 'localhost:6776', search: '' };
  window.localStorage = {
    getItem: (key) => localStorage.get(key) || null,
    setItem: (key, value) => localStorage.set(key, String(value)),
    removeItem: (key) => localStorage.delete(key),
  };
  const context = {
    Array, ArrayBuffer, DataView, JSON, Map, Math, Node: FakeElement, Number, Object,
    URLSearchParams, WebSocket: FakeWebSocket, clearInterval() {}, clearTimeout() {},
    confirm: () => true, document, performance: { now: () => 0 }, requestAnimationFrame: (fn) => {
      animationFrames.push(fn);
      return animationFrames.length;
    }, setInterval: () => 1, setTimeout: (fn) => {
      timers.push(fn);
      return timers.length;
    }, window,
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'public/control/controller.js'), 'utf8');
  vm.runInNewContext(source, context, { filename: 'controller.js' });
  const socket = FakeWebSocket.instance;
  socket.emit('open');
  socket.emit('message', { data: JSON.stringify({ type: 'auth_ok', sessionToken: 'session-token' }) });

  return {
    document,
    leftDragButton: document.getElementById('btn-left-drag'),
    lockButton: document.getElementById('btn-lock'),
    socket,
    trackpad: document.getElementById('trackpad'),
    volumeTrack: document.getElementById('volume-track'),
    window,
    flushAnimationFrames() { while (animationFrames.length) animationFrames.shift()(); },
    flushTimers() { while (timers.length) timers.shift()(); },
    binaryFrames: () => sent.filter((value) => value instanceof ArrayBuffer).map((value) => new DataView(value)),
    binaryTags: () => sent.filter((value) => value instanceof ArrayBuffer).map((value) => new DataView(value).getUint8(0)),
    binaryTagsAndButtons: () => sent.filter((value) => value instanceof ArrayBuffer)
      .map((value) => new DataView(value)).filter((view) => view.getUint8(0) === 0x06)
      .map((view) => [view.getUint8(0), view.getUint8(1)]),
    volumeMessages: () => sent.filter((value) => typeof value === 'string').map(JSON.parse)
      .filter((value) => value.type === 'volume_set'),
  };
};

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

test('pointer cancellation and page exit release held left input', () => {
  const cancelled = createControllerHarness();
  cancelled.trackpad.emit('pointerdown', pointer({ button: 0, clientX: 10, clientY: 10 }));
  cancelled.trackpad.emit('pointermove', pointer({ button: 0, clientX: 30, clientY: 10 }));
  cancelled.trackpad.emit('pointercancel', pointer());
  assert.deepEqual(cancelled.binaryTags(), [0x03, 0x04]);

  const exiting = createControllerHarness();
  exiting.leftDragButton.emit('click', event());
  exiting.window.emit('pagehide', event());
  assert.deepEqual(exiting.binaryTags(), [0x03, 0x04]);
});

test('pagehide on window releases sticky left and touch taps do not click while held', () => {
  const app = createControllerHarness();
  app.leftDragButton.emit('click', event());
  app.trackpad.emit('touchstart', event({ touches: [{ clientX: 10, clientY: 10 }] }));
  app.trackpad.emit('touchend', event({ touches: [] }));
  app.window.emit('pagehide', event());
  assert.deepEqual(app.binaryTags(), [0x03, 0x04]);
});

test('volume track clamps pointer positions and synchronizes slider state', () => {
  const expected = [[50, 0], [150, 25], [350, 100]];
  for (const [clientX, percent] of expected) {
    const app = createControllerHarness();
    app.volumeTrack.bounds = { left: 100, width: 200, height: 5 };
    app.volumeTrack.emit('pointerdown', pointer({ clientX }));
    app.flushTimers();
    assert.deepEqual(app.volumeMessages(), [{ type: 'volume_set', percent }]);
    assert.equal(app.volumeTrack.getAttribute('aria-valuenow'), String(percent));
  }
});

test('volume track stops drag updates on cancellation and supports keyboard range keys', () => {
  const app = createControllerHarness();
  app.volumeTrack.bounds = { left: 100, width: 200, height: 5 };
  app.volumeTrack.emit('pointerdown', pointer({ clientX: 150 }));
  app.volumeTrack.emit('pointercancel', pointer());
  app.volumeTrack.emit('pointermove', pointer({ clientX: 350 }));
  app.flushTimers();
  assert.deepEqual(app.volumeMessages(), [{ type: 'volume_set', percent: 25 }]);
  app.volumeTrack.emit('keydown', event({ key: 'End' }));
  app.volumeTrack.emit('keydown', event({ key: 'Home' }));
  app.flushTimers();
  assert.deepEqual(app.volumeMessages().at(-1), { type: 'volume_set', percent: 0 });
});
