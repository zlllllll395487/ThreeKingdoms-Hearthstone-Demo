# 三国炉石 · Game（React App）

React 19 + TypeScript 6 + Vite 8 主程序。

> 项目总览见 [上层 README](../README.md)；接手指南见 [HANDOFF.md](../HANDOFF.md)；进度跟踪见 [PROGRESS.md](PROGRESS.md)；资源清单见 [src/assets/ASSETS.md](src/assets/ASSETS.md)。

---

## 启动

```bash
npm install            # 首次安装依赖
npm run dev            # 启动开发服务器，监听 http://localhost:5173/
npm run build          # 生产构建至 dist/
npm run preview        # 本地预览生产构建
npx tsc --noEmit       # TypeScript 静态检查，要求 0 错误
```

AI 对战模拟（1000 局约 1.5 秒）：

```bash
npx tsx --tsconfig=./tsconfig.app.json scripts/sim/run-sims.ts \
  --games 1000 --label myrun
```

输出报告：`docs/sim-reports/sim-YYYY-MM-DD-myrun.md`

---

## 目录结构

```
src/
├─ App.tsx                   根：横屏 / 竖屏画布切换 + 屏幕路由
├─ main.tsx                  React 入口
├─ index.css                 全局变量 / Google Fonts / Tailwind 入口
├─ store/
│  ├─ uiStore.ts             屏幕路由 + 弹窗 + navigateWithLoading
│  └─ gameStore.ts           战斗状态镜像 + dispatch
├─ engine/
│  ├─ index.ts               战斗规则主入口
│  ├─ types.ts               CardData / CardInstance / GameState 等
│  ├─ ai.ts                  启发式 AI 决策（含 trace 接口）
│  ├─ deck.ts                牌库构造与加权抽牌
│  ├─ events.ts              日志条目辅助
│  └─ effects/actions.ts     法术与技能 action 注册表
├─ data/
│  ├─ cards/                 卡牌 JSON · 蜀 23 / 吴 29 / 中立 10 / tokens 4
│  ├─ cardLibrary.ts         卡牌查询接口
│  ├─ assetLoader.ts         Vite import.meta.glob 资源映射（含 .webp fallback）
│  └─ loadingTips.ts         Loading 屏 Tip 文案池
├─ constants/
│  └─ timing.ts              动画与延时常量
├─ screens/                  10 个屏幕组件
│  ├─ Splash / Intro / Loading / MainMenu / Codex
│  ├─ SubPage                通用子页面（覆盖 13 路由）
│  ├─ FactionSelect / Tutorial / Battle / Result
├─ components/
│  ├─ Card/                  卡牌渲染（按 rarity 加载边框）
│  ├─ Modal/                 全局弹窗
│  ├─ CustomCursor/          §27 自定义鼠标光标
│  ├─ ErrorBoundary/         §29 React 异常兜底
│  └─ BackButton/            通用返回按钮
└─ assets/
   ├─ ui/                    约 260 张 UI 资源（主体 PNG + Loading 背景 WebP）
   ├─ portraits/             89 张立绘（WebP）
   ├─ fx/                    §19.6 FX 序列帧
   └─ video/intro.mp4        15 秒开场视频
```

---

## 关键约束

| 项 | 约定 |
|:--|:--|
| 设计画布 | 横屏 1920×1080 与竖屏 1080×1920，按当前屏切换 |
| 缩放策略 | CSS transform scale 等比缩放，多余空间黑色 letterbox 填充 |
| 屏幕组件尺寸 | 使用 `width: 100% / height: 100%`，避免 vw / vh |
| 资源加载 | 新增 PNG / WebP 放入对应目录即自动可用；组件中调用 `getUiAssetUrl()` 或 `getPortraitUrl()` |
| 字体 | Google Fonts 全 4 套（Ma Shan Zheng / ZCOOL XiaoWei / Long Cang / Noto Serif SC），`index.css` 中引入 |
| HMR | Vite 8 默认开启；改 CSS 即时生效，改资源后需硬刷（Ctrl+Shift+R） |

---

## 资源工具脚本

| 脚本 | 用途 |
|:--|:--|
| `scripts/copy_assets.py` | 从 `assetofsanguo/` 批量复制资源到 `src/assets/ui/`，含中文 → 英文重命名 |
| `scripts/slice_image.py` | 按 alpha 通道密度智能切图 |
| `scripts/import-cardvisuals.mjs` | 导入 cardvisual 合成版资源 |
| `scripts/import-portraits.mjs` | 导入立绘 |
| `scripts/import-fx.mjs` | 导入 FX 序列帧 |
| `scripts/convert-to-webp.mjs` | 批量 PNG → WebP（仅立绘 + Loading 背景，cardvisual 与其它 UI 保留 PNG） |
| `scripts/preview-compression.mjs` | 压缩对比样本生成（输出到 `compression-preview/`） |
| `scripts/sim/` | AI 对战模拟框架（详见 [上层 README §22 章节](../README.md#数值平衡与模拟对局体系v56--22)） |

---

## 当前进度速览

| 阶段 | 状态 |
|:--|:-:|
| W1 视觉打磨 | Done |
| W2 战场逻辑（含 §19 全部子项） | Done |
| §22 数值平衡 iter6.1 | Done（阵营差 5.6%） |
| §23 AI 难度系统 | Done |
| §24 战斗内自动托管 | Done |
| §25 教程屏 | Done |
| §26 资源预加载（首版） | Done |
| §27 自定义鼠标光标 | Done |
| §28 commit 历史规范化 | Done |
| §29 分屏渐进预加载（Loading 屏重做 + Tip + 多背景） | Done |
| §30 立绘与 Loading 背景 WebP 化 | Done |
| §22-iter7 吴方 AoE 二轮微调 | Done（待玩家体验验收） |
| GitHub Pages 自动部署 | Done |
| W5 体验层面打磨 | Pending |

详见 [PROGRESS.md](PROGRESS.md)。
