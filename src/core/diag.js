// Black-frame & flash diagnostics + log shipper (v2).
//
// Runs by default whenever the page is served from localhost/127.0.0.1 (dev sessions) or with
// ?diag=1 (headless / explicit). v2 adds, on top of the v1 black-frame probe:
//   - flash detection: a large frame-to-frame luminance OR colour jump at screen centre (the
//     "变色快闪" a viewer actually sees, not just the near-black bottom of it)
//   - rich context on every black/flash frame: recent state transitions, camera + rig, local
//     player (alive / y / form), env theme, dyn-scale, MSAA sample count, active specials
//   - a continuous luminance trace (compact, ~1 Hz) so the exact waveform around an event survives
//   - pipeline meta (MSAA samples, RT type, AO / bloom on-off, dpr) so a real-GPU log is self-describing
// Events are kept in a ring buffer for window.__diag.dump() (devtools) and, in default-on mode,
// POSTed in small batches to the dev server's /diag endpoint (tools/serve.py appends them to
// diag-log.jsonl) so a flash on real hardware can be read back from disk.
// ?diag=1 (headless capture) also fast-forwards the sim (see _loop in main.js) and does NOT POST.
import { G } from './ctx.js';

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const POSTABLE = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
const ON = params.has('diag') || POSTABLE;
const POST = POSTABLE && !params.has('diag');   // headless captures read the dump() directly, no network needed

const MAX_EVENTS = 6000;
const BLACK_LUM = 0.02;    // a healthy frame (sky / ink) never dips below this at screen centre
const FLASH_LUM = 0.26;    // frame-to-frame luminance jump worth flagging
const FLASH_COL = 0.22;    // frame-to-frame colour (avg RGB) jump worth flagging
const FLUSH_MS = 3000;
const TRACE_EVERY = 90;    // probes between trace heartbeats (~1.5 s at 60 fps, ~2 frames/sample)
// The pixel probe reads the DEFAULT drawing buffer with readPixels, which is not a safe thing to do every
// frame: the context is preserveDrawingBuffer:false, so a read that lands after the compositor consumed the
// frame comes back all-zero, and readPixels is a full pipeline sync point whose stall is itself visible. With the
// probe on by default it both manufactured the black frames it was hunting (470 of them, all of them sudden
// 0.36-0.70 -> exactly 0 for ~700 ms, none of them near any state change) and could well have caused the very
// flicker it was meant to explain. So the probe is now OFF unless you ask for it: ?probe=<n> probes every n
// frames, ?noprobe=1 is the explicit off. Event / state / pipeline logging is unaffected and stays on.
const PROBE_OFF = params.get('probe') === null || params.get('noprobe') === '1';
const PROBE_EVERY = Math.max(1, +params.get('probe') || 30);
const state = {
  on: false,
  frame: 0,
  t0: 0,
  boot: Date.now(),
  events: [],
  pending: [],             // events not yet POSTed to the server
  black: [],
  probeN: 0,
  lastLum: 1,
  prevLum: -1,
  prevRGB: null,
  trace: [],               // rolling [t, lum, r, g, b] samples
  traceAcc: 0,
  ctxLost: 0,
  ctxRestored: 0,
  lastBig: 0,             // timestamp of the last big centre change (camera cuts are legitimate)
  probeOff: PROBE_OFF,
  fadeOp: 0,
  fullFrame: false,
  matchState: null,
  mode: null,
  skipRender: false,
  meta: null,
  pipe: null,              // { samples, rtType, ao, bloom, dpr, w, h }
};

function log(type, extra = {}) {
  state.events.push({ f: state.frame, t: Math.round(performance.now() - state.t0), type, ...extra });
  if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
  if (POST) state.pending.push({ type, ...extra, f: state.frame, t: Math.round(performance.now() - state.t0) });
  if (state.pending.length > 800) state.pending.splice(0, state.pending.length - 800);
}
const errName = (e) => (e && e !== 0 ? '0x' + e.toString(16) : null);
const R2 = (v) => Math.round(v * 100) / 100;
const R3 = (v) => Math.round(v * 1000) / 1000;

