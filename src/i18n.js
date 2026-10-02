// Chinese UI localization. English is the default language.
//
// The game's menu/HUD text is spread across thousands of lines of DOM code, so instead of editing every call site
// we watch DOM mutations and replace text nodes (plus placeholder/title/aria-label) that match the dictionary with
// Chinese. Switching back to English restores the original text.
// Fonts: the bundled fonts only cover Latin; CJK characters fall back to system Chinese fonts via unicode-range.

const LANG_KEY = 'inkwave.lang';

// Exact English string → Chinese. Keys are matched verbatim (trimmed); an all-caps key also matches its uppercase form.
const ZH = {
  // ---- title / boot
  'Press any key to start': '按任意键开始', 'PRESS ANY KEY': '按任意键开始', 'Press any button to start': '按任意键开始',
  'Click to start': '点击开始', 'CLICK TO START': '点击开始',
  'Building the plaza…': '正在搭建广场…', 'Filling the harbor…': '正在给港口注水…', 'Mixing ink…': '正在调配墨水…',
  'Mixing the ink…': '正在调配墨水…', 'Teaching squids to swim…': '正在教乌贼游泳…', 'Tuning the tentacles…': '正在调校触手…',
  'Warming up…': '热身中…', 'Loading…': '加载中…',

  // ---- main menu
  'PLAY': '开始游戏', 'PLAY OFFLINE': '单机游玩', 'OFFLINE': '单机', 'ONLINE': '联机', 'MULTIPLAYER': '联机对战',
  'LOADOUT': '装备', 'SQUIDKID': '角色', 'LOCKER': '更衣室', 'SETTINGS': '设置', 'HOW TO PLAY': '玩法说明',
  'CREDITS': '制作名单', 'NEWS': '新闻', 'SHOP': '商店', 'QUICK MATCH': '快速匹配',
  'Play Turf War or Zone Control against the bots': '与机器人进行涂地对战或据点控制',
  'Turf War or Zone Control 5 v 5 — or team up with the bots against HULLBREAKER in a Boss Battle': '涂地对战或据点控制，5 对 5 —— 也可以与机器人组队挑战 HULLBREAKER 巨蟹',
  'Private rooms for up to 10 friends — create one or join with a room code': '私人房间，最多 10 位好友 —— 创建房间或用房间码加入',
  'Choose your weapon, sub and special — or practice with it': '选择武器、副武器和大招 —— 也可以在这里练习',
  'Choose your squidkid — tentacles, headgear, eyes, skin and outfit': '定制你的角色 —— 触手、头饰、眼睛、肤色和服装',
  'Controls, video, audio and gameplay options': '操作、画面、声音和玩法选项',
  'The rules in 30 seconds, plus every control': '30 秒看懂规则，外加全部按键',
  'The squidkids and code behind INKWAVE': 'INKWAVE 背后的角色与代码',
  'New this week': '本周更新',
  'Press any key': '按任意键',
  'BACK': '返回', 'Back': '返回', 'CANCEL': '取消', 'Cancel': '取消', 'CLOSE': '关闭',
  'START!': '开始！', 'START': '开始', 'Start': '开始', 'GO!': '开始！', 'GO': '开始',
  'READY': '准备就绪', 'Ready': '准备就绪', 'SELECTED': '已选择', 'Selected': '已选择',
  'Player': '玩家', 'You': '你', 'YOU': '你', 'MVP': 'MVP', 'LV': '等级',
  'Played': '场次', 'Wins': '胜场', 'PLAYED': '场次', 'WINS': '胜场', 'MATCHES': '场次', 'Matches': '场次',
  'Saved!': '已保存！', 'Changes save automatically': '修改会自动保存', 'Changes apply instantly': '修改立即生效',
  'RESET TO DEFAULTS': '恢复默认', 'Reset': '重置', 'Restore every setting to its original value.': '把所有设置恢复为初始值。',
  'PRESS AGAIN TO CONFIRM': '再按一次确认', 'ON': '开', 'OFF': '关', 'Default': '默认',
  'ONLINE NOW': '当前在线', 'OFFLINE MODE': '单机模式',

  // ---- match setup
  'MAP': '地图', 'Map': '地图', 'STAGE': '地图', 'Match': '对局', 'MATCH': '对局',
  'DIFFICULTY': '难度', 'Difficulty': '难度', 'BOTS': '机器人', 'Bots': '机器人',
  'LENGTH': '时长', 'Length': '时长', 'DAY': '白天', 'DUSK': '黄昏', '90 SEC': '90 秒', '3 MIN': '3 分钟',
  'Chill': '轻松', 'Fresh': '普通', 'Fierce': '困难',
  'Chill bots': '轻松机器人', 'Fresh bots': '普通机器人', 'Fierce bots': '困难机器人',
  'Relaxed bots with shaky aim. Great for learning the ropes.': '机器人比较佛系、枪法不准，适合熟悉操作。',
  'Balanced bots that push turf and fight back.': '机器人会抢地盘也会还手，难度适中。',
  'Sharp, aggressive bots that punish mistakes. Bring your A-game.': '机器人凶猛精准，一失误就会被惩罚，拿出真本事吧。',
  'Turf War': '涂地对战', 'TURF WAR': '涂地对战', 'ZONE CONTROL': '据点控制', 'Zone Control': '据点控制',
  'BOSS BATTLE': 'Boss 战', 'Boss Battle': 'Boss 战',
  'Ink the most ground before the clock runs out.': '在时间耗尽前涂下最多的地盘。',
  'Hold the live zone to count down from 100 — first to 0 wins.': '占领发光据点，把倒计时从 100 打到 0，先到 0 的一方获胜。',
  'Your squad of 8 against HULLBREAKER.': '你们的 8 人小队对阵 HULLBREAKER。',
  'Pick a stage and the time of day': '选一张地图和时间',
  '5 v 5 against bots': '5 对 5 · 对战机器人', '5:00 + overtime': '5:00 + 加时',
  'Time of day': '时间', 'Day or dusk': '白天或黄昏',
  'Match length': '对局时长', 'Pick your difficulty': '选择难度',
  'Stages change a few pieces for Zone Control.': '据点控制模式下地图会调整一些布局。',

  // ---- maps
  'Tidewater Plaza': '潮汐广场', 'Kelpline Terminal': '海带码头', 'Halyard Marina': '吊环码头',
  'Saltpan Basin': '盐田盆地', 'Crossroads Market': '十字路口市场', 'Lockgate Canals': '闸口水道',
  'Terrace Heights': '台地高地', 'Cargo Terminal': '货运码头',
  'A sun-bleached harbor plaza on the edge of the sea.': '海边一座被阳光晒得发白的港口广场。',
  'Container yard with grate catwalks, a sunken trench and a steel gantry deck.': '集装箱堆场，有格栅走道、下沉沟渠和钢制龙门平台。',
  'Floating pontoons and crane decks ringed by the marina.': '浮动栈桥和吊车平台环绕的码头。',
  'A wide, flat basin where the tides write their lines.': '一片宽阔平坦的盆地，潮汐在这里留下纹路。',
  'A busy market street with stalls, awnings and high ground at both ends.': '热闹的市集街，摊位和雨棚两侧都是制高点。',
  'Narrow canals under a chain of gates — every crossing is a fight.': '闸门串起的窄水道，每一次过闸都是争夺。',
  'Stepped terraces up a cliffside, with a view of the whole harbour.': '崖壁上的阶梯台地，一眼望见整个港口。',
  'Same plaza, golden hour. Lights coming on across the bay.': '同一座广场，黄金时刻，海湾对岸亮起了灯。',

  // ---- weapons
  'Spritzer': '喷溅枪', 'Twinfire Pistols': '双发手枪', 'Canopy Brolly': '天幕伞枪', 'Popper Blaster': '爆破枪',
  'Squall Spinner': '骤雨纺锤', 'Glint Charger': '蓄光狙击', 'Tideline Bow': '潮线弓', 'Swell Roller': '涌浪滚筒',
  'Swish Brush': '拂刷', 'Brine Cutlass': '盐刃弯刀', 'Sponge Mitts': '海绵拳套', 'Bilge Bucket': '底舱水桶',
  'Shooter': '射击枪', 'Roller': '滚筒', 'Charger': '狙击枪', 'Blaster': '爆破枪', 'Bow': '弓', 'Brush': '刷',
  'Blade': '刀', 'Fists': '拳套', 'Bucket': '水桶',
  'Rapid-fire all-rounder. Sprays a steady stream of ink blobs.': '高射速全能型，持续喷出墨弹。',
  'Paired pistols. Jump while firing to dodge-roll; stand still after a roll for rapid, longer-range fire. Walking returns to dual mode.': '双持手枪。射击中起跳可以翻滚闪避，翻滚后站定进入快速远射程扫射，走动切回双发模式。',
  'A shotgun spray of ink pellets. Hold to open the canopy: a shield for you and your team. Keep holding to launch it as a rolling wall.': '喷出一簇霰弹墨粒。按住撑开伞面，为你和队友挡住攻击；继续按住，把伞发射成滚动墨墙。',
  'Slow shots that burst mid-air. Direct hits splat instantly.': '弹速慢，会在空中爆开，直接命中一击必杀。',
  'Spin up, then unleash a stream of ink. A full spin reaches farthest and fires longest.': '旋转蓄力后喷射墨流，转满一圈射程最远、喷射最久。',
  'Hold to charge, release for a long piercing line. Full charge splats.': '按住蓄力，松开射出贯穿长线，满蓄力一击必杀。',
  'Draw to fill two rings, then loose three arrows at once: a flat fan on the ground, an upright one in the air. Past the first ring the arrows stick where they land and burst.': '拉弓填满两道蓄力槽，一次射出三支箭：地面呈平扇形，空中呈竖扇形。过第一道蓄力后，箭会钉在落点并爆炸。',
  'Roll out wide stripes of turf. Flick for a crushing splash.': '滚出宽阔的涂地带，甩动时泼出致命墨浪。',
  'Dash along the ground leaving a thin trail, or swipe side to side to flick a spray of small globs.': '贴地冲刺留下细细墨痕，左右挥扫甩出一串小墨滴。',
  'Tap for quick slashes that fling a crescent of ink. Hold to charge an overhead cut that sends a long ink wave. The blade itself hits hard: a charged cut splats in one hit.': '轻点快速斩击，甩出月牙形墨浪；按住蓄力使出跃斩，放出长长的墨波。刀刃本身伤害高，满蓄力斩一刀击倒。',
  'Punch out ink fists that burst a few metres ahead — with your gloves up, the sponge soaks part of any hit from the front. Hold fire and press jump to charge a long leap that splashes where you land, and sticks you to walls (holding on drains ink).': '打出几米外才爆开的墨拳——举拳时海绵拳套能吸收正面的一部分伤害。按住射击再按跳跃蓄力长跃，落地溅起墨浪，还能吸附在墙上（攀附会持续耗墨）。',
  'Hurl a wave of ink in an arc: aim higher to throw farther, lob it over cover. Full damage at any distance; two hits splat.': '弧线抛出一波墨水：瞄得越高抛得越远，可以越过掩体。伤害不随距离衰减，两发击倒。',
  'Range': '射程', 'Damage': '伤害', 'Fire rate': '射速', 'Mobility': '机动性', 'Ink coverage': '涂地能力',
  'SPECIAL': '大招', 'Special': '大招', 'SUB': '副武器', 'Sub': '副武器',
  'Pick your weapon — your squidkid shows it off on the right': '选择武器，右边的角色会展示给你看',
  'Weapon': '武器', 'Weapon type': '武器类型',
  'Splat Bomb': '溅射炸弹', 'Tidal Slam': '潮汐重击', 'Ink Tempest': '墨水风暴', 'Ink Rain': '墨雨',
  'Barricade': '墨墙', 'Super Dash': '超级冲刺', 'Riptide Current': '回流', 'Lava Burst': '熔岩爆发',
  'Leap up and slam down in a huge ink shockwave.': '跃起后重重砸地，掀起巨大墨水冲击波。',
  'Hurl a rain cloud that soaks the turf below.': '抛出一朵雨云，把下方地面淋满墨水。',
  'Special ready! Press F': '大招就绪！按 F 释放', 'Special ready': '大招就绪',
  'SPECIAL READY': '大招就绪',

  // ---- settings
  'Controls': '操作', 'Video': '画面', 'Audio': '声音', 'Gameplay': '玩法', 'Audio settings': '声音设置',
  'Mouse sensitivity': '鼠标灵敏度', 'How far the camera turns for each bit of mouse movement.': '鼠标移动时镜头转动的幅度。',
  'Controller sensitivity': '手柄灵敏度', 'Camera turn speed with the right stick.': '右摇杆转动镜头的速度。',
  'Invert vertical look': '上下视角反转', 'Push up to look down, like a flight stick.': '像飞行摇杆一样，往上推是往下看。',
  'Aim assist (controller)': '辅助瞄准（手柄）', 'Gently slows and steers your aim onto nearby rivals when you play with a controller.': '使用手柄时，准星靠近对手会轻微减速并吸附。',
  'Aim assist for mouse': '鼠标辅助瞄准', 'Also apply a lighter aim assist when aiming with a mouse. Off by default.': '鼠标瞄准时也启用较轻的辅助瞄准，默认关闭。',
  'Controls reference': '按键一览', 'Every keyboard, mouse and controller binding in one place.': '键盘、鼠标、手柄的所有按键。',
  'Graphics quality': '画质', 'Low': '低', 'Med': '中', 'Medium': '中', 'High': '高', 'Ultra': '极高',
  'Resolution scale, shadow detail, anti-aliasing and particle counts.': '分辨率缩放、阴影细节、抗锯齿和粒子数量。',
  'Field of view': '视野', 'Wider shows more of the turf around you.': '越大能看到周围越多的地面。',
  'Shadows': '阴影', 'Soft sun shadows. Turn off for extra speed on older machines.': '柔和的阳光阴影，旧电脑可以关掉以提升流畅度。',
  'Bloom glow': '泛光', 'A soft glow around bright ink and specials.': '亮色墨水和大招周围的柔光。',
  'Show FPS counter': '显示帧率', 'Displays frames per second in the corner during matches.': '对局时在角落显示每秒帧数。',
  'Fullscreen': '全屏', 'VSync': '垂直同步',
  'Master volume': '总音量', 'Music': '音乐', 'Menu and battle soundtrack.': '菜单和战斗配乐。',
  'Sound effects': '音效', 'Weapons, splats, voices and menu sounds.': '武器、击倒、语音和菜单音效。',
  'Camera shake': '镜头震动', 'Screen shake from explosions, slams and hits.': '爆炸、砸地和被击中时的画面震动。',
  'Vibration': '手柄震动', 'Controller rumble for hits, splats, bombs and specials. Only while you play with a controller.': '命中、击倒、炸弹和大招时手柄震动，仅在使用手柄时生效。',
  'Colorblind-safe inks': '色盲友好配色', 'Always use high-contrast yellow vs. blue team inks.': '始终使用高对比度的黄色与蓝色墨水。',
  'Minimap': '小地图', 'Show the turf minimap in the corner during matches.': '对局时在角落显示小地图。',
  'Default bot skill': '默认机器人难度', 'Starting difficulty for new matches.': '新对局的初始难度。',
  'Default match length': '默认对局时长', 'How long each Turf War lasts.': '每局涂地对战的时长。',
  'Look speed, invert, aim assist and the full control reference.': '视角速度、反转、辅助瞄准以及完整按键说明。',
  'Quality tier, field of view and screen effects.': '画质档位、视野和屏幕特效。',
  'Master, music and sound-effect levels.': '总音量、音乐和音效。',
  'Shake, vibration, colour-safe inks, minimap and match defaults.': '震动、色盲配色、小地图和对局默认值。',
  'Mouse + keyboard': '鼠标键盘', 'Gamepad': '手柄', 'Controller': '手柄', 'Keyboard': '键盘', 'Mouse': '鼠标',
  'Look': '视角', 'Move': '移动', 'Aim': '瞄准', 'Fire': '射击', 'Jump': '跳跃', 'Pause': '暂停',
  'View': '视角', 'VIEW': '视角', 'Swim · squid form': '潜墨（乌贼形态）',
  'SUPER JUMP': '超级跳', 'Super Jump': '超级跳', 'SUB WEAPON': '副武器', 'SPECIAL WEAPON': '大招',
  'MOUSE': '鼠标', 'INPUT': '输入', 'BUTTON': '按键', 'LEFT': '左', 'RIGHT': '右', 'SPACE': '空格',
  'Hold': '按住', 'Press': '按下', 'Right stick': '右摇杆', 'Left stick': '左摇杆',

  // ---- how to play
  'Turf War in 30 seconds': '30 秒看懂涂地对战',
  'How to play': '玩法说明', 'The basics': '基础', 'Controls': '操作',
  'Paint the ground in your team’s color. When time runs out, the team with the most turf wins.': '把地面涂成你队伍的颜色。时间结束时，涂地面积最大的队伍获胜。',
  'Swim in your own ink to zip around and refill your tank.': '在自己的墨水里潜游，移动更快，还能补充墨量。',
  'Enemy ink slows you down and hurts. Paint over it to take the ground back.': '敌方墨水会让你减速并受伤，把它涂回来就能夺回地盘。',
  'Swim up any wall you have inked to reach high ground.': '涂过的墙可以直接游上去，抢占高处。',
  'Your special gauge fills as you ink. Press [F] when it glows!': '涂地会积攒大招，发光时按 [F] 释放！',
  'Only turf counts when time runs out. Splats just buy you space.': '最终只算涂地面积，击倒对手只是帮你争取空间。',
  'Ink the turf': '涂地', 'Swim to refill': '潜墨补充', 'Avoid enemy ink': '避开敌方墨水', 'Climb inked walls': '爬涂过的墙',
  'Ink the most turf in 5 v 5 against bots': '在 5 对 5 中涂出最多地盘',
  'Zone Control in 30 seconds': '30 秒看懂据点控制',
  'A live zone glows on the map. Hold it to count down from 100 — the first team to reach 0 wins.': '地图上会发光一个据点，占领它让倒计时从 100 递减，先到 0 的一方获胜。',
  'The zone moves; losing it costs you a time penalty.': '据点会移动，失去占领会扣时间。',
  'At 0:00 a photo finish or a sudden-death overtime settles it.': '0:00 时比分相同就进入加时，一击定胜负。',
  'Boss Battle in 30 seconds': '30 秒看懂 Boss 战',
  'Your squad of 8 against HULLBREAKER. Watch the tells, dodge the moves and break its armour.': '你们 8 人小队对阵 HULLBREAKER。看准前摇、躲开招式、打破它的装甲。',
  'Stun it to expose its weak point.': '把它打晕就能暴露弱点。',

  // ---- online / lobby
  'Private rooms · 5 v 5 · up to 10 squidkids': '私人房间 · 5 对 5 · 最多 10 名玩家',
  'CREATE ROOM': '创建房间', 'JOIN ROOM': '加入房间', 'ROOM CODE': '房间码', 'Enter a room code': '输入房间码',
  'JOIN': '加入', 'Share the code with friends': '把房间码发给好友',
  'Waiting for players…': '等待玩家加入…', 'waiting': '等待中',
  'HOST': '房主', 'Host': '房主', 'Ready up': '准备', 'READY UP': '准备', 'Not ready': '未准备',
  'Alpha': '阿尔法队', 'Bravo': '布拉沃队', 'your team': '我方', 'THEIR TEAM': '对方',
  'Leave the room?': '离开房间？', 'Leave': '离开', 'KICK': '踢出', 'SPECTATE': '观战',
  'A bot fills the empty seat when you leave.': '你离开后机器人会顶替你。',
  'Players': '玩家', 'Empty seats fill with bots.': '空位将由机器人填补。',
  'Match starting…': '对局即将开始…',

  // ---- match HUD
  'READY?': '准备好了吗？', 'READY!': '准备！', 'Ready!': '准备！',
  "TIME'S UP!": '时间到！', 'Time’s up!': '时间到！', '1 minute left!': '还剩 1 分钟！',
  'LOW INK': '墨量不足', 'Low ink': '墨量不足', 'TURF': '涂地', 'SPLATS': '击倒', 'SPLATTED': '被击倒', 'DEATHS': '被击倒',
  'SPLATTED BY': '击倒你的是', 'SPLATTED!': '被击倒！', 'RESPAWN': '复活', 'Times splatted': '被击倒次数',
  'Turf inked': '涂地面积', 'Splats': '击倒',
  'Hold SHIFT to swim in your ink and refill': '按住 SHIFT 潜入墨水补充墨量',
  'Low ink! Hold SHIFT in your ink to refill': '墨量不足！在自己的墨里按住 SHIFT 补充',
  'Paint the ground — most turf wins!': '涂地吧——涂得最多的一方获胜！',
  'Press 1 – 5 to Super Jump to a teammate  ·  6 to jump home': '按 1–5 超级跳到队友身边  ·  按 6 跳回基地',
  'Hold [TAB] to plan a Super Jump': '按住 [TAB] 规划超级跳', 'Pick a landing spot': '选择落点',
  'Press [1] – [5] or click · release [TAB] to cancel': '按 [1]–[5] 或点击 · 松开 [TAB] 取消',
  'Aim bomb · release to throw': '瞄准炸弹 · 松开投掷', 'The whole team is splatted': '全队都被击倒了',
  'FIRST SPLAT!': '首杀！', 'DOUBLE SPLAT!': '双杀！', 'TRIPLE SPLAT!': '三杀！', 'QUAD SPLAT!': '四杀！', 'WIPEOUT!': '团灭！',
  'SHUTDOWN!': '终结！', 'REVENGE!': '复仇！', 'LEVEL UP!': '升级！', 'TIP': '提示', 'Base': '基地',
  'SUPER JUMP': '超级跳', 'BEACON': '信标',
  'or click · release': '或点击 · 松开', 'to cancel': '取消',
  'CAN’T USE': '不可用', 'or click to start': '或点击开始',

  // ---- pause / results
  'PAUSED': '已暂停', 'RESUME': '继续', 'Quit': '退出', 'QUIT MATCH': '退出对局', 'QUIT MATCH?': '退出对局？',
  'QUIT': '退出', 'Back to lobby': '返回大厅', 'To the main menu': '回主菜单',
  'You will leave this Turf War and head back to the lobby. Your turf will not count.': '你将离开本局并返回大厅，本局涂地不计入成绩。',
  'YOUR MATCH': '本局', 'YOUR TEAM': '我方', 'RIVALS': '对手', 'ENEMY': '对手',
  'JUDGING': '判定中', 'VICTORY!': '胜利！', 'DEFEAT': '失败', 'WIN BONUS': '胜利奖励',
  'REMATCH': '再来一局', 'MAIN MENU': '主菜单', 'MENU': '菜单', 'PICK A STAGE': '选图',
  'KEEP PLAYING': '继续游戏', 'STAY FRESH!': '保持状态！', 'VS': 'VS', "IT'S A TIE!": '平局！', 'TIE': '平局',
  'Tangerine': '橘子队', 'Cobalt': '钴蓝队', 'Bubblegum': '泡泡糖队', 'Mint': '薄荷队', 'Lemon': '柠檬队', 'Grape': '葡萄队',
  'Aqua': '水蓝队', 'Cherry': '樱桃队', 'Lime': '青柠队', 'Magenta': '洋红队', 'Sun': '太阳队', 'Sea': '海洋队',
  'Final turf': '最终涂地', 'Damage dealt': '造成伤害', 'Weak-point hits': '弱点命中',
  'LANDSLIDE': '压倒性胜利', 'PHOTO FINISH': '险胜', 'PURE PAINTER': '纯粹画家', 'SURVIVOR': '幸存者', 'TOP INKER': '涂地王',
  'AWARD': '奖项', 'Best of the match': '全场最佳',

  // ---- tips (loading screen)
  'Rollers paint huge stripes. Flick the roller to splash foes at range.': '滚筒能涂出宽宽的一大片，甩动还能远程泼到敌人。',
  'Chargers splat in one fully-charged shot. Keep moving and use cover.': '狙击枪满蓄力一枪就能击倒你，记得移动并利用掩体。',
  'A Splat Bomb costs most of your tank — throw it where it claims the most turf.': '炸弹会消耗大半墨量，扔在能涂最多地盘的地方。',
  'Low on ink? Dive in, refill, then push again.': '墨不够了？潜进墨里补满再冲。',
  'Enemy ink slows you down and chips away at your health. Paint over it!': '敌方墨水会减速并持续掉血，把它涂掉！',
  'Dive into your own ink as a squid to move fast, hide and refill your ink tank.': '变成乌贼潜入自家墨水，移动更快、能隐藏还能补墨。',
  'Hold [SHIFT] to dive into your ink — you are nearly invisible while swimming.': '按住 [SHIFT] 潜入墨水——潜游时几乎看不见你。',
  'Hold [TAB] to open the big map and spot unpainted turf.': '按住 [TAB] 打开大地图，找找没涂的地方。',
  'Ink a wall, then swim straight up it as a squid to reach high ground.': '先把墙涂上，再变成乌贼直接游上去抢高处。',

  // ---- ranks / news / credits
  'Fresh Recruit': '新兵', 'Turf Scrapper': '地盘争夺者', 'Ink Slinger': '墨水投手', 'Splat Veteran': '击倒老兵', 'Tide Legend': '潮汐传说',
  'Select': '选择', 'Title': '标题', 'Change': '切换', 'Equip': '装备', 'Adjust': '调整', 'Tabs': '分页',
  'Switch controls': '切换操作方式', 'Hold to speed up': '按住加速', 'Resume': '继续', 'Skip': '跳过',
  'Grab your crew — the harbour just got a whole lot louder!': '叫上你的小队——港口又要热闹起来了！',
  'The Lobby': '大厅', 'watch your squad roll in, emote, ready up': '看你的小队陆续到场、做表情、点准备',
  'share a code, squad up with up to 10 friends': '分享房间码，和最多 10 位好友组队',
  'a brand-new stage, online only': '全新地图，仅限联机',
  'An original 5 v 5 turf-war shooter.': '一款原创 5 对 5 涂地射击游戏。',
  'Original game': '原作', 'Made with': '制作技术', 'Rendering': '渲染',
  'Procedural everything — squidkids, weapons, stage, ink, music and sound are all generated in code.': '全程序化生成 —— 角色、武器、地图、墨水、音乐和音效全部由代码生成。',
  'by the three.js authors & contributors': 'three.js 作者与贡献者',
  'MIT License': 'MIT 许可协议',

  // ---- ported from fork (medals / settings / credits)
  'Turf Riot': '涂地大乱斗',
  'Overall loudness of everything.': '所有声音的整体音量。',
  'UNTOUCHABLE': '无人能挡',
  'Most splats in the match': '全场击倒最多',
  'Most turf inked in the match': '全场涂地最多',
  'Most turf inked on their team': '队内涂地最多',
  'Never got splatted': '一次都没被击倒',
  'Never splatted': '零击倒',
  'Splatted the fewest times': '被击倒次数最少',
  'Ambient occlusion': '环境光遮蔽',
  'Ink detail': '墨水细节',
  'Particles': '粒子',
  'Pixel density': '像素密度',
  'Shadow map': '阴影贴图',
  'Special thanks': '特别感谢',
  'Starring the squidkids': '主演：墨鱼小子们',
  'Typography': '字体',
  'And you, for playing': '以及正在玩的你',
  'Everyone who ever painted a wall': '每一个涂过墙的人',
  'Every bot that got splatted in testing': '测试中被击倒的每一个机器人',

  // ---- mode tips / intro (mode cards, help)
  'Two teams of five, one harbour. Ink the most ground before the whistle.': '五人对五人，一座港口。终场哨响前涂下最多地盘。',
  'In Turf War only turf counts when time runs out. Splats just buy you space.': '涂地模式中，时间到时只看涂地面积。击倒只是为你争取空间。',
  'Hold the zone and your count ticks down — 1 a second at the centre. First to 0, or lowest count at time up, wins.': '守住据点，计数就会下降——中央点每秒降 1。先降到 0，或时间到后计数最低的一方获胜。',
  'Every 30–60 s the live zone swaps between the centre and a side zone: 1 point per 2 s on your half, per ½ s on theirs.': '每 30–60 秒，活跃据点会在中央与侧点之间轮换：在你方半场每 2 秒计 1 点，在对方半场每 0.5 秒计 1 点。',
  'Zone Control: a side zone on their half counts you down 4× faster than the one on yours.': '占点模式：对方半场的侧点让你的计数下降速度是己方侧点的 4 倍。',
  'Zone Control: lose the zone to the other team and you get a penalty to count off before your count moves again.': '占点模式：据点被对方夺走时，会先记一笔罚分，之后你的计数才会继续变化。',
  'Zone Control: while they hold the zone your special charges fast. Team up and break their hold!': '占点模式：对方持有点位时你的大招充能更快。和队友一起撕掉他们的控制！',
  'Zone Control: ink 80% of the live zone to take it — 40% of theirs knocks it back to neutral.': '占点模式：涂满活跃据点 80% 即可夺取——涂对方据点 40% 可打回中立。',
  'Ink 80% of the live zone to take it. Ink 40% of a zone they hold to knock it back to neutral.': '涂满活跃据点 80% 即可夺取。涂对方据点 40% 可打回中立。',
  'Take the live zone and hold it: your count ticks down from 100. The zone moves, so keep up!': '夺取活跃据点并守住：你的计数从 100 开始下降。据点会移动，跟上节奏！',
  'Tougher shell, harder hits, relentless pace. Bring the whole squad.': '更硬的外壳、更猛的冲击、毫不留情的节奏。带上你的整支队伍。',
  'The full HULLBREAKER. Dodge the tells, punish the openings.': '完整的 HULLBREAKER。躲避前摇，惩罚破绽。',
  'Turf points to fill the special gauge': '涂地面积填充大招槽',
  'Ink the zone and hold it to count down!': '涂满据点并守住，让计数下降！',
  'A teammate is charging a Cheer Orb — press C to cheer it on!': '队友正在蓄力加油球——按 C 一起加油！',
  'Practice · L to change loadout · ESC for the practice menu': '练习 · L 切换装备 · ESC 打开练习菜单',

  // ---- room / online flow
  'Play with friends · private rooms': '和朋友一起玩 · 私人房间',
  'Pick the stage, share the code, start when everyone’s ready.': '选地图、分享房间码，等大家都准备好了就开打。',
  'Choose a mode · you and the bots': '选择模式 · 你和机器人',
  'Just you and the bots': '只有你和机器人',
  'No enemies · no clock': '没有敌人 · 没有计时',
  'No bots on this stage': '这张地图不能用机器人',
  'No bots on this stage — it’s humans only': '这张地图不能用机器人——仅限真人',
  'Create or join': '创建或加入',
  'Share the code': '分享房间码',
  'Share the code to fill the room': '分享房间码，把房间凑满',
  'Join my room: K7QXM': '加入我的房间：K7QXM',
  'Opening a room': '正在创建房间',
  'Getting ready…': '准备中…',
  'Ready up & ink!': '准备就绪，开工！',
  'Not ready to start yet': '还没准备好开打',
  'Let the host know you’re set': '告诉房主你准备好了',
  'Everyone’s ready — start when you like!': '大家都准备好了——随时开打！',
  'Everyone’s ready — let’s ink!': '大家都准备好了——开工涂地！',
  'Room full · everyone’s ready!': '房间已满 · 大家就绪！',
  'Nobody to play against yet!': '还没有对手！',
  'Press JOIN (or Enter) to hop in': '按 JOIN（或 Enter）加入',
  'Type or paste the code': '输入或粘贴房间码',
  'Press Ctrl+V (⌘V) to paste': '按 Ctrl+V（⌘V）粘贴',
  'Letters and numbers only': '只允许字母和数字',
  'Room codes are 5 letters & numbers': '房间码由 5 个字母和数字组成',
  'Room codes never use W, A, S or D': '房间码从不用 W、A、S 或 D',
  'No O or 0 in room codes — try the letter next to it': '房间码里没有 O 或 0——试试它旁边的字母',
  'No I or 1 in room codes': '房间码里没有 I 或 1',
  'Nothing that looks like a room code on the clipboard': '剪贴板里没有像房间码的内容',
  'That room code was just taken. Give it another go.': '这个房间码刚被占用。再试一次。',
  'Couldn’t open a room': '无法创建房间',
  'You left the room': '你已离开房间',
  'Empty spots stay empty': '空位保持空缺',
  'Everyone comes with you': '大家跟你一起走',
  'You’re the host now — the room is yours': '现在是房主——房间归你管',
  'You’re the last one here — the room closes when you leave.': '你是这里最后一个人——你离开后房间就会关闭。',
  'You’ll head back to the main menu. Your friends stay in the room.': '你将返回主菜单。你的好友仍留在房间里。',
  'You’ll leave the match and the room — a bot takes over your squidkid for the team.': '你将离开对局和房间——由机器人顶替你，为队伍继续作战。',
  'You will leave this Zone Control match and head back to the lobby. It will not count.': '你将离开这局占点对局并返回大厅，本局不计入成绩。',
  'LEAVE ROOM?': '离开房间？',
  'Otto, Glub +2 joined': 'Otto、Glub 和另外 2 人加入',
  'joined!': '加入了！',
  'Match in progress': '对局进行中',
  'Could not connect': '无法连接',
  'Already in a room': '已在房间中',
  'Connection lost': '连接断开',
  'Room not found': '房间不存在',
  'Room is full': '房间已满',
  'Lost connection to the room': '与房间失去连接',
  'Could not start the match': '无法开始对局',
  'Room code taken': '房间码已占用',
  'Disconnected': '已断开',
  'Cancelled': '已取消',
  'Can’t reach the servers right now': '现在连不上服务器',
  'The link to the room dropped. Check your connection and join again.': '与房间的连接断了。检查网络后重新加入。',
  'They are mid-match right now. Try again in a few minutes — the room reopens after the results.': '他们正在对局中。过几分钟再试——结算后房间会重新开放。',
  'The INKWAVE servers didn’t answer. Check your connection, then try again.': 'INKWAVE 服务器没有响应。检查网络后重试。',
  'Something went wrong. Try again.': '出了点问题。再试一次。',
  'Something went wrong while loading: ': '加载时出错：',
  'Every spot is taken. Ask the host to make space, or open a room of your own.': '所有位置都满了。请房主腾出位置，或自己开一个房间。',

  // ---- offline setup screen
  'Choose your squidkid, then make it yours': '挑选你的墨仔，然后打扮成自己的样子',
  'Pick your weapon, sub and special — your squidkid shows it off on the right': '选择武器、副武器和大招——你的墨仔会在右侧展示',
  'Pick a stage and the time of day · 5 v 5 against bots': '选择地图与时间段 · 5 对 5 人机',
  'Pick a stage and the time of day · 5 v 5 against bots · 5:00 + overtime': '选择地图与时间段 · 5 对 5 人机 · 5:00 + 加时',
  'Swap weapons and subs mid-practice — changes apply straight away': '练习中可随时换武器和副武器——立即生效',
  'Try this loadout on a random stage': '在随机地图上试用这套装备',
  'Your picks are already equipped': '你选的装备已经穿上了',
  'Low sun, long shadows, harbour lights.': '夕阳低垂、长影横斜、港口灯火。',
  'Bright sun, crisp shadows.': '烈日当空，影子清晰。',
  'Turf War · Zone Control · Boss Battle': '涂地 · 占点 · BOSS 战',
  'Fill the whole display. Also ⌃⌘F or F11.': '占满整个屏幕。也可用 ⌃⌘F 或 F11。',
  'Frame rate limit': '帧率上限',
  'Damage to the boss': '对 BOSS 的伤害',
  'Pushed off the zone in overtime': '加时赛中被挤出据点',
  'Lost at the overtime limit': '加时上限，惜败',
  'Won at the overtime limit': '加时上限，险胜',
  'Comeback in overtime!': '加时逆转！',
  'Overtaken in overtime': '加时赛被反超',
  'Held on in overtime': '加时赛守住领先',
  'Stopped in overtime': '加时赛被追平',
  'Count down from 100': '从 100 开始倒数',
  'Take the zone': '夺取据点',
  'Don’t lose it': '别失守',
  'Zones rotate': '据点轮换',
  'Knocked out': '被淘汰',
  'KNOCKOUT': '淘汰',
  'ESCAPED': '已逃脱',
  'NEUTRAL': '中立',
  'Skip · Select': '跳过 · 选择',
  'What’s New': '更新速递',
  "What's New": '更新速递',
  "Time's up": '时间到',
  'Press again to cancel': '再按一次取消',

  // ---- short labels / buttons (menus, customization, results)
  'SQUAD': '小队', 'SQUIDKIDS': '墨仔', 'OUTFIT': '服装', 'HEADGEAR': '头饰', 'HAIR': '发型', 'FACE': '脸部', 'EYES': '眼睛', 'BROWS': '眉毛', 'SKIN': '皮肤', 'NAME': '名字',
  'DANCE': '跳舞', 'FLEX': '秀一下', 'HEX': 'HEX', 'OPEN': '开放', 'DONE': '完成', 'Done': '完成', 'Wear': '穿戴', 'Type': '输入', 'COPY': '复制', 'COPIED': '已复制',
  'CLASSIC': '经典', 'SHUFFLE': '随机', 'NEW!': '新！', 'Mode': '模式', 'TIME': '时间', 'MODE': '模式', 'TEAM': '队伍', 'STAY': '留下',
  'Switch': '切换', 'Letter': '字母', 'Delete': '删除', 'Clear': '清空', 'Backspace': '退格',
  'BOOYAH!': '加油！', 'HEY!': '嘿！', 'YEAH!': '好耶！', 'Yeah!': '好耶！',
  'Sneaky': '鬼祟', 'Glossy': '亮泽', 'Mighty': '强悍', 'Speedy': '疾速', 'Bubbly': '泡泡', 'Snazzy': '神气', 'Drippy': '滴答', 'Legend': '传奇',
  'Tidal': '潮汐', 'Zesty': '鲜活', 'Soggy': '湿漉', 'Salty': '咸涩', 'Sunny': '晴朗', 'Inky': '墨染', 'Splashy': '泼辣',
  'Inkling': '墨灵', 'Sprayer': '喷射手',
  'Friends join from ': '好友从这里加入 ',

  // ---- character style (shirts / headwear / hair / colors)
  'Night Pinstripe': '夜纹细条', 'Raglan Runner': '插肩跑衫', 'Breton Stripe': '海魂条纹', 'Basic Ringer': '基础滚边',
  'Splatter Tee': '泼墨 T 恤', 'Chevron Tee': '人字纹 T 恤', 'Dip-Dye Tee': '浸染 T 恤', 'Splat Camo': '墨点迷彩', 'Pro Jersey': '职业球衣', 'Track Top': '运动套头衫',
  'Bucket Hat': '渔夫帽', 'Snapback': '平檐帽', 'Beanie': '毛线帽', 'Skipper': '船长帽',
  'Straight': '直发', 'Classic': '经典款',
  'Porcelain': '瓷白', 'Chestnut': '栗棕', 'Lagoon': '泻湖蓝', 'Violet': '紫罗兰', 'Honey': '蜂蜜', 'Olive': '橄榄',
  'Ebony': '乌木', 'Amber': '琥珀', 'Hazel': '榛果', 'Frost': '霜白', 'Ember': '余烬', 'Rosy': '绯红', 'Rose': '玫瑰',
  'Peach': '蜜桃', 'Cocoa': '可可', 'None': '无', 'Bold': '浓眉', 'Dash': '短眉', 'Arched': '拱眉',
  'Low bun under a bucket hat, splat camo, very patient charger main.': '渔夫帽下扎着低丸子头，一身泼墨迷彩，主武器是耐心十足的蓄力枪。',
  'Twin tails, breton stripes, always first to the ferry deck.': '双马尾，海魂条纹衫，总是第一个冲上渡轮甲板。',
  'Fresh off the ferry, ringer tee and long tentacles.': '刚下渡轮，滚边 T 恤配一条长长的触手。',
  'Track-top sprinter with a spiky quiff.': '运动套头衫的短跑选手，额前一撮炸毛。',
  'Mohawk crest and a splatter tee. Loud.': '莫西干发冠加泼墨 T 恤，嗓门很大。',
  'Side-swept and too cool for the lobby.': '侧分发型，酷得在大厅都懒得理人。',
  'Ponytail up, jersey on, game face.': '高马尾，球衣上身，比赛脸。',
  'Snapback, raglan, harbour regular.': '平檐帽，插肩袖，港口的常客。',
  'Beanie season, all season.': '毛线帽季节，四季如常。',
  'Dip-dyed and unbothered.': '浸染发尾，什么都不在乎。',

  // ---- weapons / subs / specials (names)
  'Spinner': '旋流枪', 'Pistols': '双枪', 'Cutlass': '弯刀', 'Dualies': '双持', 'Slosher': '水瓢', 'Brolly': '雨伞枪', 'Mitts': '拳套',
  'Tidebucket Slosher': '潮汐水瓢', 'Twinfin Dualies': '双鳍双持', 'Gyre Splatling': '旋涡小炮', 'Splatling': '墨鱼小炮',
  'Splat Bomb': '爆裂墨弹', 'Cling Charge': '吸能弹', 'Pop Pellet': '爆裂豆', 'Skitter Bomb': '速爆弹', 'Echo Orb': '回声球',
  'Drip Curtain': '滴墨帘', 'Twirl Sprinkler': '旋转洒水器', 'Lurk Mine': '潜伏水雷', 'Hop Beacon': '跳跃信标', 'Murk Bomb': '毒雾弹',
  'Shaker Bomb': '摇晃弹', 'Waddle Bomb': '咕噜弹', 'Tide Torpedo': '潮汐鱼雷', 'Tracer Bolt': '追踪飞镖', 'Whirl Boomerang': '回旋飞刃',
  'Cling Charge Barrage': '吸能弹齐射', 'Skitter Bomb Barrage': '速爆弹齐射', 'Splat Bomb Barrage': '墨弹齐射',
  'Pop Pellet Barrage': '爆裂豆齐射', 'Murk Bomb Barrage': '毒雾弹齐射',
  'Bubble Guard': '泡泡护盾', 'Deep Sonar': '深海声呐', 'Vortex Strike': '漩涡打击', 'Twister Zooka': '龙卷风筒',
  'Howl Box': '咆哮音箱', 'Kraken': '章鱼形态', 'Bubble Blower': '泡泡吹风机', 'Ink Jet': '墨流喷射',
  'Mega Stamp': '巨型墨印', 'Cheer Orb': '加油球', 'Crab Rig': '螃蟹坦克', 'Zipline': '抓钩索道',
  'Needs 2+ players — no bots on this stage': '需要 2 名以上玩家——这张地图不能用机器人',
  'Needs a player on each team': '每支队伍至少要有一名玩家',

  // ---- map descriptions
  'Narrow shop streets and an iron gallery close in on the glass Market Hall, where the No. 3 tram waits under the clock.': '狭窄的商铺街巷与铁艺长廊环抱着玻璃的市场大厅，3 路电车停在钟楼之下。',
  'An open salt works: sunken pans and boardwalks round a wind pump, with the shed roof and salt heap as high ground.': '敞开的盐场：下沉的盐池与木栈道环绕着风车水泵，棚顶和盐堆是制高点。',
  'A container terminal at shift change: a gantry crane straddles the pier between two moored ships. Mind the water.': '换班时段的集装箱码头：一台龙门吊横跨在两座停泊货船之间的栈桥上。小心落水。',
  'Drained locks through a brick warehouse district: the canal splits the map, so hold the bridge and the gates.': '排水船闸穿过红砖仓库区：运河把地图一分为二，守住桥和闸门。',
  'Floating docks, a tug on blocks and a car ferry moored across the middle. Mind the water.': '浮动码头、吊在绞盘上的拖船，以及横泊在中央的汽车渡轮。小心落水。',

  // ---- weapon / sub / special descriptions
  'Dash along the ground leaving a thin trail, or swipe side to side to flick a spray of small globs.': '贴地冲刺留下一道细墨迹，或左右挥扫甩出一片小墨滴。',
  'Twin pistols, alternating fire. Jump while firing to dodge-roll, then plant and unload.': '双枪交替射击。射击中跳跃可闪避翻滚，站定后火力全开。',
  'Heaves a heavy wave of ink in an arc: over cover, up ledges, a thick stripe where it lands.': '以弧线抛出沉重的墨浪：越过掩体、爬上台阶，落地留下一条粗墨痕。',
  'Bounces, arms when it lands, then bursts. Splats anyone close.': '弹跳着飞出去，落地后起爆，炸飞附近所有人。',
  'Sticks to whatever it hits (floors, walls, ceilings) and blows after a moment with a wide blast.': '粘在命中的任何表面（地面、墙面、天花板）上，片刻后大范围爆炸。',
  'Pops on impact. Cheap enough to throw twice: two direct hits or three near misses splat.': '命中即爆。墨量便宜到可以连扔两颗：两次直击或三次近失即可击倒。',
  'Scuttles after the nearest foe, laying a swimmable ink trail, and bursts when it reaches them. It turns wide: sidestep it late.': '爬向最近的敌人，留下一条可以游行的墨迹，追上目标后爆炸。它转弯半径大：尾端侧身就能甩掉。',
  'Bursts into a sensing cloud. Foes it touches are tracked for your whole team. No damage.': '炸开成探测云雾。被碰到的敌人会被全队锁定标记。无伤害。',
  'Drops a wall of falling ink that stops enemy players and shots. It fades over time, faster when shot.': '落下一道下坠的墨水墙，阻挡敌方玩家和射击。随时间消散，被射击时消散更快。',
  'Sticks to any surface and sprays ink around it in pulses, until it is shot or you get splatted.': '粘在任何表面上，以脉冲方式向四周喷墨，直到被击破或你被击倒。',
  'Planted at your feet and hidden in your ink. Foes who come close are hit and tracked. Two at a time.': '布在脚下，藏进你的墨色里。靠近的敌人会被击伤并锁定。同时最多 2 颗。',
  'A super-jump point for your team. Place up to three; each takes two jumps.': '队伍的超级跳落点。最多放 3 个，每个可用两次。',
  'Releases a poison mist that slows foes and drains their ink. A direct hit keeps them poisoned until the mist fades.': '释放毒雾，减速敌人并消耗其墨水。直击的敌人会持续中毒，直到毒雾散去。',
  'Hold to shake it up (mash jump, keep moving): up to three blasts that hop it forward.': '长按摇晃它（狂按跳跃、保持移动）：最多三段蹦跳爆炸。',
  'Waddles after foes it senses near where it lands, noisily. Blows up where it lands if nobody is near.': '摇摇晃晃地追踪落点附近的敌人，动静很大。附近没人就原地爆炸。',
  'Locks onto a foe in mid-air, then darts at them and bursts into droplets. One out at a time.': '在空中锁定敌人后俯冲撞击，炸成墨滴。同时只能有一枚。',
  'A fast bolt fired a little low that skims and ricochets, puddling ink on every bounce. Hits and its trail mark foes for your team.': '一枚略向下射的快速飞镖，贴地弹跳，每次弹起都留下墨滩。命中与轨迹都会为全队标记敌人。',
  'Spins out, hovers and shreds, whirls back round you, then bursts. Hit a foe and it bursts on them like a Splat Bomb. One out at a time.': '飞出去后悬停绞杀，再回旋到你身边爆炸。命中敌人则像爆裂墨弹一样在敌人身旁爆炸。同时只能有一个。',
  'Hold up a ball of ink that charges over time, then throw it for a huge blast. Teammates\' "Yeah!" cheers (C) charge it faster and top up their own special.': '举起一颗墨水球，随时间蓄力，然后投掷引发大爆炸。队友的"好耶！"加油（C 键）能让它充能更快，并回复他们自己的大招。',
  'Spin up, then unleash a stream of ink. A full spin reaches farthest and fires longest.': '蓄力旋转，然后喷射墨水流。转得越满，射得越远、持续越久。',
  'Hold to spin up, release for a long high-speed stream. The more charge, the longer it lasts.': '按住旋转蓄力，松开出射一长串高速墨流；蓄得越满，喷射越久。',
  'Throw Splat Bombs as fast as you like for a few seconds — no ink needed. Your main weapon still works.': '几秒内尽情投掷爆裂墨弹——不需要墨水。主武器照常可用。',
  'Stick Cling Charges to every wall in sight — no ink needed. Your main weapon still works.': '把吸能弹贴满视野里的每一面墙——不需要墨水。主武器照常可用。',
  'Pelt foes with rapid-fire Pop Pellets — no ink needed. Your main weapon still works.': '用速射爆裂豆轰击敌人——不需要墨水。主武器照常可用。',
  'Send a pack of Skitter Bombs chasing foes, each inking a trail — no ink needed. Your main weapon still works.': '放出一群速爆弹追咬敌人，各自留下墨迹——不需要墨水。主武器照常可用。',
  'Smother an area in Murk Bomb mist — no ink needed. Your main weapon still works.': '用毒雾弹的毒雾笼罩一片区域——不需要墨水。主武器照常可用。',
  'A force field that turns every hit into a shove instead of damage. Touch teammates to share it.': '一道力场，把受到的所有打击变成击退而不是伤害。触碰队友可以分享。',
  'Reveals every enemy to your team on screen and on the map. Revealed foes move slower and burn through ink faster.': '在屏幕和地图上向全队显示所有敌人。被显示的敌人移动变慢、墨水消耗加快。',
  'Pick a spot on the map and launch a missile. It lands as a huge swirling vortex of ink.': '在地图上选一个落点发射导弹，落地时化作巨大的墨水漩涡。',
  'A bazooka that fires tall twisters of ink in quick succession — splats foes at long range.': '一门火箭筒，快速发射高大的墨龙卷——远程一击击倒。',
  'Hold up a huge speaker, aim it and click: it blasts a sound wave that goes through walls and splats anything in its path.': '举起巨型音箱，瞄准后点击：轰出一道具穿墙音波，路径上一切都被击倒。',
  'Turn into an invincible kraken. Race through any ink (even the enemy\'s) and splat foes with a jump attack.': '化身无敌章鱼。在任意墨水（包括敌人的）中疾速穿行，用跳跃攻击击倒敌人。',
  'Blow up to three giant bubbles that wall off an area. Shoot them (you or your team) to set off a huge ink blast.': '吹出最多 3 个巨型泡泡，围出一块区域。射击泡泡（你或队友）即可引发巨型墨爆。',
  'Hover over the stage firing powerful blasts — jump for a boost. When it runs out you super jump back to where you took off (marked for everyone to see).': '悬浮在战场上方发射强力炮弹——跳跃加速。燃料耗尽后超级跳回起飞点（对所有人可见）。',
  'Charge forward smashing with a giant stamp: each swing deflects attacks from the front and smashes bombs before they go off, but it turns slowly and is open from the sides and back. Swing mid-air for a flip that reaches further and hits behind you too. Throw it (sub) as a long-range blast — that ends the special.': '举着巨印冲锋横扫：每次挥击都能格挡正面攻击、在炸弹起爆前将其砸碎，但转向较慢，侧后方是死角。空中挥击可翻印，范围更远，还能砸到身后。用副武器把它投出去当远程爆破——大招随即结束。',
  'Cloaked in a mysterious aura, your sub becomes a grapple: latch onto walls from afar and zip over, main weapon in hand. You super jump back when it ends (marked for everyone to see).': '笼罩在神秘光晕中，副武器变成抓钩：从远处勾住墙壁滑行而过，主武器照常可用。结束时会超级跳回起点（对所有人可见）。',
  'Ride a crab tank: gatling on fire, mortar on sub, roll into an armoured ball with swim. The tank can be shot down, and you\'re exposed from above and behind.': '驾驶螃蟹坦克：主武器是机炮，副武器是迫击炮，游泳时可卷成装甲球。坦克会被打爆，且上方和后方无防护。',

  // ---- in-match HUD callouts
  'Move the mouse to aim · click to launch': '移动鼠标瞄准 · 点击发射',
  'Hold TAB to plan a Super Jump': '按住 TAB 规划超级跳',
  'Knocked into the sea': '被击落水中',
  "THEY'VE GOT CONTROL!": '对方夺得控制！',
  'Fell off the stage': '跌出场地',
  "WE'VE GOT CONTROL!": '我方夺得控制！',
  'THEY LOST CONTROL!': '对方失去控制！',
  'WE LOST CONTROL!': '我方失去控制！',
  'Fell in the sea': '落水',
  'Out of bounds': '出界',
  "IT'S A TIE!": '平局！',
  'OVERTIME!': '加时！',
  'KNOCKOUT!': '击倒！',

  // ---- quality tiers / standalone labels / minimap pins (UPPER fallback covers most; explicit where the
  //      title-case key means something different, e.g. 'Look' = aim action vs 'LOOK' = locker chip)
  'LOW': '低', 'MED': '中', 'HIGH': '高', 'ULTRA': '极高',
  'WEAPON': '武器', 'LOOK': '外观', 'LOOKS': '外观', 'OPTIONS': '选项', 'LEAVE': '离开',
  'DAMAGE': '伤害', 'BASE': '基地', 'YOU': '你',
  'Splats (crablets)': '击倒数（小蟹怪）',
  // ---- practice menu (pause buttons + practice panel)
  'CHANGE LOADOUT': '更换装备',
  'RESET STAGE': '重置关卡',
  'NEW STAGE': '新关卡',
  'END PRACTICE': '结束练习',
  'YOUR LOADOUT': '你的装备',
  'QUICK CONTROLS': '快速操作',
  // compact control labels are derived at runtime via .replace() ('Swim · squid form' → 'Swim'), so they
  // need their own keys; the hint line is composed of <b> + text fragments, each translated separately
  'Swim': '潜墨',
  'Aim bomb': '瞄准副武器',
  'or': '或',
  'Reset stage': '重置关卡',
  'swaps your loadout any time': '可随时切换装备',
  'swaps your loadout any time ·': '可随时切换装备 ·',
  'wipes the ink and refills your special': '会清空墨水并补满大招',
  // ---- settings preview / join error / zone rules (exact source punctuation matters)
  'Assist on <b>controller and mouse</b> (lighter on mouse)': '辅助瞄准：<b>手柄与鼠标</b>（鼠标更轻）',
  'No room uses that code. Double-check it with your friend — rooms close when everyone leaves.': '没有房间使用这个房号。和好友再核对一下——所有人离开后房间就会关闭。',
  'If they take the zone from you, ¾ of what you counted since you took it becomes a penalty: your count won’t move until you count it off.': '若对方夺走据点，你占领期间计数的 ¾ 会转为罚分：数完罚分前，你的计数不会减少。',
  // how-to zone notes (composed <b> + text fragments, translated per node)
  'Specials charge fast': '大招充能加快',
  'while the other team holds the zone — use them to break in.': '对方占领据点期间——用大招强攻夺回',
  'Overtime:': '加时赛：',
  'at time up, the team behind plays on while it holds the zone.': '时间到后，落后一方若持有据点则继续比赛',
  'OVERTIME': '加时',
  'POISONED': '中毒',
  'PRACTICE': '练习',
  'SPECIAL!': '大招！',
  'TRACKED': '被锁定',
  'CENTRE': '中央',
  'ASSIST': '助攻',
  'FREE': '中立',
  'Hold [SHIFT] to swim': '按住 [SHIFT] 游泳',
  'The jump beacon is gone': '超级跳信标已消失',
  'Your beacon': '你的信标',
  "Can't use": '无法使用',

  // ---- boss battle
  'Shoot HULLBREAKER — its glowing eyes take extra damage!': '射击 HULLBREAKER——发光的眼睛会受到额外伤害！',
  'Shell cracked — hit the glowing belly!': '甲壳裂开——打发光的腹部！',
  'Final phase · hit the glowing belly!': '最终阶段 · 打发光的腹部！',
  'It\u2019s OPEN — unload on it!': '破防了——全力输出！',
  'Crablets incoming — pop them fast!': '蟹仔来袭——快点戳破！',
  'SHELL CRACKED!': '甲壳裂开！',
  "TIME'S UP!": '时间到！',
  'PHASE 2!': '二阶段！',
  'ENRAGED': '狂暴',
  'IMMUNE': '免疫',
  'PHASE': '阶段',
  'CRIT!': '暴击！',
  'SUNK!': '击沉！',
  'The Rust-Shelled Terror': '锈甲巨威',
  'INCOMING!': '来袭！', 'CHARGE!': '冲锋！', 'FRENZY!': '狂暴！', 'SWEEP!': '横扫！', 'BROOD!': '产卵！', 'SLAM!': '猛砸！', 'OPEN!': '破防！',

  // ---- special-ability hints
  'Aim the speaker · click to set it down and blast': '瞄准音箱 · 点击放下并引爆',
  'Move the mouse to pick a spot · click to launch': '移动鼠标选择落点 · 点击发射',
  'Charging… teammates press C to cheer!': '蓄力中…队友按 C 加油！',
  'Clinging — SPACE to jump off': '吸附中——按 SPACE 跳下',
  'Kraken! LMB to jump-attack': '章鱼形态！左键跳跃攻击',
  'Fire twisters with LMB': '左键发射龙卷风',
  'Ink Jet! Fire with LMB': '墨流喷射！左键开火',
  'Charged! LMB to throw': '蓄满！左键投掷',
  'Right stick to point · A or D-pad to plan your Super Jump · release VIEW to close': '右摇杆指向 · A 或十字键规划超级跳 · 松开 VIEW 关闭',
  'Right stick to point · A or D-pad to Super Jump · release VIEW to close': '右摇杆指向 · A 或十字键超级跳 · 松开 VIEW 关闭',
  'Launches on respawn · pick again to change': '复活时自动发射 · 重新选择可更换',
  'Pick a teammate or beacon to jump to on respawn': '选择复活时超级跳的目标：队友或信标',

  // ---- settings descriptions (menu art)
  'Minimap <b>hidden</b> — hold TAB for the big map': '小地图 <b>已隐藏</b>——按住 TAB 看大图',
  'Shadows <b>OFF</b> — faster on older machines': '阴影 <b>关</b>——老机器更流畅',
  'The full <b>turf war</b> — room for comebacks': '完整的 <b>涂地</b> 大战——逆转空间大',
  'Best all-round score on the winning team': '胜队全场最佳',
  'Best all-round score against HULLBREAKER': '对战 HULLBREAKER 全场最佳',
  'Frame counter <b>shown</b> in matches': '对局中 <b>显示</b>帧数',
  'Top-3 turf without splatting anyone': '涂地进前三且零击倒',
  'Bright ink and specials <b>glow</b>': '亮色墨水与大招 <b>发光</b>',
  'Dealt the most damage to the boss': '对 BOSS 伤害最高',
  'Turf minimap <b>in the corner</b>': '涂地小地图 <b>在角落</b>',
  'Assist on <b>controller only</b>': '辅助瞄准仅限 <b>手柄</b>',
  'Painted over the most boss ink': '覆盖 BOSS 墨水最多',
  'Frame counter <b>hidden</b>': '帧数 <b>隐藏</b>',
  'Push up <b>→ look DOWN</b>': '推上 <b>→ 镜头朝下</b>',
  'Soft sun shadows <b>ON</b>': '柔和日光阴影 <b>开</b>',
  'Popped the most crablets': '戳破蟹仔最多',
  'Push up <b>→ look UP</b>': '推上 <b>→ 镜头朝上</b>',
  'Screen shake <b>OFF</b>': '屏幕震动 <b>关</b>',
  'Aim assist <b>OFF</b>': '辅助瞄准 <b>关</b>',
  'Most weak-point hits': '弱点命中最多',
  'Vibration <b>OFF</b>': '震动 <b>关</b>',
  'Top all-round score': '全场最佳',
  'Glow <b>OFF</b>': '发光 <b>关</b>',
  'Anti-aliasing': '抗锯齿',
  'UNSINKABLE': '不沉之舰',
  'On': '开', 'Off': '关',

  // ---- news feed (page 2)
  'it\u2019s still sharpening its claws — tell us what you think!': '它还在磨砺利爪——告诉我们你的想法！',
  'Three phases of chaos': '三段式混乱',
  'Co-op showdown': '合作对决',
  'Private rooms': '私人房间',
  'Public beta': '公开测试',
  'What\u2019s new': '更新内容',
  'EXPANSION': '资料片',
  'INTRODUCING': '即将登场',
  'THE MULTIPLAYER': '多人联机',
  'CONTINUE': '继续',
  'LATER': '稍后',
  'A giant hermit crab has moved into a rusty shipping container — and it wants the whole harbour.': '一只巨型寄居蟹搬进了锈迹斑斑的集装箱——它想把整个港口都吞掉。',
  'BOSS BATTLE · PUBLIC BETA': 'BOSS 战 · 公开测试',
  'dodge the tells, crack the shell, blast the glowing weak points': '躲前摇、砸甲壳、轰碎发光的弱点',
  'your whole squad vs one colossal crab': '你的整支小队 VS 一只巨无霸螃蟹',
  'TRY IT': '试试身手',

  // ---- mode card chips / setup / locker / online labels
  'VS BOTS': '人机对战', 'RANKED RULES': '排位规则', 'ROTATING ZONES': '据点轮换', 'CO-OP': '合作',
  '1 BOSS': '1 个 BOSS', 'STAGES': '地图', 'LAYOUT': '布局', 'BOT SKILL': '机器人难度', 'DIFFICULTY': '难度',
  'MATCH LENGTH': '对局时长',
  'EQUIPPED': '已装备', '◀ ▶ CHANGE': '◀ ▶ 切换', 'MAIN': '主武器',
  'CHOOSE YOUR SQUIDKID': '选择你的墨仔', 'SQUIDKID': '墨仔', 'Saves automatically': '自动保存', 'DRAG TO SPIN': '拖动旋转',
  'HAT': '帽子',
  'KEYBOARD & MOUSE': '键盘与鼠标', 'CONTROLLER': '手柄', 'Rules · Controls': '规则 · 操作', 'DPad': '十字键', 'or': '或',
  '"Yeah!" cheer': '"好耶！"加油',
  'YOU HOST': '你来当房主', 'CREATE A ROOM': '创建房间', 'GOT A CODE?': '有房间码？', 'JOIN A ROOM': '加入房间',
  'PASTE': '粘贴', 'YOUR SPLASHTAG': '你的墨仔名', 'ONLINE › JOIN A ROOM': '联机 › 加入房间',
  'PUBLIC ROOMS': '公开房间', 'No public rooms yet': '暂无公开房间', 'Create a room and mark it public': '建一个房间并设为公开',
  'Waiting': '等待中', 'In match': '对局中', 'PUBLIC ROOM': '公开房间', 'Listed in the ONLINE lobby — anyone can join': '显示在联机大厅，任何人都能加入',
  'ROOM NOT FOUND': '房间不存在', 'ROOM IS FULL': '房间已满', 'MATCH IN PROGRESS': '对局进行中', 'CONNECTION LOST': '连接已断开',
  'TRY AGAIN': '再试一次', 'CAN’T CONNECT': '无法连接', 'FILL WITH BOTS': '用机器人填充', 'COPIED!': '已复制！', 'PICKED BY ': '由  挑选',
  // online errors: the join card shows title + text as separate nodes; the create card and toasts compose the
  // same strings in other forms — keep every rendered form in sync with menus.js JOIN_ERR
  'No room uses that code. Double-check it with your friend — rooms close when everyone leaves.': '没有房间在用这个房间码。和好友核对一下 —— 大家都离开后房间就会关闭。',
  'Every spot is taken. Ask the host to make space, or open a room of your own.': '所有位置都满了。请房主腾出位置，或自己开一个房间。',
  'They are mid-match right now. Try again in a few minutes — the room reopens after the results.': '他们正在打比赛。几分钟后重试 —— 结算后房间会重新开放。',
  'The INKWAVE servers didn’t answer. Check your connection, then try again.': '服务器没有响应。请检查网络后重试。',
  'That room code was just taken. Give it another go.': '这个房间码刚被占用了。再试一次吧。',
  'The link to the room dropped. Check your connection and join again.': '与房间的连接中断了。请检查网络后重新加入。',
  'ROOM NOT FOUND — No room uses that code. Double-check it with your friend — rooms close when everyone leaves.': '房间不存在 —— 没有房间在用这个房间码。和好友核对一下，大家都离开后房间就会关闭。',
  'ROOM IS FULL — Every spot is taken. Ask the host to make space, or open a room of your own.': '房间已满 —— 所有位置都满了。请房主腾出位置，或自己开一个房间。',
  'MATCH IN PROGRESS — They are mid-match right now. Try again in a few minutes — the room reopens after the results.': '对局进行中 —— 他们正在打比赛。几分钟后重试，结算后房间会重新开放。',
  'CAN’T CONNECT — The INKWAVE servers didn’t answer. Check your connection, then try again.': '无法连接 —— 服务器没有响应。请检查网络后重试。',
  'TRY AGAIN — That room code was just taken. Give it another go.': '再试一次 —— 这个房间码刚被占用了。再试一次吧。',
  'CONNECTION LOST — The link to the room dropped. Check your connection and join again.': '连接已断开 —— 与房间的连接中断了。请检查网络后重新加入。',
  'Room not found — No room uses that code.': '房间不存在 —— 没有房间在用这个房间码。',
  'Room is full — Every spot is taken.': '房间已满 —— 所有位置都满了。',
  'Match in progress — They are mid-match right now.': '对局进行中 —— 他们正在打比赛。',
  'Can’t connect — The INKWAVE servers didn’t answer.': '无法连接 —— 服务器没有响应。',
  'Try again — That room code was just taken.': '再试一次 —— 这个房间码刚被占用了。',
  'Connection lost — The link to the room dropped.': '连接已断开 —— 与房间的连接中断了。',
  'Opening a room': '正在创建房间…', 'Can’t reach the servers right now': '现在连不上服务器', 'Couldn’t open a room': '房间创建失败',
  'COULDN’T JOIN': '加入失败', 'Something went wrong. Try again.': '出了点问题，请再试一次。', 'Cancelled': '已取消',
  'LIVE': '在线', 'NEXT RANK': '下一段位', 'CURRENT LOADOUT': '当前装备',
  'STAGE MAP': '地图总览', 'ON RESPAWN': '复活时', 'ZONE SHIFT IN': '据点切换',

  // ---- map descriptions that start with a bare letter (the scanner's isUI missed them)
  'A Victorian seaside square: fight round the Jubilee clock tower, under the colonnade and along the promenade.': '维多利亚风的海滨广场：在庆典钟楼、拱廊与海滨步道之间激战。',
  'A container terminal at shift change: a gantry crane straddles the pier between two moored box ships.': '换班时段的集装箱码头：一台龙门吊横跨在两座并泊货船之间的栈桥上。',
  'A whitewashed hill village: hold the terraces, fight for the stairs and drop in on the Piazzetta.': '粉刷成白色的山丘村庄：守住层层露台，争夺阶梯，从天而降突袭小广场。',

  // ---- boss mode
  "Everyone's one squad against HULLBREAKER, a giant crab in a rusted container. Sink it before time runs out!": '全队一条心，共同对抗 HULLBREAKER——一只躲在锈集装箱里的巨蟹。在时间耗尽前把它击沉！',
  'Your squad of 8 against HULLBREAKER.': '你的 8 人小队，对抗 HULLBREAKER。',
  'A giant hermit crab living in a rusted shipping container. Everyone in the room teams up to sink it before time runs out.': '一只住在锈集装箱里的巨型寄居蟹。全房间的人协力，在时间耗尽前把它击沉。',

  // ---- settings (sensitivity)
  'of mouse travel per 360° turn': '的鼠标移动量对应一次 360° 转向',
};

