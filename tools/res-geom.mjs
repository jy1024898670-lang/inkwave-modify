// Measure results-screen bottom-right geometry (button row vs the prompt pill) for
// turf / zones / boss at 1600x900 and the user's 2133x1012. usage: node tools/res-geom.mjs
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
    '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=1600,900'],
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
await page.evaluateOnNewDocument(() => localStorage.setItem('inkwave.lang', 'zh'));
await page.goto('http://localhost:8490/?skipTitle', { waitUntil: 'load', timeout: 180000 })
  .catch((e) => errs.push('goto ' + e.message));
for (let i = 0; i < 90; i++) {
  const ok = await page.evaluate(() => (document.body?.innerText || '').includes('开始游戏')).catch(() => false);
  if (ok) break;
  await sleep(2000);
}
await sleep(2500);

const SIZES = [[1600, 900], [2133, 1012]];

function makeData(mode) {
  const P = (i, team) => ({ name: 'Bot' + (i + 1), team, weapon: ['shooter', 'roller', 'charger', 'blaster', 'bucket'][i % 5],
    turf: 140 + i * 37 + (team ? 13 : 0), splats: (i * 3) % 7, deaths: (i * 5) % 6, isSelf: i === 0 && team === 0, bot: true });
  const base = { win: true, percents: [57.3, 42.7], colors: ['#ff7a3c', '#3f6fe8'], teamNames: ['Alpha', 'Bravo'],
    mapName: 'Tidewater Plaza',
    xp: { gained: 320, levelBefore: 3, levelAfter: 4, xpBefore: 120, xpAfter: 440, xpToNextBefore: 500, xpToNextAfter: 900 } };
  if (mode === 'boss') {
    return { ...base, mode: 'boss', percents: [100, 0],
      boss: { name: 'HULLBREAKER', defeated: true, time: 342, hpLeft: 0, phase: 2 },
      players: Array.from({ length: 8 }, (_, i) => ({ ...P(i, 0), damage: 900 - i * 97, weakHits: (i * 2) % 5 })) };
  }
  const players = [0, 1].flatMap((t) => Array.from({ length: 5 }, (_, i) => P(i, t)));
  if (mode === 'zones') return { ...base, mode: 'zones', players,
    zones: { reason: 'knockout', counts: [0, 43], penalty: [0, 12], winner: 0 } };
  return { ...base, players };
}

const measure = () => {
  const run = () => {
  const sc = document.querySelector('.iw-results');
  if (sc) {
    sc.classList.remove('is-intro');
    sc.style.translate = ''; sc.style.transform = ''; sc.style.opacity = '';
    try { for (const a of document.getAnimations()) { try { a.finish(); } catch (e2) { /* frozen anim */ } } } catch (e2) { /* no WAAPI */ }
    for (const sel of ['.iw-res__head', '.iw-res__body', '.iw-res__cover', '.iw-res__teams', '.iw-res__foot', '.iw-res__btns', '.iw-prompts']) {
      const e = sc.querySelector(sel);
      if (e) { e.style.translate = ''; e.style.transform = ''; e.style.opacity = ''; }
    }
  }
  const r = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top), bottom: Math.round(b.bottom), right: Math.round(b.right) };
  };
  const ov = (a, b) => (a && b) ? { dy: Math.round(Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)), dx: Math.round(Math.min(a.right, b.right) - Math.max(a.x, b.x)) } : null;
  const btns = r('.iw-res__btns'), prompts = r('.iw-prompts'), foot = r('.iw-res__foot'),
    body = r('.iw-res__body'), cover = r('.iw-res__cover'), teams = r('.iw-res__teams'), head = r('.iw-res__head');
  const pEl = document.querySelector('.iw-prompts');
  const uEl = document.querySelector('.iw-ui') || document.body;
  window.scrollTo(0, 0);
  const docEl = document.scrollingElement || document.documentElement;
  docEl.scrollTop = 0; document.body.scrollTop = 0;
  const cbOf = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return { pos: cs.position, top: cs.top, bottom: cs.bottom, h: Math.round(b.height), y: Math.round(b.y), scrollY: Math.round(docEl.scrollTop || 0), canvasH: (document.querySelector('canvas') || {}).clientHeight || null };
  };
  const u = getComputedStyle(uEl).getPropertyValue('--u').trim();
  return {
    vw: innerWidth, vh: innerHeight, u,
    btns, prompts, foot, body, cover, teams, head,
    btnsVSprompts: ov(btns, prompts), footVsPrompts: ov(foot, prompts), headVsBody: ov(head, body),
    btnsBelowView: btns ? Math.round(btns.bottom - innerHeight) : null,
    footBelowBody: body && foot ? Math.round(foot.bottom - body.bottom) : null,
    intro: !!document.querySelector('.iw-results.is-intro'),
    promptsText: pEl ? pEl.textContent.trim().replace(/\s+/g, ' ').slice(0, 90) : null,
    promptsCssBottom: pEl ? getComputedStyle(pEl).bottom : null,
    promptsParent: pEl && pEl.parentElement ? String(pEl.parentElement.className).slice(0, 50) : null,
    uiBox: cbOf('.iw-ui'), screenBox: cbOf('.iw-screen'),
    bodyInlineStyle: (document.querySelector('.iw-res__body') || { style: { cssText: '' } }).style.cssText || null,
    btnLabels: [...document.querySelectorAll('.iw-res__btns .iw-btn')].map((b) => (b.textContent || '').trim().slice(0, 24)),
  };
  };
  try { return run(); } catch (e) { return { error: e.message, stack: String(e.stack || '').slice(0, 400) }; }
};

const out = [];
for (const mode of ['turf', 'zones', 'boss']) {
  const ok = await page.evaluate((md) => {
    const m = window.__inkwave?.menus;
    if (!m || typeof m.showResults !== 'function') return 'no menus';
    m.showResults(md);
    m.show('results');
    return true;
  }, makeData(mode)).catch((e) => 'ERR ' + e.message);
  if (ok !== true) { out.push({ mode, error: ok }); continue; }
  // headless dt is clamped so the JS intro timeline (2.3 s game-time) never advances — force the settled state
  await sleep(1000);
  // the JS intro timeline is frozen by the clamped headless dt and parks elements mid-slide via inline
  // styles — settling is done synchronously inside measure() (class removal + finish() + style clear), then rect
  for (const [w, hh] of SIZES) {
    await page.setViewport({ width: w, height: hh, deviceScaleFactor: 1 }).catch(() => {});
    await sleep(1600);   // 0.75 s body slide + staggered rows settle
    const g = await page.evaluate(measure).catch((e) => ({ error: e.message }));
    out.push(Object.assign({ mode, size: w + 'x' + hh }, g));
  }
  await page.evaluate(() => window.__inkwave.menus.show('main', { back: true })).catch(() => {});
  await sleep(2600);
}
for (const o of out) console.log(JSON.stringify(o));
console.log('pageerrors:', errs.length ? errs : 'none');
kill();
process.exit(0);
