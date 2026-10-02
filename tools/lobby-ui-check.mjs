// Single-page lobby UI check (no second browser): boots the game headless, walks main menu → ONLINE screen,
// verifies the public-rooms panel renders, creates a room via the own-code card, flips the host's PUBLIC ROOM
// toggle, and confirms (from Node, over plain HTTP) that the room's card lands in the relay registry.
// usage: node tools/lobby-ui-check.mjs    (relay must be running on :8787)
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
    '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=960,540'],
  defaultViewport: { width: 960, height: 540, deviceScaleFactor: 1 },
  protocolTimeout: 240000,
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));

const R = {};
try {
  await page.goto('http://localhost:8490/?skipTitle', { waitUntil: 'load', timeout: 240000 });

  // 1) main menu → ONLINE
  await page.waitForSelector('.iw-btn--online', { timeout: 240000 });
  R.menu = true;
  await page.evaluate(() => document.querySelector('.iw-btn--online').click());
  await page.waitForSelector('.iw-screen.iw-online .iw-hub__rooms', { timeout: 60000 });
  R.panel = await page.evaluate(() => {
    const tape = document.querySelector('.iw-hr__tape');
    const live = document.querySelector('.iw-hr__live');
    const empty = document.querySelector('.iw-hr__empty');
    return { tape: tape ? tape.textContent.trim() : null, live: !!live, empty: empty && !empty.classList.contains('is-hidden') };
  });

  // 2) create a room via the own-code card
  await page.evaluate(() => {
    const own = document.querySelector('.iw-screen.iw-online [data-cur="own"]');
    if (own) own.click();
  });
  R.createClicked = await page.evaluate(() => !!document.querySelector('.iw-screen.iw-online [data-cur="own"]'));

  // 3) room screen: find the PUBLIC ROOM row and flip its custom toggle (.iw-toggle, is-on class)
  await page.waitForSelector('.iw-lset--public', { timeout: 120000 });
  R.publicRow = true;
  R.toggled = await page.evaluate(() => {
    const row = document.querySelector('.iw-lset--public');
    const tgl = row && row.querySelector('.iw-toggle');
    if (!tgl) return 'no-toggle';
    tgl.click();
    return tgl.classList.contains('is-on') ? 'on' : 'stays-off';
  });

  // 4) from Node: the card must appear in the registry (client meta frame → Room DO → Lobby DO)
  const card = await (async () => {
    for (let i = 0; i < 20; i++) {
      try {
        const r = await fetch('http://localhost:8787/lobby', { headers: { Origin: 'http://localhost:8490' }, cache: 'no-store' });
        const j = await r.json();
        const rooms = (j.rooms || []).filter((x) => x.players >= 1);
        if (rooms.length) return rooms[0];
      } catch { /* relay blip */ }
      await sleep(1000);
    }
    return null;
  })();
  R.card = card;
} catch (e) {
  R.fatal = String(e.message || e).slice(0, 200);
  try {
    R.diag = await page.evaluate(() => {
      const cs = document.querySelector('.iw-screen.iw-online .iw-hubcard__status');
      const toasts = [...document.querySelectorAll('[class*="toast"]')].map((t) => t.textContent.trim()).slice(-3);
      return { onlineVisible: !!document.querySelector('.iw-screen.iw-online'), lobbyVisible: !!document.querySelector('.iw-screen.iw-lobby'),
        createStatus: cs ? cs.textContent : null, toasts };
    });
  } catch { /* page gone */ }
}

console.log('LOBBY UI (single page):');
console.log('  menu ONLINE button:', R.menu ?? 'n/a');
console.log('  panel:', JSON.stringify(R.panel), R.panel && R.panel.tape === 'PUBLIC ROOMS' && R.panel.live && R.panel.empty ? 'PASS' : 'FAIL');
console.log('  create card clicked:', R.createClicked, '| room screen PUBLIC ROOM row:', R.publicRow ?? 'n/a');
console.log('  toggle:', R.toggled ?? 'n/a');
console.log('  registry card after toggle:', R.card ? JSON.stringify({ code: R.card.code, name: R.card.name, players: R.card.players, inMatch: R.card.inMatch }) : 'none');
const ok = R.panel && R.panel.tape === 'PUBLIC ROOMS' && R.panel.live && R.panel.empty && R.publicRow && R.toggled === 'on' && R.card;
if (R.diag) console.log('  diag:', JSON.stringify(R.diag));
console.log('VERDICT', R.fatal ? `LOBBY-UI-FAIL (${R.fatal})` : (ok ? 'LOBBY-UI-PASS' : 'LOBBY-UI-FAIL'));
console.log('pageerrors:', errs.length ? errs : 'none');
await browser.close().catch(() => {});
