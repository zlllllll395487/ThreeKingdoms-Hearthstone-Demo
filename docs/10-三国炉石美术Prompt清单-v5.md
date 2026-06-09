# 三国炉石 v5 · 全美术资源 Prompt 清单（v5.4 卡牌重构版）

> **版本**：v5.3 用户落地版（取代 v5.0 / v5.1 / v5.2）· **日期**：2026-06-05
> **配套策划**：`09-三国炉石策划终稿-v5.md`
> **总资源数**：70 张 PNG · **总 prompt 数**：41 个（其余 29 张用户已提供，详见各章节）
> **生图工具建议**：Midjourney v6 / Niji v6

---

## 全局风格锚点（强制遵守，与项目已通过验收的 18 张老立绘 + 主菜单 + Splash 视觉锚点对齐）

```
HoYoverse anime cel-shading（即偏原神二次元）
高反差赛璐璐平涂 (Cel-Shading)、粗黑硬切边、无 3D 材质反射、死黑阴影
画幅比例：竖向 3:4（立绘）/ 横向 16:9（横屏背景）/ 1:1（圆形头像）等
ANATOMY 硬约束：手画清 5 指 / 武器杆直 / 全身可见 / 自然比例
```

**严格禁止**：
- ❌ semi-realistic CG illustration（v5.0/v5.1 的错误方向，已纠正）
- ❌ Dynasty Warriors 9 / DW9（同上）
- ❌ painterly texture / painterly / grain / noise / 碎渣感 / 噪点
- ❌ photorealistic / photoreal / hyperrealistic
- ❌ 工笔国画 / ink painting / ink-and-color painting / 水墨
- ❌ Q 版 / chibi / kawaii / moe（不是这个方向，是偏写实的动漫风）
- ❌ 任何文字（中文 / 英文 / 数字）出现在图像中
- ❌ 现代元素

**MJ 引擎分工**（不要混用）：
- **立绘 / 法术场景 / 兵器 / 复杂背景**：`--style raw --v 6`（写实倾向的二次元）
- **UI 按钮 / 装饰框 / 小 icon / sprite 纯图形**：`--niji 6`（更干净的二次元 UI）

**输出规格统一**：
- 立绘 portrait：PNG，72 DPI，sRGB
- 透明背景资源：PNG-32（带 alpha）
- 实色背景资源：PNG-24

---

## ⭐ 优先级 P0 · 战斗背景（风格基调，单独成章）

### #1 · 竖屏战斗背景 · `battle_background_v3_vertical.png`

- **文件名**：`battle_background_v3_vertical.png`
- **像素尺寸**：**2160×3840（4K 竖屏，9:16）**
- **DPI**：72
- **背景类型**：实色 PNG-24
- **预期文件大小**：5-8 MB
- **用途**：竖屏 BattleScreen 整屏背景（1080×1920 显示，4K 资源保证清晰）
- **放置路径**：`game/src/assets/ui/`

**设计依据**：
- 项目原 `battle_background_v3.png`（1923×1082）是横屏战斗背景，v5 改竖屏需新出
- 三层结构：顶部装饰带（敌方区视觉底）/ 中央亮战场（卡牌/随从摆放）/ 底部装饰带（玩家区视觉底）
- 中央铜带分界，给上下分区一个明确的视觉分隔

**Prompt**：
```
2160x3840 vertical scene background 9:16, Three Kingdoms era top-down
card battle table. HoYoverse anime cel-shading style, hard chiaroscuro,
flat color regions, thick black ink outlines, heavy solid black shadows,
crisp geometric edges, NO painterly texture, NO grain, NO 3D rendering.

Subject: ancient Chinese war-room table viewed top-down, divided into
three horizontal zones — upper dark zone for enemy hero, central bright
empty playing field for cards, lower dark zone for player hero.

Composition: TOP 25% — dark walnut wooden chamber wall with hanging
crimson silk banners, two lit bronze lanterns flanking center, ink-
stones and folded battle maps on side surfaces.
CENTRAL 50% — aged warm cream-tan parchment war-table surface
(#d4b88a base) with subtle cloud-pattern damask undertones, MOSTLY
EMPTY for code-rendered cards and minions, slight worn marks suggesting
heavy use, BRIGHTER and WARMER than top/bottom zones.
BOTTOM 25% — mirrored decoration for player side, weapon rack with
halberds, bamboo book stack, brass incense burner with faint smoke,
scrolls, dark walnut tones matching top.
CENTER SEAM — strong burnished bronze inlay band crossing the middle
of the central zone, carved cloud-and-thunder pattern, small dragon-
head bosses every ~600px, dividing top (enemy) and bottom (player)
zones, glowing warmly from above-center lantern light.

Background: war-room atmosphere, subtle damask pattern on parchment
field, no busy details in central zone.

Lighting: soft warm tungsten lantern light pouring down from above-
center onto the central parchment field, creating a gentle light-pool
effect, vignette darkening corners ~30%. The contrast between bright
center and dark perimeter is the KEY visual feature.

STRICT REQUIREMENTS:
- Central field MUST be brighter and warmer than perimeter
- Bronze seam MUST be visible and strong (key composition element)
- NO baked-in minion slots or circles in the field
- NO text anywhere, NO Chinese characters, NO English
- NO crossed swords or center decorative motif (center must be CLEAN
  for gameplay overlays)
- NO floating UI elements
- NO painterly texture, NO grain

--ar 9:16 --style raw --v 6
```

**质量检查**：
- [ ] 中央亮色羊皮纸区与上下暗色装饰区对比明显
- [ ] 中央铜带清晰可见且贯穿全宽
- [ ] 无文字 / 无烤入式 minion 槽位 / 无中央装饰
- [ ] 上下装饰区元素丰富但不抢戏
- [ ] 风格 = HoYoverse 二次元 cel-shading，无任何碎渣感

---

## 一、命名武将立绘（12 张）

> 所有命名武将立绘：**1086×1448 PNG**，DPI 72，sRGB，实色背景（带氛围）
> 风格：HoYoverse anime cel-shading，hard chiaroscuro，平面色块，干净线稿
> Midjourney 参数：`--ar 3:4 --style raw --v 6`
> 预期文件大小：1.5-2.5 MB
> 放置路径：`game/src/assets/portraits/`

---

### #2 · 赵云 · `zhaoyun.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：传说 · **对应卡 ID**：S20
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/zhaoyun.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #3 · 马超 · `machao.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：传说 · **对应卡 ID**：S17
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/machao.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #4 · 严颜 · `yanyan.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：稀有 · **对应卡 ID**：S11
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/yanyan.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #5 · 黄月英 · `huangyueying.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：S12
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/huangyueying.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #6 · 周瑜 · `zhouyu.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：传说 · **对应卡 ID**：W01
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/zhouyu.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #7 · 鲁肃 · `lusu.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：W02
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/lusu.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #8 · 大乔 · `daqiao.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：W03
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/daqiao.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #9 · 孙策 · `sunce.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：稀有 · **对应卡 ID**：W04
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/sunce.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #10 · 甘宁 · `ganning.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：稀有 · **对应卡 ID**：W05
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/ganning.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #11 · 吕蒙 · `lvmeng.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：W06
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/lvmeng.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #12 · 周泰 · `zhoutai.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：W07
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/zhoutai.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

### #13 · 程普 · `chengpu.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：稀有 · **对应卡 ID**：W25
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/chengpu.png`
- 风格已通过用户验收（HoYoverse anime cel-shading，与项目锚点一致）


---

## 二、兵种共用立绘（6 张）

> 所有兵种共用立绘：**1086×1448 PNG**，DPI 72，实色背景
> 风格：HoYoverse anime cel-shading（与命名武将同基调，但表情/姿态更"路人兵"，无个人英雄主义）
> 预期文件大小：1.5-2.5 MB
> 放置路径：`game/src/assets/portraits/`

**设计依据**：
- 避免给 v5 策划的大量 generic 兵种（弓兵/骑兵/卫兵/老兵）每张独立立绘
- 项目比例：「蜀国步兵」用 `soldierofshu.png` 作为通用步兵立绘已多张共用
- 按兵种分类：每个兵种 1 张立绘 + 多张同兵种卡共用

### #14 · 蜀汉弓兵 · `shu_archer.png`

- **像素**：1086×1448 · **背景**：实色 · **共用卡**：S02 · **稀有度**：普通
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/shu_archer.png`
- 兵种共用立绘（一张图被多张同兵种卡复用）


