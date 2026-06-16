// Ad-hoc volume test: pair, then set exact levels and print the authoritative
// volume_state the server reports back. Usage: node scripts/test-volume.js <port> <pairCode>
const WebSocket = require('ws');
const [, , portArg, code] = process.argv;
const port = Number(portArg) || 3000;

const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { origin: `http://127.0.0.1:${port}` } });
let authed = false;

ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', pairCode: code })));
ws.on('message', (raw) => {
  let m; try { m = JSON.parse(raw.toString()); } catch { return; }
  if (m.type === 'volume_state') { console.log('volume_state ->', JSON.stringify(m.state)); return; }
  if (m.type === 'auth_ok' && !authed) {
    authed = true;
    console.log('AUTH_OK');
    const steps = [
      [200, { type: 'volume_set', percent: 33 }],
      [700, { type: 'volume_set', percent: 77 }],
      [1200, { type: 'volume_set', percent: 50 }],
    ];
    steps.forEach(([t, msg]) => setTimeout(() => { console.log('send', JSON.stringify(msg)); ws.send(JSON.stringify(msg)); }, t));
    setTimeout(() => { ws.close(); process.exit(0); }, 1900);
  }
});
ws.on('error', (e) => { console.log('WS_ERROR', e.message); process.exit(3); });
setTimeout(() => { console.log('TIMEOUT'); process.exit(4); }, 5000);
