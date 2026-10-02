<p align="center">
  <img src="assets/stages/halyard-day.webp" alt="Halyard Marina at golden hour" width="100%">
</p>

<h1 align="center">INKWAVE</h1>

<p align="center"><a href="README.md">📖 English</a></p>

<p align="center">
  一款在浏览器里运行的原创喷射战士风格 <b>5v5 涂地对战</b>射击游戏。<br>
  涂地、在自己的墨水里游泳、把对面涂个干净。· <b>界面全中文</b>
</p>

<p align="center">
  <a href="https://inkwave-2cc.pages.dev"><b>▶ 立即游玩</b></a> ·
  <a href="#controls">操作</a> ·
  <a href="#online">联机</a> ·
  <a href="#running-locally">本地运行</a> ·
  <a href="#deploy">部署</a> ·
  <a href="#how-it-works">原理</a>
</p>

---

## 特性

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

## 操作

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

## 联机

主菜单选 **联机**,然后 **创建房间**,把房间码发给朋友(或 **加入房间** 输入对方的码)。房主选地图、时段、对局长度,以及空位是否用机器人填充;其他玩家选队伍、武器、外观后准备就绪。阵容、表情和准备状态在房间内实时同步。

想让更多陌生玩家看到你的房间,打开房间里的 **公开房间** 开关 —— 房间卡片会出现在所有人 ONLINE 屏下方的 **公开房间** 列表里,点一下就能加入。

房间运行在一个小巧的中继上(Cloudflare Worker,每个房间一个 Durable Object,见 [`server/`](server))。它只转发消息:每个玩家自己模拟自己的小鱿并广播状态,其他人通过同一套动画系统、在大约 0.1 秒滞后的平滑时间轴上画出它。原理和测量工具见 [`docs/NET.md`](docs/NET.md)。

在自己的网络里联机玩,把中继和游戏放在一起跑:

```bash
npm install      # 一次性:中继跑在 wrangler 上
npm run relay    # ws://<本机>:8787
```

从 `localhost`、局域网地址或直接 `file://`(Electron)打开的页面会自动使用该本地中继;`?relay=wss://…` 可以指向任何别的中继。

## 本地运行

没有构建步骤。任何静态文件服务器都可以;自带的这个还会服务局域网,并发送 no-cache 头,模块更新永远不会被缓存卡住。

```bash
git clone https://github.com/jy1024898670-lang/inkwave.git
cd inkwave
npm install      # Electron + 无头测试工具
npm start        # 桌面版(Electron)
npm run serve    # 或网页版: http://localhost:8490
```

可选:放自己的音乐到 `songs/`(见 [`songs/README.md`](songs/README.md));不放则使用程序化生成的配乐。

有用的 URL 参数:`?map=halyard&time=dusk` 选地图,`&autostart=180` 跳过菜单直接开 180 秒的对局,`&autopilot` 让机器人代打。

```bash
npm install      # 一次性,为无头测试工具
npm run check    # 语法检查全部模块
npm run smoke    # 无头 Chrome 启动 + 8 秒 autopilot,控制台报错即失败
npm run build    # 组装 dist/(游戏 + 它用到的 three.js addons)
npm run check-maps   # 校验每张地图布局(含据点控制变体)
```

机器人对局可无头静音运行用于调参:`MAP=halyard MODE=turf SECS=180 npm run botlab`(见 [`tools/botlab/README.md`](tools/botlab/README.md))。
开着中继时,`npm run net-test` 会跑一场无头客户端之间的真实对局并报告每个画面画了什么(见 [`docs/NET.md`](docs/NET.md#how-the-netcode-works-srcnetnetmatchjs))。

## 部署

中继与前端分开部署,域名固定,重复部署不会变:

```bash
npx wrangler login      # 一次性,浏览器里授权 Cloudflare 账号
npm run deploy-relay    # 中继 Worker(+ 两个 Durable Object)→ wss://inkwave-net.bugyellow.workers.dev
npm run release         # 构建 dist/ 并发布到 Pages → https://inkwave-2cc.pages.dev
```

部署完成后,房间与大厅状态存在 Cloudflare 侧,你的电脑关机也不影响别人访问;重新部署只是推送新版本,旧版本可在控制台回滚。详见 [`docs/NET.md`](docs/NET.md#deploying-the-relay)。

## 原理

- **墨水画在贴图空间里。** 每个可涂面独占一张 4K 图集上的一块区域;墨渍在 GPU 上画进去,同时用一张粗粒度的 CPU 网格保持涂地分数和玩法查询同步。关卡着色器把墨水连同高度、光泽、湿度叠在表面之上。见 [`src/world/paint.js`](src/world/paint.js) 与 [`src/world/inkShading.js`](src/world/inkShading.js)。
- **地图是数据。** 布局是半个竞技场的一组盒体与坡道;另一半是 180° 旋转,两队永远拿到完全对称的场地。环境光遮蔽离线烘焙(`tools/bake-ao.mjs`)。见 [`src/world/maps.js`](src/world/maps.js)。
- **角色完全程序化。** 几何体、材质、60 根骨骼的骨架和全部动画(移动、鱿鱼形态、武器姿势、次级运动)都是代码,由基于弹簧的姿势系统驱动。见 [`docs/RIG.md`](docs/RIG.md)。
- **系统之间通过事件对话。** 武器、角色和对局发出类型化事件;特效、HUD 和音频订阅。契约见 [`docs/EVENTS.md`](docs/EVENTS.md) 与 [`docs/CONTRACTS.md`](docs/CONTRACTS.md)。
- **确定性工具链。** 游戏暴露冻结/单步调试接口,让胶片条、手感测量和机器人模拟逐帧可复现(`tools/film.py`、`tools/measure-handling.mjs`)。

渲染基于 three.js r186(仓库内置,纯 ES 模块 + import map),带 GTAO、泛光和自定义调色通道。

## 浏览器支持

目标浏览器是 Chrome 和 Edge;Firefox 可用。Safari 能跑但偏慢。High 画质建议独显或较新的核显;设置菜单里有 Medium 和 Low 档位。

## 关于本仓库

本仓库是 [jaydendavisnc/inkwave](https://github.com/jaydendavisnc/inkwave) 的 fork,在其基础上:

- 4v4 → **5v5**(据点控制 / 涂地对战;BOSS 战小队保持 8 人)
- **界面全中文** 化(DOM 字典替换,不改源码调用点)
- **公开房间**大厅(ONLINE 屏公开列表,任何人可加入)
- 联机中继部署到 Cloudflare(Worker + Durable Objects)
- 一批 UI / 渲染 / 手感修复(字体、D3D11 黑闪、Esc 鼠标锁定、漩涡打击落点手感与方向等)

## License

[MIT](LICENSE) — 原作 © Jayden Davis。INKWAVE 是独立项目,与任天堂无隶属关系;Splatoon 是任天堂的商标。
