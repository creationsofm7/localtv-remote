import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * Require for native packages (koffi, webview-nodejs, systray2) that must live
 * on real disk and therefore cannot be embedded in the Node SEA blob.
 *
 * - In a packaged SEA build, modules are shipped in `node_modules/` next to the
 *   executable, so we resolve relative to `process.execPath`.
 * - In dev (tsx / `node dist/...`), we resolve relative to this module as usual.
 *
 * The bundler is told these packages are external, so these calls hit real
 * files at runtime rather than anything baked into the bundle.
 */
function isSea(): boolean {
  try {
    // Available on Node >= 20 when running as a Single Executable Application.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return Boolean((require('node:sea') as { isSea?: () => boolean }).isSea?.());
  } catch {
    return false;
  }
}

const anchor = isSea()
  ? path.join(path.dirname(process.execPath), 'node_modules', '_')
  : __filename;

export const nativeRequire = createRequire(anchor);
