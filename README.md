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

| 版本 | 改动 | 蜀胜率 | 吴胜率 | 起手卡死 |
|:--|:--|:-:|:-:|:-:|
| baseline | 现规则 | 99.3% | 34.0% | 71.7% |
| iter1 | AI 强化吴策略识别 | 99.1% | 34.3% | 71.7% |
| iter2 | **机制改造**：T6+ 抽 2 张 / 联动加权抽 (×1.8) / 起手保证 1+2+3 / W27 谋议 | 99.2% | 34.1% | **31.9%** ✅ |

**iter2 验证结论**：体验 KPI 全部回归健康（起手卡死 -39.8% / 终局手牌 +1.8 / 出牌 +0.45/回合），但**跨阵营失衡需要调卡牌数值**（机制层无法解决）。

### iter2 的 4 大机制改造（v5.6 核心）

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
