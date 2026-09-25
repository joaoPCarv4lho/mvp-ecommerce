/**
 * Lighthouse (mobile, default throttling) on the prerendered build.
 *
 * Writes HTML + JSON reports to docs/lighthouse/ and exits 1 when Performance < 90
 * or Accessibility < 95 (§9, criteria #33 and #34).
 * CHROMIUM_PATH points at a preinstalled browser when Chrome is not on PATH.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { ROOT } from './routes.mjs';

const PORT = 4180;
const BASE = `http://localhost:${PORT}`;
const DIST = join(ROOT, 'frontend', 'dist');
const OUT = join(ROOT, 'docs', 'lighthouse');
const MIN = { performance: 90, accessibility: 95 };

const TARGETS = [
  { name: 'home', url: `${BASE}/` },
  { name: 'produto', url: `${BASE}/produto/playstation-5-pro-2tb-lacrado` },
];

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) throw new Error(`static server did not answer on ${BASE}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

mkdirSync(OUT, { recursive: true });
const server = spawn('npx', ['serve', DIST, '-s', '-l', String(PORT)], { cwd: join(ROOT, 'frontend'), stdio: 'ignore' });
const rows = [];

try {
  await waitForServer();
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
    ...(process.env.CHROMIUM_PATH ? { chromePath: process.env.CHROMIUM_PATH } : {}),
  });
  try {
    for (const { name, url } of TARGETS) {
      const result = await lighthouse(url, { port: chrome.port, output: ['html', 'json'], logLevel: 'error' });
      writeFileSync(join(OUT, `${name}.report.html`), result.report[0]);
      writeFileSync(join(OUT, `${name}.report.json`), result.report[1]);
      const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([k, c]) => [k, Math.round(c.score * 100)]));
      rows.push({ name, url, scores });
    }
  } finally {
    await chrome.kill();
  }
} finally {
  server.kill();
}

let failed = 0;
for (const { name, scores } of rows) {
  const line = Object.entries(scores)
    .map(([k, v]) => `${k} ${v}`)
    .join(' · ');
  const bad = Object.entries(MIN).filter(([k, min]) => scores[k] < min);
  if (bad.length) failed++;
  console.log(`${bad.length ? '❌' : '✅'} ${name}: ${line}`);
  for (const [k, min] of bad) console.log(`     ${k} ${scores[k]} is below the ${min} minimum`);
}
console.log(`\nreports in docs/lighthouse/`);
process.exit(failed ? 1 : 0);
