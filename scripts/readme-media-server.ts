/** Documentation-only host. Never instantiate a native input/audio/power backend. */
import path from 'node:path';
import QRCode from 'qrcode';
import { DaemonControlServer } from '../src/daemon/control-server';
import { buildHostHtml } from '../src/daemon/host-page';
import type { InputRouter } from '../src/core/main/input/input-router';
import type { InputMode, VolumeState } from '../src/core/shared/control';

const port = Number(process.env.README_MEDIA_PORT || 6789);
const pairCode = '123456';
const documentationAddress = '192.0.2.10';
let inputMode: InputMode = 'system';
let cursorVisible = true;
const volume: VolumeState = { available: true, level: 42, muted: false };
const inputSink: InputRouter = {
  async route(message) {
    if (process.send) process.send({ type: 'routed', message });
    // Only update demonstration state. All desktop actions terminate here.
    if (message.type === 'input_mode') inputMode = message.mode;
    if (message.type === 'cursor_visibility') cursorVisible = message.visible;
    if (message.type === 'volume_set') volume.level = Math.max(0, Math.min(100, message.percent));
    if (message.type === 'volume_adjust') volume.level = Math.max(0, Math.min(100, volume.level + message.delta));
    if (message.type === 'volume_mute_toggle') volume.muted = !volume.muted;
  },
  getInputMode: () => inputMode,
  isSystemModeAvailable: () => true,
  getCursorVisible: () => cursorVisible,
  getVolumeState: () => ({ ...volume }),
};

const server = new DaemonControlServer(inputSink, {
  staticDir: path.resolve(__dirname, '../public/control'),
  lanAddress: documentationAddress,
  port,
  onQuit: () => void stop(),
  onNetworkSelection: async () => { /* Documentation address stays fixed. */ },
});
// TS private fields remain JS properties. Override only in this isolated fixture,
// before starting the server, so the machine-derived code never enters a capture.
Object.defineProperty(server, 'pairCode', { value: pairCode });
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await server.stop();
  process.exit(process.exitCode || 0);
}
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
process.on('message', (message) => { if (message === 'stop') void stop(); });
process.on('disconnect', () => void stop());

async function main() {
  const state = server.getState();
  const qr = await QRCode.toDataURL(state.pairingUrl, { width: 256, margin: 2 });
  server.setHostHtml(buildHostHtml(qr, pairCode, state.controllerUrl, {
    addresses: [{ address: documentationAddress, name: 'Demo Wi-Fi' }],
    mode: 'automatic',
    selectedAddress: documentationAddress,
  }));
  await server.start();
  console.log('README_MEDIA_READY');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  void stop();
});
