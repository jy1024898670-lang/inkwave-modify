// Headless check for the in-match PAUSE menus (not covered by i18n-walk, which only visits lobby screens):
//   page A: practice match (loadout -> PRACTICE button) -> Esc -> scan the practice pause screen
//           (the CHANGE LOADOUT / RESET STAGE / NEW STAGE / END PRACTICE / YOUR LOADOUT / QUICK CONTROLS cluster)
//   page B: regular autopilot match -> Esc -> scan the regular pause screen
// Residuals = visible ASCII letter runs of length >= 2 not on the proper-noun allowlist (same rules as i18n-walk).
// usage: node tools/practice-pause-check.mjs [url]
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
  // music track titles
  'Splash', 'Attitude', 'Harbor', 'Lounge', 'Fresh', 'Victory', 'Final', 'Shell', 'Shock', 'Hull', 'Alarm',
  // waddle shout / room-code sample
  'DEEP', 'bi', 'BCEFGHJKLMNPQRTUVXYZ23456789',
  // keycaps (title case) + credits/license
  'Esc', 'Enter', 'Tab', 'Shift', 'Space', 'SIL', 'Jayden', 'Davis', 'github', 'com', 'jaydendavisnc', 'inkwave',
  // loanwords / units / abbreviations / style names / language toggle (intentional English, see i18n-walk)
  'BOSS', 'Boss', 'VS', 'HP', 'EN', 'px', 'by', 'MIT', 'three', 'js', 'Rookie', 'Tide', 'Tan', 'Switch', 'to', 'English',
]);

const scanFn = (allowArr, expect) => {
  const ALLOW = new Set(allowArr);
  const runs = (t) => (t.match(/[A-Za-z]{2,}/g) || []);
  const visible = (el) => {
    if (!el) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };
  const out = new Set();
  const walker = document.createTreeWalker(document.body, 4 /* SHOW_TEXT */);
  let n;
  while ((n = walker.nextNode())) {
    const p = n.parentElement;
    if (!p || p.closest('script,style,template')) continue;
    if (!visible(p)) continue;
    for (const r of runs(n.nodeValue)) if (!ALLOW.has(r)) out.add(r + '  <-  ' + n.nodeValue.trim().slice(0, 60));
  }
  const text = document.body.innerText || '';
  const hits = expect.filter((s) => text.includes(s));
  return { missingZh: expect.filter((s) => !text.includes(s)), residuals: [...out], textHead: text.slice(0, 380) };
};

// ---- page A: practice pause
const a = await browser.newPage();
const errsA = [];
a.on('pageerror', (e) => errsA.push(e.message.slice(0, 120)));
await a.evaluateOnNewDocument(() => localStorage.setItem('inkwave.lang', 'zh'));
await a.goto(`${URL}/?skipTitle`, { waitUntil: 'load', timeout: 180000 }).catch((e) => errsA.push('goto ' + e.message));
for (let i = 0; i < 90; i++) {
  const ok = await a.evaluate(() => (document.body?.innerText || '').includes('开始游戏')).catch(() => false);
  if (ok) break;
  await sleep(2000);
}
await sleep(2000);
await a.evaluate(() => window.__inkwave?.menus?._go('loadout')).catch(() => {});
await sleep(2500);
await a.evaluate(() => { const b = document.querySelector('.iw-loadout__practice'); if (b) b.click(); }).catch(() => {});
let stA = null;
for (let i = 0; i < 90; i++) {
  stA = await a.evaluate(() => (window.__inkwave?.match ? { state: __inkwave.match.state, practice: !!__inkwave.match.practice, attract: !!__inkwave.match.attract } : null)).catch(() => null);
  if (stA && stA.practice) break;
  await sleep(1500);
}
// wait out the spawn-selection phase (Esc is consumed by it), then pause
for (let i = 0; i < 40; i++) {
  const sel = await a.evaluate(() => (document.body?.innerText || '').includes('选择落点')).catch(() => false);
  if (!sel) break;
  await sleep(1000);
}
await sleep(1500);
await a.keyboard.press('Escape');
await sleep(3000);
const expectA = ['继续', '更换装备', '重置关卡', '新关卡', '设置', '结束练习', '你的装备', '快速操作', '潜墨', '瞄准副武器', '可随时切换装备', '会清空墨水并补满大招'];
const RA = await a.evaluate(scanFn, [...ALLOW], expectA).catch((e) => ({ error: e.message }));
const matchInfoA = await a.evaluate(() => { const m = __inkwave?.match; return m ? { mode: m.mode, practice: m.practice, attract: m.attract, keys: Object.keys(m).slice(0, 28) } : null; }).catch(() => null);
console.log('A practice pause  state:', JSON.stringify(stA), ' match:', JSON.stringify(matchInfoA));
console.log('A missing-zh:', JSON.stringify(RA.missingZh || RA));
console.log('A residuals (' + ((RA.residuals || []).length) + '):');
for (const r of (RA.residuals || []).slice(0, 30)) console.log('   ' + r);
console.log('A pause-text:', JSON.stringify(RA.textHead || ''));
console.log('A pageerrors:', errsA.length ? errsA : 'none');

// ---- page B: regular match pause
const b = await browser.newPage();
const errsB = [];
b.on('pageerror', (e) => errsB.push(e.message.slice(0, 120)));
await b.evaluateOnNewDocument(() => localStorage.setItem('inkwave.lang', 'zh'));
await b.goto(`${URL}/?autostart=60&autopilot&shadercheck`, { waitUntil: 'load', timeout: 180000 }).catch((e) => errsB.push('goto ' + e.message));
let stB = null;
for (let i = 0; i < 130; i++) {
  stB = await b.evaluate(() => (window.__inkwave?.match ? { state: __inkwave.match.state, actors: __inkwave.match.actors?.length || 0 } : null)).catch(() => null);
  if (stB && stB.state === 'playing') break;
  await sleep(2000);
}
await sleep(5000);
await b.keyboard.press('Escape');
await sleep(3000);
const expectB = ['继续', '设置', '玩法说明', '退出对局'];
const RB = await b.evaluate(scanFn, [...ALLOW], expectB).catch((e) => ({ error: e.message }));
console.log('B regular pause   state:', JSON.stringify(stB));
console.log('B missing-zh:', JSON.stringify(RB.missingZh || RB));
console.log('B residuals (' + ((RB.residuals || []).length) + '):');
for (const r of (RB.residuals || []).slice(0, 30)) console.log('   ' + r);
console.log('B pause-text:', JSON.stringify(RB.textHead || ''));
console.log('B pageerrors:', errsB.length ? errsB : 'none');

const aFail = RA.error || (!stA || !stA.practice) || (RA.missingZh || []).length > 0 || (RA.residuals || []).length > 0;
const bFail = RB.error || (stB && stB.state !== 'playing') || (RB.residuals || []).length > 0;
console.log('VERDICT A(practice):', aFail ? 'FAIL' : 'PASS', ' B(regular):', bFail ? 'FAIL' : 'PASS');
kill();
process.exit(0);
