import type express from 'express';

import {
  RemoteControlServer,
  type RemoteControlServerOptions,
} from '../core/main/control/remote-control-server';
import type { InputRouter } from '../core/main/input/input-router';

export type DaemonControlServerOptions = RemoteControlServerOptions & {
  /** Called when the user clicks "Stop" on the desktop pairing page. */
  onQuit: () => void;
};

const isLoopback = (ip: string | undefined): boolean =>
  ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

/**
 * RemoteControlServer + the daemon-only desktop endpoints:
 *  - GET  /host       → the pairing screen HTML (loopback only)
 *  - GET  /api/state  → live pairing state for the page's poller (loopback only)
 *  - POST /api/quit   → stop the daemon (loopback only)
 *
 * The `/host` page reveals the pair code, so these routes are restricted to
 * loopback — LAN clients only ever get the controller PWA + the `/ws` channel,
 * which still requires the pair code. This matches the Electron app, where the
 * code was only ever shown in a local window.
 */
export class DaemonControlServer extends RemoteControlServer {
  private hostHtml = '<!doctype html><title>LocalTV Remote</title><p>Starting…</p>';
  private readonly onQuit: () => void;

  constructor(inputRouter: InputRouter, options: DaemonControlServerOptions) {
    super(inputRouter, options);
    this.onQuit = options.onQuit;
  }

  setHostHtml(html: string): void {
    this.hostHtml = html;
  }

  protected registerExtraRoutes(app: express.Express): void {
    const loopbackOnly: express.RequestHandler = (req, res, next) => {
      if (isLoopback(req.socket.remoteAddress)) {
        next();
      } else {
        res.status(403).end();
      }
    };

    app.get('/host', loopbackOnly, (_req, res) => {
      res.type('html').send(this.hostHtml);
    });

    app.get('/api/state', loopbackOnly, (_req, res) => {
      res.json(this.getState());
    });

    app.post('/api/quit', loopbackOnly, (_req, res) => {
      res.json({ ok: true });
      // Defer so the response flushes before we tear down.
      setTimeout(() => this.onQuit(), 50);
    });
  }
}
