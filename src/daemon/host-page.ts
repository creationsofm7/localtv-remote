import { APP_NAME } from './constants';

/**
 * The desktop pairing screen, reused almost verbatim from the Electron app's
 * `buildHostHtml()`. Differences for running outside Electron:
 *  - status + device count update by polling `/api/state` (was Electron
 *    `webContents.executeJavaScript`),
 *  - the Stop button POSTs `/api/quit` (was a `localtv-host://quit` nav hack),
 *  - drag regions removed; CSP allows same-origin `connect-src` for polling.
 */
export function buildHostHtml(
  qrDataUrl: string,
  pairCode: string,
  controllerUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'"
    />
    <title>${APP_NAME} — Remote Control</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        background: #0f172a;
        color: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        overflow: hidden;
        user-select: none;
      }
      main {
        width: 100%;
        max-width: 340px;
        padding: 10px 10px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .card {
        width: 100%;
        padding: 12px 12px 10px;
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 20px 60px rgba(2, 6, 23, 0.45);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      h1 { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
      .subtitle { font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.25; }
      .qr-wrap {
        background: #fff;
        border-radius: 12px;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qr-wrap img { width: 156px; height: 156px; display: block; }
      .pair-code {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 0.12em;
        font-family: 'Cascadia Code', 'Fira Code', monospace;
        color: #f1f5f9;
      }
      .url {
        font-size: 10px;
        color: #64748b;
        word-break: break-all;
        text-align: center;
      }
      .status-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #94a3b8;
      }
      .dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #f59e0b;
        animation: pulse 1.8s ease-in-out infinite;
      }
      .dot.connected { background: #22c55e; animation: none; }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      .btn-stop {
        border: 0;
        border-radius: 10px;
        padding: 10px 28px;
        background: #1e293b;
        color: #e2e8f0;
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      .btn-stop:hover { background: #334155; }
      .buttons {
        display: flex;
        gap: 8px;
        margin-top: 0;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <h1>${APP_NAME} Remote</h1>
        <p class="subtitle">Scan the QR or enter the code on your phone.</p>
        <div class="qr-wrap">
          <img src="${qrDataUrl}" alt="QR code" />
        </div>
        <div class="pair-code">${pairCode}</div>
        <div class="url">${controllerUrl}</div>
        <div class="status-row">
          <span class="dot" id="dot"></span>
          <span id="status">Waiting for connection…</span>
        </div>
        <div class="buttons">
          <button class="btn-stop" id="stop">Stop</button>
        </div>
      </section>
    </main>
    <script>
      (function () {
        var dot = document.getElementById('dot');
        var status = document.getElementById('status');
        async function poll() {
          try {
            var res = await fetch('/api/state', { cache: 'no-store' });
            var s = await res.json();
            var n = s.clientCount | 0;
            if (n > 0) {
              status.textContent = n + ' device' + (n > 1 ? 's' : '') + ' connected';
              dot.className = 'dot connected';
            } else {
              status.textContent = 'Waiting for connection…';
              dot.className = 'dot';
            }
          } catch (e) { /* server gone; keep last state */ }
        }
        document.getElementById('stop').addEventListener('click', function () {
          fetch('/api/quit', { method: 'POST' }).finally(function () {
            status.textContent = 'Stopping…';
          });
        });
        poll();
        setInterval(poll, 1000);
      })();
    </script>
  </body>
</html>`;
}
