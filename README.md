# 三国炉石 (Three Kingdoms Hearthstone) · Demo

> 三国题材的 Hearthstone 风格卡牌对战游戏。Web 端 React + TypeScript + Vite 实现。

## 项目结构

```
d:/三国炉石/
├─ docs/                      ← 设计文档（玩法策划、卡牌设计、实施方案、美术清单）
├─ assetofsanguo/             ← AI 出图原始素材（工作目录，按需迁移到 game/src/assets/）
│  ├─ 组件3.0/                ← 最新 UI 组件套
│  ├─ 组件Splash/             ← Splash 专属 UI
│  ├─ 组件ui按钮/             ← Battle / Result 屏按钮
│  ├─ 切图结果/               ← 卡牌边框 / 数值球 / 关键词印章 切片
│  ├─ portraits 原图          ← 武将立绘原文件（guanyu.png 等）
│  └─ 开屏动画.mp4            ← intro 视频原文件
├─ game/                      ← React 应用主目录（详见 game/README.md）
└─ remove_background.py       ← 工具脚本（图像背景去除）
```

## 快速开始

```bash
cd d:/三国炉石/game
npm install            # 首次或克隆后
npm run dev            # 启动开发服务器 → http://localhost:5173/
npx tsc --noEmit       # TypeScript 检查（应 0 错误）
```

## 接手新对话 / 新设备 / 新 AI

按顺序读这三份文档即可顺利接手：

1. **[HANDOFF.md](HANDOFF.md)** — 给下一个开发者 / AI 的简明接手指南（必读）
2. **[game/PROGRESS.md](game/PROGRESS.md)** — 项目当前进度 + 待办清单
3. **[game/src/assets/ASSETS.md](game/src/assets/ASSETS.md)** — 121 张 UI + 11 张立绘资源清单

设计文档在 `docs/`，按编号阅读。

## 技术栈

- React 18 + TypeScript 5 + Vite 5
- Zustand（屏幕路由 + 弹窗状态）
- Tailwind CSS 4 + CSS Modules
- Google Fonts：Ma Shan Zheng / ZCOOL XiaoWei / Long Cang / Noto Serif SC
- Vite `import.meta.glob` 静态资源加载

## 设计规格

- **画布**：1920×1080 固定，浏览器自适应等比缩放，超出留黑边
- **流程**：intro 视频（可跳过）→ splash 进入游戏 → loading 3 秒 → mainmenu
- **状态机**：`src/store/uiStore.ts` 内 `currentScreen` 决定渲染哪个屏幕
- **卡牌**：`src/components/Card/Card.tsx` 按 rarity 加载对应边框 PNG，立绘 / 数值球 / 名字横幅模块化层叠

## 当前阶段

**W1（视觉打磨）已完成** — Splash / Loading / MainMenu / Codex / Battle 占位 / Result 全部接入真实 PNG 美术资源。

**W2-W4（战场逻辑）已完成** — 完整对战体验落地（含 §19.6 Phase A/B/C/D 反馈系统、§19.7 验收期 20+ 改动）。

**当前迭代：v5.6 数值平衡（§22）**
- 完整 AI vs AI 模拟对战框架（1000 局 1.5s 跑完）
- 见下方"数值平衡 / 模拟对局"章节

---

## 数值平衡 / 模拟对局体系 (v5.6 · §22)

为了科学打磨卡组数值，我们建了一套 **AI vs AI 模拟对战框架**，让数值调整不靠拍脑袋而靠数据。

### 设计哲学

1. **基石数值不能拍脑袋** — 卡牌 cost/stat/effect 互相耦合，一处改动可能滚雪球
2. **AI 启发式 + 大样本** — 不追求完美 AI，但用 1000+ 局让数据收敛
3. **快速迭代** — 每轮改动 → 跑 1000 局 → 看 MD 报告 → 决策 → 再迭代
4. **关注体验不只是胜率** — 起手卡死率 / 平均出牌 / 空过回合 等 KPI 同样重要

### 框架结构

```
game/scripts/sim/
├── seeded-random.ts          # mulberry32 PRNG · 每局 seed 完全决定结果
├── simulator.ts              # 单局 AI vs AI runner + 30+ 指标采集
├── stats-collector.ts        # 1000 局聚合（阵营胜率 / 单卡 impact / 体验 KPI）
├── reporter.ts               # 模板化生成 MD 报告
├── analyzers/                # 5 个分析维度
└── run-sims.ts               # CLI: npx tsx run-sims.ts --games 1000 --label baseline

docs/sim-reports/              # 每次跑出的报告归档
├── sim-2026-06-11-baseline.md
├── sim-2026-06-11-iter1-ai-wu-boost.md
└── sim-2026-06-11-iter2-draw-mechanics.md
```

### 使用方法

```bash
cd game
# 跑 1000 局，标签为 myrun
npx tsx --tsconfig tsconfig.app.json scripts/sim/run-sims.ts --games 1000 --label myrun

# 报告会写入 docs/sim-reports/sim-YYYY-MM-DD-myrun.md
```

