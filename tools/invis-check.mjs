// Invisibility probe: two headless humans (autopilot) play a real match on the LOCAL relay and every 500 ms record,
// per remote squidkid, the exact visibility state the netcode drives — to pin down "invisible but still hit by ink".
//
// usage: node tools/invis-check.mjs [--secs 100] [--map tidewater]
//   needs the game on :8490 (npm start) — this script starts/stops the relay on :8787 itself.
//
// The decisive question: when a remote kid is invisible while ALIVE, is it
//   (a) ready=false            → no samples at all (position frozen — would NOT be hit)  = network/delivery
//   (b) ready=true, tp==deathTp → the respawn-tp desync (netmatch.js:421 early return)   = the suspected state machine
//   (c) ready=true, tp!=deathTp, no spawnPending → something else keeps root.visible false
// The dump below reports which case every invisible-while-alive frame falls in.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const SECS = +opt('secs', 45);
const MAP = opt('map', 'tidewater');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:8490/';

const say = (...a) => console.log('[invis]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browsers = [], pages = [];
let relay = null;

async function upRelay() {
  // the relay is a wrangler dev workerd process; keep it a child of THIS shell so it lives for the whole probe
  relay = spawn('npm', ['run', 'relay'], {
    cwd: fileURLToPath(new URL('../server', import.meta.url)), shell: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  relay.stdout.on('data', (d) => (log += d));
  relay.stderr.on('data', (d) => (log += d));
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch('http://127.0.0.1:8787/health', { signal: AbortSignal.timeout(800) });
      if (r.ok) { say('relay up in ~' + (i + 1) + ' s'); return; }
    } catch { /* not yet */ }
    await sleep(1000);
  }
  say('RELAY FAILED TO START; log tail:\n' + log.slice(-1500));
  process.exit(3);
}

async function open(i) {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required',
      '--window-size=800,450', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
    defaultViewport: { width: 800, height: 450, deviceScaleFactor: 1 },
  });
  const p = await b.newPage();
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('inkwave.settings', JSON.stringify({ quality: 'low' })); } catch { /* */ } });
  p.on('pageerror', (e) => say(`c${i} pageerror`, e.message));
  await p.goto(`${BASE}?skipTitle&autopilot`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction('window.__inkwave && window.__G && __G.mode === "menu"', { timeout: 300000, polling: 500 });
  browsers.push(b); pages[i] = p;
}
const ev = (i, fn, ...a) => pages[i].evaluate(fn, ...a);
const until = (i, js, ms = 60000) => pages[i].waitForFunction(js, { timeout: ms, polling: 100 });

