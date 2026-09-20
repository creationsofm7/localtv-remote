#!/usr/bin/env node

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const playwrightModulePath = process.env.PLAYWRIGHT_MODULE_PATH || 'playwright';
const { chromium } = require(playwrightModulePath);

const repositoryRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(repositoryRoot, 'docs');
const screenshotRoot = path.join(os.tmpdir(), 'localtv-seo-qa');
const productionOrigin = 'https://creationsofm7.github.io';
const sitePrefix = '/localtv-remote/';

const existingPaths = [
  sitePrefix,
  `${sitePrefix}unified-remote-alternative/`,
  `${sitePrefix}remote-mouse-alternative/`,
  `${sitePrefix}control-pc-from-phone/`,
];
const guidePaths = [
  `${sitePrefix}how-do-i-use-my-phone-as-a-mouse/`,
  `${sitePrefix}how-do-i-type-on-my-pc-from-my-phone/`,
  `${sitePrefix}how-do-i-control-pc-volume-from-my-phone/`,
  `${sitePrefix}how-do-i-control-one-pc-with-multiple-phones/`,
  `${sitePrefix}how-do-i-control-an-ethernet-pc-from-my-phone/`,
  `${sitePrefix}how-do-i-fix-phone-to-pc-wifi-connection/`,
  `${sitePrefix}how-do-i-allow-localtv-through-windows-firewall/`,
  `${sitePrefix}how-do-i-connect-without-scanning-qr-code/`,
  `${sitePrefix}how-do-i-stop-phone-remote-disconnecting/`,
  `${sitePrefix}how-do-i-fix-connected-remote-not-working/`,
];
const hubPath = `${sitePrefix}guides/`;
const newPaths = [hubPath, ...guidePaths];
const requiredPaths = [...existingPaths, ...newPaths];
const screenshotPaths = [
  hubPath,
  `${sitePrefix}how-do-i-use-my-phone-as-a-mouse/`,
  `${sitePrefix}how-do-i-allow-localtv-through-windows-firewall/`,
];

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.xsl': 'application/xml; charset=utf-8',
};

const checks = [];
const failures = [];
const warnings = [];

