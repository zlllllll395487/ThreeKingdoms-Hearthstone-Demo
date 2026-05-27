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

**W2-W4（战场逻辑）未开始** — 见 `docs/05-Demo实施方案.md`。