export function installDiag({ canvas, R }) {
  if (!ON || state.on) return null;
  state.on = true;
  state.t0 = performance.now();
  state.canvas = canvas;
  state.R = R;
  state.gl = R.renderer.getContext();
  try { state.pipe = R.pipelineInfo ? R.pipelineInfo() : null; } catch { state.pipe = null; }
  log('pipe', state.pipe || { note: 'pipelineInfo unavailable' });
  // GPU identity (renderer string) makes the disk log readable per-machine
  try {
    const dbg = state.gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) state.meta = {
      gpu: String(state.gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).slice(0, 90),
      vendor: String(state.gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)).slice(0, 60),
      quality: R.settings?.quality, dpr: +(devicePixelRatio || 1),
      screen: innerWidth + 'x' + innerHeight,
      url: location.href.slice(0, 120), ua: navigator.userAgent.slice(0, 120),
    };
  } catch { state.meta = { quality: R.settings?.quality, dpr: +(devicePixelRatio || 1) }; }
  // three.js already prevents the default and reinitializes on restore — we only observe + cover the black gap
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); state.ctxLost++; log('ctx-lost', { n: state.ctxLost }); if (POST) flushNow('ctx-lost'); });
  canvas.addEventListener('webglcontextrestored', () => { state.ctxRestored++; log('ctx-restored', { n: state.ctxRestored }); if (POST) flushNow('ctx-restored'); });
  const origScale = R.setDynamicScale.bind(R);
  R.setDynamicScale = (s) => { log('dyn-scale', { from: R2(R.dynScale), to: R2(s) }); return origScale(s); };
  window.addEventListener('resize', () => log('resize', { w: innerWidth, h: innerHeight, dpr: +(devicePixelRatio || 1) }));
  window.addEventListener('error', (e) => { log('js-error', { msg: String(e.message).slice(0, 160) }); if (POST) flushNow('js-error'); });
  window.addEventListener('unhandledrejection', (e) => { log('js-error', { msg: String(e.reason && e.reason.message || e.reason).slice(0, 160) }); if (POST) flushNow('js-error'); });
  log('install', state.meta || {});
  if (POST) {
    setInterval(() => {
      // periodic luminance trace heartbeat: the waveform survives even with no black/flash event
      const t = state.trace;
      if (t.length) {
        const c = t[t.length - 1];
        log('trace', { t: Math.round(performance.now() - state.t0), lum: c[1], rgb: [c[2], c[3], c[4]] });
        t.length = 0;
      }
      if (state.pending.length) flushNow('tick');
    }, FLUSH_MS);
    window.addEventListener('pagehide', () => { try { if (state.pending.length) navigator.sendBeacon?.(location.href.split('/').slice(0, 3).join('/') + '/diag', JSON.stringify(batch())); } catch { /* best effort */ } });
    flushNow('install');
  }
  return state;
}

// called by the renderer after (re)building its composer, so the log records the exact pipeline
export function diagPipeline(p) {
  if (!state.on) return;
  state.pipe = p;
  log('pipe', p);
}

function pipeNow() { try { return state.R?.pipelineInfo?.() || state.pipe; } catch { return state.pipe; } }
function batch() { return { client: state.meta, boot: state.boot, frames: state.frame, pipe: pipeNow(), events: state.pending.splice(0, state.pending.length) }; }

function flushNow(reason) {
  if (!state.pending.length) return;
  try {
    fetch('diag', {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, ...batch() }),
    }).catch(() => { /* offline / closed server: buffer stays, next tick retries */ });
  } catch { /* ignore */ }
}

const probeBuf = new Uint8Array(16 * 16 * 4);
// centre 16x16 → average RGB + luminance (what a viewer's eye integrates over)
function probeCenter() {
  const { gl, canvas } = state;
  if (!gl) return null;
  const x = Math.max(0, (canvas.width / 2 - 8) | 0), y = Math.max(0, (canvas.height / 2 - 8) | 0);
  gl.readPixels(x, y, 16, 16, gl.RGBA, gl.UNSIGNED_BYTE, probeBuf);
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < probeBuf.length; i += 4) { r += probeBuf[i]; g += probeBuf[i + 1]; b += probeBuf[i + 2]; }
  const n = 256;
  r /= n; g /= n; b /= n;
  const lum = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
  return { lum, r: r / 255, g: g / 255, b: b / 255 };
}

// the state worth shipping with a black/flash frame, so a real-GPU log is self-explanatory
function richContext(game) {
  const m = game.match;
  const rig = game.rig;
  const cam = G.camera;
  const recent = state.events
    .filter((e) => !['black-frame', 'flash', 'lum', 'trace'].includes(e.type))
    .slice(-4)
    .map((e) => e.type + ':' + JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k]) => !['t', 'type', 'f'].includes(k)))).slice(0, 90));
  return {
    fade: R2(state.fadeOp), fullFrame: state.fullFrame, ms: state.matchState, mode: state.mode,
    dyn: R3(state.R.dynScale), samples: state.pipe?.samples, ao: state.pipe?.ao,
    cam: cam ? [R1(cam.position.x), R1(cam.position.y), R1(cam.position.z)] : null,
    rig: rig?.mode || null,
    local: m?.local ? { alive: !!m.local.alive, y: R1(m.local.pos?.y ?? 0), form: m.local.form ?? null } : null,
    env: G.env?.theme || G.env?.time || null,
    map: game.layoutId || null,
    level: G.level ? 1 : 0,
    specials: G.specials?.length ?? 0,
    ctxLost: state.ctxLost,
    recent,
  };
}
const R1 = (v) => Math.round(v * 10) / 10;

