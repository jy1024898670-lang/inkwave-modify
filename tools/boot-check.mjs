// Boot check with FULL console capture: where does the page die (or slow down) after the renderer edits?
// usage: node tools/boot-check.mjs [url] [waitSeconds]
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

function chromePath() {
  const cands = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
  for (const c of cands) if (existsSync(c)) return c;
  return undefined;
}
const URL = process.argv[2] || 'http://localhost:8490/?skipTitle&d3d11fix=1&probe=30';
const WAIT = +(process.argv[3] || 120);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: chromePath(), headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=1600,900'],
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
const page = await browser.newPage();
const out = [];
page.on('console', (m) => out.push(`[${m.type()}] ${m.text().slice(0, 220)}`));
page.on('pageerror', (e) => out.push(`[pageerror] ${String(e).slice(0, 220)}`));
page.on('requestfailed', (r) => out.push(`[reqfail] ${r.url().slice(0, 120)} ${r.failure()?.errorText || ''}`));
const t0 = Date.now();
await page.goto(URL, { waitUntil: 'load', timeout: 180000 }).catch((e) => out.push('[goto] ' + e.message));
console.log('goto done at', ((Date.now() - t0) / 1000).toFixed(1) + 's');
let upAt = null;
const deadline = Date.now() + WAIT * 1000;
while (Date.now() < deadline) {
  const st = await page.evaluate(() => ({
    iw: !!window.__inkwave,
    match: !!(window.__inkwave && window.__inkwave.match),
    diag: !!window.__diag,
    canvas: !!document.querySelector('canvas'),
    state: window.__inkwave && window.__inkwave.match ? window.__inkwave.match.state : null,
  })).catch(() => null);
  if (st && st.iw && !upAt) { upAt = ((Date.now() - t0) / 1000).toFixed(1); console.log('booted at', upAt + 's', JSON.stringify(st)); }
  if (st && st.match) { console.log('match at', ((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify(st)); break; }
  await sleep(1000);
}
const d = await page.evaluate(() => {
  const x = window.__diag && JSON.parse(window.__diag.dump());
  return x ? { frames: x.frames, events: x.events.length } : null;
}).catch(() => null);
console.log('final diag:', JSON.stringify(d));
console.log('console (first 25):');
for (const l of out.slice(0, 25)) console.log('  ' + l);
console.log('console total:', out.length);
kill();
process.exit(0);
