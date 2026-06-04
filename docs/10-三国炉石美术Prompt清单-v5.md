# 三国炉石 v5 · 全美术资源 Prompt 清单（修正版）

> **版本**：v5.1（修正版，取代 v5.0）· **日期**：2026-06-04
> **配套策划**：`09-三国炉石策划终稿-v5.md`
> **总资源数**：66 张 PNG · **总 prompt 数**：66 个（一图一 prompt）
> **生图工具建议**：Midjourney v6 / SDXL+ControlNet / DALL-E 3

---

## 全局风格锚点（强制遵守，与项目历史立绘一致）

参照项目 `08-P1-P2武将立绘完整Prompt集合.md` 的风格定义：

```
美术风格：semi-realistic CG illustration, similar art style to Dynasty Warriors 9
画幅比例：竖向 2:3
分辨率参考：1024×1536（实际成品 1086×1448）
统一构图：head in upper third of frame, full body low angle shot
Midjourney 参数：--ar 2:3 --style raw --v 6
品质：ultra detailed, masterpiece quality, 8k
```

**严格禁止**：
- ❌ 工笔国画 / 水墨画风
- ❌ 卡通 / 二次元 / Q 版
- ❌ 任何文字（中文 / 英文 / 数字）出现在图像中
- ❌ 现代元素

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
- 参照 HS / 影之诗 / 阴阳师百闻牌 竖屏卡牌游戏标准布局
- 三层结构：顶部装饰带 / 中央战场 / 底部装饰带 + 中央铜带分界

**Prompt**：
```
Vertical battle scene background for top-down card game, 2160x3840 (9:16
aspect ratio), Three Kingdoms era. Composition divided into THREE
horizontal layers:

LAYER 1 (TOP ~25% of canvas, dark zone): rich dark wooden chamber wall
with hanging crimson silk banners, two lit bronze lanterns flanking the
center, ink-stones and folded battle maps on side surfaces, dark walnut
brown and bronze tones. This zone serves as visual backdrop for the
enemy hero area.

LAYER 2 (CENTRAL 50% of canvas, BRIGHT playing field): aged parchment
and weathered light-oak war table surface (warm cream-tan #d4b88a base)
with subtle cloud-pattern damask undertones, MOSTLY EMPTY for cards
and minions to be placed via code, slight worn marks suggesting heavy
use, BRIGHTER and WARMER than top/bottom zones (key visual contrast).

LAYER 3 (BOTTOM ~25% of canvas, dark zone): similar to top but
decorated for player side—weapon rack with halberds, bamboo book stack,
brass incense burner emitting faint smoke, scrolls, dark tones matching
top zone.

CENTER HORIZONTAL SEAM (across middle of LAYER 2): strong burnished
BRONZE INLAY BAND ~120px thick at full resolution, with carved
cloud-and-thunder patterns and small dragon-head bosses every ~600px,
dividing top (enemy) and bottom (player) zones, glowing with warm
lantern light from above center.

LIGHTING: Soft warm tungsten lighting from above-center pouring down
onto the parchment field, creating a gentle light-pool effect. Edges
fall into shadow (vignette darkening corners ~30%). The contrast
between bright center and dark perimeter is the KEY visual feature.

STRICT REQUIREMENTS:
- Central field MUST be brighter and warmer than perimeter
- Bronze seam MUST be VISIBLE and STRONG (key composition element)
- NO baked-in minion slots or circles in the field
- NO text anywhere, NO Chinese characters, NO English
- NO crossed swords or center decorative motif (center must be CLEAN
  for gameplay overlays)
- NO floating UI elements

Style: semi-realistic CG illustration matching Dynasty Warriors 9
aesthetic. Resolution 2160x3840 vertical PNG.
```

**质量检查**：
- [ ] 中央亮色羊皮纸区与上下暗色装饰区对比明显
- [ ] 中央铜带清晰可见且贯穿全宽
- [ ] 无文字 / 无烤入式 minion 槽位 / 无中央装饰
- [ ] 上下装饰区元素丰富但不抢戏

---

## 一、命名武将立绘（12 张）

> 所有命名武将立绘：**1086×1448 PNG**，DPI 72，sRGB，实色背景（带氛围）
> 风格：semi-realistic CG, Dynasty Warriors 9 style
> Midjourney 参数：`--ar 2:3 --style raw --v 6`
> 预期文件大小：1.5-2.5 MB
> 放置路径：`game/src/assets/portraits/`

---

