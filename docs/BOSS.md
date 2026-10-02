# Boss Battle — special game mode

A co-op mode: every squidkid in the room (humans + bots filling to 8) is one squad against one giant boss. Chaotic,
readable, fair. Works offline (you + bots) and online (the host simulates the boss, like it simulates bots).

## The boss: HULLBREAKER
An original giant armoured hermit crab that has made its home in a rusted shipping container, bristling with harbour
junk — it fits every stage (plaza, container yard, marina). ~5–6 m tall at the shell, ~9 m long. It paints the
arena with its own corrupt ink (= team 1 ink: enemy ink for the squad, so it slows and hurts them and has to be
painted over). Silhouette first: container shell on its back, two unequal claws (a huge crusher and a quick pincer),
eye stalks, walking legs. Weak points glow in the rival ink colour: the eye stalks (always) and the soft underbelly
/ cracked shell (only in vulnerable windows and phase 3).

### Moves (host picks; each has a telegraph → action → recovery, all readable ≥ 0.6 s ahead)
| id | name | what happens | counterplay |
|---|---|---|---|
| `slam` | Crusher Slam | big claw rises (glow), slams → expanding ink shockwave ring along the ground | jump the ring / be far |
| `barrage` | Container Barrage | lobs 3–6 barrels at players' positions; target circles on the ground first; burst into ink puddles | move out of circles |
| `sweep` | Ink Cannon Sweep | eye cannon charges then sprays a sweeping ink beam in an arc | take cover / dive under (squid in own ink) |
| `charge` | Hull Charge | locks a direction (line telegraph), charges across the arena; hits a wall → STUNNED (vulnerable window) | sidestep; punish the stun |
| `crablets` | Brood | (phase ≥ 2) spills 3–5 small crablets that chase the nearest kid and pop in ink | shoot them (1–2 shots) |
| `frenzy` | Shell Frenzy | (phase 3) spins, spraying ink in all directions for 3 s | get out / get behind cover |

Phases by HP: 1 (100–66 %), 2 (66–33 %: + crablets, faster), 3 (< 33 %: shell cracks → belly weak point exposed,
frenzy, enrage tint). Phase transitions play a roar + short invulnerable beat (never mid-move).
HP scales with squad size (humans count 1.0, bots 0.6) and difficulty. Match timer: 4 min (host setting). Win:
HP → 0. Lose: timer runs out (turf % is shown but secondary). Weak-point hits ×2.5 with a distinct hit sound/VFX.

## Modules
| file | what |
|---|---|
| `src/boss/bossModel.js`, `bossModelGeo.js`, `bossAnim.js`, `bossMats.js`, `bossModelFx.js` | the 3D model, materials, rig + animation clips, VFX hooks; lab `tools/boss-lab.*` |
| `src/boss/boss.js`, `bossBrain.js`, `bossHazards.js`, `bossMode.js` | simulation, AI, moves, hazards, mode rules, damage both ways, netcode |
| `src/game/match.js`, `bots.js`, `weapons.js`, `src/net/netmatch.js`, `src/net/session.js`, `src/main.js` | mode integration (boss-mode branches only) |
| `src/ui/hud-boss.js`, `src/ui/boss-art.js`, `src/ui/menus.js` + `styles/ui.css`, `styles/hud.css`, `src/audio/bossAudio.js` | HUD, mode select, lobby MODE, boss results, sound + music |

## Interfaces

### Model
```js
import { BossModel } from '../boss/bossModel.js';
const m = new BossModel({ ink: THREE.Color, quality });   // m.root (Group, feet at y=0, facing +Z), m.ready (Promise)
m.update(dt, st)          // st = { speed, turn, move, moveT, movePhase: 'tele'|'act'|'rec'|null, phase, stunned, hurt, dead, aim: Vector3|null }
                          // drives locomotion + the move clips from state alone (so guests animate identically)
m.flash(k)                // damage flash 0…1 (weak point hits flash the weak point)
m.getSocket(name, out)    // world pos of 'clawL' 'clawR' 'cannon' 'eyeL' 'eyeR' 'belly' 'shellTop' 'mouth'
m.hitShapes               // [{ socket, r, weak, active }] spheres in world space (updated in update) — gameplay hit tests
m.setInk(color); m.setPhase(p); m.dispose()
```
Clips: idle, walk (speed-scaled, legs actually step), turn-in-place, each move's tele/act/rec, stun (dazed, eyes spiral),
roar (phase change), hurt flinch (additive), death (collapse, shell bursts, ink geyser), intro (bursts out of the ground/
water in a spray). Budget: ≤ 150k tris hero, ≤ 60 draw calls; must hold 60 fps with 8 kids.