// regex fallbacks for dynamic strings (exact matches above cover almost everything).
// Applied as a fixed point: composed strings (e.g. the stage header "Turf War · Tidewater Plaza · DAY · 3 MIN")
// carry several known fragments at once, so keep substituting until stable.
const PATTERNS = [
  [/^(\d+) minute left!$/m, (m) => `${m.slice(0, m.indexOf(' '))} 分钟后？`],
  // mode / map names inside composed strings
  [/Turf War/g, '涂地'],
  [/Zone Control/g, '占点'],
  [/Boss Battle/g, 'BOSS 战'],
  [/Tidewater Plaza/g, '潮汐广场'],
  [/Kelpline Terminal/g, '海带码头'],
  [/Halyard Marina/g, '吊环码头'],
  [/Saltpan Basin/g, '盐田盆地'],
  [/Crossroads Market/g, '十字路口市场'],
  [/Lockgate Canals/g, '闸口水道'],
  [/Terrace Heights/g, '台地高地'],
  [/Cargo Terminal/g, '货运码头'],
  // units / chips
  [/\bDAY\b/g, '白天'],
  [/\bDusk\b/g, '黄昏'],
  [/(\d+) MIN/g, '$1 分钟'],
  [/(\d+) SEC/g, '$1 秒'],
  [/(\d+):00 \+ OT/g, '$1:00 + 加时'],
  [/(\d+) V (\d+)/g, '$1 对 $2'],
  [/SQUAD OF (\d+)/g, '$1 人小队'],
  [/(\d+) LOOKS/g, '$1 种外观'],
  [/(\d+) OPTIONS/g, '$1 种选项'],
  [/^LV (\d+)$/m, '等级 $1'],
  [/^(\d+) of (\d+)$/, '第 $1 / $2 项'],
  [/MIT License/g, 'MIT 许可协议'],
  [/SIL Open Font License/g, 'SIL 开放字体许可证'],
  [/\bDay\b/g, '白天'],
  // "<weapon blurb> Uses N% of your ink." — a dictionary blurb plus the dynamic ink cost
  [/^(.+) Uses (\d+)% of your ink\.$/, (full, blurb, cost) => { const z = ZH[blurb]; return z != null ? z + ' 消耗 ' + cost + '% 墨水。' : full; }],
  // "— <text>" lines (news card bullets): translate the body from the dictionary, keep the dash
  [/^(—\s*)(.+)$/, (full, pre, rest) => { const z = ZH[rest] ?? UPPER.get(rest.toUpperCase()); return z != null ? pre + z : full; }],
];