function record(ok, label, detail = '') {
  const entry = { ok, label, detail };
  checks.push(entry);
  if (!ok) failures.push(entry);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? ` :: ${detail}` : ''}`);
}

function warn(label, detail) {
  warnings.push({ label, detail });
  console.log(`WARN ${label} :: ${detail}`);
}

function productionUrl(urlPath) {
  return new URL(urlPath, productionOrigin).href;
}

function localUrl(origin, urlPath) {
  return new URL(urlPath, origin).href;
}

function requestPathToFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  if (!pathname.startsWith(sitePrefix)) return null;

  let relativePath = pathname.slice(sitePrefix.length);
  if (!relativePath || relativePath.endsWith('/')) relativePath += 'index.html';
  const candidate = path.resolve(docsRoot, relativePath.replaceAll('/', path.sep));
  const relativeToDocs = path.relative(docsRoot, candidate);
  if (relativeToDocs.startsWith('..') || path.isAbsolute(relativeToDocs)) return null;
  return candidate;
}

function createStaticServer() {
  return http.createServer((request, response) => {
    let filePath;
    try {
      filePath = requestPathToFile(request.url);
    } catch {
      response.writeHead(400).end('Bad request');
      return;
    }

    if (!filePath) {
      response.writeHead(404).end('Not found');
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        response.writeHead(404).end('Not found');
        return;
      }
      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      if (request.method === 'HEAD') response.end();
      else fs.createReadStream(filePath).pipe(response);
    });
  });
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const canonical = document.querySelector('link[rel~="canonical"]')?.href || '';
    const robots = [...document.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')]
      .map((node) => node.content.toLowerCase());
    const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => {
      try {
        return { value: JSON.parse(node.textContent), error: null };
      } catch (error) {
        return { value: null, error: error.message };
      }
    });
    const breadcrumb = jsonLd.find(({ value }) => value?.['@type'] === 'BreadcrumbList');
    const internalTargets = [...document.querySelectorAll('a[href], link[rel~="stylesheet"][href]')]
      .map((node) => node.href)
      .filter((href) => {
        const url = new URL(href);
        return url.origin === location.origin && url.pathname.startsWith('/localtv-remote/');
      });
    const images = [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
    }));

    return {
      title: document.title.trim(),
      description: document.querySelector('meta[name="description"]')?.content.trim() || '',
      h1: [...document.querySelectorAll('h1')].map((node) => node.textContent.trim()),
      canonical,
      noindex: robots.some((content) => /(?:^|[,\s])noindex(?:[,\s]|$)/.test(content)),
      jsonErrors: jsonLd.filter(({ error }) => error).map(({ error }) => error),
      breadcrumb: breadcrumb?.value || null,
      internalTargets: [...new Set(internalTargets)],
      images,
      overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - window.innerWidth,
    };
  });
}

function validateBreadcrumb(data, expectedCanonical) {
  if (!data || !Array.isArray(data.itemListElement) || data.itemListElement.length < 2) {
    return 'missing BreadcrumbList with at least two items';
  }
  const positions = data.itemListElement.map((item) => item.position);
  if (!positions.every((position, index) => position === index + 1)) {
    return `positions are not sequential: ${positions.join(', ')}`;
  }
  const invalidItem = data.itemListElement.find((item) => (
    item?.['@type'] !== 'ListItem'
    || typeof item.name !== 'string'
    || !item.name.trim()
    || typeof item.item !== 'string'
    || !item.item.startsWith(`${productionOrigin}${sitePrefix}`)
  ));
  if (invalidItem) return `invalid list item: ${JSON.stringify(invalidItem)}`;
  const lastItem = data.itemListElement.at(-1).item;
  if (lastItem !== expectedCanonical) return `last item ${lastItem} does not match ${expectedCanonical}`;
  return null;
}

async function main() {
  fs.mkdirSync(screenshotRoot, { recursive: true });
  const server = createStaticServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  console.log(`INFO server ${origin}${sitePrefix}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const sitemapResponse = await context.request.get(localUrl(origin, `${sitePrefix}sitemap.xml`));
    record(sitemapResponse.status() === 200, 'sitemap served', `status=${sitemapResponse.status()}`);
    const rawSitemap = await sitemapResponse.text();
    const sitemap = await page.evaluate((raw) => {
      const xml = new DOMParser().parseFromString(raw, 'application/xml');
      const parserError = xml.querySelector('parsererror')?.textContent || '';
      const locations = [...xml.getElementsByTagNameNS('*', 'loc')].map((node) => node.textContent.trim());
      return { parserError, locations };
    }, rawSitemap);
    record(!sitemap.parserError, 'sitemap XML parses', sitemap.parserError);
    record(sitemap.locations.length === requiredPaths.length, 'sitemap has exactly 15 URLs', `count=${sitemap.locations.length}`);
    const requiredCanonicals = requiredPaths.map(productionUrl);
    record(
      requiredCanonicals.every((url) => sitemap.locations.includes(url))
        && sitemap.locations.every((url) => requiredCanonicals.includes(url)),
      'sitemap URL set matches expected canonical mappings',
      `actual=${JSON.stringify(sitemap.locations)}`,
    );
    const sitemapHosts = [...new Set(sitemap.locations.map((url) => {
      try { return new URL(url).host; } catch { return `INVALID:${url}`; }
    }))];
    record(
      sitemapHosts.length === 1 && sitemapHosts[0] === new URL(productionOrigin).host,
      'sitemap host is creationsofm7.github.io',
      `hosts=${sitemapHosts.join(', ')}`,
    );

    for (const urlPath of requiredPaths) {
      const response = await context.request.get(localUrl(origin, urlPath));
      record(response.status() === 200, `served 200 ${urlPath}`, `status=${response.status()}`);
    }

    const metadata = [];
    for (const urlPath of newPaths) {
      const pageErrors = [];
      const consoleErrors = [];
      const onPageError = (error) => pageErrors.push(error.message);
      const onConsole = (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      };
      page.on('pageerror', onPageError);
      page.on('console', onConsole);
      const response = await page.goto(localUrl(origin, urlPath), { waitUntil: 'networkidle' });
      const data = await inspectPage(page);
      page.off('pageerror', onPageError);
      page.off('console', onConsole);

      const expectedCanonical = productionUrl(urlPath);
      metadata.push({ urlPath, title: data.title, description: data.description });
      record(response?.status() === 200, `browser served 200 ${urlPath}`, `status=${response?.status()}`);
      record(data.h1.length === 1, `one H1 ${urlPath}`, `count=${data.h1.length}`);
      record(data.canonical === expectedCanonical, `canonical matches ${urlPath}`, `actual=${data.canonical}`);
      record(Boolean(data.title), `non-empty title ${urlPath}`);
      record(Boolean(data.description), `non-empty description ${urlPath}`);
      record(!data.noindex, `no noindex ${urlPath}`);
      record(data.jsonErrors.length === 0, `JSON-LD parses ${urlPath}`, data.jsonErrors.join(' | '));
      const breadcrumbError = validateBreadcrumb(data.breadcrumb, expectedCanonical);
      record(!breadcrumbError, `valid BreadcrumbList ${urlPath}`, breadcrumbError || '');
      record(pageErrors.length === 0, `no page errors ${urlPath}`, pageErrors.join(' | '));
      record(consoleErrors.length === 0, `no console errors ${urlPath}`, consoleErrors.join(' | '));

      for (const target of data.internalTargets) {
        const targetResponse = await context.request.get(target);
        const targetLabel = new URL(target).pathname;
        record(targetResponse.status() === 200, `local target exists ${urlPath} -> ${targetLabel}`, `status=${targetResponse.status()}`);
      }
    }

    for (const urlPath of guidePaths) {
      await page.goto(localUrl(origin, urlPath), { waitUntil: 'networkidle' });
      const h1 = await page.locator('h1').textContent();
      record(h1?.trim().startsWith('How do I'), `guide H1 starts "How do I" ${urlPath}`, `h1=${JSON.stringify(h1?.trim())}`);
    }

    const duplicateValues = (key) => {
      const counts = new Map();
      for (const item of metadata) counts.set(item[key], (counts.get(item[key]) || 0) + 1);
      return [...counts.entries()].filter(([value, count]) => value && count > 1);
    };
    const duplicateTitles = duplicateValues('title');
    const duplicateDescriptions = duplicateValues('description');
    record(duplicateTitles.length === 0, 'new pages have unique titles', JSON.stringify(duplicateTitles));
    record(duplicateDescriptions.length === 0, 'new pages have unique descriptions', JSON.stringify(duplicateDescriptions));

    const viewports = [
      { name: 'mobile', width: 390, height: 844 },
      { name: 'desktop', width: 1440, height: 1000 },
    ];
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const urlPath of newPaths) {
        await page.goto(localUrl(origin, urlPath), { waitUntil: 'networkidle' });
        const data = await inspectPage(page);
        record(data.overflow <= 0, `no horizontal overflow ${viewport.name} ${urlPath}`, `overflow=${data.overflow}px`);
        for (const image of data.images) {
          const loaded = image.complete && image.naturalWidth > 0;
          const imageUrl = new URL(image.src);
          if (!loaded && imageUrl.origin !== origin) {
            warn(`external image did not load ${viewport.name} ${urlPath}`, image.src);
          } else {
            record(loaded, `image loaded ${viewport.name} ${urlPath}`, image.src);
          }
        }

        if (screenshotPaths.includes(urlPath)) {
          const slug = urlPath === hubPath ? 'hub' : urlPath.includes('mouse') ? 'mouse' : 'firewall';
          const screenshotPath = path.join(screenshotRoot, `${slug}-${viewport.name}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`INFO screenshot ${screenshotPath}`);
        }
      }
    }

    await context.close();
  } finally {
    if (browser) await browser.close();
    server.close();
    await once(server, 'close');
  }

  console.log(`SUMMARY checks=${checks.length} passed=${checks.length - failures.length} failed=${failures.length} warnings=${warnings.length}`);
  if (failures.length) {
    console.log('FAILURES');
    for (const failure of failures) console.log(`- ${failure.label}${failure.detail ? ` :: ${failure.detail}` : ''}`);
  }
  if (warnings.length) {
    console.log('WARNINGS');
    for (const warning of warnings) console.log(`- ${warning.label} :: ${warning.detail}`);
  }
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((error) => {
  console.error(`FATAL ${error.stack || error.message}`);
  process.exitCode = 1;
});