---

### #15 · 蜀汉骑兵 · `shu_cavalry.png`

- **像素**：1086×1448 · **背景**：实色 · **共用卡**：S05/S08 · **稀有度**：普通
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/shu_cavalry.png`
- 兵种共用立绘（一张图被多张同兵种卡复用）


---

### #16 · 蜀汉守卫 · `shu_guard.png`

- **像素**：1086×1448 · **背景**：实色 · **共用卡**：S04/S06 + 守卫 token · **稀有度**：普通
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/shu_guard.png`
- 兵种共用立绘（一张图被多张同兵种卡复用）


---

### #17 · 蜀汉老兵 · `shu_veteran.png`

- **像素**：1086×1448 · **背景**：实色 · **共用卡**：S07/S09/S13/S14 · **稀有度**：普通混稀有
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/shu_veteran.png`
- 兵种共用立绘（一张图被多张同兵种卡复用）


---

### #18 · 吴国水军 · `wu_marine.png`

- **像素**：1086×1448 · **背景**：实色 · **共用卡**：W08 · **稀有度**：普通
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/wu_marine.png`
- 兵种共用立绘（一张图被多张同兵种卡复用）


---

### #19 · 吴国弓兵 · `wu_archer.png`

- **像素**：1086×1448 · **背景**：实色 · **共用卡**：弓兵 token · **稀有度**：普通
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/wu_archer.png`
- 兵种共用立绘（一张图被多张同兵种卡复用）


---

## 三、Token 独立立绘（3 张）

> Token 独立立绘：**1086×1448 PNG**，DPI 72，实色背景
> 义兵 token 复用 `soldierofshu.png` / 蜀汉新兵+蜀汉守卫 token 复用 `shu_guard.png` / 民兵 token 复用 `soldierofshu.png`
> v5.3 删除：TK_QINGLONG 青龙偃月刀 token（关羽 S18 去武器附赠后失去召唤源）
> 仅 3 张独立 token 需新出
> 预期文件大小：1.2-2 MB
> 放置路径：`game/src/assets/portraits/`

### #20 · 机关木甲 token · `token_jiguan_mujia.png` ⭐ v5.3 改名（原 医匠）

- **像素**：1086×1448 · **背景**：实色 · **来源**：黄月英 S12 受击触发
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/token_yijiang.png`（沿用原文件名，避免动美术资源）
- v5.3 叙事重构：蜀作为快攻阵营，被打后召唤「医生」违和；改为「机关木甲」更契合阵营调性
- Token 不入牌组无稀有度


---

### #21 · 巫祝 token · `token_wuzhu.png`

- **像素**：1086×1448 · **背景**：实色 · **来源**：校尉亡语召唤
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/token_wuzhu.png`
- Token 不入牌组无稀有度


---

### #22 · 绵羊 token · `token_mianyang.png`

- **像素**：1086×1448 · **背景**：实色
- **用途**：吕蒙战吼变形产生的绵羊 token（HS polymorph 致敬）

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, flat color regions,
thick black ink outlines, NO painterly texture, NO grain.

Subject: cute fluffy white anime sheep standing in green meadow,
slightly humorous confused expression with big round eyes, soft round
shape, faint hint of fading purple transformation magic still swirling
around it as wisps in air (HS polymorph reference but in HoYoverse
anime style).

Composition: sheep body centered in frame, ground line visible at
lower third.

Background: peaceful meadow with flat-color silhouettes of scattered
wildflowers and grass, pastel green.

Lighting: soft daylight from upper-left, cel-shaded gentle highlight
on white wool, soft cool shadow under sheep.

--ar 3:4 --style raw --v 6
```

---

## 四、法术立绘（18 张，v5.3 重构：+1 缓兵之计 / -1 火攻连环 / 净持平）

> 所有法术立绘：**1086×1448 PNG**，DPI 72，实色背景
> 风格：HoYoverse anime cel-shading 场景渲染（参照项目老法术立绘：桃园结义/仁德之政/万箭齐发/募兵令/休养生息已建立的风格）
> 预期文件大小：1.5-2.5 MB
> 放置路径：`game/src/assets/portraits/`


### #5a · W11 行舟借势（吴抽牌·鲁肃锚点）⭐ v5.3 改名（原 江风长歌）· v5.3.1 联动 +1 费返还 · `xingzhoujieshi.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：W11
- **机制**：基础抽 1 张牌；鲁肃在场（`anchor_draw`）+ 抽 1 张（共 2 张）+ **当回合归还 1 费**（v5.3.1 新增）
- **设计意图**：补抽牌系低费手感 + 锚点 setup 后回合内 tempo swing（解场+站场+补牌）
- 🟡 **prompt 待用户写**（按 docs/10 风格 checklist + 共享头模板）

---


### #5b · W12 周郎顾曲（吴控场·周瑜锚点）⭐ v5.3 改名+降费 · v5.3.1 联动剥离抽牌 · v5.4 改临时软控 · `zhoulangguqu.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：W12
- **机制**：**2 费**；基础冻结 1 个敌方武将 1 回合；周瑜在场（`anchor_fire`）+ 该武将 **-1 攻击（本回合）**（v5.4 永久 → 临时，永久减攻在低费卡 UX 恶心）
- **设计意图**：临时软控 — 配合冻结造成 1 回合节奏切割，敌方下回合解冻时恢复原 stat
- 🟡 **prompt 待用户写**（按 docs/10 风格 checklist + 共享头模板）

---

### #5c · W16 固守待援（吴治疗/防御·大乔锚点）⭐ v5.3 改名+削数（原 春风化雨 3 费回 8 / 联动 12） · `gushoudaiyuan.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：W16
- **机制**：3 费恢复主公 **6 HP**（v5.3 由 8 → 6）；大乔在场（`anchor_heal`）+ **3 HP（共 9）** + 全友方武将 +0/+1
- **设计意图**：吴控制阵营治疗量需严控（3 费回 9 + 群增益），新名「固守待援」更贴合战场肃杀调性
- 🟡 **prompt 待用户写**（按 docs/10 风格 checklist + 共享头模板）

---

### #5d · W26 缓兵之计（吴软控场·无锚点）⭐ v5.3 新增（接替 W10 火攻连环槽位） · `huanbingzhiji.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：稀有 · **对应卡 ID**：W26
- **机制**：**2 费**；使一个敌方武将本回合无法攻击，且其相邻武将下回合无法攻击
- **设计意图**：补吴极度缺乏的软性拖延手段，强化「位置 / 阵型」概念（引擎需新增 board adjacency 字段），比单纯打伤害更具策略深度
- 🟡 **prompt 待用户写**（按 docs/10 风格 checklist + 共享头模板）

---

### #23 · 武勇（蜀法术） · `wuyong.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：S21

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, anime face proportions,
clean line work, flat color regions, thick black ink outlines, NO
painterly texture, NO grain.
ANATOMY: hands clearly drawn with all 5 fingers each, sword shaft
dead straight, full body resolved.

Subject: Three Kingdoms era Shu warrior in mid-charge surrounded by
glowing golden battle aura (rush keyword visual metaphor), fierce
determined anime expression, sword raised high.

Composition: full body dynamic action pose forward, motion lines
suggesting added speed, head in upper third of frame.

Background: battlefield with flat-color crimson Shu battle flag
flapping behind, dust kicked up at feet, simple distant fighting
silhouettes.

Lighting: cinematic upper-left golden light casting hard cel-shaded
highlight, golden ki-aura emanating from warrior as bright flat color
region, energy sparks as bright dots in air.

--ar 3:4 --style raw --v 6
```

---

### #24 · 五虎合击（蜀法术） · `wuhuheji.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：传说 · **对应卡 ID**：S22

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, anime face proportions,
clean line work, flat color regions, thick black ink outlines, NO
painterly texture, NO grain.
ANATOMY: hands clearly drawn with all 5 fingers each, weapons dead
straight, all five heroes resolved.

