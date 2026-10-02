// Server-contract test for the public lobby (NO browser — speaks the relay's WebSocket protocol directly).
// A = host (creates the room), B = guest. Covers: meta frame broadcast, registry upsert/remove, meta-on-join,
// lock → inMatch, player counts, and the origin-checked HTTP list.
// usage: node tools/lobby-server-check.mjs   (relay must be running on :8787)
import WebSocket from 'ws';

const BASE = 'ws://localhost:8787';
const HTTP = 'http://localhost:8787';
const ORIGIN = 'http://localhost:8490';   // the relay only admits the game site + local dev origins
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T0 = Date.now();
const t = () => ((Date.now() - T0) / 1000).toFixed(1) + 's';

const getLobby = async () => {
  const r = await fetch(HTTP + '/lobby', { headers: { Origin: ORIGIN }, cache: 'no-store' });
  const j = await r.json();
  return j.rooms || [];
};
const findRoom = (rooms, code) => rooms.find((r) => r.code === code) || null;
async function until(fn, timeout = 10000) {
  const t0 = Date.now();
  for (;;) {
    let v = null;
    try { v = await fn(); } catch { v = null; }
    if (v) return v;
    if (Date.now() - t0 > timeout) return null;
    await sleep(300);
  }
}

function connect(code, name, create) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${BASE}/room/${code}?name=${encodeURIComponent(name)}&v=1${create ? '&create=1' : ''}`,
      { headers: { Origin: ORIGIN } });
    const c = { ws, frames: [], welcome: null, closed: null };
    c.send = (o) => ws.send(JSON.stringify(o));
    const to = setTimeout(() => reject(new Error('connect timeout ' + code)), 8000);
    ws.on('message', (d) => {
      const s = d.toString();
      if (s === 'pong') return;
      let o; try { o = JSON.parse(s); } catch { c.frames.push(s); return; }
      if (o.t === 'welcome') { c.welcome = o; clearTimeout(to); resolve(c); return; }
      c.frames.push(o);
    });
    ws.on('close', (code2, reason) => { c.closed = { code: code2, reason: reason.toString() }; });
    ws.on('error', (e) => { clearTimeout(to); reject(new Error('ws error ' + code + ': ' + e.message)); });
  });
}

const code = 'AB' + String(Math.floor(1000 + Math.random() * 9000));
const R = { code };
const checks = {};

// origin check: a request from a foreign origin must be refused
const foreign = await fetch(HTTP + '/lobby', { headers: { Origin: 'https://evil.example' } });
checks['origin check (foreign origin refused)'] = foreign.status === 403;

console.log('A (host) connecting…');
const A = await connect(code, 'HostA', true);
R.aId = A.welcome.id; R.aHost = A.welcome.host;
checks['A: welcome (host is A)'] = R.aHost === R.aId && A.welcome.members.length === 1;

A.send({ t: 'meta', public: true, mode: 'turf', map: 'ocean' });
let room = await until(async () => { const r = findRoom(await getLobby(), code); return r && r.players === 1 ? r : null; });
R.card1 = room;
checks['registry: card appears (1 player, waiting, host name)'] = !!room && room.inMatch === false && room.name === 'HostA' && room.mode === 'turf' && room.map === 'ocean';

console.log('B (guest) joining…');
const B = await connect(code, 'GuestB', false);
const bMeta = await until(() => B.frames.find((f) => f.t === 'meta' && f.public === true));
checks['B: gets meta frame on join (public state)'] = !!bMeta;
const aJoin = await until(() => A.frames.find((f) => f.t === 'join' && f.m && f.m.name === 'GuestB'));
checks['A: gets join frame (GuestB)'] = !!aJoin;
room = await until(async () => { const r = findRoom(await getLobby(), code); return r && r.players === 2 ? r : null; });
R.card2 = room;
checks['registry: 2 players after join'] = !!room && room.players === 2;

A.send({ t: 'lock', v: true });
room = await until(async () => { const r = findRoom(await getLobby(), code); return r && r.inMatch === true ? r : null; });
checks['registry: lock → inMatch'] = !!room && room.inMatch === true;

// while locked, a stranger is refused (match in progress)
const C = await connect(code, 'LateC', false).then(() => null, (e) => e);
checks['stranger refused while match locked'] = C instanceof Error;

A.send({ t: 'meta', public: false, mode: 'turf', map: 'ocean' });
const gone = await until(async () => (findRoom(await getLobby(), code) ? null : true));
checks['registry: un-publish removes the card'] = gone === true;

B.ws.close(1000, 'bye');
const bGone = await until(() => A.frames.find((f) => f.t === 'leave' && f.id === B.welcome.id));
checks['A: gets leave frame (B)'] = !!bGone;
A.ws.close(1000, 'bye');
await sleep(500);
const empty = await until(async () => (findRoom(await getLobby(), code) ? null : true));
checks['registry: empty room stays removed'] = empty === true;

// stale-meta regression: a brand-new room on the same code must NOT inherit the old room's public card
const A2 = await connect(code, 'HostA2', true);
const stale = await until(async () => (findRoom(await getLobby(), code) ? true : null), 6000);
checks['registry: re-created code starts private (no stale meta)'] = stale === null;
A2.ws.close(1000, 'bye');

console.log('LOBBY SERVER (' + t() + '):');
for (const [k, v] of Object.entries(checks)) console.log('  ' + (v ? 'PASS' : 'FAIL') + '  ' + k);
console.log('  card@1:', JSON.stringify(R.card1), ' card@2:', JSON.stringify(R.card2), ' C:', C instanceof Error ? C.message : 'connected?!');
console.log('VERDICT', Object.values(checks).every(Boolean) ? 'LOBBY-SERVER-PASS' : 'LOBBY-SERVER-FAIL');
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
