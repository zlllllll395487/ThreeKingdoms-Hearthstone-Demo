# 三国炉石 · Game (React App)

React + TypeScript + Vite 主程序。

> 项目总览见 [上层 README](../README.md)；接手指南见 [HANDOFF.md](../HANDOFF.md)；进度跟踪见 [PROGRESS.md](PROGRESS.md)；资源清单见 [src/assets/ASSETS.md](src/assets/ASSETS.md)。

---

## 启动

```bash
npm install            # 首次安装依赖
npm run dev            # 启动 dev → http://localhost:5173/
npm run build          # 生产构建 → dist/
npm run preview        # 预览生产构建
npx tsc --noEmit       # TS 检查（应 0 错误）
```

---

## 目录结构

```
src/
├─ App.tsx                 ← 1920×1080 固定画布 + 屏幕路由
├─ main.tsx                ← React 入口
├─ index.css               ← 全局变量 / Google Fonts / Tailwind 入口
├─ store/uiStore.ts        ← Zustand store（currentScreen / modal / introSeen）
├─ engine/types.ts         ← CardData / Rarity 类型
├─ data/
│  ├─ cards/               ← 17 张卡 JSON（shu + neutral + weapons）
│  ├─ cardLibrary.ts       ← 卡牌查询接口
│  └─ assetLoader.ts       ← Vite import.meta.glob 资源映射
├─ screens/                ← 7 个屏幕（Splash / Intro / Loading / MainMenu / Codex / Battle / Result）
├─ components/             ← Card + DevelopingModal
└─ assets/
   ├─ ui/                  ← 121 张 PNG（按用途分类见 ASSETS.md）
   ├─ portraits/           ← 11 张武将立绘
   └─ video/intro.mp4      ← 15s 开场视频
```

---

## 关键约束

- **固定 1920×1080 设计画布**：所有屏幕组件用 `width: 100%` 而非 `100vh`
- **资源加载**：新增 PNG 放进 `src/assets/ui/` 或 `src/assets/portraits/` 即自动可用，组件中 `getUiAssetUrl('name.png')` 取用
- **字体**：Google Fonts 全 4 套（Ma Shan Zheng / ZCOOL XiaoWei / Long Cang / Noto Serif SC）已在 `index.css` 引入
- **HMR**：Vite 5 默认开启；改 CSS 即时生效，改资源后需硬刷（Ctrl+Shift+R）

---

## 常用脚本

- `scripts/copy_assets.py` — 从 `assetofsanguo/` 批量复制资源到 `src/assets/ui/` + 中文 → 英文重命名
- `scripts/slice_image.py` — 智能切图（按 alpha 通道密度分析）

---

## 当前进度速览

W1 视觉打磨 100% 完成，6 屏全接入真图。下一阶段 W2 战场逻辑实装。详见 [PROGRESS.md](PROGRESS.md)。