export function diagTick(game, dt) {
  if (!state.on) return;
  try { _tick(game, dt); } catch (e) {
    // diagnostics must never take the game down with them: self-disable on any internal error
    state.on = false;
    console.warn('[diag] self-disabled:', e && e.message);
  }
}

function _tick(game, dt) {
  state.frame++;
  const m = game.match;
  // cheap state-transition logging
  const ms = m ? m.state : null;
  if (ms !== state.matchState) { log('match-state', { from: state.matchState, to: ms }); state.matchState = ms; }
  if (G.mode !== state.mode) { log('mode', { from: state.mode, to: G.mode }); state.mode = G.mode; }
  const ff = !!game.showcase?.fullFrame;
  if (ff !== state.fullFrame) { log('fullframe', { to: ff }); state.fullFrame = ff; }
  const sk = !!game._skipRender;
  if (sk !== state.skipRender) { log('skiprender', { to: sk }); state.skipRender = sk; }
  const fo = game.fadeEl ? parseFloat(game.fadeEl.style.opacity) || 0 : 0;
  if ((fo >= 0.5) !== (state.fadeOp >= 0.5)) log('fade', { op: fo });
  state.fadeOp = fo;
  if (dt && dt > 0.1) log('long-frame', { dt: +dt.toFixed(3) });
  // pixel probe: what did this frame actually composite to? Off with ?noprobe=1, otherwise every PROBE_EVERY frames
  if (PROBE_OFF || state.frame % PROBE_EVERY) return;
  const p = probeCenter();
  if (!p) return;
  state.probeN++;
  state.lastLum = p.lum;
  const glErr = state.gl.getError();
  if (glErr !== 0) log('gl-error', { code: errName(glErr) });
  // rolling trace sample
  state.trace.push([Math.round(performance.now() - state.t0), R3(p.lum), R2(p.r), R2(p.g), R2(p.b)]);
  if (state.trace.length > 40) state.trace.shift();

  const prev = state.prevLum;
  const prevRGB = state.prevRGB;
  const dLum = prev >= 0 ? Math.abs(p.lum - prev) : 0;
  const dCol = prevRGB ? Math.hypot(p.r - prevRGB[0], p.g - prevRGB[1], p.b - prevRGB[2]) : 0;
  state.prevLum = p.lum;
  state.prevRGB = [p.r, p.g, p.b];

  const isBlack = p.lum < BLACK_LUM;
  // a single big centre change is a legitimate camera cut / attract shot change; the user-visible
  // "变色快闪" is a rapid SEQUENCE of them, so only flag a second big jump within a short window
  const now = performance.now();
  let isFlash = false;
  if (!isBlack) {
    const big = dLum > FLASH_LUM || dCol > FLASH_COL;
    if (big) { isFlash = now - state.lastBig < 400; state.lastBig = now; }
  }
  if (!isBlack && !isFlash) return;
  const type = isBlack ? 'black-frame' : 'flash';
  const ctx = {
    f: state.frame, t: Math.round(performance.now() - state.t0),
    lum: R3(p.lum), rgb: [R2(p.r), R2(p.g), R2(p.b)],
    prevLum: prev >= 0 ? R3(prev) : null,
    dLum: R2(dLum), dCol: R2(dCol),
    match: ms, mode: G.mode,
    ...richContext(game),
    trace: state.trace.slice(-24),
  };
  state.black.push(ctx);
  if (state.black.length > 400) state.black.shift();
  log(type, {
    lum: ctx.lum, rgb: ctx.rgb, prevLum: ctx.prevLum, dLum: ctx.dLum, dCol: ctx.dCol,
    match: ms, mode: G.mode,
    dyn: ctx.dyn, samples: ctx.samples, rig: ctx.rig, cam: ctx.cam,
    local: ctx.local, env: ctx.env, map: ctx.map, specials: ctx.specials, fade: ctx.fade, fullFrame: ctx.fullFrame,
    recent: ctx.recent, trace: ctx.trace,
  });
  console.warn('[diag] ' + type.toUpperCase(), JSON.stringify(ctx));
  if (POST) flushNow(type);
}

export function diagDump() {
  return JSON.stringify({
    on: state.on,
    probeOff: state.probeOff,
    probeEvery: PROBE_EVERY,
    frames: state.frame,
    meta: state.meta,
    pipe: state.pipe,
    ctxLost: state.ctxLost,
    ctxRestored: state.ctxRestored,
    lastLum: R3(state.lastLum),
    blackFrames: state.black,
    events: state.events,
  }, null, 1);
}

if (ON && typeof window !== 'undefined') window.__diag = { dump: diagDump };
