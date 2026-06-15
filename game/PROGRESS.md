# 三国炉石 Demo · 项目进度档案

> 最后更新：2026-06-15

---

## 一、项目阶段总览

| 阶段 | 内容 | 状态 |
|:--|:--|:-:|
| W1 视觉打磨 | 6 屏全部接入真实 PNG 资源，TypeScript 0 错误 | Done |
| W2 战场逻辑（含 §19 各子项） | 完整对战体验落地，含反馈系统与验收期改动 | Done |
| §22 数值平衡 | iter1 → iter6.1，阵营差由 65.3% 收敛至 5.6% | Done |
| §23 AI 难度系统 | 生手 / 标准 / 宗师三档难度，本地存储记忆 | Done |
| §24 战斗内自动托管 | 战斗中一键切换 AI 自动决策 | Done |
| §25 教程屏 | 竖屏 1080×1920 教程页，覆盖基础玩法说明 | Done |
| §26 资源预加载优化 | 主菜单核心资源预加载，最大等待时长 5 秒 | Done |
| §27 自定义鼠标光标 | 长枪 PNG 光标 + hover 金色光晕 + 点击波纹 | Done |
| §28 commit 历史规范化 | 历史 commit 信息按 Conventional Commits 重写 | Done |
| §29 分屏渐进预加载 | Loading 屏重做，按目标屏阻塞加载所需资源 + 30 条 Tip 文案池 + 4 张随机背景 | Done |
| §30 立绘与 Loading 背景 WebP 化 | 89 张立绘 + 4 张背景转 WebP，体积砍 76%，cardvisual 与其它 UI 保留 PNG | Done |
| GitHub Pages 自动部署 | workflow 已就绪，仓库公开后随 push 自动部署 | Done |
| 吴方 AoE 二轮微调（iter7） | 引擎扩展 + 卡牌数据调整 + 1000 局验证 | Done（待玩家体验验收） |
| W5 体验层面打磨 | 待启动 | Pending |

---

## 二、W1 视觉打磨（Done · 2026-05-27）

### 2.1 启动流程串联

```
intro.mp4 （立即可跳过）
  → splash（协议勾选 + 区服选择）
  → loading（3 秒进度条）
  → mainmenu
```

刷新跳过 intro 由 LocalStorage 键 `sgls_intro_seen` 控制。

### 2.2 六屏组件接入资源

| 屏幕 | 组件文件 | 关键资源 |
|:--|:--|:--|
| Splash | `screens/Splash/SplashScreen.tsx` | splash_bg / logo_main / btn_enter_game / pill_server / 工具图标 / 灯笼晕点 / 花瓣飘落 |
| Intro | `screens/Intro/IntroVideo.tsx` | intro.mp4 |
| Loading | `screens/Loading/LoadingScreen.tsx` | loading_bg + 14 步进度序列 |
| MainMenu | `screens/MainMenu/MainMenu.tsx` | player_ui_block / 3 货币 / 4 Tab / 3 卡叠层 / war-room 底板 / 桃园 banner / 长公告卷轴 / 设置 Tab |
| Codex | `screens/Codex/CodexScreen.tsx` | codex_background / logo_codex / 17 张卡片渲染 / btn_back |
| Battle | `screens/Battle/BattleScreen.tsx` | battle-background / icon_weapons / text_battle_title |
| Result | `screens/Result/ResultScreen.tsx` | win/defeat_background / text_victory/defeat |
| SubPage × 5 | `screens/SubPage/SubPageScreen.tsx` | subpage_story / quest / shop / settings / event 全屏背景 + btn_back |

5 个子页面的导航对接：

| 入口 | 目标屏 |
|:--|:--|
| MainMenu 剧情卡 | `navigate('storymode')` |
| 底部任务 Tab | `navigate('quest')` |
| 底部商城 Tab | `navigate('shop')` |
| 底部设置 Tab | `navigate('settings')` |
| MainMenu 限时活动卡与桃园 banner | `navigate('event')` |

每个子页面左上角统一以 `btn_back.png` 古铜雕花牌作为返回按钮，点击回到主菜单。

### 2.3 Card 组件结构

`components/Card/Card.tsx` 按稀有度加载边框 PNG，模块化层叠以下结构：

