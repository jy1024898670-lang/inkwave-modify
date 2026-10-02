<p align="center">
  <img src="assets/stages/halyard-day.webp" alt="Halyard Marina at golden hour" width="100%">
</p>

<h1 align="center">INKWAVE</h1>

<p align="center"><a href="#简体中文">📖 简体中文</a> &nbsp;·&nbsp; <a href="#english">📖 English</a></p>

<p align="center">
  一款在浏览器里运行的原创喷射战士风格 5v5 涂地对战射击游戏。<br>
  An original Splatoon-style 5v5 turf-war shooter that runs in your browser.
</p>

<p align="center">
  <a href="https://inkwave-2cc.pages.dev"><b>▶ 立即游玩 / Play now</b></a>
</p>

<p align="center">
  <img alt="three.js r186" src="https://img.shields.io/badge/three.js-r186-000000?logo=three.js&logoColor=white">
  <img alt="No build step" src="https://img.shields.io/badge/build-none%20needed-2ea44f">
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-blue"></a>
</p>

---

## 简体中文

<p align="center">
  <a href="#操作">操作</a> ·
  <a href="#联机">联机</a> ·
  <a href="#本地运行">本地运行</a> ·
  <a href="#部署">部署</a> ·
  <a href="#原理">原理</a>
</p>

### 特性

- **5 v 5 游戏模式。** 涂地对战(涂满地面多的一方获胜)、据点控制(守住活据点,从 100 倒计时 —— 轮换侧据点、惩罚机制、加时赛),以及 BOSS 战(8 人小队)。三种难度等级的机器人对手。
- **和朋友联机。** 创建私密房间,把五位房间码发给朋友,最多 10 人在大厅里列队选武器、选外观;空位可以自动填机器人,有人中途掉线,机器人会接管他的角色继续打。**公开房间**开关一开,房间就出现在 ONLINE 屏的公开列表里,任何人都能一键加入。
- **鱿鱼形态。** 按住下潜进自己的墨水:高速游动、回墨、攀爬涂墨墙面、海豚跳跨越水沟。
- **十二种武器**,手感各不相同:喷溅枪、双发手枪、天幕伞枪(霰弹 + 可发射的护盾)、爆破枪、骤雨纺锤、蓄光狙击、潮线弓(三箭,两档蓄力)、涌浪滚筒、拂刷、盐刃弯刀(蓄力一击刀)、海绵拳套(墨水拳头、蓄力跳跃、贴墙)和底舱水桶。主武器可自由搭配 15 种副武器和 19 种特殊技能。
- **七张地图,白天或黄昏。** 潮汐广场、海带码头、吊环码头、盐田盆地、十字路口市场、闸口水道、台地高地,每一张都是布局独立的真实场所。部分地图在据点控制模式下会调整一些布局。
- **墨水像液体一样。** 墨渍会扩散并沉底,新墨有光泽、干燥后变哑光,会顺着墙往下滴,游泳时会在墨面留下尾迹。
- **看得懂的地图。** 按住 <kbd>Tab</kbd>,镜头拉高成一张倾斜偏移(stereo)的微缩场景,队友带标记,一键超级跳。
- **更衣室。** 挑选你的小鱿:触手发型、头饰、脸谱、服装。
- **全程序化生成。** 角色、动画、武器、贴图、道具、音效和音乐全部由代码生成。除两款字体外没有任何下载资源。
- **界面全中文。** 菜单、HUD、结算、联机大厅完整汉化,标题界面可中/英切换。

<p align="center">
  <img src="assets/stages/tidewater-day.webp" width="49%" alt="Tidewater Plaza">
  <img src="assets/stages/kelpline-dusk.webp" width="49%" alt="Kelpline Terminal at dusk">
</p>

### 操作

| 动作 | 键盘 / 鼠标 | 手柄 |
|---|---|---|
| 移动 | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | 左摇杆 |
| 瞄准 | 鼠标 | 右摇杆 |
| 射击 | 鼠标左键 | RT |
| 鱿鱼形态 | <kbd>Shift</kbd> | LT |
| 跳跃 / 翻滚闪避 | <kbd>Space</kbd> | A |
| 副武器(炸弹) | 鼠标右键 / <kbd>E</kbd> | RB |
| 特殊技能 | <kbd>F</kbd> | Y |
| 地图 + 超级跳 | 按住 <kbd>Tab</kbd> 或 <kbd>M</kbd>,再按 <kbd>1</kbd>–<kbd>4</kbd> 或点击标记 | 视角键 |
| 暂停 | <kbd>Esc</kbd> | Start |

手柄在 https 部署版上可用;纯 `http://` 局域网地址下浏览器会禁用 Gamepad API。

### 联机