Subject: five Shu Han tiger generals (Guan Yu / Zhang Fei / Zhao Yun /
Ma Chao / Huang Zhong) attacking together in dramatic V-shaped fan
formation, each raising their iconic weapon in unison, swirling golden
tiger-spirit energy forming an ethereal roaring tiger head as bright
flat color region above them.

Composition: V-formation centered, heroes silhouetted in foreground,
head positions in upper third of frame.

Background: epic battlefield with crimson sunset sky in flat gradient
bands, dust kicked up by their charge.

Lighting: brilliant cinematic golden light from upper-left casting
hard cel-shaded highlight on all five, tiger energy as bright flat
gold region.

--ar 3:4 --style raw --v 6
```

---

### #25 · 火烧赤壁（吴法术） · `huoshaochibi.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：传说 · **对应卡 ID**：W09

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, flat color regions,
thick black ink outlines, NO painterly texture, NO grain.

Subject: epic cinematic view of the Burning of Red Cliff, massive Wei
war junks engulfed in raging orange-red anime flames spreading across
the Yangtze river, billowing black smoke rising.

Composition: wide sweeping view with ships taking up middle band,
fire reflections on water below, sky above filled with smoke.

Background: silhouettes of burning ships listing and breaking apart in
flat color regions, drifting bright dots of embers, crimson sunset sky
in flat gradient bands.

Lighting: brilliant golden fire-glow as primary light source lighting
everything below with hard cel-shaded warm highlights, dark cool sky
above.

--ar 3:4 --style raw --v 6
```

---

### ⛔ #26 · ~~火攻连环~~ W10（v5.3 已删除）

- v5.3 删除：W10 火攻连环 与 W09 火烧赤壁 定位严重重叠（均为火系 AoE），导致吴缺乏操作维度
- 槽位由 W26 缓兵之计（2 费稀有软控场）接替（见 #5d）
- 旧文件 `huogonglianhuan.png` 弃用

---

### #27 · 火计连发（吴法术） · `huojilianfa.png`

### ⛔ #27 · ~~火计连发~~（v5.2 已删除）

- v5.2 删除：与 W19 赤焰焚营 单体伤害功能重叠
- 此章保留空壳作为变更追溯，**无需出图**


---

### #28 · 火矢（吴法术） · `huoshi.png`

### ⛔ #28 · ~~火矢~~（v5.2 已删除，原 v5 doc/09 实为 W12 万箭齐发，复用 wanjian.png）

- v5.2 删除：W12 万箭齐发 违反「强力 AoE 必须有限制」原则（2 费无任何代价）
- v5.1 误写为「火矢」也是错的；原 W12 立绘 wanjian.png 已废弃不用
- 此章保留空壳作为变更追溯，**无需出图**


---

### #29 · 火油（吴谋略·火 setup） · `huoyou.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：稀有 · **对应卡 ID**：W18

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, flat color regions,
thick black ink outlines, NO painterly texture, NO grain.

Subject: large ceramic jar of glowing amber oil being poured onto
ground from above, flammable golden-yellow liquid splashing in flat
color regions on dry earth, oil trails snaking on ground prepared for
ignition (ominous pre-ignition moment).

Composition: oil jar held at upper portion of frame, splash and spread
fills lower half, ground line at mid-frame.

Background: war camp ground with flat-color shadow silhouettes
retreating, dim moody ambient.

Lighting: dim moonlight ambient with subtle warm under-glow from oil
itself, hard cel-shaded edges on jar and splash.

--ar 3:4 --style raw --v 6
```

---

### #30 · 赤焰焚营（吴 combo 后置 · 与火油联动） · `chiyanfenying.png` ⭐ v5.2 改名

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：W19

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, flat color regions,
thick black ink outlines, NO painterly texture, NO grain.

Subject: massive eruption of fire from ignited pool, swirling orange-
red anime flames forming a fierce phoenix-shape rising majestically
from blaze, smoke and embers spiraling upward.

Composition: phoenix-fire as centerpiece rising from lower mid-frame
to upper third, retreating enemy silhouettes in lower foreground as
flat dark shapes.

Background: dark battlefield backdrop, brilliant flat orange flames
dominate.

Lighting: fire glow as primary light source casting hard cel-shaded
warm orange highlights everywhere, dark ash regions at edges.

--ar 3:4 --style raw --v 6
```

---

### #31 · 草船借箭（吴谋略） · `caochuanjiejian.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：稀有 · **对应卡 ID**：W13

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, anime face proportions,
clean line work, flat color regions, NO painterly texture, NO grain.
ANATOMY: figure on boat has 5 fingers visible holding fan, full body
resolved.

Subject: classic historical scene — Zhuge Liang's straw boat
stratagem, small Wu boat completely covered in tied straw bundles
bristling with hundreds of enemy arrows stuck in straw armor, Zhuge
Liang figure standing calmly on boat with feather fan.

Composition: boat as centerpiece of foggy river, head of figure in
upper third of frame, hundreds of arrows as small straight black
shapes embedded in straw.

Background: foggy morning Yangtze river in soft pale grey flat
gradient, gentle water reflections as flat regions.

Lighting: soft diffused dawn from upper-left with cel-shaded gentle
highlight on boat, no harsh shadows (peaceful misty mood).

--ar 3:4 --style raw --v 6
```

---

### #32 · 苦肉计（吴谋略） · `kurouji.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：W14

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, anime face proportions,
clean line work, flat color regions, NO painterly texture, NO grain.
ANATOMY: kneeling figure full body resolved with 5 fingers on visible
hands, cane shaft straight.

Subject: Wu general voluntarily kneeling on stone courtyard for
ceremonial flogging with bamboo cane (黄盖 self-sacrifice stratagem),
bare back showing fresh red welts as flat color regions, determined
willing anime expression on face turned slightly downward.

Composition: kneeling figure as central focus, cane held by another
figure visible at side, Wu officer silhouettes watching from
sidelines as flat dark shapes.

Background: Wu camp courtyard at dusk, somber heroic atmosphere, muted
earth tones.

Lighting: cinematic golden-hour from upper-left with hard cel-shaded
warm highlight on bare back and face, deep cool twilight shadow on
right.

--ar 3:4 --style raw --v 6
```

---

### #33 · 运筹帷幄（吴谋略·抽牌系） · `yunchouweiwo.png` ⭐ v5.2 改名

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：W15

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, flat color regions,
thick black ink outlines, NO painterly texture, NO grain.
ANATOMY: hand reaching down has 5 fingers visible, weiqi stones
geometric.

Subject: scholarly hand placing weiqi (围棋) stones on wooden game
board in candlelit night study, swirling ink-painting motifs of
military formations rising from the board into the air like ghostly
tactics manifesting (rendered in clean cel-shaded outlined style,
NOT painterly ink).

Composition: hand and board as centerpiece, formations rising upward
in flat color shapes.

Background: war-map scroll partially unrolled in background as flat
silhouette, ink stones and brushes on desk, deep amber and shadow
tones.

Lighting: moody candlelight from upper-right casting hard cel-shaded
warm amber highlight on hand and board, deep cool shadow on left.

--ar 3:4 --style raw --v 6
```

---

### ⛔ #34 · ~~春风化雨~~ W16（v5.3 改名+削数为「固守待援」，见 #5c）

- v5.3 改名：春风化雨 → **固守待援**（详见 #5c 条目）
- 旧文件 `chunfenghuayu.png` 弃用，新文件 `gushoudaiyuan.png`
- 旧 prompt 块的「青梅」意象已不适用新名「固守待援」（应改为城防/坚壁待援场景，用户自写新 prompt）

---

### #35 · 借东风（吴防御/谋略） · `jiedongfeng.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：W17

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, anime face proportions,
clean line work, flat color regions, NO painterly texture, NO grain.
ANATOMY: figure on altar full body resolved with arms raised, 5
fingers visible.

Subject: Zhuge Liang dramatic silhouette standing on tall stone altar
at night with both arms raised in ritual incantation, swirling
glowing wind energy spiraling around him in bright golden-blue
ribbons of ki (rendered as flat color flowing shapes, NOT painterly).

Composition: figure centered on altar at lower mid-frame, energy
ribbons spiraling upward and outward, head in upper third of frame.

