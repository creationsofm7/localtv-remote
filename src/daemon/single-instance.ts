import net from 'node:net';

const ADDRESS = '127.0.0.1';
const REQUEST = 'SHOW\n';
const RESPONSE = 'OK\n';
const TIMEOUT_MS = 1200;

/** Own the loopback lock and accept only a small pairing-window activation request. */
export function acquireSingleInstance(
  port: number,
  onActivate: () => void,
): Promise<net.Server | null> {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      let input = '';
      socket.setEncoding('utf8');
      socket.setTimeout(TIMEOUT_MS, () => socket.destroy());
      socket.on('error', () => {});
      socket.on('data', (chunk: string) => {
        input += chunk;
        if (input.length > REQUEST.length || !REQUEST.startsWith(input)) socket.destroy();
      });
      socket.on('end', () => {
        if (input === REQUEST) {
          onActivate();
          socket.end(RESPONSE);
        } else {
          socket.destroy();
        }
      });
    });
    server.once('error', (error: NodeJS.ErrnoException) => {
      server.close();
      if (error.code === 'EADDRINUSE') resolve(null);
      else reject(error);
    });
    try {
      server.listen(port, ADDRESS, () => resolve(server));
    } catch (error) {
      reject(error);
    }
  });
}

/** Ask an already-running copy to reveal its pairing window. */
export function requestActivation(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: ADDRESS });
    let response = '';
    let complete = false;
    const finish = (success: boolean) => {
      if (complete) return;
      complete = true;
      socket.destroy();
      resolve(success);
    };
    socket.setEncoding('utf8');
    socket.setTimeout(TIMEOUT_MS, () => finish(false));
    socket.on('connect', () => socket.end(REQUEST));
    socket.on('data', (chunk: string) => {
      response += chunk;
      if (response.length > RESPONSE.length) finish(false);
    });
    socket.on('end', () => finish(response === RESPONSE));
    socket.on('error', () => finish(false));
  });
}