### Simulation
- `Boss` (boss.js) owns state: `pos, yaw, vel, hp, maxHp, phase, move, moveT, movePhase, target (nid), stunned, dead,
  seed`. Deterministic moves: a move is `{ id, t0, seed, params }` — everything a guest needs to reproduce its
  telegraphs/hazards/animation from the start time.
- Hazards (bossHazards.js): rings, beams, barrels, puddles, crablets — geometry evaluated from the move record + time, so
  every client computes the same shapes. Painting: hazards paint via G.paint.splat(team 1) ON THE HOST ONLY (splats
  replicate like any other). Damage to a squidkid is applied by that kid's OWNER (victim-side, like the storm), from
  the replicated hazards — what you see is what hits you.
- Damage to the boss: projectiles/rollers/etc. test `boss.hitShapes`. Offline or host: apply directly. Guest: send
  `{ k: 'bhit', d, weak, w }` to the host (shooter-authoritative), show the hit marker locally at once.
- Events (event bus, src/core/ctx.js): `boss:spawn {boss}`, `boss:intro`, `boss:move {id, phase:'tele'|'act'|'rec'}`,
  `boss:hit {damage, weak, attacker}`, `boss:stun {dur}`, `boss:phase {phase}`, `boss:defeat {by}`, `boss:hp {hp,max}`.
  HUD / audio / fx subscribe; nothing polls.
- Netcode: host adds `B` (boss snapshot) to its 20 Hz tick and `['bm', move]` records to its event stream; guests
  interpolate the boss like any remote actor (playback clock) and start moves on the timeline. Host migration: the new
  host adopts the boss (state continues from the last snapshot). Late/lost packets: moves are keyed by t0, idempotent.
- Mode plumbing: `Match({ mode: 'boss' | 'turf' })`; lobby setting `lobby.mode` (host), carried in the start cfg;
  offline via `api.startMatch({ mode: 'boss', mapId, time })`. In boss mode everyone is team 0 ("SQUAD"); bots play
  the boss (spread out, target it, dodge telegraphs, clear boss ink, pop crablets).

### UI
- HUD: boss bar (name, HP with phase notches, damage chip-away, weak-point flash), title-card intro, move callouts
  (subtle), stun "OPEN!" prompt, squad status (replaces the 5v5 squads), timer. Results: VICTORY/DEFEAT with boss time,
  per-player damage, weak-point hits, splats, turf.
- Menus: mode choice in the offline Play flow (Turf War | Boss Battle) and in the online lobby host settings (locked
  team picker → "SQUAD" in boss mode).
- Audio: boss roar/footsteps/move tells/hit/stun/defeat + a boss battle music variant (procedural like the rest).

## Edge cases that must hold
- Host leaves mid-fight → boss continues seamlessly on the new host.
- A player joins nothing mid-match (rooms lock) but leavers become bots (they keep fighting).
- Everyone splatted at once → respawn as normal (no instant loss); the boss doesn't camp the spawn (spawn pads are
  a no-go zone for hazards and the boss body).
- Boss never walks into water / off the stage / through walls (nav-restricted; charge stops at walls = stun).
- Kill during a move → death anim interrupts cleanly; pending hazards fizzle; no damage after defeat.
- Timer ends mid-move → hazards stop, results show.
- Stage + time of day: works on all three stages, day and dusk.

## Model notes
The model API above holds; these are the details and small additions.
- Files: `src/boss/bossModel.js` (BossModel + Crablet), `bossModelGeo.js` (rig + procedural geometry), `bossAnim.js`
  (pose channels, clips, gait/IK, springs, verlet junk), `bossMats.js` (5 patched physical materials + stencil atlas),
  `bossModelFx.js` (model-owned ink blobs + steam). Lab: `tools/boss-lab.html` (+ `tools/boss-lab.film.mjs` capture).
