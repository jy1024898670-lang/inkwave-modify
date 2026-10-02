// Headless black-frame capture: boots a mock 5v5 match with ?diag=1, lets it play to
// the finish (or a sim-time cap), then dumps window.__diag and a screenshot.
// usage: node tools/diag-capture.mjs [url] [durationSec]
import puppeteer from 'puppeteer-core';
import { existsSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// crash-safe logging: append synchronously to the log file (stdout is buffered and lost on a hard exit)
const LOG = path.join(root, 'diag-capture.log');
const log = (s) => { process.stdout.write(s + '\n'); try { appendFileSync(LOG, s + '\n'); } catch { /* ignore */ } };
// crash self-diagnostics: a silent death loses everything, so record every abnormal path
process.on('uncaughtException', (e) => log('UNCAUGHT ' + (e && e.stack || e)));
process.on('unhandledRejection', (e) => log('UNHANDLED ' + (e && e.stack || e)));
process.on('exit', (c) => log('NODE-EXIT code=' + c));
function chromePath() {
  const cands = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
  for (const c of cands) if (existsSync(c)) return c;
  return undefined;
}
const URL = process.argv[2] || 'http://localhost:8490';
const DUR = +(process.argv[3] || 90);
const WALLCAP = +(process.argv[4] || 250);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: chromePath(), headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=1600,900'],
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ' ' + m.text().slice(0, 300)); });

log('goto', `${URL}/?skipTitle&autostart=${DUR}&autopilot&diag=1`);
await page.goto(`${URL}/?skipTitle&autostart=${DUR}&autopilot&diag=1`, { waitUntil: 'networkidle2', timeout: 180000 }).catch((e) => log('goto', e.message));

const t0 = Date.now();
let last = '';
for (;;) {
  const wall = (Date.now() - t0) / 1000;
  if (wall > WALLCAP) { log('wall cap ' + WALLCAP + 's hit'); break; }
  const st = await page.evaluate(() => {
    const d = window.__diag;
    const m = window.__inkwave && __inkwave.match;
    let dump = null;
    try { dump = d && JSON.parse(d.dump()); } catch { /* not ready */ }
    return {
      attract: m ? !!m.attract : null, state: m ? m.state : null,
      time: m ? +m.time.toFixed(1) : null, duration: m ? m.duration : null,
      frames: dump ? dump.frames : null, black: dump ? dump.blackFrames.length : null,
    };
  }).catch(() => null);
  if (st) {
    const line = `wall=${wall.toFixed(0)}s attract=${st.attract} state=${st.state} time=${st.time} dur=${st.duration} frames=${st.frames} black=${st.black}`;
    if (line !== last) { log(line); last = line; }
    // a REAL match (the attract backdrop has duration 99999) finishes at state 'finish'
    if (st.attract === false && st.state === 'finish') { await sleep(4000); break; }
  }
  await sleep(5000);
}

const dump = await page.evaluate(() => (window.__diag && window.__diag.dump()) || null).catch(() => null);
await page.screenshot({ path: path.join(root, 'diag-capture.png') }).catch(() => {});
if (dump) {
  writeFileSync(path.join(root, 'diag-capture.json'), dump);
  const j = JSON.parse(dump);
  log('DUMP frames=' + j.frames, 'ctxLost=' + j.ctxLost, 'ctxRestored=' + j.ctxRestored, 'lastLum=' + j.lastLum, 'blackFrames=' + j.blackFrames.length, 'events=' + j.events.length);
  log('black: ' + JSON.stringify(j.blackFrames.slice(0, 5)));
  const byType = {};
  for (const e of j.events) byType[e.type] = (byType[e.type] || 0) + 1;
  log('event types: ' + JSON.stringify(byType));
  log('js-errors: ' + JSON.stringify(errs.filter((e) => e.startsWith('PAGEERROR') || /error/i.test(e)).slice(0, 8)));
} else {
  log('NO DIAG DUMP (diag module not enabled?)');
  log('errors: ' + JSON.stringify(errs.slice(0, 10)));
}
kill();
process.exit(0);