Background: stars visible above as bright dots, mystical Eight Trigrams
symbol faintly visible beneath feet on altar floor, cliff-top altar
surrounded by bamboo banner silhouettes whipping in conjured wind.

Lighting: mystical golden-blue glow from ki energy as primary light
source with hard cel-shaded edge highlights, dark night ambient.

--ar 3:4 --style raw --v 6
```

---

### #36 · 反间计（吴控场） · `fanjianji.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：稀有 · **对应卡 ID**：W20

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, anime face proportions,
clean line work, flat color regions, NO painterly texture, NO grain.
ANATOMY: two figures full body resolved, hands exchanging letter
visible with 5 fingers each.

Subject: shadowy figure of enemy soldier silhouette receiving a folded
secret letter from cloaked hooded Wu agent in dim alley between
buildings, two-faced mask symbol subtly carved on alley wall in
background.

Composition: two figures centered facing each other, letter exchange
at frame center, alley walls framing sides.

Background: deep shadow alley with single dim flat-color oil lamp
glow visible, amber candle palette.

Lighting: single oil lamp candlelight as primary source with hard cel-
shaded warm highlight on faces and letter, deep cool shadow on rest.

--ar 3:4 --style raw --v 6
```

---

### #37 · 美人计（吴控场） · `meirenji.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：W21

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, anime face proportions,
clean line work, flat color regions, NO painterly texture, NO grain.
ANATOMY: two figures full body resolved with 5 fingers visible on
hands holding cup and table edge.

Subject: elegant Wu beauty in flowing pale-cyan silk Hanfu robe
presenting wine cup forward to bewitched general sitting opposite at
low Chinese table, seduction-and-strategy charged moment.

Composition: two figures facing each other across table at center,
wine cup as visual focus between them, head positions in upper third
of frame.

Background: chamber with flat-color golden embroidered curtain
silhouettes and silk cushion silhouettes, intimate setting.

Lighting: warm candlelight from upper-right casting hard cel-shaded
golden highlight on both faces and cup, deep cool shadow behind.

--ar 3:4 --style raw --v 6
```

---

### #38 · 二乔（吴通用谋略） · `erqiao.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：W22

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, anime face proportions,
clean line work, flat color regions, NO painterly texture, NO grain.
ANATOMY: both figures full body resolved with 5 fingers visible
holding fans.

Subject: two legendary Wu beauties standing together gracefully (Da
Qiao elder sister in pale cyan, Xiao Qiao younger sister in pink
robes), both refined anime young women holding folding fans, gentle
sisterly bond with serene expressions.

Composition: two figures standing side by side centered, slight
shoulder overlap, heads in upper third of frame.

Background: lakeside pavilion at dawn with flat-color silhouettes of
willow trees and lotus blooms on water, soft pink and cyan palette.

Lighting: gentle dawn light from upper-left casting hard cel-shaded
warm highlight on both faces and silk robes, soft cool shadow on
right.

--ar 3:4 --style raw --v 6
```

---

### #39 · 连环计（吴控场） · `lianhuanji.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：史诗 · **对应卡 ID**：W23

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, flat color regions,
thick black ink outlines, NO painterly texture, NO grain.

Subject: war junks ominously chained together with massive thick iron
chains spanning between hulls (the trap setup BEFORE Red Cliff
burning), frozen pre-battle moment of calm before storm, NO fire yet
just the looming chains and silent ships.

Composition: ships arranged across mid-frame, chains as hard black
crossing lines visible spanning hulls, dark moody composition.

Background: dark twilight sky over Yangtze, faint flat-color torchlight
on each ship deck, sense of impending doom.

Lighting: low cinematic twilight from above-left with cel-shaded
highlights on iron chains and ship hulls, dark cool ambient.

--ar 3:4 --style raw --v 6
```

---

### #40 · 金疮药（中立法术） · `jinchuangyao.png` ⭐ v5.2 改名 · v5.3 削数（3 费回 8 → 2 费回 5）

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：N07
- v5.3 削数：3 费回 8 HP 溢出过高（中立卡治疗效率应低于阵营专属卡），降至 2 费回 5 HP 作前期润滑剂

**Prompt**：
```
1086x1448 illustration 3:4. Match project anime style EXACTLY —
HoYoverse anime cel-shading, hard chiaroscuro, flat color regions,
thick black ink outlines, NO painterly texture, NO grain.
ANATOMY: hands clearly drawn with all 5 fingers each grinding herbs
in mortar.

Subject: ancient Chinese medicine herbalist's hands grinding herbs in
stone mortar, glowing golden-green healing light emanating from herb
mixture as bright flat color region, soft golden particle dots rising.

Composition: mortar and hands as centerpiece of frame, herbalist arms
extending from upper edges.

Background: traditional pharmacy interior with flat-color silhouettes
of bamboo medicine drawers and hanging dried herbs, peaceful warm
ambience.

Lighting: golden-green healing glow from mortar as primary light
source with hard cel-shaded highlights on hands, soft amber ambient.

--ar 3:4 --style raw --v 6
```

---

## 五、兵器立绘（4 张）

> 兵器立绘：**1086×1448 PNG**，DPI 72，实色背景
> 风格：HoYoverse anime cel-shading 静物渲染（参照项目老兵器立绘 `qinglongdao.png` 已建立的风格）
> 预期文件大小：1-1.8 MB
> 放置路径：`game/src/assets/portraits/`

### #41 · 雌雄双股剑（蜀兵器） · `cixiongshuanggujian.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：稀有 · **对应卡 ID**：S23
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/cixiongshuanggujian.png`
- 兵器立绘（垂直构图，适配装备椭圆 frame 裁切）


---

### #42 · 蛇矛（蜀兵器） · `shemao.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：S24
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/shemao.png`
- 兵器立绘（垂直构图，适配装备椭圆 frame 裁切）


---

### #43 · 百锐刀（蜀兵器） · `bairuidao.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：S25
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/bairuidao.png`
- 兵器立绘（垂直构图，适配装备椭圆 frame 裁切）


---

### #44 · 古锭刀（吴兵器） · `gudingdao.png`

- **像素**：1086×1448 · **背景**：实色 · **稀有度**：普通 · **对应卡 ID**：W24
- ✅ **用户已提供** · 文件：`game/src/assets/portraits/gudingdao.png`
- 兵器立绘（垂直构图，适配装备椭圆 frame 裁切）


---

## 六、主公头像（2 张）

> 主公头像：**500×500 PNG**，DPI 72，透明背景（带 alpha 圆形裁切）
> 风格：HoYoverse anime cel-shading 头像版（圆形构图：胸 + 肩部居中）
> 预期文件大小：300-500 KB
> 放置路径：`game/src/assets/ui/`

**设计依据**：
- 项目现有 `hero_player.png` `hero_ai.png` 是 500×500 圆形头像（独立美术，不是立绘截胸）
- 新增刘备 / 孙权同样规格

### #45 · 刘备主公头像 · `hero_shu_liubei.png`

- **像素**：500×500 · **背景**：透明（圆形 alpha） · **用途**：玩家选蜀时显示
- **用途**：玩家选蜀时显示的玩家主公头像

**Prompt**：
```
500x500 character avatar 1:1, transparent rounded background. Match
project anime style EXACTLY — HoYoverse anime cel-shading, hard
chiaroscuro, anime face proportions, clean line work, flat color
regions, thick black ink outlines, NO painterly texture, NO grain.

Character: Liu Bei (刘备) Three Kingdoms benevolent Shu Han emperor in
his mid-forties, head and shoulders only visible centered in circle,
imperial yellow embroidered silk robe collar with gold dragon motif
barely visible at shoulder, long flowing beard touched with grey,
large compassionate anime eyes with subtle melancholy, warm regal
smile, jade crown ornament on head.

Composition: head and shoulders centered in 1:1 frame, circular framing
with face occupying upper 65%, shoulders crossing bottom 35%.

Background: solid warm amber-gold tone fading to fully transparent at
circle edge.

Lighting: soft warm light from upper-left casting hard cel-shaded
gentle highlight on face and crown, soft cool shadow on right.

