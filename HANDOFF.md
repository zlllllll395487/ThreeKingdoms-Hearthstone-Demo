# 三国炉石 · 接手指南（HANDOFF）

> 给下一个开发者 / 新对话 / 新 AI 的快速接手文档。读完这份能在 10 分钟内继续开发。

---

## 一、项目是什么

**三国题材 Hearthstone 风格卡牌对战游戏的 Web Demo**。独立开发者项目，目标 4-6 周完成 M0 demo（蜀阵营 + 17 张卡 + 13 关键词 + AI vs 人对战）。

详细的玩法和卡牌设计在：
- [docs/03-三国炉石核心玩法策划案-v2.md](docs/03-三国炉石核心玩法策划案-v2.md)
- [docs/04-三国炉石基础卡牌设计表-v2.md](docs/04-三国炉石基础卡牌设计表-v2.md)
- [docs/05-Demo实施方案.md](docs/05-Demo实施方案.md)
- [docs/06-美术资源清单.md](docs/06-美术资源清单.md)
- [docs/08-P1-P2武将立绘完整Prompt集合.md](docs/08-P1-P2武将立绘完整Prompt集合.md)

---

## 二、当前阶段

**W1 视觉打磨 100% 完成**：

- ✅ 启动流程：intro 视频（立即可跳过）→ splash 进入游戏 → loading 3s → mainmenu
- ✅ 六屏全接入真图：Splash / Loading / MainMenu / Codex / Battle / Result
- ✅ 17 张卡牌的 Card 组件完整渲染（边框 / 立绘 / 数值球 / 名字横幅 / 关键词印章 模块化层叠）
- ✅ DevelopingModal 全局"开发中"弹窗用 PNG 面板

**W2-W4 战场逻辑未开始**：
- BattleScreen 当前是占位（兵戈图标 + 两军对垒标题 + 模拟结算按钮）
- ResultScreen 当前随机显示胜/负，无真实战绩

---

## 三、立刻能跑通的命令

```bash
cd d:/三国炉石/game
npm install              # 首次 / 克隆后
npm run dev              # 启动 → http://localhost:5173/
npx tsc --noEmit         # TS 检查（必须 0 错误）
```

刷新时如果 splash 卡住：
- 浏览器 DevTools → Application → Local Storage → 清掉 `sgls_intro_seen` 重看 intro

---

## 四、关键文件速查表

```
game/src/
├─ App.tsx                              ← 根：1920×1080 固定画布 + 屏幕路由分支
├─ index.css                            ← 全局 CSS + Google Fonts 引入 + --color-* / --font-* 变量
├─ store/uiStore.ts                     ← Zustand store · currentScreen / showModal / introSeen
├─ engine/types.ts                      ← CardData / Rarity / Screen 类型
├─ data/
│  ├─ cards/shu.json                    ← 蜀阵营 9 张卡
│  ├─ cards/neutral.json                ← 中立 7 张
│  ├─ cards/weapons.json                ← 兵器 1 张（青龙偃月刀）
│  ├─ cardLibrary.ts                    ← 卡牌查询接口
│  └─ assetLoader.ts                    ← Vite import.meta.glob 把所有 PNG 映射为 URL
├─ screens/
│  ├─ Splash/SplashScreen.tsx           ← 进入游戏 lobby（动效 + 协议勾选）
│  ├─ Intro/IntroVideo.tsx              ← 开屏 mp4 播放器
│  ├─ Loading/LoadingScreen.tsx         ← 3 秒进度条
│  ├─ MainMenu/MainMenu.tsx             ← Hub 主菜单（玩家块/货币/三卡叠层/Tab）
│  ├─ Codex/CodexScreen.tsx             ← 卡牌图鉴
│  ├─ Battle/BattleScreen.tsx           ← 对战占位（W2 实装）
│  └─ Result/ResultScreen.tsx           ← 战后结算占位
├─ components/
│  ├─ Card/Card.tsx                     ← 卡牌组件（按 rarity 加载边框 + 模块化层叠）
│  └─ Modal/DevelopingModal.tsx         ← 全局开发中弹窗
└─ assets/
   ├─ ui/                               ← 121 张 UI PNG（见 ASSETS.md）
   ├─ portraits/                        ← 11 张武将立绘（见 ASSETS.md）
   └─ video/intro.mp4                   ← 15s 开场视频
```