### #2 · 赵云 · `zhaoyun.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era Shu Han general Zhao Yun, full body low angle shot,
handsome youthful warrior in his late twenties with determined fearless
expression and warrior topknot tied with silver headband, wearing
pristine silver scale armor with gold trim (银鳞甲), white cape
billowing dramatically behind, holding white-tassel spear (青釭剑)
raised diagonally in dynamic charging stance, mid-action pose as if
breaking through enemy lines, standing on Changban Slope battlefield
at dawn with swirling dust and fallen banners in fog, red battle fires
atmospheric lit in distance, silver white and crimson palette,
cinematic golden dawn light from upper-left, sparks and embers in air,
semi-realistic CG illustration, similar art style to Dynasty Warriors 9,
intricate armor textures, metallic highlights, heroic warrior detail,
ultra detailed, masterpiece quality, 8k, head in upper third of frame,
vertical portrait 2:3 aspect ratio, 1024x1536 resolution, tall canvas
--ar 2:3 --style raw --v 6
```

---

### #3 · 马超 · `machao.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era Western Liang cavalry leader Ma Chao "Brocade Ma Chao",
full body low angle shot, fierce mid-twenties warrior with sharp eyebrows
("剑眉") and piercing eyes, light-skinned with subtle Western Qiang-Han
features and short stubble, wearing ornate silver-and-gold lion-engraved
helmet (狮盔) with red horsehair plume, silver chest armor with western
jade studs, flowing scarlet-red cape billowing dramatically, raising
long-shafted silver spear overhead in mounted charging pose, standing
on vast western plains at sunset, dust clouds from galloping horses
behind, distant mountains, deep red-orange sky, scarlet red and silver
palette, cinematic golden hour lighting, sand sparks in air,
semi-realistic CG illustration, similar art style to Dynasty Warriors 9,
intricate armor textures with western jade details, dynamic motion blur
on cape, fierce determined expression, ultra detailed, masterpiece
quality, 8k, head in upper third of frame, vertical portrait 2:3 aspect
ratio, 1024x1536 resolution, tall canvas --ar 2:3 --style raw --v 6
```

---

### #4 · 严颜 · `yanyan.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era elderly Shu Han veteran general Yan Yan, full body
low angle shot, late sixties warrior with long flowing white beard and
deeply lined face, stern unbreakable gaze with eyes like cold steel,
powerful broad-shouldered build despite age, wearing weathered silver-
and-bronze layered armor showing decades of battle scars, dark blue
under-robe, simple cloth belt, holding long staff-spear at rest with
one hand on chest in commanding stance, standing at ancient stone city
gate at twilight lit by torches, war banners visible, somber heroic
atmosphere, weathered silver and twilight purple palette, cold blue
torch light from above, semi-realistic CG illustration, similar art
style to Dynasty Warriors 9, intricate aged armor textures, dignified
veteran gravitas, ultra detailed, masterpiece quality, 8k, head in
upper third of frame, vertical portrait 2:3 aspect ratio, 1024x1536
resolution, tall canvas --ar 2:3 --style raw --v 6
```

---

### #5 · 黄月英 · `huangyueying.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era brilliant female inventor Huang Yueying wife of
Zhuge Liang, full body shot, late twenties intelligent female scholar
with hair tied up with wooden pins and side hair lock, sharp observant
eyes with neutral confident expression, light-tan skin (historically
plain features with brilliance shining through), wearing soft dark
green-and-grey practical scholar robes with leather working sleeves,
a small ornate mechanical owl crafted of brass and wood perched on
her left forearm, holding craftsman's caliper-tool in right hand,
standing in workshop with blueprints on walls and hanging mechanical
parts, brass cogs scattered on table behind, dark green and warm
amber palette, soft afternoon sunlight through window, semi-realistic
CG illustration, similar art style to Dynasty Warriors 9, detailed
robe textures and brass cog details, scholarly inventor aesthetic,
ultra detailed, masterpiece quality, 8k, head in upper third of frame,
vertical portrait 2:3 aspect ratio, 1024x1536 resolution, tall canvas
--ar 2:3 --style raw --v 6
```

---

### #6 · 周瑜 · `zhouyu.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era Wu Grand Commander Zhou Yu, full body low angle
shot, famously handsome scholarly young man in his late twenties
("美周郎"), refined intelligent features with neat short beard and
calm strategic gaze with hint of pride, hair tied up with jade crown,
wearing ornate golden-and-cyan general's armor with phoenix engravings
over white scholar's robe flowing elegantly underneath, holding white
feather strategist fan (羽扇) in left hand, ceremonial jeweled sword
at hip, elegant commander pose, standing on cliffs above the Yangtze
at Red Cliff (赤壁) at sunset with war junks burning in distance,
billowing smoke and flame reflection on water, dramatic crimson sky,
golden cyan and crimson palette, cinematic warm lighting from
upper-left with fire embers in air, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9, intricate armor and silk
textures, romantic scholar-general aesthetic, ultra detailed,
masterpiece quality, 8k, head in upper third of frame, vertical
portrait 2:3 aspect ratio, 1024x1536 resolution, tall canvas
--ar 2:3 --style raw --v 6
```

---

### #7 · 鲁肃 · `lusu.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era Wu chief strategist Lu Su, full body shot, mid-
thirties honest middle-aged scholar with round face and kind warm eyes,
neat short beard, slightly heavy-set frame and trustworthy expression,
wearing dark-blue scholar's silk robes with simple silver trim, square
scholar's hat (方巾), holding rolled diplomatic scroll in right hand,
jade pendant at waist, standing in diplomatic pose, in Wu court
interior with bamboo scrolls on shelves, distant river view through
window, dark blue and warm gold palette, warm oil lamp glow ambient
lighting, semi-realistic CG illustration, similar art style to Dynasty
Warriors 9, detailed silk robe textures, honest scholar-diplomat
aesthetic, ultra detailed, masterpiece quality, 8k, head in upper
third of frame, vertical portrait 2:3 aspect ratio, 1024x1536
resolution, tall canvas --ar 2:3 --style raw --v 6
```

---

### #8 · 大乔 · `daqiao.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era legendary Eastern Wu beauty Da Qiao, full body shot,
early twenties beautiful refined young woman with gentle melancholy
expression and large expressive eyes, soft fair complexion ("江东国
色"), hair tied elegantly with golden phoenix hairpin and pearl
ornaments, jade bracelet on wrist, wearing flowing pale-cyan and
silver Hanfu silk robes with gentle phoenix embroidery, long sash
trailing, holding small folding fan (团扇) with delicate ink-painting
of plum blossoms, elegant feminine stance, standing at peaceful
lakeside pavilion at twilight with willow trees and lotus flowers on
water, soft pink-purple sky, pale cyan and pearl pink palette,
cinematic soft twilight lighting, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9, detailed silk robe and
jewelry, classical beauty aesthetic, ultra detailed, masterpiece
quality, 8k, head in upper third of frame, vertical portrait 2:3
aspect ratio, 1024x1536 resolution, tall canvas --ar 2:3 --style raw
--v 6
```

---

### #9 · 孙策 · `sunce.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era "Little Conqueror" of Jiangdong Sun Ce, full body
low angle shot, early twenties bold handsome warrior with fierce
confident grin showing teeth and sharp eyes burning with ambition,
shoulder-length black hair tied up with red headband, strong youthful
build, wearing red-and-bronze cavalry armor with tiger-head shoulder
pieces, scarlet cape billowing dramatically, holding long curved
Chinese spear (古锭刀) raised heroically with one foot forward in
charging stance, standing on Wu coastal battlefield with crashing
waves and war banners, fallen enemies silhouetted in distance,
dramatic stormy sky at sunset with lightning flash, scarlet red and
storm grey palette, cinematic lighting from upper-left with sea spray
sparks in air, semi-realistic CG illustration, similar art style to
Dynasty Warriors 9, intricate armor textures and dynamic motion blur
on cape, youthful conqueror aesthetic, ultra detailed, masterpiece
quality, 8k, head in upper third of frame, vertical portrait 2:3
aspect ratio, 1024x1536 resolution, tall canvas --ar 2:3 --style raw
--v 6
```

---

### #10 · 甘宁 · `ganning.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era Wu marauder pirate-general Gan Ning, full body low
angle shot, fierce thirties warrior with wild long hair and dangerous
grin showing teeth, scar across nose, tattooed forearms with sea-
dragon motifs, wearing rugged leather armor trimmed with small brass
bells (legendary trait sounding as he moved), twin-wielding short
cutlass swords in aggressive battle pose, standing on Yangtze river
port at night with junks at dock, torchlight reflecting on water,
fierce reaver atmosphere, dark turquoise and torch orange palette,
cinematic night torchlight from below, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9, intricate leather and tattoo
detail, ferocious pirate aesthetic, ultra detailed, masterpiece
quality, 8k, head in upper third of frame, vertical portrait 2:3
aspect ratio, 1024x1536 resolution, tall canvas --ar 2:3 --style raw
--v 6
```

---

### #11 · 吕蒙 · `lvmeng.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era Wu scholar-general Lv Meng, full body shot, mid-
thirties studious warrior with thoughtful sharp eyes and neat beard,
fur-trimmed cape, wearing dark green silk over light armor (symbolizing
his transformation from warrior to scholar-general), holding open
strategy scroll in one hand and short sword in other (representing
both wisdom and martial prowess), standing in Wu military strategy
room with maps unrolled and bamboo scrolls on shelves, ambient
candlelight setting, dark green and warm candle amber palette,
cinematic warm interior lighting, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9, intricate fur and scroll
detail, scholarly-warrior duality aesthetic, ultra detailed, master-
piece quality, 8k, head in upper third of frame, vertical portrait
2:3 aspect ratio, 1024x1536 resolution, tall canvas --ar 2:3 --style
raw --v 6
```

---

### #12 · 周泰 · `zhoutai.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era Wu bodyguard general Zhou Tai, full body shot,
mid-thirties loyal warrior covered in numerous battle scars across
face and arms (legendary trait of surviving many wounds protecting
Sun Quan), hair tied back tightly, stoic protective expression,
wearing heavy iron armor in dark grey and bronze, holding tower
shield and short sword in defensive stance, standing in tense
defensive position at city gate with arrows flying past mid-air,
gritty heroic atmosphere, iron grey and crimson palette, cinematic
mid-battle lighting with motion blur on arrows, semi-realistic CG
illustration, similar art style to Dynasty Warriors 9, intricate
armor scratches and battle scar details, stoic guardian aesthetic,
ultra detailed, masterpiece quality, 8k, head in upper third of
frame, vertical portrait 2:3 aspect ratio, 1024x1536 resolution,
tall canvas --ar 2:3 --style raw --v 6
```

---

### #13 · 程普 · `chengpu.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era elder Wu veteran general Cheng Pu, full body shot,
fifties grizzled but powerful warrior with long grey beard and stern
commanding glare, wearing bronze-and-black armor showing decades of
use, holding curved iron rod-mace in firm grip, standing in Wu war
council chamber with war banners hanging behind, somber leadership
atmosphere, deep bronze and dark grey palette, cinematic warm chamber
lighting from torches, semi-realistic CG illustration, similar art
style to Dynasty Warriors 9, intricate aged armor and grey beard
detail, elder commander aesthetic, ultra detailed, masterpiece
quality, 8k, head in upper third of frame, vertical portrait 2:3
aspect ratio, 1024x1536 resolution, tall canvas --ar 2:3 --style raw
--v 6
```

---

## 二、兵种共用立绘（6 张）

> 所有兵种共用立绘：**1086×1448 PNG**，DPI 72，实色背景
> 风格：与命名武将同（DW9 风格），但表情/姿态更"路人兵"，无个人英雄主义
> 预期文件大小：1.5-2.5 MB
> 放置路径：`game/src/assets/portraits/`

**设计依据**：
- 蜀阵营 v5 牌组有大量 generic 兵种（弓兵/骑兵/卫兵/老兵），每张独立立绘成本太高
- 项目惯例：「蜀国步兵」用 `soldierofshu.png` 作为通用步兵立绘已多张共用
- 按兵种分类，每个兵种 1 张立绘 + 多张同兵种卡共用

### #14 · 蜀汉弓兵 · `shu_archer.png`

- **像素**：1086×1448 · **背景**：实色
- **共用卡**：S02 蜀汉弓兵

**Prompt**：
```
Three Kingdoms era common Shu Han infantry archer, full body low angle
shot, ordinary young foot soldier in his early twenties with focused
archer expression, red headband and short black hair, wearing simple
green leather armor with bronze studs, holding longbow with arrow
nocked and drawn back in shooting stance, standing in disciplined
archer rank under bright Shu green war banners, fresh emerald green
palette dominant, neutral noon daylight, clear bright atmosphere
without dramatic effects, faceless rank-and-file feeling, no
individual heroism, semi-realistic CG illustration, similar art style
to Dynasty Warriors 9, straightforward armor design, modest detail
level, anonymous soldier expression, ultra detailed, masterpiece
quality, 8k, head in upper third of frame, vertical portrait 2:3
aspect ratio, 1024x1536 resolution, tall canvas --ar 2:3 --style raw
--v 6
```

---

### #15 · 蜀汉骑兵 · `shu_cavalry.png`

- **像素**：1086×1448 · **背景**：实色
- **共用卡**：S05 突阵骑 / S08 突阵骑兵

**Prompt**：
```
Three Kingdoms era common Shu Han cavalry charger, full body low angle
shot, young Shu cavalry rider mid-gallop in his twenties with fierce
charging expression, helmet with white plume, wearing iron lamellar
armor and green cape, mounted on brown warhorse, lance leveled for
charge or short spear raised, dust trail behind, standing on open
battlefield with fellow cavalry charging in distance, dusty plains,
fresh green and amber dust palette, neutral noon daylight, anonymous
cavalry feeling rank-and-file, semi-realistic CG illustration, similar
art style to Dynasty Warriors 9, straightforward armor design, modest
detail level, ultra detailed, masterpiece quality, 8k, head in upper
third of frame, vertical portrait 2:3 aspect ratio, 1024x1536
resolution, tall canvas --ar 2:3 --style raw --v 6
```

---

### #16 · 蜀汉守卫 · `shu_guard.png`

- **像素**：1086×1448 · **背景**：实色
- **共用卡**：S04 蜀国卫兵 / S06 御林军 / 守卫 token

**Prompt**：
```
Three Kingdoms era common Shu Han defensive guard soldier, full body
shot, stern young palace guardian in his twenties with serious
expression, helmet with red horsetail plume, wearing dark green-and-
bronze armor with red trim, defensive stance holding large rectangular
tower shield and short spear in front of body, standing at imperial
palace gate guarding, anonymous rank-and-file feeling, fresh emerald
green and bronze palette, neutral noon daylight, semi-realistic CG
illustration, similar art style to Dynasty Warriors 9, sturdy armor
design, modest detail level, anonymous guard expression, ultra
detailed, masterpiece quality, 8k, head in upper third of frame,
vertical portrait 2:3 aspect ratio, 1024x1536 resolution, tall canvas
--ar 2:3 --style raw --v 6
```

---

### #17 · 蜀汉老兵 · `shu_veteran.png`

- **像素**：1086×1448 · **背景**：实色
- **共用卡**：S07 蜀汉骁将 / S09 蜀汉校尉 / S13 蜀汉老将 / S14 校尉

**Prompt**：
```
Three Kingdoms era common Shu Han veteran soldier-officer, full body
shot, weathered middle-aged warrior in his forties with tan lined
face and salt-and-pepper beard, calm tired eyes that have seen many
battles, faint scar across cheek, wearing weathered chain-mail over
dark linen with simple iron helmet, sun-faded green cape, holding
broad-bladed Chinese saber leaning slightly on it, standing in dusty
military camp at dawn with soldiers in formation in distance, war
banners behind, muted earth tones and weathered green palette, soft
dawn light, semi-realistic CG illustration, similar art style to
Dynasty Warriors 9, worn armor textures showing wear, modest detail
level, weary veteran expression, ultra detailed, masterpiece quality,
8k, head in upper third of frame, vertical portrait 2:3 aspect ratio,
1024x1536 resolution, tall canvas --ar 2:3 --style raw --v 6
```

---

### #18 · 吴国水军 · `wu_marine.png`

- **像素**：1086×1448 · **背景**：实色
- **共用卡**：W08 吴国水军

**Prompt**：
```
Three Kingdoms era common Wu naval soldier, full body shot, tough
young Wu river-sailor warrior in his twenties with salty determined
expression and wet hair from river spray, blue headband, wearing
light leather armor with oilskin overlay (protecting from water),
holding short curved cutlass and small round shield, standing on Wu
warship deck with rigging and Yangtze river view in background,
crashing waves and sea spray, deep navy blue and storm grey palette,
overcast cinematic lighting with subtle sea-spray, semi-realistic CG
illustration, similar art style to Dynasty Warriors 9, weathered
leather and oilskin details, anonymous mariner expression, ultra
detailed, masterpiece quality, 8k, head in upper third of frame,
vertical portrait 2:3 aspect ratio, 1024x1536 resolution, tall canvas
--ar 2:3 --style raw --v 6
```

---

### #19 · 吴国弓兵 · `wu_archer.png`

- **像素**：1086×1448 · **背景**：实色
- **共用卡**：W10 弓兵

**Prompt**：
```
Three Kingdoms era common Wu archer, full body shot, young Wu archer
in his twenties with focused archer expression, hair tied with blue
sash, wearing light navy-and-bronze armor adapted for naval warfare,
drawing longbow with arrow nocked, standing on Wu warship deck or
riverside with reeds, Yangtze river backdrop, navy blue and reed
green palette, neutral cinematic daylight, semi-realistic CG
illustration, similar art style to Dynasty Warriors 9, light naval
armor design, modest detail, anonymous mariner-archer expression,
ultra detailed, masterpiece quality, 8k, head in upper third of frame,
vertical portrait 2:3 aspect ratio, 1024x1536 resolution, tall canvas
--ar 2:3 --style raw --v 6
```

---

## 三、Token 独立立绘（3 张）

> Token 独立立绘：**1086×1448 PNG**，DPI 72，实色背景
> 民兵 token 复用 `soldierofshu.png` / 守卫 token 复用 `shu_guard.png`，仅 3 张独立 token 需新出
> 预期文件大小：1.2-2 MB
> 放置路径：`game/src/assets/portraits/`

### #20 · 医匠 token · `token_yijiang.png`

- **像素**：1086×1448 · **背景**：实色
- **用途**：黄月英受击触发召唤的医匠 token

**Prompt**：
```
Three Kingdoms era battlefield medic, full body shot, kind young Shu
medic in his twenties with helpful expression, wearing white-and-
green herbalist robes, carrying medicine satchel slung over shoulder
and bandages wrapped at waist, holding small green healing herb in
right hand, standing in camp infirmary with bandaged wounded soldiers
silhouetted in background, soft healing atmosphere, white and herb
green palette, warm soft lighting suggesting compassion, semi-
realistic CG illustration, similar art style to Dynasty Warriors 9,
detailed herbalist robe textures, kind healer expression, ultra
detailed, masterpiece quality, 8k, head in upper third of frame,
vertical portrait 2:3 aspect ratio, 1024x1536 resolution, tall canvas
--ar 2:3 --style raw --v 6
```

---

### #21 · 巫祝 token · `token_wuzhu.png`

- **像素**：1086×1448 · **背景**：实色
- **用途**：校尉亡语召唤的巫祝 token

**Prompt**：
```
Three Kingdoms era mystical battlefield shaman, full body shot, intense
mystical Shu shaman in his thirties with painted face bearing tribal
markings, wearing dark ceremonial robes adorned with bone fetishes and
hanging amulets, holding long wooden staff topped with carved wooden
animal skull and trailing ribbons, ritual fire and rising smoke behind,
intense supernatural expression, deep purple and ritual orange palette,
flickering fire lighting from below, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9, detailed bone and ribbon
ornaments, mystical aesthetic, ultra detailed, masterpiece quality, 8k,
head in upper third of frame, vertical portrait 2:3 aspect ratio,
1024x1536 resolution, tall canvas --ar 2:3 --style raw --v 6
```

---

### #22 · 绵羊 token · `token_mianyang.png`

- **像素**：1086×1448 · **背景**：实色
- **用途**：吕蒙变形产生的绵羊 token（HS polymorph 致敬）

**Prompt**：
```
Cute fluffy white sheep standing in green meadow, harmless confused
expression, slight hint of fading purple transformation magic still
swirling around it as wisps in air, soft pastoral mood, white wool
and pastel green palette, soft daylight, slightly humorous tone
(Hearthstone polymorph reference but still rendered in Dynasty
Warriors 9 semi-realistic CG style), peaceful meadow with scattered
wildflowers backdrop, ultra detailed, masterpiece quality, 8k, sheep
body centered in frame, vertical 2:3 aspect ratio, 1024x1536
resolution --ar 2:3 --style raw --v 6
```

---

## 四、法术立绘（18 张）

> 所有法术立绘：**1086×1448 PNG**，DPI 72，实色背景
> 风格：DW9 风格法术发动场景或典故插画（参照现有桃园/仁德/万箭/募兵 portrait）
> 预期文件大小：1.5-2.5 MB
> 放置路径：`game/src/assets/portraits/`

**设计依据**：
- 项目历史上桃园 / 仁德 / 万箭 / 募兵 / 休养 / 青龙刀 都有独立 portrait（DW9 风格典故场景）
- 新增法术按同样风格画发动场景

### #23 · 武勇（蜀法术） · `wuyong.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Three Kingdoms era Shu warrior surrounded by golden battle aura,
fierce determined expression, sword raised high charging forward with
motion lines suggesting added speed (rush keyword visual metaphor),
glowing golden ki-energy aura emanating from his body, red Shu battle
flag flapping behind in motion, dust kicked up at feet, battlefield
background with distant fighting, vibrant gold and crimson palette,
cinematic upper-left golden light, energy sparks in air, semi-realistic
CG illustration, similar art style to Dynasty Warriors 9, dynamic
action pose, energy aura effects, ultra detailed, masterpiece quality,
8k, head in upper third of frame, vertical portrait 2:3 aspect ratio,
1024x1536 resolution --ar 2:3 --style raw --v 6
```

---

### #24 · 五虎合击（蜀法术） · `wuhuheji.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Five Shu Han tiger generals attacking together in dramatic V-shaped fan
formation (representing Guan Yu, Zhang Fei, Zhao Yun, Ma Chao, Huang
Zhong), each silhouetted hero raising their iconic weapon in unison,
surrounded by swirling golden tiger-spirit energy forming an ethereal
roaring tiger head as energy waves emanating outward over them, epic
battlefield with crimson sunset sky, dust kicked up by their charge,
brilliant gold and crimson palette, cinematic golden light from
upper-left, semi-realistic CG illustration, similar art style to
Dynasty Warriors 9, intricate armor details on all five heroes, epic
legendary moment, ultra detailed, masterpiece quality, 8k, formation
centered in frame, vertical 2:3 aspect ratio, 1024x1536 resolution
--ar 2:3 --style raw --v 6
```

---

### #25 · 火烧赤壁（吴火法术） · `huoshaochibi.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Epic cinematic view of the Burning of Red Cliff battle, massive Wei war
junks engulfed in raging orange-red flames spreading across the Yangtze
river, billowing black smoke rising into crimson sunset sky, fire
reflecting brilliantly on water, silhouettes of burning ships listing
and breaking apart, drifting embers and ash in air, dramatic
apocalyptic moment, scarlet red and deep crimson palette, golden fire
glow lighting everything, semi-realistic CG illustration, similar art
style to Dynasty Warriors 9, intricate fire and ship destruction
details, legendary battle aesthetic, ultra detailed, masterpiece
quality, 8k, sweeping wide view, vertical 2:3 aspect ratio, 1024x1536
resolution --ar 2:3 --style raw --v 6
```

---

### #26 · 火攻连环（吴火法术） · `huogonglianhuan.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Multiple war junks chained together with massive iron chains spanning
between hulls bursting into flames simultaneously, fire spreading from
ship to ship along the connecting chains (历史典故 of Pang Tong's
chain strategy turned against Cao Cao), orange-red flames roaring
upward, silhouettes of panicked soldiers diving into water, dark
smoke filling sky at dusk, river reflections of fire, scarlet and
dark navy palette, fire glow lighting, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9, intricate chain and ship
detail, devastating chain reaction moment, ultra detailed, masterpiece
quality, 8k, multiple ships visible in frame, vertical 2:3 aspect
ratio, 1024x1536 resolution --ar 2:3 --style raw --v 6
```

---

### #27 · 火计连发（吴火法术） · `huojilianfa.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Multiple flaming arrows launched in massive volley from Wu archer
ranks, trailing orange-red flames and black smoke across red-orange
sky in dramatic arc formation, frozen mid-flight moment showing
hundreds of fire arrows en route to target, Wu archers silhouetted by
sunset in foreground, dramatic motion blur on arrows, scarlet fire
and gold sunset palette, cinematic fire glow lighting, semi-realistic
CG illustration, similar art style to Dynasty Warriors 9, intricate
fire and archer detail, devastating volley moment, ultra detailed,
masterpiece quality, 8k, sweeping arrow arc, vertical 2:3 aspect
ratio, 1024x1536 resolution --ar 2:3 --style raw --v 6
```

---

### #28 · 火矢（吴火法术） · `huoshi.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Single dramatically lit flaming arrow mid-flight, trailing intense
orange-red flame and dark smoke tail, frozen moment of arrow tip
burning white-hot brightly, motion blur on shaft showing high velocity,
deep night sky with crescent moon visible in background, vibrant
orange fire against deep blue night palette, fire glow illuminating
surrounding air, semi-realistic CG illustration, similar art style to
Dynasty Warriors 9, intricate fire flame detail with realistic
turbulence, single arrow focus shot, ultra detailed, masterpiece
quality, 8k, arrow positioned diagonally across frame, vertical 2:3
aspect ratio, 1024x1536 resolution --ar 2:3 --style raw --v 6
```

---

### #29 · 火油（吴谋略·火） · `huoyou.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Large ceramic jar of glowing amber oil being poured onto enemy battle
ground from above, flammable golden-yellow liquid splashing dramatically
on the dry earth, faint heat shimmer rising above the spreading pool,
oil trails snaking on the ground prepared for ignition, ominous
preparatory moment, war camp ground backdrop with retreating shadows,
amber gold and dark earth palette, dim moonlit lighting with subtle
heat-shimmer effect, semi-realistic CG illustration, similar art style
to Dynasty Warriors 9, intricate liquid and ceramic jar detail, calm
before storm aesthetic, ultra detailed, masterpiece quality, 8k, oil
pour as centerpiece, vertical 2:3 aspect ratio, 1024x1536 resolution
--ar 2:3 --style raw --v 6
```

---

### #30 · 火攻（吴火法术，与火油联动） · `huogong.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Massive eruption of fire from ignited pool of oil engulfing target,
swirling orange-red flames forming a fierce phoenix-shape rising
majestically from the blaze, smoke and embers spiraling upward,
devastating moment of fire-bird emerging, retreating enemy silhouettes
fleeing in foreground, dark battlefield backdrop, brilliant orange
flames and dark ash palette, fire glow as primary light source,
semi-realistic CG illustration, similar art style to Dynasty Warriors 9,
intricate phoenix-flame detail and ember particles, mythical fire
spirit aesthetic, ultra detailed, masterpiece quality, 8k, phoenix
fire shape as focal point, vertical 2:3 aspect ratio, 1024x1536
resolution --ar 2:3 --style raw --v 6
```

---

### #31 · 草船借箭（吴谋略） · `caochuanjiejian.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Classic historical scene of Zhuge Liang's straw boat stratagem, small
Wu boat completely covered in tied straw bundles bristling with
hundreds of enemy arrows stuck in straw armor, drifting on foggy
morning Yangtze river, soft dawn light through mist, water reflections
gentle, Zhuge Liang figure standing calmly on boat with feather fan,
peaceful misty dawn atmosphere, pale grey and soft amber palette, soft
diffused morning light, semi-realistic CG illustration, similar art
style to Dynasty Warriors 9, intricate arrow and straw detail,
legendary stratagem aesthetic, ultra detailed, masterpiece quality, 8k,
boat as centerpiece of foggy river, vertical 2:3 aspect ratio,
1024x1536 resolution --ar 2:3 --style raw --v 6
```

---

### #32 · 苦肉计（吴谋略） · `kurouji.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Wu general voluntarily kneeling on stone courtyard for ceremonial
flogging with bamboo cane (classic 黄盖苦肉计 self-sacrifice stratagem),
bare back showing fresh welts and bruises, determined willing
expression on face turned slightly downward, sympathetic witnesses
including Wu officers and commanders watching from sidelines, Wu camp
courtyard at dusk backdrop, somber heroic atmosphere, muted earth
tones and twilight purple palette, cinematic golden hour lighting,
semi-realistic CG illustration, similar art style to Dynasty Warriors 9,
detailed muscular back and bamboo cane detail, sacrifice aesthetic,
ultra detailed, masterpiece quality, 8k, kneeling figure as focal
point, vertical 2:3 aspect ratio, 1024x1536 resolution --ar 2:3
--style raw --v 6
```

---

### #33 · 谋略（吴谋略） · `moulve.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Scholarly hand placing weiqi (围棋 ancient Chinese strategic board game)
stones on wooden game board in candlelit night study scene, swirling
ink-painting motifs of military formations rising from the board into
the air like ghostly tactics manifesting, war-map scroll partially
unrolled in background, ink stones and brushes on desk, cinematic
moody candlelight lighting, deep amber and shadowy palette, semi-
realistic CG illustration, similar art style to Dynasty Warriors 9,
intricate weiqi board and floating formation detail, scholarly
strategy aesthetic, ultra detailed, masterpiece quality, 8k, hand and
board as centerpiece, vertical 2:3 aspect ratio, 1024x1536 resolution
--ar 2:3 --style raw --v 6
```

---

### #34 · 望梅止渴（吴防御） · `wangmeizhike.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Cluster of fresh juicy green plums hanging from branches with morning
dew drops glistening, soft refreshing sunlight filtering through
leaves, classical idiom imagery suggesting hope and healing comfort,
gentle mist drifting over plum orchard in background, vibrant fresh
green and dew-clear palette, soft natural morning light, semi-realistic
CG illustration, similar art style to Dynasty Warriors 9, intricate
plum and dew detail, peaceful idiomatic aesthetic, ultra detailed,
masterpiece quality, 8k, plum cluster as centerpiece, vertical 2:3
aspect ratio, 1024x1536 resolution --ar 2:3 --style raw --v 6
```

---

### #35 · 借东风（吴防御·谋略） · `jiedongfeng.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Zhuge Liang dramatic silhouette standing on tall stone altar at night
with arms raised in ritual incantation, swirling glowing wind energy
spiraling around him in golden-blue ribbons of ki, stars visible above,
mystical Eight Trigrams symbol faintly visible beneath his feet on
the altar floor, cliff-top altar surrounded by bamboo banners whipping
wildly in conjured wind, dark mystical night atmosphere, deep blue and
golden ki palette, mystical glow as primary lighting, semi-realistic
CG illustration, similar art style to Dynasty Warriors 9, intricate
robe and energy ribbon detail, mystical ritual aesthetic, ultra
detailed, masterpiece quality, 8k, ritualist as centerpiece, vertical
2:3 aspect ratio, 1024x1536 resolution --ar 2:3 --style raw --v 6
```

---

### #36 · 反间计（吴控制） · `fanjianji.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Shadowy figure of enemy soldier silhouette receiving a secret folded
letter from cloaked hooded Wu agent in dim alley between buildings,
single dim oil lamp candlelight reveals deceptive exchange moment,
two-faced mask symbol subtly carved on alley wall in background,
ink-painting of intrigue and betrayal, deep shadow and amber candle
palette, mysterious noir atmosphere, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9, intricate cloak and letter
detail, espionage aesthetic, ultra detailed, masterpiece quality, 8k,
two figures centered in scene, vertical 2:3 aspect ratio, 1024x1536
resolution --ar 2:3 --style raw --v 6
```

---

### #37 · 美人计（吴控制） · `meirenji.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Elegant Wu beauty in flowing pale-cyan silk robe presenting wine cup
to bewitched general sitting opposite at low Chinese table, soft warm
candlelight illuminating their faces, seduction-and-strategy charged
moment, golden embroidered curtains and silk cushions in background,
intimate chamber scene, pale cyan and warm gold palette, intimate
candlelight as primary illumination, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9, intricate silk robe and wine
cup detail, elegant strategem aesthetic, ultra detailed, masterpiece
quality, 8k, two figures and wine offering centered, vertical 2:3
aspect ratio, 1024x1536 resolution --ar 2:3 --style raw --v 6
```

---

### #38 · 二乔（吴通用谋略） · `erqiao.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Two legendary Wu beauties standing together gracefully (Da Qiao
elder sister wearing pale cyan, Xiao Qiao younger sister wearing
pink), both refined beautiful young women holding folding fans, gentle
sisterly bond and serene expressions, soft pearl jewelry, peaceful
lakeside pavilion at dawn in background with willow trees and lotus
blooms on water, soft pink and cyan palette, gentle dawn light,
semi-realistic CG illustration, similar art style to Dynasty Warriors 9,
intricate silk hanfu and hair ornament detail, classical sisters
beauty aesthetic, ultra detailed, masterpiece quality, 8k, two figures
side by side centered, vertical 2:3 aspect ratio, 1024x1536 resolution
--ar 2:3 --style raw --v 6
```

---

### #39 · 连环计（吴控制） · `lianhuanji.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
War junks ominously chained together with massive thick iron chains
spanning between ship hulls (the trap setup before Red Cliff burning),
frozen pre-battle moment of calm before storm, dark moody twilight
sky over Yangtze river, no fire yet just the looming chains and
silent ships, faint torchlight on each ship deck, sense of impending
doom, dark navy and bronze chain palette, low cinematic twilight
lighting, semi-realistic CG illustration, similar art style to Dynasty
Warriors 9, intricate iron chain links and ship hull detail, ominous
foreshadowing aesthetic, ultra detailed, masterpiece quality, 8k,
chains as visual focus crossing scene, vertical 2:3 aspect ratio,
1024x1536 resolution --ar 2:3 --style raw --v 6
```

---

### #40 · 治疗术（中立法术） · `zhiliaoshu.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Ancient Chinese medicine herbalist's hands grinding herbs in stone
mortar, glowing golden-green healing light emanating from the herb
mixture, soft golden particles rising into air around the mortar,
traditional Chinese pharmacy interior with bamboo medicine drawers
and hanging dried herbs in background, peaceful healing ambience,
warm gold and herb green palette, soft golden glow lighting from
mortar, semi-realistic CG illustration, similar art style to Dynasty
Warriors 9, intricate herb and mortar detail, healing aesthetic,
ultra detailed, masterpiece quality, 8k, mortar and hands as
centerpiece, vertical 2:3 aspect ratio, 1024x1536 resolution
--ar 2:3 --style raw --v 6
```

---

## 五、兵器立绘（4 张）

> 兵器立绘：**1086×1448 PNG**，DPI 72，实色背景
> 参照项目历史 `qinglongdao.png`（青龙偃月刀已有 portrait）的风格
> 预期文件大小：1-1.8 MB
> 放置路径：`game/src/assets/portraits/`

### #41 · 雌雄双股剑（蜀兵器） · `cixiongshuanggujian.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Pair of legendary Three Kingdoms twin double-edged short swords
"Twin Dragon Double Swords" (雌雄双股剑), crossed in X formation
displayed prominently, one sword with masculine dragon-head pommel
(雄) the other with subtle phoenix design pommel (雌), both polished
steel blades catching dramatic golden light, leather-wrapped grips
with silk cord, ornate cross-guards, displayed on weapon rack in
royal armory, dark wood backdrop with weapon shadows, dramatic
spotlight from above-left, deep wood brown and silver steel palette,
heroic ceremonial weapon aesthetic, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9, intricate sword and dragon-
pommel detail, ultra detailed, masterpiece quality, 8k, crossed
swords as focal point, vertical 2:3 aspect ratio, 1024x1536 resolution
--ar 2:3 --style raw --v 6
```

---

### #42 · 蛇矛（蜀兵器） · `shemao.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Legendary Three Kingdoms long-shafted Chinese spear "Snake Spear"
(蛇矛) displayed vertically with full length visible, sinuous
serpentine wave-shaped blade tip (蛇矛特征), black wood shaft with
red silk wrapping at grip section, iron spearhead with detailed snake-
scale engraving and dragon-tooth point, polished metal catching light,
displayed in barracks weapon rack with other lesser spears in
background out of focus, dark wood brown and gleaming steel palette,
dramatic side lighting from upper-left, ceremonial weapon aesthetic,
semi-realistic CG illustration, similar art style to Dynasty Warriors 9,
intricate snake-scale engraving and serpentine blade detail, ultra
detailed, masterpiece quality, 8k, spear as vertical focal point,
vertical 2:3 aspect ratio, 1024x1536 resolution --ar 2:3 --style raw
--v 6
```

---

### #43 · 百锐刀（蜀兵器） · `bairuidao.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Practical Chinese broad-bladed military saber (戰刀 百锐刀), single
sharp curved edge with slight backwards curve, simple but expertly
crafted with no excessive ornamentation, black silk-wrapped grip,
brass disc cross-guard, polished steel blade catching light, displayed
in smithy with anvil and forge fire behind, sparks from forge in air,
deep iron grey and forge orange palette, dramatic forge fire lighting,
practical weapon aesthetic, semi-realistic CG illustration, similar
art style to Dynasty Warriors 9, intricate blade temper-line and grip
detail, ultra detailed, masterpiece quality, 8k, saber as vertical
focal point, vertical 2:3 aspect ratio, 1024x1536 resolution --ar 2:3
--style raw --v 6
```

---

### #44 · 古锭刀（吴兵器） · `gudingdao.png`

- **像素**：1086×1448 · **背景**：实色

**Prompt**：
```
Heavy ancient Chinese Wu single-edged saber "Ancient Anvil Saber"
(古锭刀), thick chopping blade with brutal weight, bronze hilt and
red silk grip wrap, brass cross-guard with simple geometric pattern,
ancient and battle-worn surface but powerful presence, displayed in
Wu armory rack with naval weapons in background, dark wood brown and
bronze palette, dramatic lighting from upper-left, ceremonial naval
weapon aesthetic, semi-realistic CG illustration, similar art style
to Dynasty Warriors 9, intricate bronze hilt and weathered blade
detail, ultra detailed, masterpiece quality, 8k, saber as vertical
focal point, vertical 2:3 aspect ratio, 1024x1536 resolution
--ar 2:3 --style raw --v 6
```

---

## 六、主公圆头像（2 张）

> 主公圆头像：**500×500 PNG**，DPI 72，透明背景（带 alpha 圆形裁切）
> 风格：DW9 半身肖像，圆形构图（脸 + 肩部居中）
> 预期文件大小：300-500 KB
> 放置路径：`game/src/assets/ui/`

**设计依据**：
- 项目现有 `hero_player.png` `hero_ai.png` 是 500×500 圆形头像（独立美术，不是立绘截脸）
- 新增刘备 / 孙权按同样规格
- 圆形构图要求脸部居中、肩部刚好入框

### #45 · 刘备主公头像 · `hero_shu_liubei.png`

- **像素**：500×500 · **背景**：透明（圆形 alpha）
- **用途**：玩家选蜀时战斗界面玩家主公头像

**Prompt**：
```
Circular portrait headshot of Liu Bei (刘备) Three Kingdoms benevolent
Shu Han emperor and Han imperial uncle in his mid-forties, framed
within a circle composition, head and shoulders only visible centered
in the circle, wearing imperial yellow embroidered silk robes collar
with gold dragon motif barely visible at shoulder, long flowing beard
touched with grey, large compassionate eyes with subtle melancholy,
regal calm authority and warm smile, jade crown ornament on head,
soft gentle lighting from upper-left, golden warm background tone
fading to transparent at circle edge, semi-realistic CG illustration,
similar art style to Dynasty Warriors 9 character portrait, intricate
face and crown detail, dignified emperor aesthetic, ultra detailed,
masterpiece quality, 8k, perfectly circular composition, 1:1 aspect
ratio 1024x1024 source, transparent rounded background, NO text
--ar 1:1 --style raw --v 6
```

**质量检查**：
- [ ] 脸部正面或 3/4 角度居中
- [ ] 肩部刚好入框，不溢出圆形
- [ ] 背景透明（alpha 圆形裁切）
- [ ] 与现有 `hero_player.png` 风格一致

---

### #46 · 孙权主公头像 · `hero_wu_sunquan.png`

- **像素**：500×500 · **背景**：透明（圆形 alpha）
- **用途**：玩家选吴时战斗界面玩家主公头像

**Prompt**：
```
Circular portrait headshot of Sun Quan (孙权) Three Kingdoms young
Eastern Wu emperor in his late twenties, framed within a circle
composition, head and shoulders only visible centered in the circle,
wearing imperial dark-purple silk robes collar with phoenix embroidery
barely visible at shoulder, famously sharp blue-green eyes ("碧眼儿"),
neat short beard, calm but penetrating gaze, jade crown with hanging
beads on head, regal youthful authority, soft cool lighting from
upper-left, dark cyan-purple background tone fading to transparent at
circle edge, semi-realistic CG illustration, similar art style to
Dynasty Warriors 9 character portrait, intricate face and crown
detail, young emperor aesthetic, ultra detailed, masterpiece quality,
8k, perfectly circular composition, 1:1 aspect ratio 1024x1024 source,
transparent rounded background, NO text --ar 1:1 --style raw --v 6
```

**质量检查**：同 #45

---

## 七、阵营选择 Screen（4 张）

> 阵营选择是**横屏 Screen**（沿用项目其他界面横屏），不是竖屏
> 放置路径：`game/src/assets/ui/`

### #47 · 阵营选择背景 · `faction_select_bg.png`

- **像素**：1920×1080 · **背景**：实色 PNG-24
- **DPI**：72 · **预期文件大小**：2-3.5 MB
- **用途**：阵营选择 Screen 全屏背景

**Prompt**：
```
Background image for game's faction selection screen, 1920x1080
landscape, Three Kingdoms era. Composition: ancient Chinese war-
council chamber with massive bronze sand-table battle map in
foreground center, calligraphic scrolls hanging on walls in background,
two large vertical war banners on either side wall (one with Shu 蜀
character on left side, one with Wu 吴 character on right side, both
subtle and decorative), oil lamps casting warm golden glow from above,
incense smoke rising gently, composition leaves clear central area
for code overlay UI (two faction selection cards plus button),
dramatic moody upper lighting, atmospheric, dark walnut and warm
gold palette, semi-realistic CG illustration, similar art style to
Dynasty Warriors 9, intricate wood and bronze sand-table detail,
ceremonial chamber aesthetic, ultra detailed, masterpiece quality,
1920x1080 resolution landscape --ar 16:9 --style raw --v 6
```

---

### #48 · 蜀阵营宣传卡 · `faction_card_shu.png`

- **像素**：380×540 · **背景**：实色卡片
- **DPI**：72 · **预期文件大小**：400-700 KB

**Prompt**：
```
Faction selection card "Shu", vertical card image 380x540, ornate red-
and-gold legendary-style frame border with decorative tiger emblem at
top suggesting "Five Tigers Generals", central featured portrait of
Guan Yu (关羽) heroic mid-battle posture holding green-dragon crescent
blade with red robes and long beard flowing in wind, red battle
background filling rest of card, bottom of card has decorative ornament
space (no text—code overlays "蜀·武力莽夫" label later), dominant
red-gold-green Shu palette, semi-realistic CG illustration similar to
Dynasty Warriors 9 character splash card, intricate frame and portrait
detail, ultra detailed, masterpiece quality, 380x540 portrait, NO text
in image --ar 7:10 --style raw --v 6
```

---

### #49 · 吴阵营宣传卡 · `faction_card_wu.png`

- **像素**：380×540 · **背景**：实色卡片
- **DPI**：72 · **预期文件大小**：400-700 KB

**Prompt**：
```
Faction selection card "Wu", vertical card image 380x540, ornate red-
and-gold legendary-style frame border with decorative phoenix emblem
at top suggesting "Grand Commander", central featured portrait of
Zhou Yu (周瑜) elegant strategist with feather fan and golden-cyan
armor, Red Cliff burning in background with crimson sky and smoke,
bottom of card has decorative ornament space (no text—code overlays
"吴·大都督" label later), dominant blue-cyan-gold Wu palette, semi-
realistic CG illustration similar to Dynasty Warriors 9 character
splash card, intricate frame and portrait detail, ultra detailed,
masterpiece quality, 380x540 portrait, NO text in image --ar 7:10
--style raw --v 6
```

---

### #50 · 开始对战按钮 · `btn_start_battle.png`

- **像素**：380×120 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：80-150 KB

**Prompt**：
```
Main CTA button "Start Battle" decorative plaque, 380x120 horizontal
PNG with transparent background, ornate gold-trim Chinese ceremonial
plaque-shape button with dark crimson lacquered wood center panel,
four decorative dragon-head bosses at four corners, inner panel has
faint ink-wash of crossed war banners as subtle background texture,
button center area is empty (no text—code overlays Chinese calligraphy
later), soft golden rim light glow around edges, semi-realistic CG
illustration matching project's existing btn_enter_game.png style,
intricate gold filigree and wood lacquer detail, ceremonial button
aesthetic, ultra detailed, masterpiece quality, transparent background
PNG, NO text in image --ar 19:6 --style raw --v 6
```

---

## 八、教程弹窗（3 张）

> 教程弹窗基于竖屏 BattleScreen（1080×1920）尺寸设计
> 弹窗尺寸 **840×1280**：竖屏画布 1080×1920 左右各留 120px 边距 = 840 宽，上下各留 320px = 1280 高
> 放置路径：`game/src/assets/ui/`

### #51 · 教程弹窗框 · `tutorial_frame.png`

- **像素**：**840×1280** · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：500-900 KB
- **用途**：竖屏教程弹窗装饰框（中央透明给代码渲染内容）

**Prompt**：
```
Decorative tutorial modal window frame, 840x1280 vertical PNG with
fully transparent background, ornate ancient Chinese carved wooden
frame border on all 4 sides only (BORDER ONLY, fully hollow middle
for content overlay), bronze-and-gold filigree corners with dragon-
head bosses at all four corners, top edge has decorative cartouche
ribbon space (no text), bottom edge has matching ornamental ribbon,
the entire MIDDLE INNER AREA must be completely transparent for code
to render tutorial content inside, outer frame color is dark walnut
wood with gold trim, inner edge has subtle parchment-cream border
ring, semi-realistic CG illustration matching project's existing
frame_legendary.png aesthetic, intricate carving and gold filigree
detail, traditional Chinese carved wood aesthetic, ultra detailed,
masterpiece quality, 840x1280 vertical PNG with HOLLOW transparent
center, NO text --ar 21:32 --style raw --v 6
```

**质量检查**：
- [ ] 4 边框装饰完整
- [ ] 中央 ~70% 区域完全透明（不能有任何不透明像素）
- [ ] 四角龙首铜钉清晰
- [ ] 顶部 cartouche 留位置但无文字

---

### #52 · 教程关闭按钮 · `btn_tutorial_close.png`

- **像素**：60×60 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：20-50 KB

**Prompt**：
```
Small close button (✕) for tutorial modal, 60x60 PNG with transparent
background, small round bronze-style button with embossed X cross
symbol in center, dark patina bronze finish, slight gold highlight
rim around edge, ancient Chinese seal-like circular appearance, soft
shadow underneath suggesting depth, semi-realistic CG illustration
matching project's existing UI button style, intricate bronze patina
detail, transparent PNG output, NO additional text or characters
--ar 1:1 --style raw --v 6
```

---

### #53 · 教程「开始对战」按钮 · `btn_tutorial_start_battle.png`

- **像素**：240×80 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：50-100 KB

**Prompt**：
```
End-of-tutorial "Start Battle" CTA button, 240x80 horizontal PNG with
transparent background, ornate red-and-gold horizontal plaque button
(scaled-down version of btn_start_battle aesthetic), gold-trim border
with small dragon-head bosses at left and right ends, dark crimson
lacquered wood center panel, soft golden rim glow, button center area
is empty (no text—code overlays Chinese calligraphy later), semi-
realistic CG illustration matching project button style, ultra detailed,
masterpiece quality, transparent PNG, NO text in image --ar 3:1
--style raw --v 6
```

---

## 九、战斗 UI 元素（5 张）

> 战斗 UI 元素：基于竖屏 BattleScreen 1080×1920 布局尺寸
> 放置路径：`game/src/assets/ui/`

### #54 · 火法术锚点 icon · `icon_anchor_fire.png`

- **像素**：60×60 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：15-40 KB
- **用途**：周瑜在场时显示在玩家头像旁

**Prompt**：
```
Small UI status icon "Fire Spell Anchor" indicator, 60x60 PNG with
transparent background, small round bronze medallion with embossed
orange-red flame symbol in center, glowing slightly with fire-orange
aura ring around outside, ancient Chinese seal aesthetic, soft glow
emanating from medallion, used to indicate fire-spell anchor minion
is active on battlefield, semi-realistic CG illustration matching
project UI style, intricate bronze and flame detail, transparent PNG,
NO text --ar 1:1 --style raw --v 6
```

---

### #55 · 抽牌锚点 icon · `icon_anchor_draw.png`

- **像素**：60×60 · **背景**：透明 PNG-32

**Prompt**：
```
Small UI status icon "Draw-Card Anchor" indicator, 60x60 PNG with
transparent background, small round bronze medallion with embossed
scroll-and-quill symbol in center, glowing slightly with blue-cyan
aura ring around outside, ancient Chinese seal aesthetic, soft glow,
used to indicate draw-spell anchor minion active on battlefield,
semi-realistic CG illustration matching project UI style, intricate
bronze and scroll detail, transparent PNG, NO text --ar 1:1 --style
raw --v 6
```

---

### #56 · 治疗锚点 icon · `icon_anchor_heal.png`

- **像素**：60×60 · **背景**：透明 PNG-32

**Prompt**：
```
Small UI status icon "Healing Anchor" indicator, 60x60 PNG with
transparent background, small round bronze medallion with embossed
lotus-flower symbol in center, glowing slightly with green-gold
healing aura ring around outside, ancient Chinese seal aesthetic,
soft glow, used to indicate healing-spell anchor minion active on
battlefield, semi-realistic CG illustration matching project UI
style, intricate bronze and lotus detail, transparent PNG, NO text
--ar 1:1 --style raw --v 6
```

---

### #57 · 法力返还浮起 icon · `icon_mana_refund.png`

- **像素**：80×80 · **背景**：透明 PNG-32

**Prompt**：
```
Floating mana refund indicator icon, 80x80 PNG with transparent
background, glowing blue crystal shard with golden upward-pointing
arrow above it, soft luminous mystical effect, magical sparkle aura,
floats up to indicate "+N mana returned" when fire spell triggers
mana refund (with Zhou Yu anchor), semi-realistic game UI element
with Chinese fantasy aesthetic, intricate crystal and arrow detail,
glowing transparent PNG, NO text --ar 1:1 --style raw --v 6
```

---

### #58 · 卡牌联动光环 · `ring_glow_anchor.png`

- **像素**：280×400 · **背景**：透明 PNG-32
- **DPI**：72 · **预期文件大小**：100-200 KB
- **用途**：手牌中可联动的谋略卡上叠加的金色 ring 描边

**Prompt**：
```
Card outline glow overlay PNG for "linkable card" highlight indication,
280x400 with fully transparent background, only the GLOWING OUTLINE/
RING shape visible (no card content fill in middle—the middle must
remain completely transparent so it can layer ON TOP of cardvisuals),
warm golden-yellow #ffd700 luminous border that follows card-rectangle
shape with rounded corners, inner edge sharp and bright, outer edge
softly fading into transparent halo, suitable for layering on top of
cardvisual PNGs in code, clean game UI glow effect, NO card content,
NO text, just the GLOWING RING shape, transparent PNG, --ar 7:10
--style raw --v 6
```

**质量检查**：
- [ ] 中央完全透明（不能有金色填充覆盖卡牌内容）
- [ ] 边框金黄色发光均匀
- [ ] 边角圆滑符合 cardvisual 卡形

---

## 十、特效 sprite sheet（8 张）

> 特效 sprite sheet：横向单排帧序列，**透明背景 PNG-32**
> 播放方式：CSS step animation 24fps，单次播放 0.3-0.7s
> 放置路径：`game/src/assets/fx/`

### #59 · 火焰飞行 · `fx_fire_projectile.png`

- **像素**：1920×240（8 帧横排，单帧 240×240）
- **背景**：透明 · **预期文件大小**：300-600 KB

**Prompt**：
```
Sprite sheet for game VFX "Fire Projectile", 1920x240 PNG total with
transparent background, 8 frames arranged horizontally each 240x240,
animation sequence: frame 1 small orange spark forming, frame 2-3
growing fireball with rising flame tips, frame 4-5 fully formed roaring
orange-red fireball with white-hot core and motion blur tail streaking
behind, frame 6-7 fireball at peak intensity with ember trail, frame 8
dissipating embers and smoke wisps, stylized realistic fire flame with
turbulence, warm orange-red tones with white-hot highlights, used as
flying fire projectile for spells, PURE TRANSPARENT background, NO text
NO characters NO background elements, 1920x240 sprite sheet --ar 8:1
--style raw --v 6
```

---

### #60 · 火焰 AoE 爆炸 · `fx_fire_aoe.png`

- **像素**：4320×600（12 帧横排，单帧 360×600）
- **背景**：透明 · **预期文件大小**：1-2 MB

**Prompt**：
```
Sprite sheet for game VFX "Fire AoE Explosion", 4320x600 PNG total
with transparent background, 12 frames arranged horizontally each
360x600, animation sequence: frame 1 single tiny ignition spark center
bottom, frames 2-3 spreading flame wave outward, frames 4-6 massive
vertical flame burst rising to full height with multiple flame tongues
and white-hot core, frames 7-9 peak inferno with swirling fire and
embers filling the frame, frames 10-12 fading smoke clouds with falling
embers and ash, epic devastating fire wave, stylized realistic fire
turbulence, orange-red-yellow flame palette with black smoke, used as
battlefield-wide AoE for fire spells, PURE TRANSPARENT background,
NO text, NO background, 4320x600 sprite sheet --ar 36:5 --style raw
--v 6
```

---

### #61 · 治疗光柱 · `fx_heal_pillar.png`

- **像素**：1920×600（8 帧横排，单帧 240×600）
- **背景**：透明 · **预期文件大小**：500 KB - 1 MB

**Prompt**：
```
Sprite sheet for game VFX "Healing Light Pillar", 1920x600 PNG total
with transparent background, 8 frames arranged horizontally each
240x600, animation sequence: frame 1 small golden-green spark on
ground, frames 2-3 rising green-gold light column from ground up,
frames 4-5 full luminous pillar with swirling lotus petals and gentle
particles, frames 6-7 expanding glow with golden healing aura, frame 8
dissipating gentle sparkles, mystical healing light effect, soft
golden-green palette with white highlights and lotus-petal particles,
used for healing spells, PURE TRANSPARENT background, NO text,
1920x600 sprite sheet --ar 16:5 --style raw --v 6
```

---

### #62 · 抽牌光效 · `fx_draw_glow.png`

- **像素**：1440×240（6 帧横排，单帧 240×240）
- **背景**：透明 · **预期文件大小**：200-400 KB

**Prompt**：
```
Sprite sheet for game VFX "Card Draw Glow", 1440x240 PNG total with
transparent background, 6 frames arranged horizontally each 240x240,
animation sequence: frame 1 small bronze sparkle dot, frame 2 expanding
ring of golden particles, frames 3-4 swirling spiral of bright gold-
white scroll-like glyphs, frames 5-6 condensing into focused beam
suggesting card materialization then fading, traditional Chinese
scroll-magic aesthetic, golden-amber palette with bright white
highlights, used for card draw effects, PURE TRANSPARENT background,
NO text, 1440x240 sprite sheet --ar 6:1 --style raw --v 6
```

---

### #63 · 冰冻 · `fx_freeze.png`

- **像素**：1920×360（8 帧横排，单帧 240×360）
- **背景**：透明 · **预期文件大小**：400-700 KB

**Prompt**：
```
Sprite sheet for game VFX "Freeze Effect", 1920x360 PNG total with
transparent background, 8 frames arranged horizontally each 240x360,
animation sequence: frame 1 cold blue mist appearing, frames 2-3 ice
crystals forming on bottom, frames 4-5 ice rapidly climbing upward in
jagged crystalline shapes, frames 6-7 fully encased in pale-cyan
translucent ice shell with frost particles, frame 8 settling with
gentle blue chill aura, magical ice elemental effect, pale-cyan-white
palette with translucent crystal facets and frost particles, used for
freeze and stun spells, PURE TRANSPARENT background, NO text,
1920x360 sprite sheet --ar 16:3 --style raw --v 6
```

---

### #64 · 变形烟雾 · `fx_transform.png`

- **像素**：2400×240（10 帧横排，单帧 240×240）
- **背景**：透明 · **预期文件大小**：400-700 KB

**Prompt**：
```
Sprite sheet for game VFX "Transformation Smoke", 2400x240 PNG total
with transparent background, 10 frames arranged horizontally each
240x240, animation sequence: frame 1 small purple sparkle, frames 2-4
expanding purple-pink magical smoke cloud completely enveloping
center, frames 5-6 dense magical mist with floating mystical glyphs
and stars, frames 7-8 smoke beginning to dissipate revealing new
silhouette space, frames 9-10 final smoke wisps clearing away,
mystical transformation effect, purple-pink palette with white glyph
sparkles, used for polymorph effects, PURE TRANSPARENT background,
NO text, 2400x240 sprite sheet --ar 10:1 --style raw --v 6
```

---

### #65 · 召唤光柱 · `fx_summon.png`

- **像素**：1920×480（8 帧横排，单帧 240×480）
- **背景**：透明 · **预期文件大小**：500 KB - 1 MB

**Prompt**：
```
Sprite sheet for game VFX "Summon Light Pillar", 1920x480 PNG total
with transparent background, 8 frames arranged horizontally each
240x480, animation sequence: frame 1 small bronze rune appearing on
ground, frames 2-3 expanding golden circle with Chinese seal-script
glyphs spinning, frames 4-5 column of golden light rising upward with
swirling particles, frames 6-7 column peaks with bright white flash,
frame 8 light fading revealing summoned silhouette space, traditional
Chinese summoning ritual aesthetic, gold-amber palette with bright
white core and seal-script glyphs floating, used for minion summon
effects, PURE TRANSPARENT background, NO text, 1920x480 sprite sheet
--ar 4:1 --style raw --v 6
```

---

### #66 · 武器挥击 · `fx_weapon_slash.png`

- **像素**：1440×240（6 帧横排，单帧 240×240）
- **背景**：透明 · **预期文件大小**：200-400 KB

**Prompt**：
```
Sprite sheet for game VFX "Weapon Slash Arc", 1440x240 PNG total with
transparent background, 6 frames arranged horizontally each 240x240,
animation sequence: frame 1 sword anticipation flash, frames 2-3
crescent-arc slash motion-blur trail (white-silver), frames 4-5 peak
arc with bright impact sparks at apex, frame 6 dissipating energy
ribbon, stylized game weapon swing motion, white-silver-gold color
palette with motion blur and sparks, calligraphic brushstroke feel,
used for hero attacking with weapons, PURE TRANSPARENT background,
NO text, 1440x240 sprite sheet --ar 6:1 --style raw --v 6
```

---

## 总计 & 交付建议

### 资源数量汇总

| # | 类别 | 数量 | 命名前缀 / 放置路径 |
|:-:|---|:-:|---|
| ⭐ A0 | 竖屏战斗背景 | 1 | `battle_background_v3_vertical.png` 放 `ui/` |
| A1 | 命名武将立绘 | 12 | `<英文名>.png` 放 `portraits/` |
| A2 | 兵种共用立绘 | 6 | `shu_*.png` / `wu_*.png` 放 `portraits/` |
| A3 | Token 独立立绘 | 3 | `token_*.png` 放 `portraits/` |
| A4 | 法术立绘 | 18 | `<英文名>.png` 放 `portraits/` |
| A5 | 兵器立绘 | 4 | `<英文名>.png` 放 `portraits/` |
| B | 主公圆头像 | 2 | `hero_shu_*.png` / `hero_wu_*.png` 放 `ui/` |
| C1 | 阵营选择 Screen | 4 | `faction_*.png` / `btn_start_battle.png` 放 `ui/` |
| C2 | 教程弹窗 | 3 | `tutorial_*.png` / `btn_tutorial_*.png` 放 `ui/` |
| C3 | 战斗 UI 元素 | 5 | `icon_anchor_*.png` / `icon_mana_refund.png` / `ring_glow_anchor.png` 放 `ui/` |
| D | 特效 sprite sheet | 8 | `fx_*.png` 放 `fx/` |
| **总计** | | **66** | |

### 推荐出图批次

| 批次 | 优先级 | 内容 | 数量 |
|:-:|:-:|---|:-:|
| **批 0** | 🔴 P0 阻塞 | 竖屏战斗背景 ⭐（风格基调）| 1 |
| **批 1** | 🔴 P0 | 12 命名武将 + 主公圆头像 2 + 阵营选择 4 + 教程 3 + 战斗 UI 5 | 26 |
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
│   ├── hero_shu_liubei.png / hero_wu_sunquan.png ← 主公圆头像
│   ├── faction_select_bg.png / faction_card_shu/wu.png / btn_start_battle.png
│   ├── tutorial_frame.png / btn_tutorial_close/start_battle.png
│   ├── icon_anchor_fire/draw/heal.png / icon_mana_refund.png / ring_glow_anchor.png
└── fx/                                  ← 特效 sprite sheet (8 张)
    └── fx_*.png × 8
```

### 风格一致性 checklist

每张图都需检查：
- [ ] 风格 = semi-realistic CG, Dynasty Warriors 9 style（不是工笔国画）
- [ ] Midjourney 参数包含 `--style raw --v 6`
- [ ] 立绘必含 `head in upper third of frame`
- [ ] 无任何文字（中文 / 英文 / 数字）出现
- [ ] 尺寸严格按规格
- [ ] 透明背景 / 实色背景按标注
- [ ] 命名按规范英文小写 + 下划线

### 验收反馈机制

每出 1 张图请按以下格式确认：
```
[OK] zhaoyun.png 已出图，已放入 portraits/
[REWORK] battle_background_v3_vertical.png 中央铜带不够明显，需重出
```

代码端 Round 1（数据 + 类型扩展）**不依赖任何美术**，可与批 0/1 并行启动。

---

*文档结束 · 共 66 个 prompt 覆盖 66 张资源（一图一 prompt）*
*版本 v5.1 · 修正版（修正风格 / 删除 cardvisual / 加入头像 / 竖屏背景）*
*与策划终稿 09 号文档同步 · 修订请同步更新本文档*
