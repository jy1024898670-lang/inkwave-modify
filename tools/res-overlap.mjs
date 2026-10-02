// Measure the results-screen bottom-right corner: does the prompt pill overlap the button row?
// usage: node tools/res-overlap.mjs [mode]   (mode: zones | turf | boss)
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const mode = process.argv[2] || 'zones';
const W = +(process.argv[3] || 1600), H = +(process.argv[4] || 900);

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
    '--enable-gpu', '--ignore-gpu-blocklist', `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text().slice(0, 200)); });

const url = `http://localhost:8490/?skipTitle&autostart=40&mode=${mode}&diag=1`;
await page.goto(url, { waitUntil: 'load', timeout: 150000 });
await page.waitForFunction('window.__inkwave && window.__inkwave.match', { timeout: 150000, polling: 250 })
  .catch(() => console.log('!! match never appeared'));
const st = () => page.evaluate(() => {
  const g = window.__inkwave, m = g && g.match;
  return m ? { state: m.state, attract: !!m.attract, time: Math.round(m.time), dur: m.duration, mode: m.mode, actors: m.actors.length } : null;
}).catch(() => null);
console.log('after boot:', JSON.stringify(await st()));
// the intro must finish before the clock runs; endMatch only bites in 'playing'
const reachedPlaying = await page.waitForFunction("window.__inkwave.match && window.__inkwave.match.state === 'playing' && !window.__inkwave.match.attract", { timeout: 150000, polling: 250 })
  .then(() => true).catch(() => false);
if (!reachedPlaying) console.log('!! never reached playing:', JSON.stringify(await st()));
console.log('playing:', JSON.stringify(await st()));
await page.evaluate(() => { try { window.__inkwave.debug.endMatch(0.02); } catch (e) { console.log('endMatch', e.message); } });
console.log('after endMatch:', JSON.stringify(await st()));
for (let i = 0; i < 40; i++) {
  const has = await page.evaluate(() => !!document.querySelector('.iw-results')).catch(() => false);
  if (has) break;
  if (i % 8 === 0) console.log('  waiting…', JSON.stringify(await st()));
  await sleep(1500);
}
const landed = await page.evaluate(() => !!document.querySelector('.iw-results')).catch(() => false);
if (!landed) console.log('!! results never appeared:', JSON.stringify(await st()));
await sleep(4000);   // let the intro/reveal animations settle

const m = await page.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect();
    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), bottom: Math.round(b.bottom), right: Math.round(b.right) }; };
  const overlap = (a, b) => (!a || !b) ? null : Math.round(Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y));
  const cs = getComputedStyle(document.documentElement);
  const btns = r('.iw-res__btns'), prompts = r('.iw-prompts'), foot = r('.iw-res__foot');
  const body = r('.iw-res__body'), cover = r('.iw-res__cover'), teams = r('.iw-res__teams'), xp = r('.iw-xp');
  return {
    u: cs.getPropertyValue('--u').trim(), vw: innerWidth, vh: innerHeight,
    btns, prompts, foot, body, cover, teams, xp,
    overlapY: overlap(btns, prompts), overlapX: overlap(btns, prompts) === null ? null : Math.round(Math.min(btns.right, prompts.right) - Math.max(btns.x, prompts.x)),
    btnsBelowViewport: btns ? btns.bottom - innerHeight : null,
    bodyOverflow: body && teams ? Math.round(teams.bottom - foot.y) : null,
    btnCount: document.querySelectorAll('.iw-res__btns .iw-btn').length,
    modes: { res: !!document.querySelector('.iw-res__cover--zones'), boss: !!document.querySelector('.iw-res__boss') },
  };
});
console.log('MODE', mode);
console.log(JSON.stringify(m, null, 1));
console.log('VERDICT overlapY=' + m.overlapY + ' (negative/0 = clear)');
kill();
process.exit(0);