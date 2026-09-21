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
  }
  setAttribute(name, value) { this[name] = String(value); }
  getAttribute(name) { return this[name] || null; }
  appendChild() {}
  contains() { return false; }
  focus() {}
  setPointerCapture() { this.pointerCaptureCalls += 1; }
  getBoundingClientRect() { return { width: 100, height: 100 }; }
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
    }, setInterval: () => 1, setTimeout: () => 1, window,
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'public/control/controller.js'), 'utf8');
  vm.runInNewContext(source, context, { filename: 'controller.js' });
  const socket = FakeWebSocket.instance;
  socket.emit('open');
  socket.emit('message', { data: JSON.stringify({ type: 'auth_ok', sessionToken: 'session-token' }) });

  return {
    document,
    lockButton: document.getElementById('btn-lock'),
    trackpad: document.getElementById('trackpad'),
    flushAnimationFrames() { while (animationFrames.length) animationFrames.shift()(); },
    binaryFrames: () => sent.filter((value) => value instanceof ArrayBuffer).map((value) => new DataView(value)),
    binaryTagsAndButtons: () => sent.filter((value) => value instanceof ArrayBuffer)
      .map((value) => new DataView(value)).filter((view) => view.getUint8(0) === 0x06)
      .map((view) => [view.getUint8(0), view.getUint8(1)]),
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
