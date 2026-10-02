// Smoke test for the diag POST path: boot ?skipTitle (no ?diag → POST mode), wait a few
// flush cycles, then confirm the client actually wrote events to the server.
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

function chromePath() {
  const cands = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
  for (const c of cands) if (existsSync(c)) return c;
  return undefined;
}
const URL = process.argv[2] || 'http://localhost:8490';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: chromePath(), headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=1600,900'],
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(`${URL}/?skipTitle`, { waitUntil: 'networkidle2', timeout: 180000 }).catch((e) => console.log('goto', e.message));
for (let i = 0; i < 20; i++) {
  const up = await page.evaluate(() => !!(window.__inkwave && window.__diag)).catch(() => false);
  if (up) break;
  await sleep(3000);
}
await sleep(9000);   // a few 3s flush cycles
const st = await page.evaluate(() => {
  const d = window.__diag && JSON.parse(window.__diag.dump());
  return d ? { frames: d.frames, meta: d.meta, events: d.events.length } : null;
}).catch(() => null);
console.log('client diag:', JSON.stringify(st));
kill();
process.exit(0);