try {
  await upRelay();
  await open(0); say('client 0 in menu');
  await open(1); say('client 1 in menu');

  const code = await ev(0, async () => __G.net.create('Host'));
  say('room', code);
  await ev(0, (m) => __G.net.setSettings({ map: m, time: 'day', bots: true, difficulty: 'normal', mode: 'turf' }), MAP);
  await ev(1, (c, n) => __G.net.join(c, n), code, 'Guest');
  await until(0, '__G.net.lobby.players.length === 2', 15000);
  await ev(1, () => __G.net.setMe({ ready: true }));
  await until(0, '__G.net.canStart()', 10000);
  await ev(0, () => { __G.net.lobby.duration = 600; });
  await ev(0, () => __G.net.start());
  await Promise.all(pages.map((_, i) => until(i, '__G.net.state === "match" && __inkwave.match && __inkwave.match.state === "playing"', 90000)));
  say('match playing, recording ' + SECS + ' s');

  // per-frame sampler (driven by rAF, stamped on wall clock), kept in a ring; we read a snapshot every 500 ms
  await Promise.all(pages.map((_, i) => ev(i, () => {
    const rec = (window.__rec = { rows: [] });
    const t0 = performance.now();
    let last = 0, n = 0;
    const tick = () => {
      const m = __inkwave.match;
      if (m && !m.attract && m.state === 'playing') {
        const wall = performance.timeOrigin + performance.now();
        if (performance.now() - last >= 500) {
          last = performance.now(); n++;
          const nm = __G.netm;
          rec.rows.push({
            t: +(performance.now() - t0).toFixed(0),
            n: n,
            in: nm ? nm.stats.in : -1, out: nm ? nm.stats.out : -1, snaps: nm ? nm.stats.snaps : -1,
            bi: __G.net.tr ? __G.net.tr.bytesIn : -1,
            a: m.actors.map((a) => {
              const net = a.net || {};
              return [a.nid, a.remote ? 1 : 0, a.alive ? 1 : 0,
                a.character.root.visible ? 1 : 0, a.character.visible ? 1 : 0,
                net.ready ? 1 : 0, net.buf ? net.buf.length : -1,
                net.tp === undefined ? -9 : net.tp, net.deathTp === undefined ? -9 : net.deathTp,
                net.spawnPending ? 1 : 0,
                +(a.respawnTimer || 0).toFixed(1),
                net.buf && net.buf.length ? net.buf[net.buf.length - 1].tp : -8,
                a.form === 'squid' ? 1 : 0, a.submerged ? 1 : 0,
                +a.pos.x.toFixed(1), +a.pos.z.toFixed(1)];
            }),
          });
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })));

  // force-splat both locals every ~10 s: a death/respawn every 5.5 s stresses the splat→respawn→tp handoff
  let lastKill = -6;
  for (let s = 0; s < SECS; s += 5) {
    if (s - lastKill >= 7) {
      lastKill = s;
      for (let i = 0; i < pages.length; i++) {
        await ev(i, () => { const a = __inkwave.match?.actors?.find((x) => !x.remote); if (a && a.alive) a.damage(99999, null); }).catch(() => {});
      }
      say(`  (forced splat @ t=${s}s)`);
    }
    await sleep(Math.min(5, SECS - s) * 1000);
    const tag = (i) => pages[i] ? ev(i, () => {
      const m = __inkwave.match; if (!m) return 'none';
      const bad = m.actors.filter((a) => a.remote && a.alive && !a.character.root.visible);
      return `t=${m.time.toFixed(0)}s bad=${bad.length}/${m.actors.filter(x => x.remote).length}`;
    }) : Promise.resolve('(gone)');
    const tags = await Promise.all(pages.map((_, i) => tag(i)));
    say(`+${Math.min(SECS, s + 5)}s`, tags.join('  '));
    // cross-check: for each bad remote on c1, what does its OWNER (c0 = host) actually hold?
    if (pages[1] && pages[0]) {
      const badNids = await ev(1, () => {
        const m = __inkwave.match; if (!m) return [];
        return m.actors.filter((a) => a.remote && a.alive && !a.character.root.visible).map((a) => a.nid);
      }).catch(() => []);
      if (badNids.length) {
        const own = await ev(0, (nids) => nids.map((n) => {
          const a = __G.netm && __G.netm.byNid.get(n);
          return `nid${n}:netTp=${a ? (a.netTp || 0) : '?'} alive=${a ? (a.alive ? 1 : 0) : '?'}`;
        }), badNids).catch(() => ['?']);
        say(`   c1 INVISIBLE nids [${badNids}]  → owner(c0) holds: ${own.join('   ')}`);
      }
    }
  }

  const recs = await Promise.all(pages.map((p, i) => p ? ev(i, () => { const r = window.__rec; window.__rec = null; return r; }) : null));

  // ---- analysis: every invisible-while-alive remote frame, classified
  say('--- invisible-while-ALIVE remote frames (the bug); [nid,remote,alive,rootVis,chVis,ready,buf,tp,deathTp,spawnPend,x,z]');
  for (let ci = 0; ci < recs.length; ci++) {
    const r = recs[ci]; if (!r) continue;
    let bad = 0, aCase = 0, bCase = 0, cCase = 0, firstT = null, lastT = null;
    const byNid = {};
    for (const row of r.rows) {
      for (const a of row.a) {
        const [nid, remote, alive, rv, chv, ready, buf, tp, deathTp, sp, rT, btp, sq, sub, x, z] = a;
        if (!remote || !alive || rv) continue;      // only invisible-while-alive remotes
        bad++; if (firstT === null) firstT = row.t; lastT = row.t;
        if (!ready) aCase++;
        else if (tp === deathTp) bCase++;
        else cCase++;
        (byNid[nid] || (byNid[nid] = 0)); byNid[nid]++;
      }
    }
    say(`c${ci}: ${bad} bad-frames over ${firstT === null ? 'none' : (firstT / 1000).toFixed(1) + '–' + (lastT / 1000).toFixed(1) + ' s'}`
      + (bad ? `  (a)no-ready ${aCase}  (b)tp==deathTp ${bCase}  (c)other ${cCase}  nids ${JSON.stringify(byNid)}` : ''));
    if (bad) {
      let shown = 0;
      for (const row of r.rows) {
        for (const a of row.a) {
          if (!(a[1] && a[2] && !a[3])) continue;
          if (shown++ >= 12) break;
          const [nid, , alive, rv, chv, ready, buf, tp, deathTp, sp, rT, btp, sq, sub, x, z] = a;
          say(`    t=${(row.t / 1000).toFixed(1)}s nid=${nid} alive=${alive} rootVis=${rv} chVis=${chv} ready=${ready} buf=${buf} S.tp=${tp} bufLastTp=${btp} deathTp=${deathTp} spawnPend=${sp} reT=${rT} squid=${sq} sub=${sub} x=${x} z=${z} | net in=${row.in} out=${row.out} snaps=${row.snaps}`);
        }
      }
    }
  }
  say('done');
} catch (e) {
  say('FAIL', e && (e.stack || e.message));
  process.exitCode = 1;
} finally {
  for (const b of browsers) { await Promise.race([b.close().catch(() => {}), sleep(4000)]); try { b.process()?.kill('SIGKILL'); } catch { /* */ } }
  if (relay) { try { relay.kill('SIGKILL'); } catch { /* */ } }
  process.exit(process.exitCode || 0);
}