### MD 报告内容（中等深度 ~300 行）

1. **总体平衡** · 先手胜率 / 阵营胜率 / 4 对位矩阵
2. **单卡 impact** · Top 12 / Bottom 10 (winrate when in winner deck)
3. **节奏诊断** · 平均回合 / 短局长局分布 / fatigue 率
4. **体验指标** · 起手 T1 卡死率 / 终局手牌 / 平均出牌 / 空过回合
5. **诊断总结** · 自动指出 OP 卡 / 弱卡 / 失衡问题 + 改动建议

### 迭代历史

| 版本 | 主改动 | 蜀总胜率 | 吴总胜率 | 阵营差 | 起手卡死 | 备注 |
|:--|:--|:-:|:-:|:-:|:-:|:--|
| baseline | 现规则 | 99.3% | 34.0% | 65.3% | 71.7% | |
| iter1 | AI 强化吴策略识别 | 99.1% | 34.3% | 64.8% | 71.7% | AI 调优**对跨阵营失衡几乎零效果** |
| iter2 | 机制改造（抽牌/起手/W27 谋议） | 99.2% | 34.1% | 65.1% | **31.9%** ✅ | 体验 KPI 健康，跨阵营失衡需调数值 |
| iter3 | 吴 6 新卡 (W28-W30/N09-N11) + 吴 minion buff | 90.3% | 43.1% | 47.2% | **0%** ✅ | T1 卡死归零，吴方仍弱 |
| iter4 | **5 条 AI bug fix** (见 §22.A) | 85.1% | 48.3% | 36.8% | 0% | trace 工具 + AI 决策审计 |
| **iter5** | **方案 B · 11 张卡数值调整** | **62.1%** | **71.2%** | **9.1%** ✅ | **阵营差进可接受区**（±10%）|

**iter5 验证结论**：阵营差从 65.3% 收敛到 9.1%，但吴稍稍反超（吴对蜀 64.4% / 蜀对吴 50.8%），可能需要 iter6 微调（如 反间计 maxCost 5→4 / 鲁肃 3/5→3/4）。

### iter2 的 4 大机制改造（v5.6 起点）

1. **自适应抽牌** (`engine/index.ts`)
   - T1-T5: 1 张/回合（HS 标准 tempo）
   - T6+: 2 张/回合（解决后期手牌断流）

2. **联动加权抽牌** (`engine/deck.ts: drawCardWithSynergy`)
   - 友方场上有锚点武将 → 牌库中匹配联动卡权重 ×1.8
   - 手牌里有 `comboFlagSet` 卡 → 触发卡权重 ×1.5
   - 软偏置不破坏随机性，但显著提升 combo 成功率

3. **起手保证扩展** (`engine/index.ts: ensureSmoothOpener`)
   - 蜀/吴 都强制保证 1+2+3 费各 1 张
   - 配合 W27 谋议（吴 1 费）让吴方 T1 也能出牌

4. **W27 谋议 · 屯田的吴版** (`data/cards/wu.json`)
   - 1 费法术：下回合开始时额外抽 2 张
   - 对应蜀的屯田（1 费换下回合 +2 mana）
   - 让吴运营到中后期发力，找齐 combo 件

---

## §22.A · AI 决策审计 + Trace 工具（iter4 引入）

### 背景

iter1 的教训：单纯调 AI 启发式对**跨阵营失衡几乎零效果**（65.3%→64.8%）。说明 baseline AI 已经"会玩两个阵营"，但**不一定玩对了**。需要单局可视化才能判断是 AI 失误还是卡牌真弱。

### Trace 工具 (`scripts/sim/trace-game.ts`)

跑 **1 局** AI vs AI，输出**完整 turn-by-turn 决策日志**到 MD：
- 每回合 AI 看到的**所有候选卡 + 评分排名**
- 选了哪张 / 选了哪个目标 / 为什么打这张
- 攻击阶段：攻击者 → 目标 + 选择理由（嘲讽 / 斩杀 / 清威胁 / 打脸）

```bash
cd game
npx tsx --tsconfig=./tsconfig.app.json scripts/sim/trace-game.ts \
  --seed 42 --player wu --ai shu

# 输出 docs/sim-reports/trace-2026-06-11-seed42-wuvsshu.md (~1300 行)
```

实现要点：
- `ai.ts` 暴露 `AiTracer` 接口，`takeAITurn` 接受可选 tracer 参数
- 出牌循环每次调用 `recordPlayDecision({候选, 选择, 目标, 理由})`
- 攻击循环每次调用 `recordAttackDecision({攻击者, 目标, 理由})`
- 0 性能开销（默认 undefined 时跳过）

### 通过 trace 发现的 5 条 AI bug（iter4 修复）

