// Headless how-to geometry probe: verify the zone-control notes row is no longer clipped at the
// bottom edge (the user's "最底下两个说明显示不全" report) after the compression pass, in both tabs
// at both common window sizes. Also checks the new note translations actually render.
// usage: node tools/howto-geom.mjs [url]
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
process.on('exit', () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.evaluateOnNewDocument(() => localStorage.setItem('inkwave.lang', 'zh'));
await page.goto(`${URL}/?skipTitle`, { waitUntil: 'networkidle2', timeout: 180000 }).catch((e) => console.log('goto', e.message));
for (let i = 0; i < 60; i++) {
  const ok = await page.evaluate(() => (document.body?.innerText || '').includes('开始游戏')).catch(() => false);
  if (ok) break;
  await sleep(2000);
}
await sleep(2500);

const measure = () => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) }; };
  const left = r('.iw-howto__left');
  const notes = r('.iw-howto__notes');
  const prompts = r('.iw-prompts');
  const text = document.querySelector('.iw-howto')?.innerText || '';
  return {
    vw: innerWidth, vh: innerHeight,
    left, notes, prompts,
    leftVsPrompts: left && prompts ? Math.round(left.bottom - prompts.top) : null,   // < 0 = clear of the prompt bar
    notesVsPrompts: notes && prompts ? Math.round(notes.bottom - prompts.top) : null,
    notesVsView: notes ? Math.round(notes.bottom - innerHeight) : null,               // < 0 = fully inside viewport
    hasZhNotes: text.includes('大招充能加快') && text.includes('加时赛'),
    hasEnNotes: /Specials charge fast|Overtime:|use them to break in/.test(text),
  };
};

await page.evaluate(() => window.__inkwave?.menus?._go('howto'));
await sleep(2500);
const out = [];
for (const [w, h] of [[1600, 900], [2133, 1012]]) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await sleep(900);
  out.push(['turf', w + 'x' + h, await page.evaluate(measure)]);
}
// switch to the zone-control tab (2nd option of the mode switch on this screen)
await page.evaluate(() => {
  const seg = document.querySelector('.iw-howto__modes .iw-seg');
  const opts = seg ? [...seg.querySelectorAll('.iw-seg__opt')] : [];
  if (opts[1]) opts[1].click();
});
await sleep(1800);
for (const [w, h] of [[2133, 1012], [1600, 900]]) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await sleep(900);
  out.push(['zones', w + 'x' + h, await page.evaluate(measure)]);
}
for (const [tab, size, m] of out) console.log(JSON.stringify({ tab, size, ...m }));
browser.process()?.kill('SIGKILL');
process.exit(0);