- Budget (tris per pass / draws): low 31k · medium 40k · high 59k · ultra 86k; 5 skinned meshes (steel, chitin, flesh,
  eyes, junk) + 2 FX draws only while FX are live; one 100-bone skeleton. `m.tris` = built triangle count.
- `m.hitShapes[i] = { socket, r, weak, active, pos }` — `pos` is a world `Vector3` (alias `c`), refreshed at the end of
  every `m.update()`. Body: `shellF`, `shellR` (container halves, r 1.8), `body` (head), `clawL`, `clawR`. Weak:
  `eyeL`, `eyeR` (always), `belly` (while `st.stunned`, in phase 3, or when the belly is glowing), `crackL`/`crackR`
  (the phase-3 torn side walls, once the flaps are open). All inactive while dead or still underground in the intro.
  Test weak shapes before body shapes when they overlap (the eyes sit in front of the body sphere).
- Sockets: `clawL` (the CRUSHER, boss's left = +X), `clawR` (pincer), `cannon` (nozzle tip, sweep origin), `mouth`,
  `eyeL`, `eyeR`, `belly`, `shellTop` (barrel hatches, barrage spawn), `hatch` (rear brood hatch, crablets), `body`,
  `shellF`, `shellR`, `crackL`, `crackR`, `footL0..2` / `footR0..2` (dactyl tips). `m.sockets` lists them.
- State read by `update(dt, st)`: `moveT` = seconds since the current movePhase began, `phaseDur` its length (tele
  clips land their strike exactly at act start), `params` = move.p (slam `rings` → one claw slam per ring; barrage
  `b[i][3]` → one hatch pop + lob per barrel; charge `wall` → bonk into the stun; frenzy spin is read from the root's
  yaw rate), `aim` (world; eyes/head track it, sweep nozzle follows it, slam lands in front), `hurt` (> 0 on the
  frame of a hit → additive flinch), `stunned` (bonk after a charge, dizzy otherwise; spiral eyes, belly out), `dead`.
  `move = 'intro' | 'roar'` play the set pieces on `moveT`; a phase increase also auto-roars when no move is running.
  The root transform is the sim's: feet plant in world space and step from the MEASURED root motion (no sliding).
- `m.flash(k, weak = false)` — body rim flash (kept subtle for sustained fire) or weak-point flash; plus a flinch.
- Colours: `new BossModel({ ink, weak, quality })`, `m.setInk(c)` (boss ink: drips, dipped feet, crusher veins, nozzle,
  FX), `m.setWeak(c)` (eyes, belly, cracks). Defaults: `G.teamColors[1]` / `G.teamColors[0]`.
- VFX hooks (called synchronously inside `update`; the Vector3 is reused — copy it):
  `m.onFoot(legIndex, pos, strength)` every plant (strength ≈ 0.4 walk … 1.5 gallop);
  `m.onImpact(socket, pos, strength)` — slam contact ('clawL', pos on the floor), charge wall bonk ('mouth'),
  stun/death collapse ('belly' / 'body'), intro landing ('body');
  `m.onEvent(name, { socket, pos, data })` — 'step', 'hatch' (barrage pop, data = barrel index), 'crablets' (brood
  hatch flips open, data = count), 'roar', 'bonk', 'burst' (intro: breaks the ground), 'geyser' (death: ink geyser).
  The model itself draws the set-piece ink/steam (intro spray, slam splash, death geyser, phase-3 steam vents).
- Minion: `BossModel.makeCrablet({ ink, weak, quality })` → `{ root, ready, tris, update(dt, { speed, turn, dead }),
  pop(), hit(), setInk, dispose }` — 1 draw, ~1.8k tris; tumbles in for 0.55 s after creation; `pop()` swells, flashes
  and bursts into ink (its own tiny FX); keep it ~1 s after pop before dispose (the sim already does 1.2 s).
- `st.params` (the live move record's params) keeps the model's telegraphs in sync with the simulation; without it the
  model mirrors the default tuning (slam rings by phase, barrage 3/4/6 barrels 0.26 s apart).
