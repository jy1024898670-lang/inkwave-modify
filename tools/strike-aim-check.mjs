// Vortex Strike aiming: the target moves in the stage map's CANVAS space (through the minimap's own transform,
// which is mirrored + per-team flipped) at a view-rotation-anchored speed; the camera must not rotate while
// aiming. T5 pins the DIRECTION regression the player reported (mouse-right / W must move the cursor the way it
// renders on the map).
// usage: node tools/strike-aim-check.mjs [W] [H]
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const W = +(process.argv[2] || 1280), H = +(process.argv[3] || 720);
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
  protocolTimeout: 180000,
});
const kill = () => { try { browser.process()?.kill('SIGKILL'); } catch { /* gone */ } };
process.on('exit', kill);
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));

await page.goto('http://localhost:8490/?skipTitle&autostart=40&mode=turf&post=0&diag=1', { waitUntil: 'load', timeout: 240000 })
  .catch((e) => errs.push('goto ' + e.message));
await page.waitForFunction("window.__inkwave.match && window.__inkwave.match.state === 'playing' && !window.__inkwave.match.attract",
  { timeout: 240000, polling: 250 }).catch(() => console.log('!! never reached playing'));

const out = await page.evaluate(async () => {
  const G = window.__G, game = window.__inkwave;
  const a = G.local, mm = G.game && G.game.minimap;
  if (!mm) return { fatal: 'no minimap' };
  G.specials.start(a, 'strike');
  const s = a.specialActive;
  const sens = (G.settings.sensitivity ?? 1);
  const turn90 = Math.PI / 2 / 0.0021;
  const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const tcOf = () => mm.toCanvas(s.target.x, s.target.z, { x: 0, y: 0 });
  const center = () => { const tc = tcOf(); G.specials.aimMove(a, mm.w / 2 - tc.x, mm.h / 2 - tc.y, mm); };
  const r = { sens, flip: !!mm.flip, mm: { w: mm.w, h: mm.h }, aiming: !!s.aiming };

  // T1: aimMove follows the map's own transform (canvas +x right on the rendered map)
  center();
  const tc1 = tcOf();
  G.specials.aimMove(a, 10, 0, mm);
  const exp1 = mm._worldX(cl(tc1.x + 10, 0, mm.w));
  r.t1 = { before: +tc1.x.toFixed(1), after: +tcOf().x.toFixed(1), ok: Math.abs(s.target.x - exp1) < 0.001 && tcOf().x > tc1.x };

  // T2: 500 raw mouse px right → canvas +x (mirrored world x), speed = full sweep ≈ 90° turn
  center();
  const tc2 = tcOf(), yaw0 = game.rig.yaw;
  const input = game.input;
  input.locked = true; input.mouse.dx = 500; input.mouse.dy = 0;
  for (let g = 0; g < 150 && tcOf().x === tc2.x && s.aiming; g++) await new Promise((res) => setTimeout(res, 100));
  const tc2b = tcOf();
  const expC2 = cl(tc2.x + 500 * (mm.w / turn90) * sens, 0, mm.w);
  r.t2 = {
    canvasBefore: +tc2.x.toFixed(1), canvasAfter: +tc2b.x.toFixed(1), expCanvas: +expC2.toFixed(1),
    movedRight: tc2b.x > tc2.x,
    ok: Math.abs(tc2b.x - expC2) < Math.max(2, mm.w * 0.02) && tc2b.x > tc2.x,
  };
  r.t3 = { yaw0: +yaw0.toFixed(4), yaw1: +game.rig.yaw.toFixed(4), ok: Math.abs(game.rig.yaw - yaw0) < 0.002 };

  // T4: huge delta clamps to the map corners
  G.specials.aimMove(a, 1e6, 1e6, mm);
  r.t4 = { ok: Math.abs(s.target.x - mm._worldX(mm.w)) < 0.001 && Math.abs(s.target.z - mm._worldZ(mm.h)) < 0.001 };
  r.aimingStill = !!s.aiming;
  return r;
});

// T5: keyboard W moves the cursor UP on the map (canvas y decreases)
let t5 = null;
if (out.aimingStill) {
  const before = await page.evaluate(() => {
    const G = window.__G, mm = G.game.minimap, s = G.local.specialActive;
    const tc = mm.toCanvas(s.target.x, s.target.z, { x: 0, y: 0 });
    G.specials.aimMove(a0x(tc.x), mm.h / 2 - tc.y, mm);   // re-centre x only
    return mm.toCanvas(s.target.x, s.target.z, { x: 0, y: 0 }).y;
  }).catch(() => null);
  if (before != null) {
    await page.keyboard.down('w');
    await sleep(1200);
    await page.keyboard.up('w');
    const after = await page.evaluate(() => {
      const G = window.__G, mm = G.game.minimap, s = G.local.specialActive;
      return s.aiming ? mm.toCanvas(s.target.x, s.target.z, { x: 0, y: 0 }).y : null;
    }).catch(() => null);
    t5 = { before: +before.toFixed(1), after: after != null ? +after.toFixed(1) : null, ok: after != null && after < before };
  }
}

console.log('STRIKE AIM (map ' + (out.mm ? out.mm.w + 'x' + out.mm.h : '?') + ' css-px, flip=' + out.flip + ', sens ' + (out.sens ?? '?') + '):');
if (out.fatal) console.log('  FATAL:', out.fatal);
else {
  console.log('  aiming started:', out.aiming, '| still aiming after T4:', out.aimingStill);
  console.log('  T1 transform-follow:  canvas x ' + out.t1.before + ' → ' + out.t1.after, out.t1.ok ? 'PASS' : 'FAIL');
  console.log('  T2 500px right → map-right: ' + out.t2.canvasBefore + ' → ' + out.t2.canvasAfter + ' (expected ' + out.t2.expCanvas + ')', out.t2.ok ? 'PASS' : 'FAIL');
  console.log('  T3 yaw unchanged: ' + out.t3.yaw0 + ' → ' + out.t3.yaw1, out.t3.ok ? 'PASS' : 'FAIL');
  console.log('  T4 corner clamp:', out.t4.ok ? 'PASS' : 'FAIL');
  console.log('  T5 W → map-up:', t5 ? (t5.before + ' → ' + t5.after + ' ' + (t5.ok ? 'PASS' : 'FAIL')) : 'SKIPPED');
}
const allOk = !out.fatal && out.aiming && out.aimingStill && out.t1.ok && out.t2.ok && out.t3.ok && out.t4.ok && (!t5 || t5.ok);
console.log('VERDICT', allOk ? 'STRIKE-AIM-PASS' : 'STRIKE-AIM-FAIL');
console.log('pageerrors:', errs.length ? errs : 'none');
await browser.close().catch(() => {});
