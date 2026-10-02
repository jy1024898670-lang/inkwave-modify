// INKWAVE online relay (Cloudflare Worker + Durable Object).
//
//   GET /room/<CODE>?name=<name>&create=1&v=<proto>   (WebSocket upgrade) → the Room object for that code
//   GET /health                                          → "ok"
//
// A Room is a dumb, fast fan-out: game payloads are forwarded as raw strings (never parsed here). The room only
// tracks membership (id, name, join order), elects the host (the oldest member), and refuses joins that can't work
// (unknown code, full, match in progress). Wire format, client → room:
//   "b|<payload>"          broadcast to everyone else          "s|<toId>|<payload>"   to one member
//   {"t":"lock","v":bool}  host: refuse new joins while a match runs
//   "ping"                 → "pong" (answered by the runtime without waking the room; also the liveness signal)
//   {"t":"ping","c":n}     → {"t":"pong","c":n}   (older clients)
// room → client:
//   "m|<fromId>|<payload>"                                      relayed game payload
//   {"t":"welcome","id","host","members":[{id,name}]}           {"t":"join","m":{id,name}}
//   {"t":"leave","id","host"}                                   {"t":"err","e":"…"} (then close)
import { DurableObject } from 'cloudflare:workers';

const PROTO = 1, MAX = 10, LOBBY_TTL = 90_000;   // public-lobby card lifetime: live rooms re-sync all the time, this is the sweep net
// Public relay hygiene: only the game's own site may open rooms (plus local dev), each socket gets a message budget
// (the game sends ~25/s; a runaway or hostile client is cut off before it can eat the account's quota) and a size cap.
// inkwave-aah.pages.dev = the upstream game's public build; inkwave-2cc.pages.dev = this build's Pages project
// (the bare "inkwave" pages name was already taken, so Cloudflare assigned the -2cc URL suffix)
const ORIGIN_OK = (o) => /^https:\/\/([a-z0-9-]+\.)?(inkwave-aah|inkwave-2cc)\.pages\.dev$/.test(o)
  || /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[a-z0-9-]+\.local)(:\d+)?$/.test(o);   // dev + LAN play