--ar 1:1 --style raw --v 6
```

**质量检查**：
- [ ] 脸部正面或 3/4 角度居中
- [ ] 肩膀刚好截，不溢出圆形
- [ ] 背景透明（alpha 圆形裁切）
- [ ] 与现有 `hero_player.png` 风格一致

---

### #46 · 孙权主公头像 · `hero_wu_sunquan.png`

- **像素**：500×500 · **背景**：透明（圆形 alpha）· **用途**：玩家选吴时显示
- ✅ **用户已提供** · 文件：`game/src/assets/ui/hero_wu_sunquan.png`


---

## 七、阵营选择 Screen（4 张）

> 阵营选择 Screen 是**横屏 Screen**（沿用其他主菜单类界面横屏），不是竖屏
> 放置路径：`game/src/assets/ui/`

### #47 · 阵营选择背景 · `faction_select_bg.png`

- **像素尺寸**：1920×1080 · **背景**：实色 PNG-24
- **DPI**：72 · **预期文件大小**：2-3.5 MB
- **用途**：阵营选择 Screen 全屏背景

**Prompt**：
```
1920x1080 background scene 16:9, Three Kingdoms era war-council chamber.
HoYoverse anime cel-shading, hard chiaroscuro, flat color regions,
thick black ink outlines, NO painterly texture, NO grain, NO 3D
rendering.

Subject: ancient Chinese war-council chamber interior with massive
bronze sand-table battle map in foreground center, two large vertical
war banners on side walls (left banner shows 蜀 character motif subtly,
right banner shows 吴 character motif subtly, both decorative not as
text), calligraphic scrolls on walls in background, oil lamps casting
warm glow.

Composition: leaves clear central area at lower 60% for code overlay
UI (two faction cards + button will be rendered on top), focal
elements on perimeter, sand-table in lower foreground.

Background: dark walnut chamber, calligraphic scroll silhouettes,
incense smoke wisps rising in flat color regions.

Lighting: warm golden lamp glow from upper-center casting hard cel-
shaded amber highlights, deep cool shadow at corners, atmospheric
moody dark walnut and warm gold palette.

STRICT: NO text, NO Chinese characters as readable text on banners
(decorative only), central lower 60% area must be relatively clean
for UI overlay.

--ar 16:9 --style raw --v 6
```

---

### #48 · 蜀阵营宣传卡 · `faction_card_shu.png`

- **像素**：380×540 · **背景**：实色卡面
- **DPI**：72 · **预期文件大小**：400-700 KB

**Prompt**：
```
380x540 vertical faction selection card 19:27 (7:10 close). Match
project anime style EXACTLY — HoYoverse anime cel-shading, hard
chiaroscuro, anime face proportions, clean line work, flat color
regions, thick black ink outlines, NO painterly texture, NO grain.
ANATOMY: figure has 5 fingers visible, weapon shaft dead straight.

Subject: faction selection splash card for "Shu (蜀)", featuring Guan
Yu (关羽) in heroic mid-battle posture holding green-dragon crescent
blade with red robes and long beard flowing in wind, dominant red-
gold palette, ornate red-and-gold legendary-style frame border with
decorative tiger emblem at top (suggesting "Five Tigers Generals").

Composition: hero portrait fills center of card, frame border on
edges, bottom of card has decorative ornament space (NO text — code
overlays "蜀·武力莽夫" label later).

Background: red battle backdrop filling card behind figure, flat-color
flame and banner silhouettes.

Lighting: dramatic cinematic upper-left light with hard cel-shaded
golden highlights on Guan Yu, deep red shadow background.

STRICT: NO text in image at all.

--ar 7:10 --style raw --v 6
```

---

### #49 · 吴阵营宣传卡 · `faction_card_wu.png`

- **像素**：380×540 · **背景**：实色卡面
- **DPI**：72 · **预期文件大小**：400-700 KB

**Prompt**：
```
380x540 vertical faction selection card 19:27 (7:10 close). Match
project anime style EXACTLY — HoYoverse anime cel-shading, hard
chiaroscuro, anime face proportions, clean line work, flat color
regions, thick black ink outlines, NO painterly texture, NO grain.
ANATOMY: figure has 5 fingers visible on fan, elegant pose.

