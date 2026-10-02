// Font fix check: header sub + selected-stage row must render bold display type (zh), and
// the REMATCH sub label must read 选图 on the results screen.
// usage: node tools/font-check.mjs [zh|en] [W] [H]
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
const url = `http://localhost:8490/?skipTitle&post=0`;
await page.goto(url, { waitUntil: 'load', timeout: 150000 }).catch((e) => errs.push('goto ' + e.message));
await page.waitForFunction('window.__inkwave && window.__inkwave.menus', { timeout: 150000, polling: 250 })
  .catch(() => console.log('!! menus never appeared'));

// open the setup screen in Zone Control (the subtitle the user circled) and let it settle
await page.evaluate(() => {
  const m = window.__inkwave.menus;
  try { m._setup = { ...(m._setup || {}), mode: 'zones' }; } catch { /* ignore */ }
  m.show('setup');
});
let styles = null;
for (let i = 0; i < 30; i++) {
  await sleep(1000);
  styles = await page.evaluate(() => {
    const sub = document.querySelector('.iw-screen.iw-setup .iw-head__sub');
    const name = document.querySelector('.iw-stagerow__name');
    const num = document.querySelector('.iw-stagerow__num');
    const cs = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return { text: (el.textContent || '').slice(0, 40), family: s.fontFamily.slice(0, 60), weight: s.fontWeight };
    };
    return { sub: cs(sub), name: cs(name), num: cs(num) };
  }).catch(() => null);
  if (styles && styles.sub && styles.name) break;
}
console.log('LANG', lang, `${W}x${H}`);
console.log('setup styles:', JSON.stringify(styles, null, 1));
await page.screenshot({ path: `tools/font-setup-${lang}.png` });
console.log('screenshot: tools/font-setup-' + lang + '.png');
console.log('pageerrors:', errs.length ? errs : 'none');
await browser.close().catch(() => {});
