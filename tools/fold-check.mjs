// Combined headless check:
//  (A) map-selection screen — list starts collapsed, chevron opens, picking a map does NOT auto-collapse,
//      hovering a ticket previews it in the hero area, leaving reverts, chevron collapses, names render in zh.
//  (B) every weapon blurb (taken live from the running game) is translated by the real i18n MutationObserver.
// usage: node tools/fold-check.mjs
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
page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));

await page.evaluateOnNewDocument(() => localStorage.setItem('inkwave.lang', 'zh'));
await page.goto('http://localhost:8490/?skipTitle', { waitUntil: 'load', timeout: 180000 })
  .catch((e) => { errs.push('goto ' + e.message); });
for (let i = 0; i < 90; i++) {
  const ok = await page.evaluate(() => (document.body?.innerText || '').includes('开始游戏')).catch(() => false);
  if (ok) break;
  await sleep(2000);
}
await sleep(2500);

// ---- (A) map-selection fold + hover
const go = async (name) => {
  await page.evaluate((nm) => window.__inkwave?.menus?._go(nm), name).catch((e) => errs.push('go ' + e.message));
  await sleep(2200);
};
await go('mode');
const clicked = await page.evaluate(() => {
  const c = document.querySelector('.iw-mode, .iw-card');
  if (c) { c.click(); return (c.className || '').slice(0, 40); }
  return null;
});
await sleep(2500);
const A = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = {};
  const list = document.querySelector('.iw-ss__list');
  const row = document.querySelector('.iw-stagerow');
  if (!list || !row) return { error: 'setup screen not found', setup: !!document.querySelector('.iw-ss') };
  const heroName = () => (document.querySelector('.iw-ss__name')?.textContent || '').trim();
  const rowName = () => (row.querySelector('.iw-stagerow__name')?.textContent || '').trim();
  const open = () => list.classList.contains('is-open');
  out.initialOpen = open();
  out.initialHero = heroName();
  row.click(); await sleep(350);
  out.opened = open();
  const tickets = [...document.querySelectorAll('.iw-ticket')];
  const selIdx = tickets.findIndex((t) => t.classList.contains('is-sel'));
  const cIdx = (selIdx + 1) % tickets.length, hIdx = (selIdx + 2) % tickets.length;
  tickets[cIdx].click(); await sleep(450);
  out.afterSelect = { open: open(), rowName: rowName(), hero: heroName(), heroMatchesRow: rowName() === heroName() };
  tickets[hIdx].dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
  await sleep(450);
  out.afterHover = { hero: heroName(), rowName: rowName(), followsCursor: heroName() !== rowName() };
  list.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
  await sleep(450);
  out.afterLeave = { hero: heroName(), backToSelected: heroName() === rowName() };
  row.click(); await sleep(350);
  out.collapsed = !open();
  out.heroIsCJK = /[\u4e00-\u9fff]/.test(out.afterSelect.hero);
  return out;
}).catch((e) => ({ error: e.message }));

// ---- (B) weapon blurbs through the real observer
await go('loadout');
const B = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const W = window.__inkwave?.menus?._weapons?.();
  if (!W) return { error: 'no _weapons() handle' };
  const rows = [];
  for (const w of Object.values(W)) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;';
    d.textContent = w.blurb;
    document.body.appendChild(d);
    await sleep(220);
    const t = d.textContent;
    rows.push({ name: w.name, translated: t !== w.blurb, cjk: /[\u4e00-\u9fff]/.test(t), text: t.slice(0, 36) });
    d.remove();
  }
  return rows;
}).catch((e) => ({ error: e.message }));

console.log('MODE CARD CLICKED:', clicked);
console.log('A (fold/hover):', JSON.stringify(A, null, 1));
console.log('B (weapon blurbs):', JSON.stringify(B, null, 1));
console.log('pageerrors:', errs.length ? errs : 'none');
const aFail = A.error || A.initialOpen !== false || A.opened !== true || !A.afterSelect ||
  A.afterSelect.open !== true || A.afterSelect.heroMatchesRow !== true ||
  A.afterHover?.followsCursor !== true || A.afterLeave?.backToSelected !== true ||
  A.collapsed !== true || A.heroIsCJK !== true;
const bFail = B.error || (Array.isArray(B) && B.some((r) => !r.translated || !r.cjk));
console.log('VERDICT A:', aFail ? 'FAIL' : 'PASS', ' B:', bFail ? 'FAIL' : 'PASS');
kill();
process.exit(0);
