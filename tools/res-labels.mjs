// Results-table header labels: verify the SPLATS / DEATHS columns render visible text that fits
// (icon + label in a 5.5u column), the name column still fits, and nothing spills below the footer.
// usage: node tools/res-labels.mjs [zh|en] [W] [H]
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const lang = process.argv[2] || 'zh';
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
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));

await page.evaluateOnNewDocument((lg) => localStorage.setItem('inkwave.lang', lg), lang);
const url = `http://localhost:8490/?skipTitle&autostart=40&mode=turf&diag=1&post=0`;
await page.goto(url, { waitUntil: 'load', timeout: 150000 }).catch((e) => errs.push('goto ' + e.message));
await page.waitForFunction('window.__inkwave && window.__inkwave.match', { timeout: 150000, polling: 250 })
  .catch(() => console.log('!! match never appeared'));
await page.waitForFunction("window.__inkwave.match && window.__inkwave.match.state === 'playing' && !window.__inkwave.match.attract", { timeout: 150000, polling: 250 })
  .catch(() => console.log('!! never reached playing'));
// Esc pause/resume regression: Esc → paused, Esc again → resumed without crash (relock armed if the lock was refused)
await page.keyboard.press('Escape');
await sleep(700);
const esc1 = await page.evaluate(() => !!(window.__inkwave.match && window.__inkwave.match.paused));
await page.keyboard.press('Escape');
await sleep(700);
const esc2 = await page.evaluate(() => ({
  paused: !!(window.__inkwave.match && window.__inkwave.match.paused),
  relock: !!window.__inkwave._relock,
  menu: (window.__inkwave.menus && window.__inkwave.menus.current) || null,
}));
console.log('ESC: pausedAfterFirst=' + esc1, 'afterSecond=' + JSON.stringify(esc2));

await page.evaluate(() => { try { window.__inkwave.debug.endMatch(0.02); } catch (e) { errs.push('endMatch ' + e.message); } });
// trace the sim until .iw-results or ~150s (headless SwiftShader frames take seconds each; the judge reveal runs on sim time)
let sawRes = false;
for (let i = 0; i < 75; i++) {
  const tr = await page.evaluate(() => {
    const G = window.__G || {};
    const m = window.__inkwave.match;
    return {
      t: Math.round((G.time || 0) * 10) / 10,
      state: m ? m.state : null,
      time: m ? (m.time == null ? null : Math.round(m.time * 100) / 100) : null,
      menu: (window.__inkwave.menus && window.__inkwave.menus.current) || null,
      res: !!document.querySelector('.iw-results'),
    };
  }).catch(() => null);
  if (tr && (i % 5 === 0 || tr.res)) console.log('trace', i, JSON.stringify(tr));
  if (tr && tr.res) { sawRes = true; break; }
  await sleep(2000);
}
console.log('sawResults:', sawRes);
await sleep(4000);   // let the intro/reveal animations settle

const m = await page.evaluate(() => {
  const cols = [...document.querySelectorAll('.iw-ttable .iw-ttable__col')].map((c) => ({
    txt: (c.textContent || '').trim(),
    w: Math.round(c.getBoundingClientRect().width),
    sw: c.scrollWidth, cw: c.clientWidth,
    fit: c.scrollWidth <= c.clientWidth + 2,
  }));
  const nm = document.querySelector('.iw-prow__nm');
  const teams = document.querySelector('.iw-ttable');
  const foot = document.querySelector('.iw-res__foot');
  const lastRow = document.querySelector('.iw-ttable .iw-prow:last-child');
  const b = (e) => (e ? e.getBoundingClientRect() : null);
  return {
    u: getComputedStyle(document.documentElement).getPropertyValue('--u').trim(),
    cols,
    nameFit: nm ? nm.scrollWidth <= nm.clientWidth + 2 : null,
    tableBottom: teams ? Math.round(b(teams).bottom) : null,
    lastRowBottom: lastRow ? Math.round(b(lastRow).bottom) : null,
    footY: foot ? Math.round(b(foot).y) : null,
  };
}).catch((e) => ({ error: e.message }));
console.log('LANG', lang, W + 'x' + H);
console.log(JSON.stringify(m, null, 1));

const labels = m.cols ? m.cols.filter((c) => ['SPLATS', 'DEATHS', '击倒', '被击倒'].includes(c.txt)) : [];
const allFit = labels.length >= 4 && labels.every((c) => c.fit);
const noSpill = m.tableBottom != null && m.footY != null ? m.tableBottom < m.footY : null;
console.log('labels found:', labels.map((c) => c.txt + (c.fit ? ' ok' : ' OVERFLOW ' + c.sw + '>' + c.cw)).join(', '));
console.log('VERDICT', allFit ? 'LABELS-PASS' : 'LABELS-FAIL', '| nameFit=' + m.nameFit, '| spill(tableBottom<footY):', noSpill);

// REMATCH button: should now go back to the map-selection screen (wipe + build take seconds at headless frame rates — poll)
const btnEl = await page.evaluateHandle(() => [...document.querySelectorAll('.iw-btn')].find((b) => /REMATCH|再来一局/.test(b.textContent || '')) || null);
let setup = null;
if (btnEl && btnEl.asElement()) {
  await btnEl.asElement().click().catch(() => {});
  for (let i = 0; i < 25; i++) {
    await sleep(2000);
    setup = await page.evaluate(() => ({
      ss: !!document.querySelector('.iw-screen.iw-setup'),
      current: (window.__inkwave.menus && window.__inkwave.menus.current) || null,
      weaponChip: !!document.querySelector('.iw-wchip'),
      start: !!document.querySelector('.iw-btn--start'),
    })).catch(() => null);
    if (setup && setup.ss && setup.weaponChip) break;
  }
  console.log('REMATCH → map screen:', JSON.stringify(setup), setup && setup.ss && setup.weaponChip ? 'PASS' : 'FAIL');
} else {
  console.log('REMATCH button not found');
}
console.log('pageerrors:', errs.length ? errs : 'none');
kill();
process.exit(0);
