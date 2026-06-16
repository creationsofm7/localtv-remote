// Ad-hoc end-to-end test: pair over WS and inject an absolute mouse move.
// Usage: node scripts/test-inject.js <port> <pairCode> <x> <y>
const WebSocket = require('ws');

const [, , portArg, code, xArg, yArg] = process.argv;
const port = Number(portArg) || 3000;
const x = Number(xArg);
const y = Number(yArg);

const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
  headers: { origin: `http://127.0.0.1:${port}` },
});

let authed = false;
const done = (msg, codeOut) => {
  console.log(msg);
  try { ws.close(); } catch {}
  setTimeout(() => process.exit(codeOut), 100);
};

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'auth', pairCode: code }));
});

ws.on('message', (raw) => {
  let m;
  try { m = JSON.parse(raw.toString()); } catch { return; }
  if (m.type === 'hello') return;
  if (m.type === 'auth_ok' && !authed) {
    authed = true;
    console.log('AUTH_OK systemModeAvailable=' + m.systemModeAvailable + ' inputMode=' + m.inputMode);
    ws.send(JSON.stringify({ type: 'mouse_move', x, y }));
    done('SENT mouse_move x=' + x + ' y=' + y, 0);
    return;
  }
  if (m.type === 'auth_error' || m.type === 'error') {
    done('AUTH_FAILED: ' + (m.message || ''), 2);
  }
});

ws.on('error', (e) => done('WS_ERROR: ' + e.message, 3));
setTimeout(() => done('TIMEOUT', 4), 5000);