const MSG_MAX = 65536, RATE = 90, BURST_STRIKES = 4;
// A socket whose "ping"s stop is a player whose connection died without closing (Wi-Fi gone, laptop lid shut): drop
// them so their squidkid is handed to a bot instead of standing frozen. Clients ping every 2 s; a hidden tab still
// pings (throttled to ≥ 1/min after five minutes), so the lobby allowance is generous.
const SILENT_MATCH = 20000, SILENT_LOBBY = 150000, SWEEP = 4000;   // a heavy transition on a slow machine can freeze a tab for seconds
const CODE = /^[A-Z0-9]{4,8}$/;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return new Response('ok', { headers: { 'access-control-allow-origin': '*' } });
    if (url.pathname === '/lobby') {   // public lobby: GET the room list, POST /room/<CODE> to upsert/remove a card
      if (!ORIGIN_OK(req.headers.get('Origin') || '')) return new Response('forbidden', { status: 403 });
      return env.LOBBY.get(env.LOBBY.idFromName('lobby')).fetch(req);
    }
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9]+)$/);
    if (!m) return new Response('INKWAVE relay', { status: 404 });
    const code = m[1].toUpperCase();
    if (!CODE.test(code)) return new Response('bad code', { status: 400 });
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
    if (!ORIGIN_OK(req.headers.get('Origin') || '')) return new Response('forbidden', { status: 403 });
    return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(req);
  },
};

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.locked = false;
    this.code = null;
    this.meta = null;   // public-lobby card state (host-controlled)
    this.seq = 0;
    this.seen = new Map();   // ws → last message time (in memory: a busy room never hibernates; a quiet one has the pings)
    this.rate = new Map();   // ws → { t: window start, n: messages in it, strikes }
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  // hibernation: a fresh instance is also built on every wakeup, but storage is unavailable in the constructor and
  // init() is not called on every wakeup in every runtime — so rehydrate the small persistent state at the top of
  // every entry method instead (async storage API: getSync is not available in this workerd build)
  async _rehydrate() {
    this.code = (await this.ctx.storage.get('code')) || this.code || null;
    this.meta = JSON.parse((await this.ctx.storage.get('meta')) || 'null');
    for (const ws of this.ctx.getWebSockets()) { const a = ws.deserializeAttachment(); if (a && a.seq >= this.seq) this.seq = a.seq + 1; }
  }

  members() {
    return this.ctx.getWebSockets().map((ws) => ({ ws, a: ws.deserializeAttachment() })).filter((m) => m.a && !m.a.gone).sort((x, y) => x.a.seq - y.a.seq);
  }
  host() { const ms = this.members(); return ms.length ? ms[0].a.id : null; }

  async fetch(req) {
    await this._rehydrate();
    const url = new URL(req.url);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    const fail = (e) => { server.send(JSON.stringify({ t: 'err', e })); server.close(4000, e); return new Response(null, { status: 101, webSocket: client }); };
    const ms = this.members().filter((m) => m.ws !== server);
    const create = url.searchParams.get('create') === '1';
    if (+(url.searchParams.get('v') || 0) !== PROTO) return fail('Please refresh the page — the game was updated');
    if (create && (ms.length || this.ctx.getWebSockets().length > 1 + ms.length)) return fail('Room code taken');   // + unattached accepted sockets (double-create race)
    if (!create && !ms.length) return fail('Room not found');
    if (ms.length >= MAX) return fail('Room is full');
    if (this.locked && ms.length) return fail('Match in progress');
    if (!ms.length) this.locked = false;
    this.code = (url.pathname.match(/^\/room\/([A-Za-z0-9]+)/) || [])[1]?.toUpperCase() || this.code;
    await this.ctx.storage.put('code', this.code);
    const name = (url.searchParams.get('name') || 'Player').replace(/[^\p{L}\p{N} ._\-!?']/gu, '').slice(0, 16) || 'Player';
    let id;
    do { id = Math.random().toString(36).slice(2, 6).toUpperCase(); } while (ms.some((m) => m.a.id === id));
    const a = { id, name, seq: this.seq++, at: Date.now() };
    server.serializeAttachment(a);
    const all = [...ms.map((m) => m.a), a];
    server.send(JSON.stringify({ t: 'welcome', id, host: all[0].id, members: all.map(({ id, name }) => ({ id, name })) }));
    if (this.meta && this.meta.public) server.send(JSON.stringify({ t: 'meta', ...this.meta }));   // a new joiner learns the room's public state
    const j = JSON.stringify({ t: 'join', m: { id, name } });
    for (const m of ms) try { m.ws.send(j); } catch { /* closing */ }
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + SWEEP);
    this._sync();
    return new Response(null, { status: 101, webSocket: client });
  }

  // liveness sweep (only while the room has members)
  async alarm() {
    await this._rehydrate();
    const now = Date.now(), limit = this.locked ? SILENT_MATCH : SILENT_LOBBY;
    for (const m of this.members()) {
      const seen = Math.max(m.a.at || 0, this.seen.get(m.ws) || 0, this.ctx.getWebSocketAutoResponseTimestamp(m.ws)?.getTime() || 0);
      if (now - seen > limit) { try { m.ws.close(4001, 'Connection timed out'); } catch { /* gone */ } this._gone(m.ws); }
    }
    if (this.members().length) { await this.ctx.storage.setAlarm(Date.now() + SWEEP); this._sync(); }
  }

  async webSocketMessage(ws, msg) {
    await this._rehydrate();
    if (typeof msg !== 'string') return;
    const me = ws.deserializeAttachment();
    if (!me) return;
    const now = Date.now();
    if (msg.length > MSG_MAX) {                                         // oversized: drop BEFORE touching liveness/rate; repeats earn strikes and get cut
      let ro = this.rate.get(ws);
      if (!ro) this.rate.set(ws, (ro = { t: now, n: 0, strikes: 0 }));
      ro.strikes += 1;
      if (ro.strikes >= BURST_STRIKES) { try { ws.close(4008, 'Oversized messages'); } catch { /* gone */ } this._gone(ws); }
      return;
    }
    this.seen.set(ws, now);
    let r = this.rate.get(ws);
    if (!r) this.rate.set(ws, (r = { t: now, n: 0, strikes: 0 }));
    if (now - r.t >= 1000) { r.strikes = r.n > RATE ? r.strikes + 1 : Math.max(0, r.strikes - 1); r.t = now; r.n = 0; }
    if (++r.n > RATE * 3 || r.strikes >= BURST_STRIKES) { try { ws.close(4008, 'Too many messages'); } catch { /* gone */ } this._gone(ws); return; }
    const c = msg.charCodeAt(0);
    if (c === 98 /* b */ && msg.charCodeAt(1) === 124) {
      const out = 'm|' + me.id + '|' + msg.slice(2);
      for (const m of this.members()) if (m.ws !== ws) try { m.ws.send(out); } catch { /* closing */ }
      return;
    }
    if (c === 115 /* s */ && msg.charCodeAt(1) === 124) {
      const k = msg.indexOf('|', 2);
      if (k < 0) return;
      const to = msg.slice(2, k), out = 'm|' + me.id + '|' + msg.slice(k + 1);
      for (const m of this.members()) if (m.a.id === to) { try { m.ws.send(out); } catch { /* closing */ } break; }
      return;
    }
    if (c === 123 /* { */) {
      let o; try { o = JSON.parse(msg); } catch { return; }
      if (o.t === 'ping') ws.send(JSON.stringify({ t: 'pong', c: o.c }));
      else if (o.t === 'lock' && this.host() === me.id) { this.locked = !!o.v; this._sync(); }
      else if (o.t === 'meta' && this.host() === me.id) {
        // mode/map feed the public lobby list that every client polls — whitelist them, never trust the raw host value
        const mode = /^(turf|zones|boss)$/.test(o.mode || '') ? o.mode : 'turf';
        const map = /^[a-z0-9-]{1,32}$/.test(o.map || '') ? o.map : '';
        this.meta = { public: !!o.public, mode, map };
        this.ctx.storage.put('meta', JSON.stringify(this.meta));
        const out = JSON.stringify({ t: 'meta', ...this.meta });   // the other players see the room's public state too
        for (const s of this.ctx.getWebSockets()) if (s !== ws) { try { s.send(out); } catch { /* closing */ } }
        this._sync();
      }
    }
  }

  async webSocketClose(ws) { await this._rehydrate(); this._gone(ws); }
  async webSocketError(ws) { await this._rehydrate(); this._gone(ws); }

  async _gone(ws) {
    this.seen.delete(ws); this.rate.delete(ws);
    const a = ws.deserializeAttachment();
    if (!a || a.gone) return;
    a.gone = true;
    try { ws.serializeAttachment(a); } catch { /* already closed */ }
    const host = this.host();
    const out = JSON.stringify({ t: 'leave', id: a.id, host });
    for (const m of this.members()) try { m.ws.send(out); } catch { /* closing */ }
    if (!this.members().length) {
      this.locked = false;
      this.meta = null;   // the room is gone: a later room on the same code must not inherit its public card
      try { await this.ctx.storage.delete('meta'); } catch { /* best-effort */ }
    }
    this._sync();
  }

  // public-lobby card: upsert this room's row in the Lobby registry (or remove it when the room is private or empty).
  // Best-effort — a failed sync just leaves the list a frame stale.
  async _sync() {
    try {
      const ms = this.members();
      const body = (this.meta && this.meta.public && ms.length)
        ? { d: { name: ms[0].a.name, mode: this.meta.mode, map: this.meta.map, players: ms.length, max: MAX, inMatch: !!this.locked, at: Date.now() } }
        : { remove: 1 };
      await this.env.LOBBY.get(this.env.LOBBY.idFromName('lobby')).fetch(new Request('https://inkwave-net.local/room/' + this.code, {
        method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' },
      }));
    } catch (e) { console.error('Lobby sync failed:', e && (e.stack || e.message || e)); }   // the lobby list is best-effort
  }
}

