import path from 'node:path';
import { createServer, type Server as HttpServer } from 'node:http';
import { createHash, randomInt } from 'node:crypto';
import { existsSync } from 'node:fs';
import os from 'node:os';

import express from 'express';
import { WebSocketServer, type WebSocket } from 'ws';

import type {
  AppMode,
  InputMode,
  RemoteControlState,
  VolumeStateMessage,
} from '../../shared/control';
import { parseBinaryMessage, parseControlMessage } from '../input/message-parser';
import { getPreferredLanAddress } from './lan';
import type { InputRouter } from '../input/input-router';

type StateListener = (state: RemoteControlState) => void;

type SessionPermissions = {
  systemModeAllowed: boolean;
};

type TrustedSession = {
  createdAt: number;
  lastSeenAt: number;
  permissions: SessionPermissions;
  token: string;
};

type ClientConnection = {
  authAttempts: number;
  authTimeout: NodeJS.Timeout | null;
  authenticated: boolean;
  isAlive: boolean;
  lastActivity: number;
  permissions: SessionPermissions;
  rateLimitTokens: number;
  rateLimitLastRefill: number;
  sessionToken: string | null;
  socket: WebSocket;
};

export type RemoteControlServerOptions = {
  /** Absolute path to the directory containing the controller PWA (index.html, controller.js, …). */
  staticDir: string;
  /** Optional absolute path to a @hugeicons ESM dir served under /hugeicons. */
  hugeIconsDir?: string;
  port?: number;
};

const DEFAULT_PORT = 3000;
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_TIMEOUT_MS = 60_000;
const HEARTBEAT_MS = 15_000;
const SESSION_INACTIVITY_MS = 30 * 60_000;
const RATE_LIMIT_MAX_PER_SEC = 500;

function auditLog(event: string, detail?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const payload = detail ? ` ${JSON.stringify(detail)}` : '';
  console.log(`[LocalTV:Audit] ${ts} ${event}${payload}`);
}

/**
 * Derive a stable 6-digit pairing code from the machine's identity.
 * Uses hostname + username so the same PC always shows the same code,
 * eliminating the need to re-scan QR or re-enter the code after restarts.
 */
function derivePairCode(): string {
  const identity = `${os.hostname()}:${os.userInfo().username}`;
  const hash = createHash('sha256').update(identity).digest('hex');
  // Extract a 6-digit number from the hash (always 100000–999999)
  const numeric = parseInt(hash.slice(0, 12), 16) % 900000 + 100000;
  return String(numeric);
}

export class RemoteControlServer {
  private inputRouter: InputRouter;
  private readonly listeners = new Set<StateListener>();
  private readonly port: number;
  private readonly staticDir: string;
  private readonly hugeIconsDir: string | undefined;
  private readonly pairCode = derivePairCode();
  private readonly clients = new Set<ClientConnection>();
  private readonly trustedSessions = new Map<string, TrustedSession>();
  private readonly lanAddress = getPreferredLanAddress();
  private app = express();
  private httpServer: HttpServer | null = null;
  private wsServer: WebSocketServer | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private appMode: AppMode = 'remote_control';
  private switchAppModeHandler: ((mode: AppMode) => void) | null = null;

  constructor(inputRouter: InputRouter, options: RemoteControlServerOptions) {
    this.inputRouter = inputRouter;
    this.staticDir = options.staticDir;
    this.hugeIconsDir = options.hugeIconsDir;
    this.port = options.port ?? DEFAULT_PORT;
  }

  async start(): Promise<void> {
    if (this.started) {
      this.emitState();
      return;
    }

    const publicDirectory = this.staticDir;
    const hugeIconsDirectory =
      this.hugeIconsDir && existsSync(this.hugeIconsDir) ? this.hugeIconsDir : undefined;

    this.app = express();

    console.log(
      `[LocalTV] Remote control static dir: ${publicDirectory} (exists=${existsSync(publicDirectory)})`,
    );

    this.app.use(express.static(publicDirectory, {
      maxAge: '1h',
      etag: true,
      lastModified: true,
    }));
    this.app.get('/', (_request, response) => {
      response.sendFile(path.join(publicDirectory, 'index.html'));
    });
    if (hugeIconsDirectory) {
      this.app.use('/hugeicons', express.static(hugeIconsDirectory, {
        maxAge: '1h',
        etag: true,
        lastModified: true,
      }));
    }
    this.app.get('/health', (_request, response) => {
      response.json({ ok: true });
    });

    // PWA manifest — must be served with correct MIME type and no-cache
    // so updates are picked up immediately by browsers.
    this.app.get('/manifest.json', (_request, response) => {
      response.sendFile(path.join(publicDirectory, 'manifest.json'), {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'no-cache',
        },
      });
    });