主菜单选 **联机**,然后 **创建房间**,把房间码发给朋友(或 **加入房间** 输入对方的码)。房主选地图、时段、对局长度,以及空位是否用机器人填充;其他玩家选队伍、武器、外观后准备就绪。阵容、表情和准备状态在房间内实时同步。

想让更多陌生玩家看到你的房间,打开房间里的 **公开房间** 开关 —— 房间卡片会出现在所有人 ONLINE 屏下方的 **公开房间** 列表里,点一下就能加入。

房间运行在一个小巧的中继上(Cloudflare Worker,每个房间一个 Durable Object,见 [`server/`](server))。它只转发消息:每个玩家自己模拟自己的小鱿并广播状态,其他人通过同一套动画系统、在大约 0.1 秒滞后的平滑时间轴上画出它。原理和测量工具见 [`docs/NET.md`](docs/NET.md)。

在自己的网络里联机玩,把中继和游戏放在一起跑:

```bash
npm install      # 一次性:中继跑在 wrangler 上
npm run relay    # ws://<本机>:8787
```

从 `localhost`、局域网地址或直接 `file://`(Electron)打开的页面会自动使用该本地中继;`?relay=wss://…` 可以指向任何别的中继。

### 本地运行

没有构建步骤。任何静态文件服务器都可以;自带的这个还会服务局域网,并发送 no-cache 头,模块更新永远不会被缓存卡住。

```bash
git clone https://github.com/jy1024898670-lang/inkwave-modify.git
cd inkwave-modify
npm install      # Electron + 无头测试工具
npm start        # 桌面版(Electron)
npm run serve    # 或网页版: http://localhost:8490
npm run package  # 构建 macOS 桌面应用(arm64 + x64)
```

可选:放自己的音乐到 `songs/`(见 [`songs/README.md`](songs/README.md));不放则使用程序化生成的配乐。

有用的 URL 参数:`?map=halyard&time=dusk` 选地图,`&autostart=180` 跳过菜单直接开 180 秒的对局,`&autopilot` 让机器人代打。

```bash
npm run check    # 语法检查全部模块
npm run smoke    # 无头 Chrome 启动 + 8 秒 autopilot,控制台报错即失败
npm run build    # 组装 dist/(游戏 + 它用到的 three.js addons)
npm run check-maps   # 校验每张地图布局(含据点控制变体)
```

