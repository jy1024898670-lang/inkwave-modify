// D3D11 byte-pipeline check (headless): boot ?d3d11fix=1&probe=30, confirm the composer reports
// samples:0 + rt:byte + d3d11:true in the pipe snapshot, frames advance, and nothing errors.
// usage: node tools/d3d-check.mjs
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

function chromePath() {
  const cands = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
  for (const c of cands) if (existsSync(c)) return c;
  return undefined;
}
const URL = process.argv[2] || 'http://localhost:8490/?skipTitle&d3d11fix=1&probe=30';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: chromePath(), headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=1600,900'],
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 180000 }).catch((e) => errs.push('goto ' + e.message));
for (let i = 0; i < 20; i++) {
  const up = await page.evaluate(() => !!(window.__inkwave && window.__diag)).catch(() => false);
  if (up) break;
  await sleep(3000);
}
await sleep(9000);   // a few flush cycles
const st = await page.evaluate(() => {
  const d = window.__diag && JSON.parse(window.__diag.dump());
  const evs = (d && d.events) || [];
  const pipe = evs.filter((e) => e.type === 'pipe').slice(-1);
  const m = window.__inkwave && window.__inkwave.match;
  return {
    frames: d ? d.frames : null,
    events: evs.length,
    pipe,
    state: m ? m.state : null,
  };
}).catch((e) => ({ error: e.message }));
console.log(JSON.stringify(st, null, 1));
console.log('pageerrors:', errs.length ? errs : 'none');
kill();
process.exit(0);
