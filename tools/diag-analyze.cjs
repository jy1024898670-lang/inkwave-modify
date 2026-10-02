// Re-analyze a real-GPU diag log. usage: node tools/diag-analyze.cjs [path]
// Emits a full text report (no printf-style formatting) to stdout so nothing is guessed at.
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', 'diag-log.jsonl');
const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
const batches = lines.map((l) => JSON.parse(l));
const out = [];
const P = (...a) => out.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
const pad = (v, n) => String(v).padEnd(n);
const r2 = (v) => Math.round(v * 100) / 100;

const meta = batches[0]?.batch?.client;
P('FILE', file, 'batches=' + batches.length);
P('CLIENT', meta);
P('URL', meta && meta.url);

const events = [];
for (const b of batches) for (const e of b.batch.events || []) events.push(e);
events.sort((a, b) => (a.t - b.t) || ((a.f || 0) - (b.f || 0)));

const counts = {};
for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1;
P('TYPES', counts);
P('span_ms', events[0].t, '->', events[events.length - 1].t, 'frames', events[0].f, '->', events[events.length - 1].f);

// boots: 'install' events split the log into separate page sessions
const boots = events.filter((e) => e.type === 'install');
P('BOOTS', boots.length, boots.map((b) => b.t));

// phase map per boot
P('');
P('=== TRANSITIONS ===');
for (const e of events) {
  if (e.type === 'fade' || e.type === 'fullframe' || e.type === 'mode' || e.type === 'match-state' || e.type === 'dyn-scale' || e.type === 'pipe' || e.type === 'resize' || e.type === 'skiprender') {
    const x = Object.fromEntries(Object.entries(e).filter(([k]) => !['t', 'type', 'f'].includes(k)));
    P('  t=' + pad(e.t, 8), pad(e.type, 13), x);
  }
}

const nonBlack = events.filter((e) => e.type !== 'black-frame' && e.type !== 'flash');
const flagged = events.filter((e) => e.type === 'black-frame' || e.type === 'flash');

P('');
P('=== FLAGGED FRAMES ===', flagged.length, counts);
if (flagged.length) {
  const k = flagged[0];
  P('  sample keys:', Object.keys(k));
  P('  sample:', JSON.stringify(k).slice(0, 1200));
}

const bursts = [];
for (const e of flagged) { const c = bursts[bursts.length - 1]; if (!c || e.t - c[c.length - 1].t > 400) bursts.push([e]); else c.push(e); }
P('');
P('=== BURSTS (gap>400ms) n=' + bursts.length + ' ===');
const byCtx = {};
for (const bs of bursts) {
  const e = bs[0];
  const key = [e.mode, e.match, 'ff=' + (e.fullFrame === undefined ? '-' : e.fullFrame), 'rig=' + (e.rig === undefined ? '-' : e.rig)].join('|');
  byCtx[key] = (byCtx[key] || 0) + 1;
  let prev = null; for (const q of nonBlack) { if (q.t <= bs[0].t) prev = q; else break; }
  P('  t=' + pad(bs[0].t, 8) + '..' + pad(bs[bs.length - 1].t, 8),
    'span=' + pad(bs[bs.length - 1].t - bs[0].t, 5), 'n=' + pad(bs.length, 3),
    'type=' + pad(e.type, 11), 'lum=' + pad(e.lum, 5),
    'ctx=' + key,
    'prev=' + (prev ? prev.type + '@' + prev.t : '-'));
}
P('');
P('BURSTS BY CONTEXT', byCtx);

const starts = bursts.map((b) => b[0].t);
const gaps = starts.slice(1).map((t, i) => t - starts[i]);
if (gaps.length) {
  const s = gaps.slice().sort((a, b) => a - b);
  P('inter-burst gap ms: min=' + s[0], 'p50=' + s[s.length >> 1], 'p90=' + s[Math.floor(s.length * 0.9)], 'max=' + s[s.length - 1]);
}

// luminance trace: reconstruct the waveform per boot
P('');
P('=== LUM TRACE (heartbeats) ===');
const trace = events.filter((e) => e.type === 'trace');
P('samples', trace.length);
for (const e of trace) {
  P('  t=' + pad(e.t, 8), 'lum=' + pad(e.lum, 6), 'rgb=' + e.rgb);
}

fs.writeFileSync(path.join(__dirname, '..', 'diag-report.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));