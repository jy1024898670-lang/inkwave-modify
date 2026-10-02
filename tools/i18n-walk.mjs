// Headless i18n residual walk: boots in Chinese, navigates every menu screen via
// __inkwave.menus._go(...), and reports text still in English (ASCII letter runs
// not on the proper-noun allowlist). usage: node tools/i18n-walk.mjs [url]
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

function chromePath() {
  const cands = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.evaluateOnNewDocument(() => localStorage.setItem('inkwave.lang', 'zh'));
await page.goto(`${URL}/?skipTitle&news=force`, { waitUntil: 'networkidle2', timeout: 180000 }).catch((e) => console.log('goto', e.message));

// wait for the main menu
for (let i = 0; i < 60; i++) {
  const ok = await page.evaluate(() => (document.body?.innerText || '').includes('开始游戏')).catch(() => false);
  if (ok) break;
  await sleep(2000);
}
await sleep(2500);   // let the main menu settle

// ---- residual extractor (runs in-page): ASCII letter runs of length >= 2, minus allowlist
const scanFn = () => {
  const ALLOW = new Set([
    // brand / boss / font / acronyms / keycaps
    'INKWAVE', 'HULLBREAKER', 'Titan', 'One', 'Rubik', 'Font', 'Diner', 'Hubert', 'Fischer',
    'MSAA', 'XP', 'LMB', 'RMB', 'TAB', 'SHIFT', 'CTRL', 'SPACE', 'ENTER', 'ESC', 'JOIN', 'VIEW', 'F11', 'F12', 'NETXX', 'Yeah',
    // character + bot names (proper nouns, kept in English by design)
    'Tako', 'Juno', 'Fizz', 'Loop', 'Meta', 'Drip', 'Moxie', 'Pip', 'Wasabi', 'Otto', 'Glub', 'Momo',
    'Wavebreaker', 'Kraken', 'Kai', 'Tentakool', 'Tidal', 'Tia', 'Coraline', 'Juniper', 'Nibbles', 'Seafoam', 'Pixel', 'Squee', 'Dashi', 'Zippy',
    'Mako', 'Blot', 'Lulu', 'Marlo', 'Nori', 'Suki', 'Zest', 'Kelp', 'Coral', 'Inky', 'Vee', 'Sprinkle', 'Squiddo', 'Blotch', 'Riptide', 'Bubbles',
    // team palettes
    'Tangerine', 'Cobalt', 'Bubblegum', 'Mint', 'Lemon', 'Grape', 'Aqua', 'Cherry', 'Lime', 'Magenta', 'Sun', 'Sea', 'Alpha', 'Bravo',
    // music track titles (proper nouns)
    'Splash', 'Attitude', 'Harbor', 'Lounge', 'Fresh', 'Victory', 'Final', 'Shell', 'Shock', 'Hull', 'Alarm',
    // waddle shout
    'DEEP', 'bi',
    // room-code alphabet sample / single chars
    'BCEFGHJKLMNPQRTUVXYZ23456789',
    // keycaps (title case) + credits/license
    'Esc', 'Enter', 'Tab', 'Shift', 'Space', 'SIL', 'Jayden', 'Davis', 'github', 'com', 'jaydendavisnc', 'inkwave',
  ]);
  const out = new Set();
  const runs = (t) => (t.match(/[A-Za-z]{2,}/g) || []);
  const visible = (el) => el && (typeof el.checkVisibility === 'function'
    ? el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })
    : !!el.offsetParent);
  const walker = document.createTreeWalker(document.body, 4 /* SHOW_TEXT */);
  let n;
  while ((n = walker.nextNode())) {
    const p = n.parentElement;
    if (!p || p.closest('script,style,template')) continue;
    if (!visible(p)) continue;
    for (const r of runs(n.nodeValue)) if (!ALLOW.has(r)) out.add(r + '  ⟵  ' + n.nodeValue.trim().slice(0, 70));
  }
  for (const el of document.querySelectorAll('[title],[placeholder],[aria-label]')) {
    if (!visible(el)) continue;
    for (const a of ['title', 'placeholder', 'aria-label']) {
      const v = el.getAttribute(a);
      if (!v) continue;
      for (const r of runs(v)) if (!ALLOW.has(r)) out.add(r + '  ⟵  [' + a + '] ' + v.slice(0, 60));
    }
  }
  return [...out];
};

const go = async (name) => {
  await page.evaluate((nm) => window.__inkwave?.menus?._go(nm), name).catch(() => {});
  await sleep(2200);
};
const dump = async (label) => {
  const res = await page.evaluate(scanFn).catch(() => ['<scan failed>']);
  console.log(`\n===== ${label} (${res.length} residuals) =====`);
  for (const r of res.slice(0, 60)) console.log('  ' + r);
};

// ---- What's New card (?news=force): wait for it, dump page 1, click 继续, dump page 2
for (let i = 0; i < 25; i++) {
  const open = await page.evaluate(() => !!document.querySelector('.iw-news')).catch(() => false);
  if (open) break;
  await sleep(1000);
}
await sleep(1500);
await dump('NEWS page 1');
const cont = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').includes('继续'));
  if (b) { b.click(); return true; }
  return false;
});
if (cont) { await sleep(1800); await dump('NEWS page 2'); }
else console.log('\n(no 继续 button on news card)');
// close the card and back to the main menu
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /稍后|Skip/.test(x.textContent || ''));
  if (b) b.click();
}).catch(() => {});
await sleep(1500);

await go('main');
await dump('MAIN (main menu)');
await go('mode');    await dump('MODE (mode cards)');
// pick a mode card to reach the setup / stage-select screen
const card = await page.evaluate(() => {
  const c = document.querySelector('.iw-mode, [class*="mode"] .iw-card, .iw-card');
  if (c) { c.click(); return (c.className || '').slice(0, 40); }
  return null;
});
await sleep(2200);
await dump('SETUP (stage select)' + (card ? ` [clicked ${card}]` : ''));
await go('loadout');  await dump('LOADOUT');
await go('locker');   await dump('LOCKER');
await go('settings'); await dump('SETTINGS');
await go('howto');    await dump('HOWTO');
await go('online');   await dump('ONLINE');
await go('credits');  await dump('CREDITS');

kill();
process.exit(0);