// The registry of PUBLIC rooms (the online lobby). Each Room writes its card on join/leave/lock/meta changes and on
// every liveness sweep while public; the game's ONLINE screen reads the list over plain HTTP. Cards carry a
// timestamp and the alarm prunes the stale ones.
export class Lobby extends DurableObject {
  constructor(ctx, env) { super(ctx, env); }

  // CREATE is idempotent and runs on every entry point, so table setup never depends on init() lifecycle timing
  // (init() is not called on every DO wakeup in every runtime — observed on workerd local)
  _ensureTable() {
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, data TEXT NOT NULL, at INTEGER NOT NULL)');
  }

  async fetch(req) {
    this._ensureTable();
    const url = new URL(req.url);
    const JSON_H = { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' };
    if (req.method === 'GET' && url.pathname === '/lobby') {
      const rooms = [...this.ctx.storage.sql.exec('SELECT code, data FROM rooms WHERE at > ' + (Date.now() - LOBBY_TTL))]
        .map((r) => { try { return { code: r.code, ...JSON.parse(r.data) }; } catch { return null; } }).filter(Boolean);
      rooms.sort((a, b) => (a.inMatch - b.inMatch) || (b.players - a.players) || (b.at - a.at));   // waiting first, busiest first
      return new Response(JSON.stringify({ rooms }), { headers: JSON_H });
    }
    if (req.method === 'POST') {
      const code = (url.pathname.match(/^\/room\/([A-Z0-9]{4,8})$/) || [])[1];
      if (!code) return new Response('bad room', { status: 400 });
      let body;
      try { body = JSON.parse(await req.text()); } catch { return new Response('bad body', { status: 400 }); }
      const sql = this.ctx.storage.sql;
      // this workerd build has no parameter binding (prepare is undefined) — values are inlined with quote
      // escaping: codes match /^[A-Z0-9]+$/, timestamps are numbers, the JSON card has its quotes doubled
      const q = (v) => "'" + String(v).replace(/'/g, "''") + "'";
      if (body.remove) sql.exec('DELETE FROM rooms WHERE code = ' + q(code));
      else if (body.d && body.d.players > 0) sql.exec('INSERT OR REPLACE INTO rooms (code, data, at) VALUES (' + q(code) + ', ' + q(JSON.stringify(body.d)) + ', ' + Date.now() + ')');
      let n = 0; for (const r of sql.exec('SELECT COUNT(*) AS n FROM rooms')) n = r.n;
      if (n) this.ctx.storage.setAlarm(Date.now() + 30_000);
      return new Response(JSON.stringify({ ok: 1 }), { headers: JSON_H });
    }
    return new Response('not found', { status: 404 });
  }

  async alarm() {
    this._ensureTable();
    const sql = this.ctx.storage.sql;
    sql.exec('DELETE FROM rooms WHERE at < ' + (Date.now() - LOBBY_TTL));
    let n = 0; for (const r of sql.exec('SELECT COUNT(*) AS n FROM rooms')) n = r.n;
    if (n) this.ctx.storage.setAlarm(Date.now() + 30_000);
  }
}