- 立绘：`top:4%, left/right:7%, height:62%, object-fit:cover`
- 边框：根据稀有度选择（common / rare / epic / legendary）
- 名字横幅：按字数选择（≤2 字 short / ≤4 字 medium / >4 字 long）
- 数值球：`cost_N / attack_N / health_N`（N = 1–10）
- 关键词印章：taunt / charge / rush / stealth / divineShield / windfury / poisonous / lifesteal / freeze / battlecry / deathrattle / spellPower / silence
- 阵营印章：emblem_shu / wei / wu / qun / neutral

### 2.4 设计画布与字体

`App.tsx` 使用 CSS transform scale 将设计画布按浏览器窗口等比缩放，多余空间填充黑色 letterbox。

`index.css` 引入 Google Fonts：Ma Shan Zheng / ZCOOL XiaoWei / Long Cang / Noto Serif SC。CSS 变量定义：`--font-kai / --font-display / --font-serif / --font-numeric`。

### 2.5 立绘交付

立绘已陆续到位，含蜀方 11 张武将（初版于 2026-05-27 到位）+ 7 张场景或物品立绘（taoyuan / rende / wanjian / mubing / xiuyang / moushi / qinglongdao）+ 吴方 31 张 + 其余卡牌艺术补全。当前总数 89 张，已全部转 WebP 以缩减加载体积。

---

## 三、W2 战场逻辑（Done）

完整对战体验落地，覆盖以下核心系统：

- 双方各 7 格战场布局
- 拖拽出牌与法力消耗
- 攻击、死亡、伤害结算
- 13 个核心关键词实装
- §19.6 战场反馈系统（Phase A / B / C / D）
- §19.7 验收期 20 余项 batch fix

---

## 四、§22 数值平衡（Done · iter6.1）

经 6 轮迭代，阵营差由 baseline 的 65.3% 收敛至 iter6.1 的 5.6%，全部核心体验指标进入健康区间。

| 关键指标 | iter6.1 |
|:--|:-:|
| 阵营差 | 5.6% |
| 蜀总胜率 | 69.5% |
| 吴总胜率 | 63.9% |
| 蜀 vs 吴 跨阵营 | 60.0% |
| 吴 vs 蜀 跨阵营 | 51.6% |
| T1 卡死率 | 0% |

完整迭代过程与改动记录详见根目录 [README.md](../README.md) 的 §22 章节。

---

## 五、§23–§30 体验层增强（Done）

| 项 | 内容 |
|:--|:--|
| §23 AI 难度系统 | 三档难度（生手 / 标准 / 宗师），FactionSelect 屏选择，本地存储记忆 |
| §24 战斗内自动托管 | 战斗中一键切换 AI 自动决策 |
| §25 教程屏 | 竖屏 1080×1920 教程页，覆盖基础玩法说明 |
| §26 资源预加载优化 | 主菜单核心资源预加载，最大等待时长 5 秒 |
| §27 自定义鼠标光标 | 长枪 PNG 光标 + hover 金色光晕 + 点击波纹 |
| §28 commit 历史规范化 | 历史 commit 信息按 Conventional Commits 重写 |
| §29 分屏渐进预加载 | LoadingScreen 重做，由 `pendingScreen` 驱动按目标屏阻塞加载所需资源；30 条 Tip 文案池随机抽取；4 张随机背景（loading_bg / loading_bg_2 / loading_bg_3 / loading_bg_4）；MainMenu / FactionSelect / Tutorial 等导航入口全部接入 `navigateWithLoading` |
| §30 立绘与 Loading 背景 WebP 化 | 89 张立绘 + 4 张背景转 WebP（q=88），体积 77 MB → 19 MB，节省 76%；cardvisual 与其它 UI 资源保留 PNG；assetLoader 加扩展名 fallback，卡牌 JSON 零修改；原 PNG 备份至 `backup-original-png/` |

---

## 六、部署

| 项 | 状态 |
|:--|:--|
| GitHub Actions workflow | 已就绪（`.github/workflows/deploy-pages.yml`） |
| 触发方式 | push 到 master 分支自动触发 |
| 构建产物 | `game/dist/` |
| 访问地址 | 仓库公开后部署至 `https://zlllllll395487.github.io/ThreeKingdoms-Hearthstone-Demo/` |

---