| # | bug | 位置 | 修复 |
|:-:|:--|:-:|:--|
| 1 | **反间计/美人计选最弱目标** | `chooseSpellTarget` | 控场类法术改选"atk×2+hp 最高"（强威胁），不再"血量最低" |
| 2 | **满 HP 治疗仍被打出** | `scoreSpellEffect.healHero` | 过度治疗惩罚 -100→-1000（×0.6 权重 = -600 < -500 阈值，AI 不打）|
| 3 | **火油打空 board 浪费** | `scoreSpellEffect.attackDebuff`（新增）| 我方场上无 minion + HP>18 → 火油价值大幅下降 |
| 4 | **生存压力下仍 setup 锚点** | `scoreCardPlay.anchorTag` | 敌方下回合总攻 ≥ 我方 HP×0.7 时锚点 setup 减 6 分 |
| 5 | **AI 默认打脸，吴 control 反着玩** | `chooseAttackTarget` | 阵营感知：吴优先 trade（atk 最高可斩杀目标），蜀维持 face-first |

iter4 效果：吴对蜀 22.4% → 27.6%（+5.2%），证明**AI 失误约占 5% 的失衡贡献**，剩余 25-30% 是卡牌设计问题。

---

## §22.B · 卡牌数值调整（iter5 · 方案 B）

基于 iter4 trace + bottom 10 弱卡数据，对 11 张卡做了**保守级数值改动**。

### 蜀方 nerf · 5 张

| 卡 | id | 改动 | 理由 |
|:--|:-:|:--|:--|
| 魏延 | S09 | 5/4 → **4/4** + buff +2→+1 | 双弱化：base 攻 -1 + 联动 attack +1 |
| 张飞 | S19 | 3/3 → **2/3** | base 攻 -1（嘲讽保留）|
| 万军取首 | S22 | +1/+1 永久 → **+0/+1** 永久 | 去掉永久攻力增益 |
| 雌雄双股剑 | S23 | atk 2/dur 2 → **1**/dur 2 | 召民兵 token 仍保留，但每次斩击伤害 -1 |
| 百锐刀 | S25 | cost 2 → **3** | 兵器提费 1（HS 标准 2 费应≤1 atk vanilla）|

### 吴方 buff · 6 张

| 卡 | id | 改动 | 理由 |
|:--|:-:|:--|:--|
| 鲁肃 | W02 | 2/4 → **3/5** + 卫戍 + 锚点 | 锚点武将更耐打，撑过 1-2 回合等联动 |
| 草船借箭 | W13 | AoE 1 → **2** + 锚点抽 2 | 能 1 击清掉 2 HP 蜀小怪（弓兵/突骑）|
| 运筹帷幄 | W15 | cost 4 → **3** | 曲线下移，与抽牌组合更稳 |
| 反间计 | W20 | maxCost 3 → **5** | 能反间魏延 / 万军取首等核心 5 费 |
| 天雷 | W29 | 3 dmg → **4 dmg** (combo 时 6 dmg) | combo 链能斩杀 5/4 魏延 |
| 冷箭 | W30 | cost 2 → **1** | 1 费 2 dmg 单体，配 W27 谋议曲线 |

### 实际数据对比（1000 局 each）

| 指标 | iter4 (前) | **iter5 (后)** |
|:--|:-:|:-:|
| 蜀总胜率 | 85.1% | **62.1%** |
| 吴总胜率 | 48.3% | **71.2%** |
| 阵营差 | 36.8% | **9.1%** ✅ |
| 蜀 vs 吴 (跨) | 82.8% | 50.8% |
| 吴 vs 蜀 (跨) | 27.6% | 64.4% |
| 蜀镜像 | 64.0% | 59.6% |
| 吴镜像 | 61.2% | 58.4% |

---

## §22.C · 数值调整方法论（如何复用）

打磨任何 TCG 数值平衡的通用流程：

1. **跑 baseline** · 1000 局，定数据基准（不带任何主观偏好）
2. **AI 决策审计** · 跑 2-3 局 trace，逐回合看 AI 选了什么、为什么。
   - 如果 AI 选择**符合战略**但卡组仍弱 → 是卡牌设计问题
   - 如果 AI 选择**明显失误** → 修 AI 评分公式
3. **AI 修完后重跑** · 看 delta，判断"AI 贡献了多少 / 卡牌贡献了多少"
4. **卡牌微调** · 优先动 bottom 10 弱卡（buff）+ top 5 强卡（nerf），避免大刀阔斧
5. **验证 + 迭代** · 1000 局新数据，看是否进可接受区（阵营差 ≤10%）
6. **避免过度修复** · 如果数据矫枉过正，**回退**优于"再加新机制"

经验法则：
- 阵营差 ≤10% 时：卡组健康，可以专注体验打磨
- 阵营差 10-25%：通过 2-3 张卡数值调整即可纠正
- 阵营差 >25%：通常是**机制层缺陷**（如吴方早期无 1 费可玩卡），需要补卡/改规则