// splashtag title: menus.js composes TITLE_ADJ + ' ' + TITLE_NOUN at runtime, so the DOM text is a pair
// that no single dictionary key can cover — translate both parts from these two maps instead.
const TAG_ADJ = {
  'Fresh': '崭新的', 'Inky': '墨染', 'Turf': '涂地', 'Splashy': '泼辣', 'Rad': '酷炫', 'Sneaky': '鬼祟',
  'Deep-Sea': '深海', 'Glossy': '亮泽', 'Tidal': '潮汐', 'Zesty': '鲜活', 'Mighty': '强悍', 'Soggy': '湿漉',
  'Speedy': '疾速', 'Salty': '咸涩', 'Bubbly': '泡泡', 'Snazzy': '神气', 'Drippy': '滴答', 'Sunny': '晴朗',
};
const TAG_NOUN = {
  'Squidkid': '墨仔', 'Inkling': '墨灵', 'Turf Boss': '涂地之王', 'Wave Rider': '冲浪手', 'Splatter': '泼溅者',
  'Tentacle': '触手仔', 'Drip Lord': '滴墨大人', 'Sprayer': '喷射手', 'Rookie': '菜鸟', 'Legend': '传奇',
  'Deck Hand': '甲板手', 'Sea Pickle': '海胆仔', 'Kelp Fan': '海藻扇', 'Ink Slinger': '墨水投手',
  'Plaza Star': '广场之星', 'Harbor Kid': '港口小子',
};

