// Verify the diagnostic A/B pipeline flags actually change the pipeline. usage: node tools/diag-flags.mjs
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
  ['baseline', ''],
  ['?msaa=0', '?msaa=0'],
  ['?ao=0', '?ao=0'],
  ['?hf=0', '?hf=0'],
  ['?sfx=0', '?sfx=0'],
  ['?post=0', '?post=0'],
  ['?noprobe=1', '?noprobe=1'],
  ['?probe=5', '?probe=5'],
];
for (const [label, q] of arms) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 90)));
  await page.goto(`http://localhost:8490/?skipTitle&${q.replace(/^\?/, '')}`, { waitUntil: 'load', timeout: 120000 }).catch((e) => errs.push('goto ' + e.message.slice(0, 60)));
  await page.waitForFunction('window.__inkwave && window.__diag', { timeout: 120000, polling: 250 }).catch(() => errs.push('no boot'));
  await sleep(3500);
  const r = await page.evaluate(() => {
    const d = JSON.parse(window.__diag.dump());
    return { pipe: d.pipe, on: d.on, frames: d.frames };
  }).catch((e) => ({ err: e.message.slice(0, 60) }));
  console.log(label.padEnd(12), JSON.stringify(r), errs.length ? 'ERR:' + errs.join('|') : '');
  await page.close().catch(() => {});
}
kill();
process.exit(0);