Subject: faction selection splash card for "Wu (吴)", featuring Zhou
Yu (周瑜) elegant strategist with feather fan and golden-cyan armor,
dominant blue-cyan-gold palette, ornate red-and-gold legendary-style
frame border with decorative phoenix emblem at top (suggesting "Grand
Commander").

Composition: hero portrait fills center of card, frame border on
edges, bottom of card has decorative ornament space (NO text — code
overlays "吴·大都督" label later).

Background: Red Cliff burning silhouette behind figure, crimson sky in
flat gradient, smoke wisps.

Lighting: dramatic cinematic upper-left light with hard cel-shaded
golden highlights on Zhou Yu, fire-glow reflection on armor, deep
cool blue shadow elsewhere.

STRICT: NO text in image at all.

--ar 7:10 --style raw --v 6
```

---

### #50 · 开始对战按钮 · `btn_start_battle.png`

- **像素**：380×120 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：80-150 KB

**Prompt**：
```
380x120 horizontal CTA button 19:6, transparent PNG. Flat cel-shaded
style, thick black ink outlines, heavy solid black shadows, crisp
geometric edges, NO painterly texture, NO grain, NO 3D rendering.

Subject: ornate gold-trim Chinese ceremonial plaque-shape button with
dark crimson lacquered wood center panel, four decorative dragon-head
bosses at four corners, inner panel has faint ink-wash of crossed war
banners as subtle background texture, button center area completely
empty (no text — code overlays Chinese calligraphy label later).

Composition: button takes full frame, ornament symmetric.

Style notes: amber gold + crimson red + dark iron palette, Three
Kingdoms card game UI design matching project's existing
btn_enter_game.png style.

Lighting: soft golden rim light glow around edges, deep crimson center.

STRICT: NO text, transparent background.

--ar 19:6 --niji 6
```

---

## 八、教程弹窗（3 张）

> 教程弹窗基于**竖屏 BattleScreen 1080×1920** 尺寸设计
> 弹窗尺寸 **840×1280**（竖屏画布左右各留 120px 边距 = 840 宽，上下各留 320px = 1280 高）
> 放置路径：`game/src/assets/ui/`

### #51 · 教程弹窗框 · `tutorial_frame.png`

- **像素**：**840×1280** · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：500-900 KB
- **用途**：竖屏教程弹窗装饰框（中央透明给代码渲染内容）

**Prompt**：
```
840x1280 vertical decorative window frame 21:32, transparent PNG.
Flat cel-shaded style, thick black ink outlines, heavy solid black
shadows, crisp geometric edges, NO painterly texture, NO grain, NO
3D rendering.

Subject: ornate ancient Chinese carved wooden frame border on all 4
sides only (BORDER ONLY, fully hollow middle for code overlay),
bronze-and-gold filigree corners with dragon-head bosses at all four
corners, top edge has decorative cartouche ribbon space (no text),
bottom edge has matching ornamental ribbon.

Composition: frame border occupies outer ~15% on each side, the
ENTIRE MIDDLE ~70% AREA must be completely transparent for code to
render tutorial content inside.

Style notes: outer frame in dark walnut wood with amber gold trim,
inner edge has subtle parchment-cream border ring, matching project's
existing frame_legendary.png aesthetic.

Lighting: soft golden rim light on outer carving, no shadows in
hollow center.

STRICT: NO text, middle ~70% must be HOLLOW transparent, no busy
center decoration.

--ar 21:32 --niji 6
```

**质量检查**：
- [ ] 4 边框装饰完整
- [ ] 中央 ~70% 区域完全透明（不能有任何不透明元素）
- [ ] 四角龙首铜饰清晰
- [ ] 顶部 cartouche 留白无文字

---

### #52 · 教程关闭按钮 · `btn_tutorial_close.png`

- **像素**：60×60 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：20-50 KB

**Prompt**：
```
60x60 small close button 1:1, transparent PNG. Flat cel-shaded style,
thick black ink outlines, heavy solid black shadows, crisp geometric
edges, NO painterly texture, NO grain, NO 3D rendering.

Subject: small round bronze-style button with embossed X cross symbol
in center, dark patina bronze finish, slight amber gold highlight rim
around edge, ancient Chinese seal-like circular appearance.

Composition: button centered in frame, X symbol clearly visible.

Style notes: dark iron + amber gold palette, matching project's
existing small UI button style.

Lighting: soft glint on amber rim, slight shadow underneath suggesting
depth.

STRICT: NO additional text or characters, transparent background.

--ar 1:1 --niji 6
```

---

### #53 · 教程「开始对战」按钮 · `btn_tutorial_start_battle.png`

- **像素**：240×80 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：50-100 KB

**Prompt**：
```
240x80 horizontal CTA button 3:1, transparent PNG. Flat cel-shaded
style, thick black ink outlines, heavy solid black shadows, crisp
geometric edges, NO painterly texture, NO grain, NO 3D rendering.

Subject: ornate red-and-gold horizontal plaque button (scaled-down
version of btn_start_battle aesthetic), gold-trim border with small
dragon-head bosses at left and right ends, dark crimson lacquered
wood center panel, button center area completely empty.

Composition: button takes full frame, symmetric.

Style notes: amber gold + crimson red + dark iron palette, matches
btn_start_battle.png miniature version.

Lighting: soft golden rim glow on edges.

STRICT: NO text, transparent background.

--ar 3:1 --niji 6
```

---

## 九、战斗 UI 元素（5 张）

> 战斗 UI 元素基于竖屏 BattleScreen 1080×1920 布局尺寸
> 放置路径：`game/src/assets/ui/`

### #54 · 火法术锚点 icon · `icon_anchor_fire.png`

- **像素**：60×60 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：15-40 KB
- **用途**：周瑜在场时显示在玩家头像旁

**Prompt**：
```
60x60 small UI status icon 1:1, transparent PNG. Flat cel-shaded style,
thick black ink outlines, heavy solid black shadows, crisp geometric
edges, NO painterly texture, NO grain, NO 3D rendering.

Subject: small round bronze medallion with embossed orange-red flame
symbol in center, glowing slightly with fire-orange aura ring around
outside, ancient Chinese seal aesthetic.

Composition: medallion centered, aura ring extending slightly outward
to edge.

Style notes: dark iron + amber gold + crimson red palette, used to
indicate fire-spell anchor minion active on battlefield.

Lighting: soft glow emanating from medallion, hard cel-shaded
highlights on bronze.

STRICT: NO text, transparent background.

--ar 1:1 --niji 6
```

---

### #55 · 抽牌锚点 icon · `icon_anchor_draw.png`

- **像素**：60×60 · **背景**：透明 PNG-32

**Prompt**：
```
60x60 small UI status icon 1:1, transparent PNG. Flat cel-shaded style,
thick black ink outlines, heavy solid black shadows, crisp geometric
edges, NO painterly texture, NO grain, NO 3D rendering.

Subject: small round bronze medallion with embossed scroll-and-quill
symbol in center, glowing slightly with blue-cyan aura ring around
outside, ancient Chinese seal aesthetic.

Composition: medallion centered, aura ring slightly outward.

Style notes: dark iron + amber gold + cyan palette, used to indicate
draw-spell anchor minion active.

Lighting: soft cyan glow, hard cel-shaded bronze highlights.

STRICT: NO text, transparent background.

--ar 1:1 --niji 6
```

---

### #56 · 治疗锚点 icon · `icon_anchor_heal.png`

- **像素**：60×60 · **背景**：透明 PNG-32

**Prompt**：
```
60x60 small UI status icon 1:1, transparent PNG. Flat cel-shaded style,
thick black ink outlines, heavy solid black shadows, crisp geometric
edges, NO painterly texture, NO grain, NO 3D rendering.

Subject: small round bronze medallion with embossed lotus-flower symbol
in center, glowing slightly with green-gold healing aura ring around
outside, ancient Chinese seal aesthetic.

Composition: medallion centered, aura ring slightly outward.

Style notes: dark iron + amber gold + healing green palette, used to
indicate healing-spell anchor minion active.

Lighting: soft green-gold glow, hard cel-shaded bronze highlights.

STRICT: NO text, transparent background.

--ar 1:1 --niji 6
```

---

### #57 · 法力返还浮起 icon · `icon_mana_refund.png`

- **像素**：80×80 · **背景**：透明 PNG-32

**Prompt**：
```
80x80 floating mana refund indicator 1:1, transparent PNG. Flat cel-
shaded style, thick black ink outlines, heavy solid black shadows,
crisp geometric edges, NO painterly texture, NO grain, NO 3D rendering.

Subject: glowing blue crystal shard with golden upward-pointing arrow
above it, soft luminous mystical effect, sparkle dots around edges,
used to indicate "+N mana returned" when fire spell triggers mana
refund.

Composition: crystal in lower half, arrow rising from top of crystal,
sparkles around perimeter.

Style notes: blue crystal + amber gold arrow + cyan glow palette,
Chinese fantasy game UI element.

Lighting: cyan glow on crystal + warm gold glow on arrow, hard cel-
shaded edges.

STRICT: NO text, transparent background.

--ar 1:1 --niji 6
```

---

### #58 · 卡牌联动金光环 · `ring_glow_anchor.png`

- **像素**：280×400 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：100-200 KB
- **用途**：手牌中可联动的谋略卡上叠加的金光 ring 描边

**Prompt**：
```
280x400 card outline glow overlay 7:10, transparent PNG. Flat cel-
shaded style, NO painterly texture, NO grain, NO 3D rendering.

Subject: card outline GLOW RING shape only, warm golden-yellow #ffd700
luminous border that follows card-rectangle shape with rounded corners,
inner edge sharp and bright, outer edge softly fading into transparent
halo.

Composition: ring shape conforms to 280x400 card outline rounded
rectangle, the middle MUST be completely transparent (NO card content
fill — designed to layer ON TOP of cardvisuals).

Style notes: golden yellow + warm amber glow palette, suitable for
layering on top of cardvisual PNGs in code, clean game UI glow effect.

Lighting: ring as light source itself, glowing.

STRICT: middle area completely transparent, NO card content, NO text,
just the GLOWING RING shape.

--ar 7:10 --niji 6
```

**质量检查**：
- [ ] 中央完全透明（不能有金色填充覆盖卡牌内容）
- [ ] 边框金黄色均匀分布
- [ ] 边角圆滑符合 cardvisual 卡形

---

## 十、特效 sprite sheet（8 张）

> 特效 sprite sheet：横向多帧序列，**透明背景 PNG-32**
> 播放方式：CSS step animation 24fps，单次播放 0.3-0.7s
> 放置路径：`game/src/assets/fx/`

### #59 · 火球飞行 · `fx_fire_projectile.png`

- **像素**：1920×240（8 帧横排，每帧 240×240）
- **背景**：透明 · **预期文件大小**：300-600 KB

**Prompt**：
```
1920x240 sprite sheet 8:1, transparent PNG, 8 frames arranged
horizontally each 240x240. Anime cel-shading FX style, flat luminous
color regions, hard light edges, thick outlines, NO painterly texture,
NO grain.

Subject: animated fire projectile sequence.

Animation:
- Frame 1: small orange spark forming, single bright dot
- Frame 2-3: growing fireball with rising flame tips
- Frame 4-5: fully formed roaring orange-red fireball with white-hot
  core and motion blur tail streaking behind
- Frame 6-7: fireball at peak intensity with ember trail
- Frame 8: dissipating embers and smoke wisps

Color palette: warm orange-red flat regions with white-hot core
highlights, no painterly turbulence — clean cel-shaded shapes.

STRICT: PURE TRANSPARENT background, NO text, NO characters, NO
background elements, each frame isolated.

--ar 8:1 --style raw --v 6
```

---

### #60 · 火焰 AoE 爆炸 · `fx_fire_aoe.png`

- **像素**：4320×600（12 帧横排，每帧 360×600）
- **背景**：透明 · **预期文件大小**：1-2 MB

**Prompt**：
```
4320x600 sprite sheet 36:5, transparent PNG, 12 frames arranged
horizontally each 360x600. Anime cel-shading FX style, flat luminous
color regions, hard light edges, thick outlines, NO painterly texture,
NO grain.

Subject: animated fire AoE explosion sequence.

Animation:
- Frame 1: single tiny ignition spark center bottom
- Frames 2-3: spreading flame wave outward
- Frames 4-6: massive vertical flame burst rising to full frame
  height, multiple flame tongues, white-hot core
- Frames 7-9: peak inferno with swirling fire and ember flat shapes
  filling the frame
- Frames 10-12: fading smoke cloud silhouettes with falling ember
  dots and ash

Color palette: orange-red-yellow flame flat regions with white-hot
core + black smoke flat shapes, no painterly turbulence.

STRICT: PURE TRANSPARENT background, NO text, NO background, each
frame isolated.

--ar 36:5 --style raw --v 6
```

---

### #61 · 治疗光柱 · `fx_heal_pillar.png`

- **像素**：1920×600（8 帧横排，每帧 240×600）
- **背景**：透明 · **预期文件大小**：500 KB - 1 MB

**Prompt**：
```
1920x600 sprite sheet 16:5, transparent PNG, 8 frames arranged
horizontally each 240x600. Anime cel-shading FX style, flat luminous
color regions, hard light edges, NO painterly texture, NO grain.

Subject: animated healing light pillar sequence.

Animation:
- Frame 1: small golden-green spark on ground
- Frames 2-3: rising green-gold light column from ground up
- Frames 4-5: full luminous pillar with swirling lotus petal flat
  shapes and gentle dot particles
- Frames 6-7: expanding glow with golden healing aura ring outward
- Frame 8: dissipating gentle sparkle dots

Color palette: soft golden-green flat regions with white highlights
and lotus-petal flat shapes.

STRICT: PURE TRANSPARENT background, NO text, each frame isolated.

--ar 16:5 --style raw --v 6
```

---

### #62 · 抽牌发光 · `fx_draw_glow.png`

- **像素**：1440×240（6 帧横排，每帧 240×240）
- **背景**：透明 · **预期文件大小**：200-400 KB

**Prompt**：
```
1440x240 sprite sheet 6:1, transparent PNG, 6 frames arranged
horizontally each 240x240. Anime cel-shading FX style, flat luminous
color regions, hard light edges, NO painterly texture, NO grain.

Subject: animated card draw glow sequence.

Animation:
- Frame 1: small bronze sparkle dot
- Frame 2: expanding ring of golden particle dots
- Frames 3-4: swirling spiral of bright gold-white scroll-like glyph
  shapes
- Frames 5-6: condensing into focused beam suggesting card
  materialization then fading

Color palette: golden-amber flat regions with bright white highlights,
traditional Chinese scroll-magic aesthetic.

STRICT: PURE TRANSPARENT background, NO text, each frame isolated.

--ar 6:1 --style raw --v 6
```

---

### #63 · 冰冻 · `fx_freeze.png`

- **像素**：1920×360（8 帧横排，每帧 240×360）
- **背景**：透明 · **预期文件大小**：400-700 KB

**Prompt**：
```
1920x360 sprite sheet 16:3, transparent PNG, 8 frames arranged
horizontally each 240x360. Anime cel-shading FX style, flat luminous
color regions, hard light edges, NO painterly texture, NO grain.

Subject: animated freeze effect sequence.

Animation:
- Frame 1: cold blue mist appearing
- Frames 2-3: ice crystal flat shapes forming on bottom
- Frames 4-5: ice rapidly climbing upward in jagged crystalline shapes
- Frames 6-7: fully encased in pale-cyan translucent ice shell with
  frost particle dots
- Frame 8: settling with gentle blue chill aura

Color palette: pale-cyan-white flat regions with translucent crystal
facets and frost particle dots, no painterly turbulence.

STRICT: PURE TRANSPARENT background, NO text, each frame isolated.

--ar 16:3 --style raw --v 6
```

---

### #64 · 变形烟雾 · `fx_transform.png`

- **像素**：2400×240（10 帧横排，每帧 240×240）
- **背景**：透明 · **预期文件大小**：400-700 KB

**Prompt**：
```
2400x240 sprite sheet 10:1, transparent PNG, 10 frames arranged
horizontally each 240x240. Anime cel-shading FX style, flat luminous
color regions, hard light edges, NO painterly texture, NO grain.

Subject: animated transformation smoke sequence.

Animation:
- Frame 1: small purple sparkle dot
- Frames 2-4: expanding purple-pink magical smoke flat shape
  completely enveloping center
- Frames 5-6: dense magical mist with floating mystical glyph shapes
  and star dots
- Frames 7-8: smoke beginning to dissipate revealing new silhouette
  space
- Frames 9-10: final smoke wisps clearing away

Color palette: purple-pink flat regions with white glyph sparkles.

STRICT: PURE TRANSPARENT background, NO text, each frame isolated.

--ar 10:1 --style raw --v 6
```

---

### #65 · 召唤光柱 · `fx_summon.png`

- **像素**：1920×480（8 帧横排，每帧 240×480）
- **背景**：透明 · **预期文件大小**：500 KB - 1 MB

**Prompt**：
```
1920x480 sprite sheet 4:1, transparent PNG, 8 frames arranged
horizontally each 240x480. Anime cel-shading FX style, flat luminous
color regions, hard light edges, NO painterly texture, NO grain.

Subject: animated summon light pillar sequence.

Animation:
- Frame 1: small bronze rune flat shape appearing on ground
- Frames 2-3: expanding golden circle with Chinese seal-script glyph
  shapes spinning
- Frames 4-5: column of golden light rising upward with swirling
  particle dots
- Frames 6-7: column peaks with bright white flash
- Frame 8: light fading revealing summoned silhouette space

Color palette: gold-amber flat regions with bright white core and
seal-script glyph shapes.

STRICT: PURE TRANSPARENT background, NO text, each frame isolated.

--ar 4:1 --style raw --v 6
```

---

### #66 · 武器斩击 · `fx_weapon_slash.png`

- **像素**：1440×240（6 帧横排，每帧 240×240）
- **背景**：透明 · **预期文件大小**：200-400 KB

**Prompt**：
```
1440x240 sprite sheet 6:1, transparent PNG, 6 frames arranged
horizontally each 240x240. Anime cel-shading FX style, flat luminous
color regions, hard light edges, NO painterly texture, NO grain.

Subject: animated weapon slash arc sequence.

Animation:
- Frame 1: sword anticipation flash
- Frames 2-3: crescent-arc slash motion-blur trail (white-silver)
- Frames 4-5: peak arc with bright impact spark dots at apex
- Frame 6: dissipating energy ribbon

Color palette: white-silver-gold flat regions with motion ribbons and
spark dots, stylized like calligraphic brushstroke but cel-shaded.

STRICT: PURE TRANSPARENT background, NO text, each frame isolated.

--ar 6:1 --style raw --v 6
```

---


## 十一、卡牌三态新增 frame（4 张，用户已提供）⭐ v5.3 新章

> 同一张卡在不同生命周期（手牌 / 战斗场内 / 装备状态）下使用不同 frame
> 全部用户自己设计的 PNG，**不写 AI prompt**
> 放置路径：`game/src/assets/ui/`

### #67 · 蜀国战斗场内 frame · `frame_onboard_shu.png`

- **像素**：1184×1578 · **背景**：透明 PNG-32 (RGBA)
- **用途**：蜀阵营卡牌从手牌打到战场时切换的新 frame（去文字面板，全展示立绘）
- ✅ **用户已提供** · 文件：`game/src/assets/ui/frame_onboard_shu.png`

---

### #68 · 吴国战斗场内 frame · `frame_onboard_wu.png`

- **像素**：1200×1641 · **背景**：透明 PNG-32 (RGBA)
- **用途**：吴阵营卡牌从手牌打到战场时切换的新 frame
- ✅ **用户已提供** · 文件：`game/src/assets/ui/frame_onboard_wu.png`

---

### #69 · 中立战斗场内 frame · `frame_onboard_neutral.png`

- **像素**：1168×1557 · **背景**：透明 PNG-32 (RGBA)
- **用途**：非阵营/中立卡牌从手牌打到战场时切换的新 frame
- ✅ **用户已提供** · 文件：`game/src/assets/ui/frame_onboard_neutral.png`

---

### #70 · 武器装备椭圆 frame · `frame_weapon_slot.png`

- **像素**：1182×1614 · **背景**：透明 PNG-32 (RGBA)
- **用途**：兵器装备到主公身上时显示，挂在主公头像旁（炉石式布局）
- **统一一款，不分阵营**
- ✅ **用户已提供** · 文件：`game/src/assets/ui/frame_weapon_slot.png`
- **技术约束**：椭圆中央透明，立绘在代码中用 `clip-path: ellipse(50% 50% at center)` + `object-fit: cover` 裁切撑满

---

## 总计 & 交付建议

### 资源数量汇总

| # | 类别 | 数量 | 用户已提供 | prompt 待写 | 命名前缀 / 放置路径 |
|:-:|---|:-:|:-:|:-:|---|
| ⭐ A0 | 竖屏战斗背景 | 1 | 0 | 1 | `battle_background_v3_vertical.png` 放 `ui/` |
| A1 | 命名武将立绘 | 12 | **12** | 0 | `<英文名>.png` 放 `portraits/` |
| A2 | 兵种共用立绘 | 6 | **6** | 0 | `shu_*.png` / `wu_*.png` 放 `portraits/` |
| A3 | Token 独立立绘 | 3 | **2** | 1（绵羊） | `token_*.png` 放 `portraits/` |
| A4 | 法术立绘 | 18 | 0 | 18（v5.3 重构：+1 缓兵之计 / -1 火攻连环 / 净持平；含 4 改名 + 数值削弱）| `<英文名>.png` 放 `portraits/` |
| A5 | 兵器立绘 | 4 | **4** | 0 | `<英文名>.png` 放 `portraits/` |
| B | 主公头像 | 2 | **1**（孙权）| 1（刘备） | `hero_shu_*.png` / `hero_wu_*.png` 放 `ui/` |
| C1 | 阵营选择 Screen | 4 | 0 | 4 | `faction_*.png` / `btn_start_battle.png` 放 `ui/` |
| C2 | 教程弹窗 | 3 | 0 | 3 | `tutorial_*.png` / `btn_tutorial_*.png` 放 `ui/` |
| C3 | 战斗 UI 元素 | 5 | 0 | 5 | `icon_anchor_*.png` / `icon_mana_refund.png` / `ring_glow_anchor.png` 放 `ui/` |
| D | 特效 sprite sheet | 8 | 0 | 8 | `fx_*.png` 放 `fx/` |
| **十一** | **卡牌三态 frame**（v5.3 新增）| **4** | **4** | 0 | `frame_onboard_*.png` / `frame_weapon_slot.png` 放 `ui/` |
| **总计** | | **70** | **29** | **41** | |

**自洽性校验**：29（用户已提供）+ 41（prompt 待写）= **70** ✓
**v5.2/v5.3/v5.4 变化**：原 66 张 - 2 删除（W11 火计连发 + W12 万箭齐发）+ 4 新 frame + 2 新法术（行舟借势/周郎顾曲）= 70。
**v5.4 卡牌重构净持平**：法术删 W10 火攻连环 + 新增 W26 缓兵之计 = 净 0；中立删 N01 谋士（无独立 prompt） + S18 关羽去武器附赠（资源已为 legacy 18 张复用，不动新 prompt 数）。删除卡的章节（#26/#27/#28/#34）保留为「已删除」空壳作为变更追溯。

### 推荐出图批次

| 批次 | 优先级 | 内容 | 数量 |
|:-:|:-:|---|:-:|
| **批 0** | 🔴 P0 阻塞 | 竖屏战斗背景 ⭐（风格基调）| 1 |
| **批 1** | 🔴 P0 | 12 命名武将 + 主公头像 2 + 阵营选择 4 + 教程 3 + 战斗 UI 5 | 26 |
| **批 2** | 🟡 P1 | 6 兵种共用立绘 + 3 token 立绘 + 18 法术立绘 + 4 兵器立绘 | 31 |
| **批 3** | 🟢 P2 | 8 特效 sprite sheet | 8 |

### 放置目录最终规范

```
game/src/assets/
├── portraits/                          ← 立绘 1086×1448 (43 张新增)
│   ├── 命名武将 12 张
│   ├── 兵种共用 6 张
│   ├── Token 3 张
│   ├── 法术 18 张
│   └── 兵器 4 张
├── ui/                                  ← UI 资源 (15 张新增)
│   ├── battle_background_v3_vertical.png ← 4K 竖屏战斗背景
│   ├── hero_shu_liubei.png / hero_wu_sunquan.png ← 主公头像
│   ├── faction_select_bg.png / faction_card_shu/wu.png / btn_start_battle.png
│   ├── tutorial_frame.png / btn_tutorial_close/start_battle.png
│   └── icon_anchor_fire/draw/heal.png / icon_mana_refund.png / ring_glow_anchor.png
└── fx/                                  ← 特效 sprite sheet (8 张)
    └── fx_*.png × 8
```

### 风格一致性 checklist（每张图都需检查）

- [ ] 风格 = HoYoverse anime cel-shading（**不是** semi-realistic / DW9）
- [ ] 硬 chiaroscuro + 平面色块 + 干净线稿 + 粗黑硬切边
- [ ] 无 painterly texture、无 grain、无 3D rendering
- [ ] Midjourney 参数正确：立绘/背景/复杂场景 `--style raw --v 6`，UI/icon/装饰 `--niji 6`
- [ ] 立绘必含 `ANATOMY: hands clearly drawn with all 5 fingers each`
- [ ] 立绘必含 5 段式：Character / Holding / Composition / Background / Lighting
- [ ] 无任何文字（中文 / 英文 / 数字）出现
- [ ] 尺寸严格按规范
- [ ] 透明背景 / 实色背景标注准确
- [ ] 命名按规范英文小写

### 验收反馈机制

每出 1 张图请按以下格式确认：
```
[OK]    zhaoyun.png 已出图，已放入 portraits/
[REWORK] battle_background_v3_vertical.png 中央铜带不够明显，需重出
```

代码端 v5 任务 3 Round 1（数据 + 类型扩展）**不依赖任何美术**，可与批 0/1 出图并行启动。

---

*文档结束 · 共 70 张资源（29 张用户已提供 + 41 个 prompt 待写）*
*版本 v5.6 设计哲学纠偏版（取代 v5.0 DW9 错误版 / v5.1 / v5.2 / v5.3 / v5.4 / v5.5）·  HoYoverse anime cel-shading 风格*
*与策划终稿 09 号文档同步 + 卡牌验收清单 docs/12（v5.3）·  修订请同步更新本文档*

## 变更日志

- **v5.6（2026-06-05 设计哲学纠偏）**：W12 周郎顾曲 联动「攻 -2 永久」→「攻 -1 本回合」（#5b 更新，UX 修正）
- **v5.5（2026-06-05 数值审查回收）**：W12 周郎顾曲 联动剥离抽牌改「攻 -2 永久」（#5b 更新）；W11 行舟借势 联动 +「当回合归还 1 费」（#5a 更新，全抽牌系联动统一加 +1 费返还）
- **v5.4（2026-06-05 用户卡牌重构）**：删 W10 火攻连环 prompt 块（#26）；删 W16 春风化雨 prompt 块（#34，改名为固守待援移至 #5c）；新增 #5c 固守待援 / #5d 缓兵之计 / W11 改名 行舟借势 / W12 改名+降费 周郎顾曲；TK_YIJIANG → 机关木甲 token 章节标题改名；删除 TK_QINGLONG token（关羽去武器附赠后无召唤源）；#40 金疮药 数值更新（2 费回 5）
- **v5.3（2026-06-05 资源落地）**：4 张 frame_onboard / frame_weapon_slot 入库；4 张兵器立绘 + 12 张命名武将立绘 + 2 张兵种 + 1 张孙权头像入库
- **v5.2（2026-06-05 吴法系精简）**：删 W11 火计连发 + W12 万箭齐发（#27/#28），新增江风长歌/横笛震敌，4 改名（W15/W16/W19/N07）
- **v5.1（2026-06-04）**：HoYoverse anime cel-shading 风格基线（取代 v5.0 DW9 错误风格）
- **v5.0（2026-06-04，废弃）**：DW9 半写实 CG 风格（前任 AI 错误方向，全份 prompt 已重写）