let lang = 'en';
try { lang = localStorage.getItem(LANG_KEY) || 'en'; } catch { /* private mode */ }   // default: English

const originals = new WeakMap();   // text node → original English
const UPPER = new Map(Object.entries(ZH).map(([k, v]) => [k.toUpperCase(), v]));

function tr(text) {
  const t = text.trim();
  if (!t || !/[A-Za-z]/.test(t)) return null;
  let z = ZH[t] ?? UPPER.get(t.toUpperCase());
  if (z == null) {
    let cur = t, applied = true, guard = 0;
    while (applied && guard++ < 8) {
      applied = false;
      for (const [re, rep] of PATTERNS) {
        re.lastIndex = 0;
        const nx = cur.replace(re, rep);
        if (nx !== cur) { cur = nx; applied = true; }
      }
    }
    if (cur !== t) z = cur;
  }
  if (z == null) {
    const sp = t.indexOf(' ');
    if (sp > 0 && TAG_ADJ[t.slice(0, sp)] && TAG_NOUN[t.slice(sp + 1)]) {
      return text.replace(t, TAG_ADJ[t.slice(0, sp)] + ' ' + TAG_NOUN[t.slice(sp + 1)]);
    }
  }
  if (z == null) return null;
  return text.replace(t, z);
}

function translateNode(n) {
  if (n.nodeType === 3) {
    const cur = n.nodeValue;
    const orig = originals.get(n);
    if (orig && cur === orig._zh) return;                  // already translated
    const z = tr(cur);
    if (z != null && z !== cur) { originals.set(n, { en: cur, _zh: z }); n.nodeValue = z; }
    return;
  }
  if (n.nodeType !== 1) return;
  const tag = n.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CANVAS' || tag === 'svg' || tag === 'SVG') return;
  // strings written via innerHTML with <b> markup: the text is split across nodes, so match the
  // whole innerHTML against the dictionary and swap it wholesale (translations keep the <b>).
  if (n.querySelector && n.querySelector('b')) {
    const hml = n.innerHTML;
    const z = ZH[hml];
    if (z != null && z !== hml) { htmlOriginals.set(n, hml); n.innerHTML = z; return; }
  }
  // per-character reveal names (data-i18n-html = the English source): the spans hide the string from the
  // per-node pass, so swap the whole node for the translation (the original is recorded for the EN restore)
  const src = n.getAttribute?.('data-i18n-html');
  if (src != null) {
    const z = tr(src);
    if (z != null && z !== src && n.innerHTML !== z) {
      if (!htmlOriginals.has(n)) htmlOriginals.set(n, n.innerHTML);
      n.innerHTML = z;
    }
    return;
  }
  for (const a of ['placeholder', 'title', 'aria-label']) {
    const v = n.getAttribute?.(a);
    if (v) { const z = tr(v); if (z != null) { n.dataset['en' + a.replace('-', '')] = v; n.setAttribute(a, z); } }
  }
  for (const c of n.childNodes) translateNode(c);
}

