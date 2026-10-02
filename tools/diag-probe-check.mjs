// Verify the pixel probe is off by default and on when asked, and that neither breaks the loop.
// usage: node tools/diag-probe-check.mjs
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

function chromePath() {
  const c = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
  for (const p of c) if (existsSync(p)) return p;
  return undefined;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: chromePath(), headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=900,600'],
  defaultViewport: { width: 900, height: 600, deviceScaleFactor: 1 },
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);

const arms = [
  ['default (probe OFF)', ''],
  ['?probe=1 (probe ON)', 'probe=1'],
];
for (const [label, q] of arms) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
  await page.goto(`http://localhost:8490/?skipTitle&${q}`, { waitUntil: 'load', timeout: 120000 })
    .catch((e) => errs.push('goto ' + e.message.slice(0, 60)));
  const booted = await page.waitForFunction('window.__inkwave && window.__diag', { timeout: 120000, polling: 250 })
    .then(() => true).catch(() => false);
  await sleep(22000);   // several 3 s flush heartbeats
  const r = await page.evaluate(() => {
    const d = JSON.parse(window.__diag.dump());
    const c = {};
    for (const e of d.events) c[e.type] = (c[e.type] || 0) + 1;
    return { booted: true, on: d.on, probeOff: d.probeOff, probeEvery: d.probeEvery, frames: d.frames,
      types: c, pixelEvents: (c['black-frame'] || 0) + (c.flash || 0) + (c.trace || 0) };
  }).catch((e) => ({ err: e.message.slice(0, 70) }));
  console.log(label.padEnd(20), JSON.stringify(r), errs.length ? 'ERR:' + errs.join('|') : '');
  await page.close().catch(() => {});
}
kill();
process.exit(0);