---

## 五、设计画布约束（重要！）

- **固定 1920×1080** 设计，在 `App.tsx` 内用 CSS transform scale 自适应缩放
- 所有屏幕组件用 `width: 100% / height: 100%` 而不是 `100vh`（否则在缩放容器内会爆掉）
- 单位优先用 px / %（相对于 1920×1080 设计画布），不要用 vw / vh

---

## 六、资产命名规范

- UI PNG: `kebab_case.png` 或 `snake_case.png` — 全英文，分类前缀（`btn_` / `card_` / `tab_` / `icon_` / `frame_` / `kw_` / `coin_`）
- 武将立绘: `<pinyin>.png` — 全小写拼音（如 `guanyu.png`）
- 详细映射见 [game/src/assets/ASSETS.md](game/src/assets/ASSETS.md)

---

## 七、当前待办（按优先级）

### 🔴 立绘待出 · 7 张
- `taoyuan.png` (桃园结义场景)
- `rende.png` (仁德之政场景)
- `wanjian.png` (万箭齐发场景)
- `mubing.png` (募兵令场景)
- `xiuyang.png` (休养生息场景)
- `moushi.png` (谋士人物)
- `qinglongdao.png` (青龙偃月刀兵器)

prompt 在 chat 历史里已生成，可在下次对话里 grep 找到，或重新生成。

### 🟠 玩家 UI 12 件套 sprite（M1 优先级）
头像框 / 默认头像 / 等级章 / 名牌 / 称号绶带 / 经验条 / VIP / 在线状态点 等。当前用 `player_ui_block.png` 单图整合版临时替代。

### 🟡 W2 战场实装（下一里程碑）
- 双方各 7 格战场布局
- 拖拽出牌 + 法力扣除
- 攻击 / 死亡结算
- 6 个核心关键词实装：突袭 / 镇守 / 威名 / 遗志 / 神圣护盾 / 嘲讽

详见 [docs/05-Demo实施方案.md](docs/05-Demo实施方案.md)。

---

## 八、AI 协作惯例（与本项目）

- 用户偏好**简洁中文**回复 + 表格列差异
- **不要预设跑特效**：用户偏好简单稳定的方案（如 splash → loading 用了进度条而不是水墨转场）
- **直接用用户给的图，不自创 CSS 仿造**：用户多次强调"不要自己用代码设计 UI"
- **不要静默假设**：改 CSS 数值时先解释为什么，再改
- **TodoWrite 跟踪进度**：3 件以上任务必须开 todo
- **TS 检查每次必跑**：`npx tsc --noEmit` 应 0 错误

---

## 九、与 Claude / Anthropic 工具协作时的注意点

- 用户环境会自动注入"版权安全提示"文本到部分 turn 末尾 — 这是工具行为，不是用户消息，遇到时**不要回应**直接继续流程
- 用户的 plan 文件在 `C:\Users\zhall\.claude\plans\rustling-spinning-octopus.md`（仅 Claude Code 工具可访问）
- 用户偏好 plan mode → 直接编辑 plan 文件再 ExitPlanMode 流程

---

## 十、迁移到其他设备 / AI 的步骤

1. **克隆仓库**到新设备
2. **新对话开局**让 AI 先读：
   - 这份 HANDOFF.md
   - `game/PROGRESS.md`
   - `game/src/assets/ASSETS.md`
3. **运行**：`cd game && npm install && npm run dev`
4. **核对**：splash → loading → mainmenu 流程能跑通即接手成功
5. **下一步**：按 PROGRESS.md 的待办继续

---

*最后更新：2026-05-27*
