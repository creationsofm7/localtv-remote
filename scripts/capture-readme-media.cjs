#!/usr/bin/env node
/** Reproduce README screenshots and 10 fps Help animation source frames.
 * Requires npm install, Chrome, and Playwright (bundled with Codex or supplied
 * through README_MEDIA_NODE_MODULES / README_MEDIA_PLAYWRIGHT).
 * Demo state only; no native input, audio, or power backend is loaded.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const os = require('node:os');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'docs/assets');
const frames = path.join(root, 'tmp/readme-media');
const port = Number(process.env.README_MEDIA_PORT || 6789);
const url = `http://127.0.0.1:${port}`;
const bundledModules = path.join(process.env.USERPROFILE || os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
function resolvePlaywright() {
  if (process.env.README_MEDIA_PLAYWRIGHT) return process.env.README_MEDIA_PLAYWRIGHT;
  if (process.env.README_MEDIA_NODE_MODULES) return path.join(process.env.README_MEDIA_NODE_MODULES, 'playwright');
  try { return require.resolve('playwright'); }
  catch { return path.join(bundledModules, 'playwright'); }
}
const chromePath = process.env.README_MEDIA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let server;
let browser;

async function startServer() {
  const tsx = require.resolve('tsx/cli');
  server = spawn(process.execPath, [tsx, path.join(__dirname, 'readme-media-server.ts')], {
    cwd: root,
    env: { ...process.env, README_MEDIA_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  });
  await new Promise((resolve, reject) => {
    let output = '';
    let errors = '';
    const timer = setTimeout(() => reject(new Error('Documentation server did not start within 20 seconds.')), 20000);
    server.stderr.on('data', (data) => { errors += data.toString(); });
    server.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('README_MEDIA_READY')) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.once('error', (error) => { clearTimeout(timer); reject(error); });
    server.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Documentation server exited (${code}). ${errors}`));
    });
  });
}

async function cleanup() {
  if (browser) { await browser.close().catch(() => {}); browser = null; }
  if (!server || server.exitCode !== null) return;
  const child = server;
  const ended = once(child, 'exit').catch(() => {});
  if (child.connected) child.send('stop', () => {});
  else child.kill();
  const timer = setTimeout(() => child.kill(), 5000);
  await ended;
  clearTimeout(timer);
}

async function screenshot(page, name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images];
    await Promise.all(images.map((image) => image.decode().catch(() => {})));
  });
  await page.screenshot({ path: path.join(assets, `readme-${name}.png`), animations: 'disabled' });
  console.log(`Captured readme-${name}.png`);
}

async function showGuide(page, index) {
  await page.locator(`[data-help-dot="${index}"]`).click();
  await page.locator(`[data-help-card="${index}"][aria-hidden="false"]`).waitFor();
}

async function animationFrames(page, name, durationMs) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Advance production CSS animations at exact 100 ms intervals. This produces
  // an entire real UI cycle at 10 fps without screenshot I/O changing its timing.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.pause();
  });
  for (let index = 0; index < durationMs / 100; index++) {
    await page.evaluate((time) => {
      for (const animation of document.getAnimations()) animation.currentTime = time;
    }, index * 100);
    await page.screenshot({ path: path.join(frames, `${name}-${String(index).padStart(3, '0')}.png`) });
  }
  console.log(`Captured ${durationMs / 100} ${name} frames at 10 fps`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

async function main() {
  await fs.mkdir(assets, { recursive: true });
  await fs.mkdir(frames, { recursive: true });
  // Remove only this script's old numbered frames, including a longer prior cycle.
  for (const filename of await fs.readdir(frames)) {
    if (/^(move|scroll)-\d{3}\.png$/.test(filename)) await fs.unlink(path.join(frames, filename));
  }
  await startServer();
  const { chromium } = require(resolvePlaywright());
  browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const desktop = await browser.newContext({ viewport: { width: 960, height: 680 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const host = await desktop.newPage();
  await host.goto(`${url}/host`);
  await host.locator('.pair-code').filter({ hasText: '123456' }).waitFor();
  await screenshot(host, 'host');

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    // Neutral platform exposes the actual iPhone/Android installation choice.
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  });
  const page = await mobile.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await page.locator('#pair-code').fill('123456');
  await page.locator('#pair-code').blur();
  await screenshot(page, 'connect');
  await page.locator('#connect-btn').click();
  await page.locator('#remote-screen').waitFor({ state: 'visible' });
  await page.locator('#volume-value').filter({ hasText: '42' }).waitFor();
  await screenshot(page, 'remote');
  await page.locator('[data-tab="media"]').click();
  await screenshot(page, 'media');
  await page.locator('[data-tab="input"]').click();
  await screenshot(page, 'keyboard');
  await page.locator('[data-tab="remote"]').click();
  await page.locator('#settings-btn').click();
  await screenshot(page, 'settings');
  await page.locator('#settings-btn').click();
  await page.locator('#help-open').click();
  await page.locator('#help-dialog').waitFor({ state: 'visible' });
  await showGuide(page, 0);
  await screenshot(page, 'help');
  await animationFrames(page, 'move', 2700);
  await showGuide(page, 1);
  await screenshot(page, 'drag');
  await showGuide(page, 2);
  await screenshot(page, 'scroll');
  await animationFrames(page, 'scroll', 3200);
  await showGuide(page, 3);
  await page.locator('[data-help-platform="ios"]').click();
  await screenshot(page, 'install-pwa');
  await page.locator('[data-help-platform="android"]').click();
  await screenshot(page, 'install-android');
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log('Capture complete. Demo PIN, network address, volume, and desktop actions are simulated.');
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => { void cleanup().finally(() => process.exit(130)); });
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(cleanup);
