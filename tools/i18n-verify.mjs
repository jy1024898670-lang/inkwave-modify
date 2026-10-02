// Headless verification: (A) main menu boots in Chinese via i18n.js, (B) an autopilot 5 v 5 match reaches 'playing'.
// usage: node tools/i18n-verify.mjs [url]   (default http://localhost:8490)
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

function chromePath() {
  const cands = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
  for (const c of cands) if (existsSync(c)) return c;
  return undefined;
}
const URL = process.argv[2] || 'http://localhost:8490';
const browser = await puppeteer.launch({
  executablePath: chromePath(), headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=1600,900'],
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { kill(); process.exit(130); });
const errs = [];
const attach = (p, tag) => {
  p.on('console', (m) => { if (m.type() === 'error') errs.push(`${tag}: ${m.text()}`); });
  p.on('pageerror', (e) => errs.push(`${tag}: PAGEERROR ${e.message}`));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- A: menu in Chinese (lang preset in localStorage before the app boots)
const a = await browser.newPage(); attach(a, 'zh');
await a.evaluateOnNewDocument(() => localStorage.setItem('inkwave.lang', 'zh'));
await a.goto(`${URL}/?skipTitle`, { waitUntil: 'networkidle2', timeout: 180000 }).catch((e) => console.log('A goto', e.message));
let zh = null;
for (let i = 0; i < 90; i++) {
  const r = await a.evaluate(() => {
    const t = document.body ? document.body.innerText : '';
    const hits = ['开始游戏', '装备', '设置', '玩法说明', '联机对战'].filter((s) => t.includes(s));
    return { hits, lang: document.documentElement.lang, btn: !!document.querySelector('.iw-lang'), btnLabel: document.querySelector('.iw-lang')?.textContent || '' };
  }).catch(() => null);
  if (r && r.hits.length) { zh = r; break; }
  await sleep(2000);
}
console.log('i18n ->', zh && zh.hits.length ? 'OK' : 'FAIL', JSON.stringify(zh));

// ---- B: autopilot 5 v 5 reaches playing
const b = await browser.newPage(); attach(b, 'match');
await b.goto(`${URL}/?autostart=60&autopilot&shadercheck`, { waitUntil: 'networkidle2', timeout: 180000 }).catch((e) => console.log('B goto', e.message));
let st = null;
for (let i = 0; i < 130; i++) {
  st = await b.evaluate(() => (window.__inkwave && __inkwave.match) ? { state: __inkwave.match.state, t: +(__inkwave.match.time || 0).toFixed(1), actors: __inkwave.match.actors.length, turf: __inkwave.match.actors.map((x) => Math.round(x.stats.turf)), fps: __inkwave.fps } : null).catch(() => null);
  if (st && st.state === 'playing') break;
  await sleep(2000);
}
await sleep(15000);   // let a few bot shots fly so turf starts moving
st = await b.evaluate(() => (window.__inkwave && __inkwave.match) ? { state: __inkwave.match.state, t: +(__inkwave.match.time || 0).toFixed(1), actors: __inkwave.match.actors.length, turf: __inkwave.match.actors.map((x) => Math.round(x.stats.turf)), fps: __inkwave.fps } : null).catch(() => null);
console.log('match ->', JSON.stringify(st));
const clean = errs.filter((e) => !/Failed to fetch|404|preload|WebGL context|OES_packed|swiftshader/i.test(e));
console.log('errors:', clean.slice(0, 8).join(' | ') || 'none');
kill();
process.exit(!(zh && zh.hits.length) || !st || st.state !== 'playing' || clean.length ? 1 : 0);
