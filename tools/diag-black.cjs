// Focused deep-dive on the black frames in a real-GPU log: what is the screen doing when it goes black?
// usage: node tools/diag-black.cjs [path]
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', 'diag-log.jsonl');
const batches = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const ev = [];
for (const b of batches) for (const e of b.batch.events || []) ev.push(e);

// two boots in one file → split by 'install'
const installs = ev.filter((e) => e.type === 'install');
const boots = [];
for (const ins of installs) boots.push(ev.filter((e) => e.t >= ins.t));
boots.sort((a, b) => b.length - a.length);
const boot = boots[0];

const black = boot.filter((e) => e.type === 'black-frame');
const flash = boot.filter((e) => e.type === 'flash');
console.log('largest boot: events=%d black=%d flash=%d span=%dms', boot.length, black.length, flash.length, boot[boot.length - 1].t);

// cluster black frames
const bursts = [];
for (const e of black) { const c = bursts[bursts.length - 1]; if (!c || e.t - c[c.length - 1].t > 500) bursts.push([e]); else c.push(e); }
console.log('black bursts:', bursts.length);

// what distinguishes a black burst from a normal frame? tally the context fields.
const tally = (arr, fn) => { const m = new Map(); for (const e of arr) { const k = fn(e); m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };
console.log('\n--- black-frame context ---');
console.log('rig      :', tally(black, (e) => e.rig));
console.log('mode|ms  :', tally(black, (e) => e.mode + '|' + e.match));
console.log('env      :', tally(black, (e) => e.env));
console.log('dyn      :', tally(black, (e) => e.dyn));
console.log('fade     :', tally(black, (e) => e.fade));
console.log('fullFrame:', tally(black, (e) => e.fullFrame));
console.log('specials :', tally(black, (e) => e.specials));
console.log('local    :', tally(black, (e) => JSON.stringify(e.local)));
console.log('camY     :', tally(black, (e) => (e.cam ? 'y=' + Math.round(e.cam[1] / 5) * 5 : 'null')).slice(0, 14));
console.log('lum      :', tally(black, (e) => (e.lum < 0.005 ? '0 (pure)' : e.lum < 0.02 ? 'near' : 'other')).slice(0, 6));

console.log('\n--- the 8 deepest black bursts (full context) ---');
const deep = bursts.slice().sort((a, b) => (b[b.length - 1].t - b[0].t) - (a[a.length - 1].t - a[0].t)).slice(0, 8);
for (const bs of deep) {
  const e = bs[0];
  console.log('t=%d..%d span=%dms n=%d lum=%s prevLum=%s cam=%s local=%s env=%s dyn=%s fade=%s ff=%s rig=%s',
    bs[0].t, bs[bs.length - 1].t, bs[bs.length - 1].t - bs[0].t, bs.length, e.lum, e.prevLum,
    JSON.stringify(e.cam), JSON.stringify(e.local), e.env, e.dyn, e.fade, e.fullFrame, e.rig);
  console.log('   recent:', JSON.stringify(e.recent));
  const tr = e.trace || [];
  console.log('   trace lum:', tr.map((x) => x[1]).join(' '));
  console.log('   trace rgb:', tr.slice(-8).map((x) => x.slice(2).join('/')).join('  '));
}

// how close is each black burst to a dyn-scale / fade / state change?
const marks = boot.filter((e) => ['dyn-scale', 'fade', 'match-state', 'mode', 'fullframe', 'pipe', 'js-error', 'gl-error', 'long-frame', 'ctx-lost', 'resize'].includes(e.type));
console.log('\n--- distance from each black burst to the nearest mark ---');
const dists = [];
for (const bs of bursts) {
  let best = null;
  for (const m of marks) { const d = Math.abs(m.t - bs[0].t); if (!best || d < best.d) best = { d, m }; }
  dists.push({ t: bs[0].t, n: bs.length, d: best.d, type: best.m.type });
}
const near = dists.filter((x) => x.d < 1500);
console.log('bursts within 1.5s of a mark:', near.length, '/', bursts.length);
const byType = new Map();
for (const x of near) byType.set(x.type, (byType.get(x.type) || 0) + 1);
console.log('nearest mark type:', [...byType.entries()].sort((a, b) => b[1] - a[1]));
console.log('closest 12:', dists.slice().sort((a, b) => a.d - b.d).slice(0, 12).map((x) => `t=${x.t} n=${x.n} Δ${x.d}ms ${x.type}`));

// does the luminance trace show a gradual ramp (AO/denoise converging) or a hard step (buffer wipe)?
console.log('\n--- is black abrupt? prevLum of each black burst start ---');
const abrupt = black.filter((e) => e.prevLum === null || e.prevLum > 0.15).length;
console.log('black frames whose previous probe was bright (>0.15):', abrupt, '/', black.length, '=>', abrupt / black.length < 0.5 ? 'ABRUPT (hard step)' : 'gradual');