function restoreNode(n) {
  if (n.nodeType === 3) { const o = originals.get(n); if (o && n.nodeValue === o._zh) n.nodeValue = o.en; return; }
  if (n.nodeType !== 1) return;
  const ho = htmlOriginals.get(n);
  if (ho != null) { htmlOriginals.delete(n); n.innerHTML = ho; return; }
  for (const a of ['placeholder', 'title', 'aria-label']) { const k = 'en' + a.replace('-', ''); if (n.dataset?.[k]) n.setAttribute(a, n.dataset[k]); }
  for (const c of n.childNodes) restoreNode(c);
}

const htmlOriginals = new WeakMap();   // element → original innerHTML (for strings written with <b> markup)

let observer = null;
export function installI18n() {
  const style = document.createElement('style');
  // The Latin fonts have no CJK glyphs: fall back to system Chinese fonts (bold is closer to the original cartoon style)
  const cjk = "unicode-range: U+2E80-2FFF, U+3000-30FF, U+3400-9FFF, U+F900-FAFF, U+FF00-FFEF;";
  style.textContent = `
    @font-face { font-family: 'Titan One'; src: local('PingFang SC Semibold'), local('PingFangSC-Semibold'), local('Microsoft YaHei Bold'), local('Microsoft YaHei'), local('Noto Sans CJK SC Bold'), local('Source Han Sans SC Bold'); font-weight: 400; ${cjk} }
    @font-face { font-family: 'Rubik'; src: local('PingFang SC'), local('PingFangSC-Regular'), local('Microsoft YaHei'), local('Noto Sans CJK SC'), local('Source Han Sans SC'); font-weight: 300 600; ${cjk} }
    @font-face { font-family: 'Rubik'; src: local('PingFang SC Semibold'), local('PingFangSC-Semibold'), local('Microsoft YaHei Bold'), local('Noto Sans CJK SC Bold'); font-weight: 700 900; ${cjk} }
    .iw-lang { position: fixed; right: 14px; top: 50%; transform: translateY(-50%); z-index: 45; font: 700 13px 'Rubik', 'PingFang SC', sans-serif; color: #fff; background: rgba(20, 16, 50, 0.7);
      border: 2px solid rgba(255,255,255,0.25); border-radius: 10px; padding: 5px 10px; cursor: pointer; pointer-events: auto; }
    body.iw-match-on .iw-lang { display: none; }`;
  document.head.appendChild(style);
  const btn = document.createElement('button');
  btn.className = 'iw-lang';
  const label = () => { btn.textContent = lang === 'zh' ? 'EN' : '中文'; btn.title = lang === 'zh' ? 'Switch to English' : '切换到中文'; };
  label();
  btn.onclick = () => { setLang(lang === 'zh' ? 'en' : 'zh'); label(); };
  document.body.appendChild(btn);
  if (lang === 'zh') start();
}

function start() {
  document.documentElement.lang = 'zh-CN';
  document.title = 'INKWAVE · 墨浪对战';
  translateNode(document.body);
  observer = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') translateNode(m.target);
      else {
        for (const n of m.addedNodes) translateNode(n);
        if (m.target && m.target.nodeType === 1) translateNode(m.target);   // re-check innerHTML when children change
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

export function setLang(l) {
  lang = l;
  try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ }
  if (l === 'zh') { if (!observer) start(); }
  else { observer?.disconnect(); observer = null; document.documentElement.lang = 'en'; document.title = 'INKWAVE · Turf War'; restoreNode(document.body); }
}
export const getLang = () => lang;