    // Service worker — must be served with no-cache so browsers check
    // for updates on every navigation per PWA spec.
    this.app.get('/sw.js', (_request, response) => {
      response.sendFile(path.join(publicDirectory, 'sw.js'), {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache',
          'Service-Worker-Allowed': '/',
        },
      });
    });

    this.app.post('/api/switch-mode', (_request, response) => {
      const nextMode: AppMode = this.appMode === 'remote_control' ? 'tv' : 'remote_control';
      this.switchAppModeHandler?.(nextMode);
      response.json({ ok: true });
    });

    this.registerExtraRoutes(this.app);

    this.httpServer = createServer(this.app);
    this.wsServer = new WebSocketServer({ noServer: true });

    this.httpServer.on('upgrade', (request, socket, head) => {
      if (request.url !== '/ws') {
        socket.destroy();
        return;
      }

      const origin = request.headers.origin;
      const requestHost = request.headers.host;

      if (origin && requestHost) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== requestHost) {
            socket.destroy();
            return;
          }
        } catch {
          socket.destroy();
          return;
        }
      }

      this.wsServer?.handleUpgrade(request, socket, head, (ws) => {
        this.wsServer?.emit('connection', ws, request);
      });
    });

    this.wsServer.on('connection', (socket) => {
      // Disable Nagle: input is a stream of tiny binary packets (9–10 bytes)
      // where latency matters far more than throughput. Without this, TCP can
      // buffer cursor/scroll events for ~40ms waiting to coalesce.
      try {
        (socket as unknown as { _socket?: { setNoDelay: (v: boolean) => void } })._socket?.setNoDelay(true);
      } catch {
        /* best-effort */
      }

      const now = Date.now();
      const client: ClientConnection = {
        authAttempts: 0,
        authTimeout: null,
        authenticated: false,
        isAlive: true,
        lastActivity: now,
        permissions: { systemModeAllowed: true },
        rateLimitTokens: RATE_LIMIT_MAX_PER_SEC,
        rateLimitLastRefill: now,
        sessionToken: null,
        socket,
      };

      this.clients.add(client);
      this.emitState();

      socket.on('pong', () => {
        client.isAlive = true;
      });

      client.authTimeout = setTimeout(() => {
        if (!client.authenticated) {
          socket.close(4001, 'Authentication timeout');
        }
      }, AUTH_TIMEOUT_MS);

      socket.on('message', (rawValue, isBinary) => {
        if (isBinary) {
          void this.handleBinaryMessage(client, rawValue as Buffer).catch((error) => {
            const message =
              error instanceof Error ? error.message : 'The control message failed.';
            client.socket.send(JSON.stringify({ message, type: 'error' }));
          });
        } else {
          void this.handleSocketMessage(client, rawValue.toString()).catch((error) => {
            const message =
              error instanceof Error ? error.message : 'The control message failed.';
            client.socket.send(JSON.stringify({ message, type: 'error' }));
          });
        }
      });

      socket.on('close', () => {
        if (client.authTimeout) {
          clearTimeout(client.authTimeout);
        }

        if (client.authenticated) {
          auditLog('session_ended', { token: client.sessionToken });
        }

        this.clients.delete(client);
        this.emitState();
      });

      socket.send(
        JSON.stringify({
          appMode: this.appMode,
          hasTrustedSession: this.trustedSessions.size > 0,
          pairCodeRequired: this.trustedSessions.size === 0,
          type: 'hello',
        }),
      );
    });

    await new Promise<void>((resolve, reject) => {
      this.httpServer?.once('error', (err) => {
        console.error(`[LocalTV] Remote control server failed to bind port ${this.port}:`, err);
        reject(err);
      });
      this.httpServer?.listen(this.port, '0.0.0.0', () => {
        console.log(`[LocalTV] Remote control server listening on 0.0.0.0:${this.port}`);
        resolve();
      });
    });

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      for (const client of this.clients) {
        if (!client.authenticated) {
          continue;
        }

        if (now - client.lastActivity > SESSION_INACTIVITY_MS) {
          auditLog('session_expired', { token: client.sessionToken });
          client.socket.close(4008, 'Session expired due to inactivity');
          continue;
        }

        if (!client.isAlive) {
          client.socket.terminate();
          continue;
        }

        client.isAlive = false;
        client.socket.ping();
      }
    }, HEARTBEAT_MS);

    this.started = true;
    this.emitState();
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const client of this.clients) {
      client.socket.close();
    }

    this.clients.clear();

    await new Promise<void>((resolve) => {
      this.wsServer?.close(() => resolve());
      if (!this.wsServer) {
        resolve();
      }
    });

    await new Promise<void>((resolve) => {
      this.httpServer?.close(() => resolve());
      if (!this.httpServer) {
        resolve();
      }
    });

    this.wsServer = null;
    this.httpServer = null;
    this.started = false;
  }

  onStateChanged(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): RemoteControlState {
    let clientCount = 0;

    for (const client of this.clients) {
      if (client.authenticated) {
        clientCount += 1;
      }
    }

    return {
      appMode: this.appMode,
      clientCount,
      controllerUrl: `http://${this.lanAddress}:${this.port}`,
      hasTrustedSession: this.trustedSessions.size > 0,
      inputMode: this.inputRouter.getInputMode(),
      pairingUrl: `http://${this.lanAddress}:${this.port}/?pairCode=${this.pairCode}`,
      pairCode: this.pairCode,
      systemModeAvailable: this.inputRouter.isSystemModeAvailable(),
    };
  }

  setInputRouter(inputRouter: InputRouter): void {
    this.inputRouter = inputRouter;
    this.broadcastInputMode(this.inputRouter.getInputMode());
    this.emitState();
  }

  setAppMode(mode: AppMode): void {
    if (this.appMode === mode) {
      return;
    }

    this.appMode = mode;
    this.broadcastAppMode(mode);
    this.emitState();
  }

  setSwitchAppModeHandler(handler: ((mode: AppMode) => void) | null): void {
    this.switchAppModeHandler = handler;
  }

  /**
   * Hook for hosts (e.g. the daemon) to register additional Express routes
   * such as the desktop pairing page (`/host`) and `/api/quit`. Default no-op.
   */
  protected registerExtraRoutes(_app: express.Express): void {
    // no-op by default
  }

  private emitState(): void {
    const state = this.getState();

    for (const listener of this.listeners) {
      listener(state);
    }
  }

  private async handleBinaryMessage(client: ClientConnection, data: Buffer): Promise<void> {
    if (!client.authenticated) {
      client.socket.send(JSON.stringify({ message: 'Not authenticated.', type: 'error' }));
      return;
    }

    if (!this.consumeRateToken(client)) return;
    client.lastActivity = Date.now();

    const message = parseBinaryMessage(data);

    if (!message) {
      return;
    }

    await this.inputRouter.route(message);
  }

  private async handleSocketMessage(client: ClientConnection, rawValue: string): Promise<void> {
    const message = parseControlMessage(rawValue);

    if (!message) {
      client.socket.send(JSON.stringify({ message: 'Invalid message.', type: 'error' }));
      return;
    }

    if (!client.authenticated) {
      const trustedSession =
        message.type === 'auth' && message.sessionToken
          ? this.trustedSessions.get(message.sessionToken)
          : null;

      if (trustedSession) {
        this.authenticateClient(client, trustedSession, 'resume');
        return;
      }

      if (message.type !== 'auth' || message.pairCode !== this.pairCode) {
        client.authAttempts += 1;
        auditLog('auth_failed', { attempts: client.authAttempts });
        client.socket.send(JSON.stringify({ message: 'Pairing code rejected.', type: 'auth_error' }));

        if (client.authAttempts >= MAX_AUTH_ATTEMPTS) {
          auditLog('auth_locked_out');
          client.socket.close(4003, 'Too many pairing attempts');
        }

        return;
      }

      this.authenticateClient(client, this.createTrustedSession(), 'pair');
      return;
    }

    if (message.type === 'auth') {
      client.socket.send(
        JSON.stringify({
          inputMode: this.inputRouter.getInputMode(),
          remoteCursorVisible: this.inputRouter.getCursorVisible(),
          systemModeAvailable: this.inputRouter.isSystemModeAvailable(),
          type: 'auth_ok',
        }),
      );
      return;
    }

    if (!this.consumeRateToken(client)) return;
    client.lastActivity = Date.now();

    if (message.type === 'input_mode' && message.mode === 'system') {
      if (!client.permissions.systemModeAllowed) {
        client.socket.send(
          JSON.stringify({ message: 'System mode not permitted.', type: 'error' }),
        );
        auditLog('system_mode_denied', { token: client.sessionToken });
        return;
      }
      auditLog('input_mode_change', { mode: message.mode, token: client.sessionToken });
    }

    if (message.type === 'elevation_request') {
      auditLog('elevation_requested', { token: client.sessionToken });
    }

    await this.inputRouter.route(message);

    if (
      message.type === 'volume_set' ||
      message.type === 'volume_adjust' ||
      message.type === 'volume_mute_toggle'
    ) {
      this.sendVolumeState(client);
    }

    if (message.type === 'input_mode') {
      this.broadcastInputMode(this.inputRouter.getInputMode());
    }
  }

  private authenticateClient(
    client: ClientConnection,
    session: TrustedSession,
    reason: 'pair' | 'resume',
  ): void {
    client.authenticated = true;
    client.permissions = { ...session.permissions };
    client.sessionToken = session.token;
    client.isAlive = true;
    client.lastActivity = Date.now();

    session.lastSeenAt = client.lastActivity;
    this.trustedSessions.set(session.token, session);

    if (client.authTimeout) {
      clearTimeout(client.authTimeout);
      client.authTimeout = null;
    }

    auditLog(reason === 'pair' ? 'session_started' : 'session_resumed', { token: session.token });

    client.socket.send(
      JSON.stringify({
        appMode: this.appMode,
        inputMode: this.inputRouter.getInputMode(),
        remoteCursorVisible: this.inputRouter.getCursorVisible(),
        sessionToken: session.token,
        systemModeAvailable: this.inputRouter.isSystemModeAvailable(),
        type: 'auth_ok',
      }),
    );

    this.sendVolumeState(client);

    this.emitState();
  }

  private createTrustedSession(): TrustedSession {
    const now = Date.now();

    return {
      createdAt: now,
      lastSeenAt: now,
      permissions: { systemModeAllowed: true },
      token: `${now}-${randomInt(100000, 999999)}`,
    };
  }

  private consumeRateToken(client: ClientConnection): boolean {
    const now = Date.now();
    const elapsed = (now - client.rateLimitLastRefill) / 1000;
    client.rateLimitTokens = Math.min(
      RATE_LIMIT_MAX_PER_SEC,
      client.rateLimitTokens + elapsed * RATE_LIMIT_MAX_PER_SEC,
    );
    client.rateLimitLastRefill = now;

    if (client.rateLimitTokens < 1) {
      return false;
    }

    client.rateLimitTokens -= 1;
    return true;
  }

  private broadcastInputMode(mode: InputMode): void {
    const payload = JSON.stringify({ mode, type: 'input_mode_changed' });

    for (const client of this.clients) {
      if (client.authenticated) {
        client.socket.send(payload);
      }
    }
  }

  private broadcastAppMode(mode: AppMode): void {
    const payload = JSON.stringify({ mode, type: 'app_mode_changed' });

    for (const client of this.clients) {
      if (client.authenticated) {
        client.socket.send(payload);
      }
    }
  }

  private sendVolumeState(client: ClientConnection): void {
    const payload: VolumeStateMessage = {
      state: this.inputRouter.getVolumeState(),
      type: 'volume_state',
    };
    client.socket.send(JSON.stringify(payload));
  }
}
