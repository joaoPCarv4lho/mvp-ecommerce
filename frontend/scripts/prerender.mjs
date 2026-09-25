import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { getIndexableRoutes, ROOT } from './routes.mjs';

const PORT = 4180;
const BASE = `http://localhost:${PORT}`;
const DIST = join(ROOT, 'frontend', 'dist');

/** `npx serve dist -s` answers every route with index.html, which is what the SPA needs. */
function startServer() {
  const child = spawn('npx', ['serve', DIST, '-s', '-l', String(PORT)], { cwd: join(ROOT, 'frontend'), stdio: 'ignore' });
  child.on('error', (e) => {
    console.error('failed to start the static server:', e.message);
    process.exit(1);
  });
  return child;
}

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const r = await fetch(BASE);
      if (r.ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error(`static server did not answer on ${BASE}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

const head = (html, re) => re.exec(html)?.[1];

const server = startServer();
let failures = [];
try {
  await waitForServer();
  // CHROMIUM_PATH lets a sandbox point at a preinstalled build instead of Playwright's own.
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  const canonicals = new Map();
  const descriptions = new Map();
  const routes = getIndexableRoutes();

  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForSelector('main h1', { timeout: 15000 }).catch(() => {
      failures.push(`${route}: no <h1> inside <main>`);
    });
    const html = await page.content();

    const canonical = head(html, /<link rel="canonical" href="([^"]+)"/);
    const title = head(html, /<title>([^<]*)<\/title>/);
    const description = head(html, /<meta name="description" content="([^"]*)"/);
    if (!canonical) failures.push(`${route}: missing <link rel="canonical">`);
    if (!title) failures.push(`${route}: missing <title>`);
    if (!description) failures.push(`${route}: missing meta description`);
    if (canonical && canonicals.has(canonical)) failures.push(`${route}: canonical duplicates ${canonicals.get(canonical)} (${canonical})`);
    else if (canonical) canonicals.set(canonical, route);
    if (description && descriptions.has(description)) failures.push(`${route}: description duplicates ${descriptions.get(description)}`);
    else if (description) descriptions.set(description, route);

    const file = route === '/' ? join(DIST, 'index.html') : join(DIST, route, 'index.html');
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, html);
  }

  await browser.close();
  console.log(`prerendered ${routes.length} routes`);
} finally {
  server.kill();
}

if (failures.length) {
  for (const f of failures) console.error(`❌ ${f}`);
  process.exit(1);
}