机器人对局可无头静音运行用于调参:`MAP=halyard MODE=turf SECS=180 npm run botlab`(见 [`tools/botlab/README.md`](tools/botlab/README.md))。
开着中继时,`npm run net-test` 会跑一场无头客户端之间的真实对局并报告每个画面画了什么(见 [`docs/NET.md`](docs/NET.md#how-the-netcode-works-srcnetnetmatchjs))。

### 部署

中继与前端分开部署,域名固定,重复部署不会变:

```bash
npx wrangler login      # 一次性,浏览器里授权 Cloudflare 账号
npm run deploy-relay    # 中继 Worker(+ 两个 Durable Object)→ wss://inkwave-net.bugyellow.workers.dev
npm run release         # 构建 dist/ 并发布到 Pages → https://inkwave-2cc.pages.dev
```

部署完成后,房间与大厅状态存在 Cloudflare 侧,你的电脑关机也不影响别人访问;重新部署只是推送新版本,旧版本可在控制台回滚。详见 [`docs/NET.md`](docs/NET.md#deploying-the-relay)。

### 原理

- **墨水画在贴图空间里。** 每个可涂面独占一张 4K 图集上的一块区域;墨渍在 GPU 上画进去,同时用一张粗粒度的 CPU 网格保持涂地分数和玩法查询同步。关卡着色器把墨水连同高度、光泽、湿度叠在表面之上。见 [`src/world/paint.js`](src/world/paint.js) 与 [`src/world/inkShading.js`](src/world/inkShading.js)。
- **地图是数据。** 布局是半个竞技场的一组盒体与坡道;另一半是 180° 旋转,两队永远拿到完全对称的场地。环境光遮蔽离线烘焙(`tools/bake-ao.mjs`)。见 [`src/world/maps.js`](src/world/maps.js)。
- **角色完全程序化。** 几何体、材质、60 根骨骼的骨架和全部动画(移动、鱿鱼形态、武器姿势、次级运动)都是代码,由基于弹簧的姿势系统驱动。见 [`docs/RIG.md`](docs/RIG.md)。
- **系统之间通过事件对话。** 武器、角色和对局发出类型化事件;特效、HUD 和音频订阅。契约见 [`docs/EVENTS.md`](docs/EVENTS.md) 与 [`docs/CONTRACTS.md`](docs/CONTRACTS.md)。
- **确定性工具链。** 游戏暴露冻结/单步调试接口,让胶片条、手感测量和机器人模拟逐帧可复现(`tools/film.py`、`tools/measure-handling.mjs`)。

渲染基于 three.js r186(仓库内置,纯 ES 模块 + import map),带 GTAO、泛光和自定义调色通道。

### 浏览器支持

目标浏览器是 Chrome 和 Edge;Firefox 可用。Safari 能跑但偏慢。High 画质建议独显或较新的核显;设置菜单里有 Medium 和 Low 档位。

### 关于本仓库

本仓库是 [jaydendavisnc/inkwave](https://github.com/jaydendavisnc/inkwave) 的 fork,在其基础上:

- 4v4 → **5v5**(据点控制 / 涂地对战;BOSS 战小队保持 8 人)
- **界面全中文** 化(DOM 字典替换,不改源码调用点)
- **公开房间**大厅(ONLINE 屏公开列表,任何人可加入)
- 联机中继部署到 Cloudflare(Worker + Durable Objects)
- 一批 UI / 渲染 / 手感修复(字体、D3D11 黑闪、Esc 鼠标锁定、漩涡打击落点手感与方向等)

---

## English

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#controls">Controls</a> ·
  <a href="#playing-online">Online</a> ·
  <a href="#running-locally">Run locally</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

### Features

- **Game modes, 5 v 5.** Turf War (most ground painted wins) and Zone Control (hold the live zone to count down from 100 — rotating side zones, penalties, overtime), plus a Boss Battle squad (8 players). Play against bots on three difficulty levels.
- **Online with friends.** Create a private room, share the five-character code, and up to ten players line up in the lobby with their loadouts and looks. Empty slots fill with bots; if someone drops, a bot takes over their squidkid mid-match. Flip the **Public room** switch and the room card shows up in the PUBLIC ROOMS list on everyone's ONLINE screen — anyone can join with one click.
- **Squid form.** Hold to dive into your ink: swim fast, refill your tank, climb inked walls, dolphin-jump water gaps.
- **Twelve weapons**, each with its own feel: Spritzer, Twinfire Pistols, Canopy Brolly (shotgun + launchable shield), Popper Blaster, Squall Spinner, Glint Charger, Tideline Bow (tri-arrow, two charge rings), Swell Roller, Swish Brush, Brine Cutlass (charged one-hit blade), Sponge Mitts (ink fists, charged leap, wall cling) and Bilge Bucket. Mix any main with any of 15 subs and 19 specials.
- **Seven stages, day or dusk.** Tidewater Plaza, Kelpline Terminal, Halyard Marina, Saltpan Basin, Crossroads Market, Lockgate Canals and Terrace Heights, each a real place with its own layout. Some stages change a few pieces for Zone Control.
- **Ink that behaves like liquid.** Splats spread and settle, fresh ink is glossy and dries, drips run down walls, and swimming leaves a wake in the surface itself.
- **A map you can actually read.** Hold <kbd>Tab</kbd> and the camera cranes up into a tilt-shift diorama of the live stage, with pins for your team and one-click Super Jumps.
- **Locker.** Choose your squidkid: tentacle style, headgear, face, outfit.
- **Everything procedural.** Characters, animation, weapons, textures, props, sound effects and music are all generated in code. There are no downloaded assets except two fonts.
- **Fully Chinese UI.** Menus, HUD, results and the online lobby are fully localized, with a language toggle on the title screen.

### Controls

| Action | Keyboard / mouse | Gamepad |
|---|---|---|
| Move | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Left stick |
| Aim | Mouse | Right stick |
| Fire | Left click | RT |
| Squid form | <kbd>Shift</kbd> | LT |
| Jump / dodge roll | <kbd>Space</kbd> | A |
| Sub weapon (bomb) | Right click / <kbd>E</kbd> | RB |
| Special | <kbd>F</kbd> | Y |
| Map + Super Jump | Hold <kbd>Tab</kbd> or <kbd>M</kbd>, then <kbd>1</kbd>–<kbd>4</kbd> or click a pin | View |
| Pause | <kbd>Esc</kbd> | Start |

Gamepads work on the hosted (https) version. On a plain `http://` LAN address browsers block the Gamepad API.

### Playing online

From the main menu choose **Online**, then **Create a room** and send your friends the code (or **Join a room** and
type theirs). The host picks the stage, time of day, match length and whether bots fill empty slots; everyone else
picks a team, weapon and look and readies up. The lineup, emotes and ready state are live for everyone in the room.

Flip **Public room** to list the room on every player's ONLINE screen so strangers can join it.

Rooms run on a tiny relay (a Cloudflare Worker with one Durable Object per room, in [`server/`](server)). It only
forwards messages: every player simulates their own squidkid and streams it, and everyone else draws it through the
same animation system on a smoothed timeline about a tenth of a second behind. How that works, and the tools used to
measure it, are in [`docs/NET.md`](docs/NET.md).

To play online on your own network, run the relay next to the game:

```bash
npm install      # once: the relay runs on wrangler
npm run relay    # ws://<this machine>:8787
```

A page opened from `localhost` or a LAN address uses that relay automatically; `?relay=wss://…` points it anywhere else.

### Running locally

There is no build step. Any static file server works; the included one also serves to your LAN and sends no-cache headers so module updates are never stale.

```bash
git clone https://github.com/jy1024898670-lang/inkwave-modify.git
cd inkwave-modify
npm install      # Electron + the headless tools
npm start        # the desktop app (Electron)
npm run serve    # or the web version: http://localhost:8490
npm run package  # build the macOS app into dist/ (arm64 + x64)
```

Optional: drop your own music into `songs/` (see [`songs/README.md`](songs/README.md)); otherwise the procedural soundtrack plays.

Useful URL parameters: `?map=halyard&time=dusk` picks a stage, `&autostart=180` skips the menus into a 180 s match, `&autopilot` lets a bot drive you.

```bash
npm run check    # syntax-check every module
npm run smoke    # boot + 8 s of autopilot in headless Chrome, fails on console errors
npm run build    # assemble dist/ (game + only the three.js addons it imports)
npm run check-maps   # sanity-check every stage layout (and its Zone Control variant)
```

Bot matches run headless and muted for tuning: `MAP=halyard MODE=turf SECS=180 npm run botlab` (see [`tools/botlab/README.md`](tools/botlab/README.md)).
With the relay running, `npm run net-test` plays a real match between headless clients and reports what each
screen drew (see [`docs/NET.md`](docs/NET.md#how-the-netcode-works-srcnetnetmatchjs)).

### Deploying

Relay and frontend deploy separately; the domains stay fixed across redeploys:

```bash
npx wrangler login      # once: authorize the Cloudflare account in a browser
npm run deploy-relay    # the relay Worker (+ two Durable Objects) → wss://inkwave-net.bugyellow.workers.dev
npm run release         # build dist/ and publish to Pages → https://inkwave-2cc.pages.dev
```

After a deploy, room and lobby state lives on Cloudflare, so your machine can shut down and the game stays reachable; redeploys only push a new version, and old versions can be rolled back from the dashboard. See [`docs/NET.md`](docs/NET.md#deploying-the-relay).

### How it works

- **Ink is painted in texture space.** Every paintable face owns a region of one 4K atlas; splats are drawn into it on the GPU while a coarse CPU grid keeps the turf score and gameplay queries in sync. The level shader layers the ink over the surface with its own height, gloss and wetness. See [`src/world/paint.js`](src/world/paint.js) and [`src/world/inkShading.js`](src/world/inkShading.js).
- **Stages are data.** A layout is a list of boxes and ramps for one half of the arena; the other half is the 180° rotation, so both teams always get an identical field. Ambient occlusion is baked offline (`tools/bake-ao.mjs`). See [`src/world/maps.js`](src/world/maps.js).
- **Characters are fully procedural.** Geometry, materials, a 60-bone rig and every animation (locomotion, squid form, weapon poses, secondary motion) are code, driven by a spring-based pose system. See [`docs/RIG.md`](docs/RIG.md).
- **Systems talk through events.** Weapons, actors and the match emit typed events; effects, HUD and audio subscribe. The contract is documented in [`docs/EVENTS.md`](docs/EVENTS.md) and [`docs/CONTRACTS.md`](docs/CONTRACTS.md).
- **Deterministic tooling.** The game exposes a freeze/step debug interface so filmstrips, handling measurements and bot simulations are reproducible frame by frame (`tools/film.py`, `tools/measure-handling.mjs`).

Rendering is three.js r186 (vendored, plain ES modules with an import map) with GTAO, bloom and a custom grade pass.

### Browser support

Chrome and Edge are the target; Firefox works. Safari runs but is slower. A discrete or recent integrated GPU is recommended for the High preset; the settings menu has Medium and Low tiers.

### About this repo

This repo is a fork of [jaydendavisnc/inkwave](https://github.com/jaydendavisnc/inkwave) with:

- 4v4 → **5v5** for Turf War / Zone Control (Boss squad stays 8)
- **Fully Chinese UI** (DOM-dictionary i18n, no source call-site changes)
- **Public room lobby** (PUBLIC ROOMS list on the ONLINE screen, joinable by anyone)
- Cloudflare relay deploy (Worker + Durable Objects)
- A batch of UI / rendering / feel fixes (fonts, D3D11 black flash, Esc mouse relock, vortex strike aim handling and direction, and more)

### Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the project layout and the checks to run first.

### License

[MIT](LICENSE) — original work © Jayden Davis. INKWAVE is an independent project and is not affiliated with Nintendo; Splatoon is a trademark of Nintendo.

