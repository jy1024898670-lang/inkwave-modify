// LOBBY screen layout check: boots the game headless, creates a room via the ONLINE card, then measures
// the left settings panel vs the bottom controls bar (the 'PUBLIC ROOM' row used to run into the weapon/
// look chips). Saves a screenshot for eyeballing.
// usage: node tools/lobby-layout-check.mjs   (relay on :8787 + static server on :8490 first)
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function chromePath() {
  const c = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
  for (const p of c) if (existsSync(p)) return p;
  return undefined;
}
const W = Number(process.env.W) || 1280, H = Number(process.env.H) || 720;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: chromePath(), headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-gpu', '--ignore-gpu-blocklist', `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  protocolTimeout: 240000,
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
const lang = process.env.UI_LANG || 'zh';   // zh matches the user's screenshot (CJK text reflows the rows)
const setLang = async (l) => {
  if (!l || l === 'en') return;
  await page.goto('http://localhost:8490/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate((v) => localStorage.setItem('inkwave.lang', v), l);
};

const R = { fatal: null };
try {
  await setLang(lang);
  await page.goto('http://localhost:8490/?skipTitle', { waitUntil: 'load', timeout: 240000 });
  await page.waitForSelector('.iw-btn--online', { timeout: 240000 });
  await page.evaluate(() => document.querySelector('.iw-btn--online').click());
  await page.waitForSelector('.iw-screen.iw-online .iw-hub__rooms', { timeout: 60000 });
  await page.evaluate(() => document.querySelector('.iw-screen.iw-online [data-cur="own"]').click());
  await page.waitForSelector('.iw-screen.iw-lobby .iw-lset__panel', { timeout: 120000 });
  // turn the room public (the user's screenshot state: the note text sits on the row)
  await page.evaluate(() => { const t = document.querySelector('.iw-lset--public .iw-toggle'); if (t && !t.classList.contains('is-on')) t.click(); });
  // wait for the entrance animations to finish — measuring mid-`iw-in-up` offsets the bar by 3.2u and
  // hides real overlaps (headless SwiftShader can stall animation ticks, so allow a generous budget)
  R.animsSettled = await page.waitForFunction(() => {
    const bar = document.querySelector('.iw-lobby .iw-lob__bar');
    const side = document.querySelector('.iw-lobby .iw-lob__side');
    return !!(bar && side) && bar.getAnimations({ subtree: false }).length === 0 && side.getAnimations({ subtree: false }).length === 0;
  }, { timeout: 15000 }).then(() => true).catch(() => false);
  await new Promise((r) => setTimeout(r, 300));

  R.m = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect();
      return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), left: Math.round(b.left) }; };
    const ui = document.querySelector('.iw-ui') || document.body;
    const bar = document.querySelector('.iw-lobby .iw-lob__bar');
    const anims = bar ? bar.getAnimations({ subtree: false }).map((a) => `${a.animationName}:${a.playState}`) : [];
    return {
      vw: innerWidth, vh: innerHeight,
      u: parseFloat(getComputedStyle(ui).getPropertyValue('--u')) || null,
      sab: getComputedStyle(ui).getPropertyValue('--sab').trim(),
      side: r('.iw-lobby .iw-lob__side'),
      rc: r('.iw-lobby .iw-rc'),
      panel: r('.iw-lobby .iw-lset__panel'),
      pubRow: r('.iw-lobby .iw-lset--public'),
      bar: r('.iw-lobby .iw-lob__bar'),
      barCssBottom: bar ? getComputedStyle(bar).bottom : null,
      barAnims: anims,
      you: r('.iw-lobby .iw-lob__you'),
    };
  });
  mkdirSync(join(dirname(fileURLToPath(import.meta.url)), 'shots'), { recursive: true });
  R.shot = join(dirname(fileURLToPath(import.meta.url)), 'shots', 'lobby-1280x720.png');
  await page.screenshot({ path: R.shot });
} catch (e) {
  R.fatal = String(e.message || e).slice(0, 200);
}

const m = R.m;
if (m) {
  const show = (k) => m[k] ? `${m[k].top}..${m[k].bottom} (h ${m[k].h})` : 'missing';
  console.log(`viewport ${m.vw}x${m.vh}, u=${m.u}px, --sab=${m.sab}, barCssBottom=${m.barCssBottom}, barAnims=${JSON.stringify(m.barAnims)}, settled=${R.animsSettled}`);
  for (const k of ['side', 'rc', 'panel', 'pubRow', 'bar', 'you']) console.log(`  ${k.padEnd(8)} ${show(k)}`);
  if (m.panel && m.bar) {
    R.overlap = Math.max(0, m.panel.bottom - m.bar.top);
    R.xOverlap = Math.max(0, Math.min(m.panel.left + 560, m.bar.left + 560) - Math.max(m.panel.left, m.bar.left));
  }
  if (m.pubRow && m.you) R.pubVsYou = Math.max(0, m.pubRow.bottom - m.you.top);
  console.log(`panel/bar vertical overlap: ${R.overlap ?? 'n/a'}px | pub row vs weapon/look chips: ${R.pubVsYou ?? 'n/a'}px`);
}
console.log('screenshot:', R.shot ?? 'n/a');
console.log('pageerrors:', errs.length ? errs : 'none');
console.log('VERDICT', R.fatal ? `LOBBY-LAYOUT-FAIL (${R.fatal})` : ((R.overlap ?? 0) === 0 && (R.pubVsYou ?? 0) === 0 ? 'LOBBY-LAYOUT-PASS' : 'LOBBY-LAYOUT-FAIL'));
await browser.close().catch(() => {});