## 七、§22-iter7 吴方 AoE 二轮微调（Done · 待玩家体验验收）

代码与数据改动已完成，iter7 1000 局模拟已记录于 `docs/sim-reports/sim-2026-06-15-iter7-wu-aoe-nerf.md`。模拟数据显示阵营差扩大至 15.2%（吴方在 AI 对战中变弱），但跨阵营双向胜率达标（蜀对吴 70.8%，吴对蜀 48.0%）。按用户决策，以玩家实际体验为准，暂不基于模拟数据再做二轮调整。

### 7.1 引擎扩展

| 模块 | 内容 |
|:--|:--|
| `dealDamageAll` | 新增 `maxTargets` 参数，使用 mulberry32 PRNG 纯随机选择最多 N 个敌方单位 |
| `dealDamageAll` | 新增 `lowTargetBonus { threshold, bonus }`，目标数 ≤ threshold 时每目标额外伤害 |
| `dealDamage` | 新增 `conditional { ifTargetHasTag, useAmountInstead, ignoreAmplifier }` |
| `AnchorTag` | 类型扩展新增 `anchor_ramp` |
| `applyDamageVulnerability` | 新增 action，主目标 + 相邻共 2–3 个敌方武将获得本回合伤害放大 |
| AI 评分 | `scoreSpellEffect` 中对 `dealDamageAll` 与 `dealDamage` 分支同步适配 |

### 7.2 卡牌数据调整

| 卡牌 | 编号 | 主要变化 |
|:--|:-:|:--|
| 吕蒙 | W06 | 新增 `anchorTag: anchor_ramp` |
| 火烧赤壁 | W09 | 基础伤害 4 → 3，`maxTargets: 4`，`lowTargetBonus: {2, 1}`，refundMana 3 → 2 |
| 草船借箭 | W13 | `maxTargets: 3` |
| 火油 | W18 | 改为 `applyDamageVulnerability` + `oiled` tag，作用范围 `targetAndAdjacent` |
| 赤焰焚营 | W19 | 改为单体玩家选定，oiled 触发时 6 dmg 且 `ignoreAmplifier` |
| 截江断流 | W28 | 锚点改为 `anchor_ramp`（吕蒙），`maxTargets: 4`，`lowTargetBonus: {2, 1}` |

### 7.3 验收方式

由玩家直接体验吴方卡组手感是否改善，决定是否需要回调或进一步调整。

---

## 八、待办

### P1 · 玩家 UI 12 件套（M1 优先级）

当前以 `player_ui_block.png` 单图整合版作为临时方案。规划拆分为：

- 头像框（3 稀有度）
- 默认头像（4 类）
- 等级章 / 名牌 / 称号绶带 / 经验条
- VIP 章 / 在线状态点

Sprite sheet 的生成 prompt 已存档。

### P2 · W5 体验层面打磨

- 战斗细节动效优化
- 音效系统接入
- 卡牌交互手感细调

---

## 九、关键文件路径速查

```
源代码：d:/三国炉石/game/src/
  ├─ App.tsx                          根 + 横屏 / 竖屏画布切换
  ├─ store/uiStore.ts                 屏幕路由 + 弹窗
  ├─ engine/                          战斗规则 / AI / 法术 action / 牌库
  ├─ data/cards/{shu,wu,neutral,weapons}.json
  ├─ data/cardLibrary.ts              卡牌查询接口
  ├─ data/assetLoader.ts              import.meta.glob 资源加载
  ├─ components/                      Card / Modal / CustomCursor
  └─ screens/                         12 个屏幕组件

资源：d:/三国炉石/game/src/assets/
  ├─ ui/                              约 260 张 UI 资源（主体 PNG + Loading 背景 WebP）
  ├─ portraits/                       89 张立绘（WebP）
  └─ video/intro.mp4

设计文档：d:/三国炉石/docs/           策划文档 + 模拟报告 + 审计
```

---

## 十、启动命令

```bash
cd d:/三国炉石/game
npm install              # 首次或克隆后
npm run dev              # http://localhost:5173/
npm run build            # 生产构建至 game/dist/
npx tsc --noEmit         # TypeScript 检查
```

测试完整启动流程：浏览器开发者工具 → Application → Local Storage → 清除 `sgls_intro_seen` → 刷新。
