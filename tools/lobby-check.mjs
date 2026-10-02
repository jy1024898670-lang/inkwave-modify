// E2E public lobby: A (host) creates a room and marks it public; B (guest) sees the room in the ONLINE list and
// joins via the row; both end up in the same room. Checks registry state, zh labels and page errors.
// Sequential boot: A eats the cold GPU/shader cost, B rides the warm cache.
// usage: node tools/lobby-check.mjs
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const T0 = Date.now();
const t = () => ((Date.now() - T0) / 1000).toFixed(1) + 's';
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
    '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=960,540'],
  defaultViewport: { width: 960, height: 540, deviceScaleFactor: 1 },
  protocolTimeout: 240000,
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);

const errs = { A: [], B: [] };
async function newPage(name, fnTimeout) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errs[name].push(String(e.message).slice(0, 140)));
  page.on('crash', () => errs[name].push('PAGE CRASHED'));
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('inkwave.lang', 'zh'); } catch { /* ignore */ } });
  await page.goto('http://localhost:8490/?skipTitle&post=0', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction('window.__inkwave && window.__inkwave.menus', { timeout: fnTimeout, polling: 200 });
  console.log('  ' + name + ' ready at ' + t());
  return page;
}
// the relay checks the Origin header — mimic the browser
const getLobby = async () => {
  const r = await fetch('http://localhost:8787/lobby', { headers: { Origin: 'http://localhost:8490' }, cache: 'no-store' });
  const j = await r.json();
  return j.rooms || [];
};
const findRoom = (rooms, code) => rooms.find((r) => r.code === code) || null;
// the i18n observer swaps text nodes a tick after DOM changes — poll, don't snapshot
const waitForText = async (page, selector, text, timeout = 8000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const has = await page.evaluate(([s, x]) => { const el = document.querySelector(s); return !!el && el.textContent.includes(x); }, [selector, text]).catch(() => false);
    if (has) return true;
    await sleep(400);
  }
  return false;
};

const R = {};
try {
  console.log('booting A (host)…');
  const A = await newPage('A', 180000);
  console.log('booting B (guest)…');
  const B = await newPage('B', 90000);

  // ---------- A: host — online → create → mark public ----------
  await A.evaluate(() => window.__inkwave.menus.show('online'));
  await A.waitForSelector('.iw-hub__rooms', { timeout: 30000 });
  R.zhPanel = await waitForText(A, '.iw-hub__rooms', '公开房间');
  await (await A.$('.iw-hubcard--create')).click();
  await A.waitForSelector('.iw-screen.iw-lobby', { timeout: 90000 });
  R.aLobby = true;
  await A.waitForSelector('.iw-lset--public .iw-toggle', { timeout: 15000 });
  await (await A.$('.iw-lset--public .iw-toggle')).click();
  R.aCode = await A.evaluate(() => window.__G.net && window.__G.net.code);
  let room = null;
  for (let i = 0; i < 40 && !room; i++) { room = R.aCode ? findRoom(await getLobby(), R.aCode) : null; if (!room) await sleep(500); }
  R.registry = room ? { code: room.code, players: room.players, inMatch: room.inMatch, mode: room.mode, map: room.map, host: room.name } : null;
  R.zhLobby = (await waitForText(A, '.iw-lset--public', '公开房间')) && (await waitForText(A, '.iw-lset--public', '显示在联机大厅'));
  console.log('  A public at ' + t() + ' (code ' + R.aCode + ')');

  // ---------- B: guest — online → see the room row → join ----------
  await B.evaluate(() => window.__inkwave.menus.show('online'));
  await B.waitForSelector('.iw-roomrow', { timeout: 60000 });
  R.bRow = await B.evaluate(() => {
    const row = document.querySelector('.iw-roomrow');
    return { code: row.querySelector('.iw-roomrow__code').textContent, state: row.querySelector('.iw-roomrow__state').textContent };
  });
  R.bRowZh = await waitForText(B, '.iw-roomrow', '等待中');
  await (await B.$('.iw-roomrow')).click();
  await B.waitForSelector('.iw-screen.iw-lobby', { timeout: 90000 });
  R.bLobby = true;
  R.bZhLobby = await waitForText(B, '.iw-lset--public', '公开房间');
  console.log('  B joined at ' + t());

  // ---------- both in the same room ----------
  const players = await Promise.all([
    A.evaluate(() => (window.__G.net.lobby.players || []).length),
    B.evaluate(() => (window.__G.net.lobby.players || []).length),
  ]);
  R.players = players;
  let room2 = null;
  for (let i = 0; i < 20; i++) {
    room2 = findRoom(await getLobby(), R.aCode);
    if (room2 && room2.players === 2) break;
    await sleep(500);
  }
  R.registry2 = room2 ? { players: room2.players, inMatch: room2.inMatch } : null;

  const checks = {
    'A: online panel zh (公开房间)': R.zhPanel === true,
    'A: reached lobby screen': R.aLobby === true,
    'A: registry card (1 player, waiting)': R.registry && R.registry.players === 1 && R.registry.inMatch === false,
    'A: lobby zh (公开房间 + note)': R.zhLobby === true,
    'B: row shows the room (zh 等待中)': R.bRow && R.bRow.code === R.aCode && R.bRowZh === true,
    'B: joined via row click': R.bLobby === true,
    'B: lobby shows public state (zh)': R.bZhLobby === true,
    'both: 2 players in room': players[0] === 2 && players[1] === 2,
    'registry: 2 players after join': R.registry2 && R.registry2.players === 2,
    'pageerrors none': errs.A.length === 0 && errs.B.length === 0,
  };
  console.log('LOBBY E2E (' + t() + '):');
  for (const [k, v] of Object.entries(checks)) console.log('  ' + (v ? 'PASS' : 'FAIL') + '  ' + k);
  console.log('  row:', JSON.stringify(R.bRow), '| code:', R.aCode, '| registry after join:', JSON.stringify(R.registry2));
  console.log('pageerrors A:', errs.A.length ? errs.A : 'none', ' B:', errs.B.length ? errs.B : 'none');
  console.log('VERDICT', Object.values(checks).every(Boolean) ? 'LOBBY-E2E-PASS' : 'LOBBY-E2E-FAIL');
} catch (e) {
  console.log('FATAL at ' + t() + ':', String(e && e.message || e).slice(0, 220));
  console.log('partial:', JSON.stringify(R));
  console.log('pageerrors A:', errs.A.length ? errs.A : 'none', ' B:', errs.B.length ? errs.B : 'none');
  console.log('VERDICT LOBBY-E2E-FAIL (probe error)');
}
await browser.close().catch(() => {});
