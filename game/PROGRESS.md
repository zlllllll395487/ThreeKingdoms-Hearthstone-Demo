# 三国炉石 Demo · 项目进度存档

> 最后更新：2026-05-27 · W1 视觉打磨全部落地

---

## 当前阶段

**W1 视觉打磨 · 完成 ✅** — 6 屏全部接入真实 PNG 美术资源，TS 0 错误。

下一阶段：**W2 战场逻辑实装**（未开始）— 见 [docs/05-Demo实施方案.md](../docs/05-Demo实施方案.md)。

---

## ✅ 已完成

### 1. 启动流程（4 屏串联）

```
intro.mp4 (立即可跳过)
  → splash「进入游戏」(协议勾选 + 区服选择)
  → loading 3s (断断续续进度条)
  → mainmenu
```

刷新跳过 intro 由 LocalStorage `sgls_intro_seen` 控制。

### 2. 六屏组件全接入真图

| 屏 | 文件 | 关键资源 |
|---|---|---|
| Splash | `screens/Splash/SplashScreen.tsx` | splash_bg / logo_main / btn_enter_game / pill_server / 3 工具图标 + 7 灯笼晕点 + 12 花瓣飘落 |
| Intro | `screens/Intro/IntroVideo.tsx` | intro.mp4 |
| Loading | `screens/Loading/LoadingScreen.tsx` | loading_bg + 3 秒 14 步进度序列 |
| MainMenu | `screens/MainMenu/MainMenu.tsx` | player_ui_block + 3 货币 + 4 Tab + 3 卡叠层 + war-room 底板 + 桃园 + 长公告卷轴 + 设置 Tab |
| Codex | `screens/Codex/CodexScreen.tsx` | codex_background + logo_codex + 17 张卡片渲染 |
| Battle | `screens/Battle/BattleScreen.tsx` | battle-background + icon_weapons + text_battle_title + 双 PNG 按钮（占位） |
| Result | `screens/Result/ResultScreen.tsx` | win/defeat_background + text_victory/defeat + 双 PNG 按钮 |

### 3. Card 组件完整渲染（17 张卡）

`components/Card/Card.tsx` 按 rarity 加载边框 PNG，模块化层叠：
- 立绘（top:4%, left/right:7%, height:62%, object-fit:cover）
- 边框（rarity 决定：common/rare/epic/legendary）
- 名字横幅（字数决定：name_short ≤ 2 / name_medium ≤ 4 / name_long > 4）
- 数值球（cost_N / attack_N / health_N，N=1-10）
- 关键词印章（kw_taunt / charge / rush / stealth / divineShield / windfury / poisonous / lifesteal / freeze / battlecry / deathrattle / spellPower / silence）
- 阵营印章（emblem_shu/wei/wu/qun/neutral）

### 4. DevelopingModal · 全局开发中弹窗

`components/Modal/DevelopingModal.tsx` 使用 `modal_developing.png` 整图当背板，动态消息覆盖中央。

### 5. 设计画布固定 16:9

`App.tsx` 用 CSS transform scale 把 1920×1080 设计画布按浏览器窗口等比缩放，多余空间黑边。

### 6. 古风字体

`index.css` 引入 Google Fonts：Ma Shan Zheng / ZCOOL XiaoWei / Long Cang / Noto Serif SC。变量：`--font-kai / --font-display / --font-serif / --font-numeric`。

---

## 🟠 待办（按优先级）

### P0 · 立绘待出（7 张）

需要 AI 出图后命名放进 `src/assets/portraits/`：

- `taoyuan.png` — 桃园结义场景
- `rende.png` — 仁德之政场景
- `wanjian.png` — 万箭齐发场景
- `mubing.png` — 募兵令场景
- `xiuyang.png` — 休养生息场景
- `moushi.png` — 谋士人物（半身）
- `qinglongdao.png` — 青龙偃月刀兵器

Prompt 模板与风格统一规范见 chat 历史；可参考 [docs/08-P1-P2武将立绘完整Prompt集合.md](../docs/08-P1-P2武将立绘完整Prompt集合.md)。

### P1 · 玩家 UI 12 件套（M1）

当前用 `player_ui_block.png` 单图整合版临时替代。未来拆分为：头像框（3 稀有度）/ 默认头像（4 类）/ 等级章 / 名牌 / 称号绶带 / 经验条 / VIP 章 / 在线状态点。Sprite sheet prompt 已生成。

### P2 · W2 战场逻辑

详见 [docs/05-Demo实施方案.md](../docs/05-Demo实施方案.md)：
- 双方各 7 格战场
- 拖拽出牌 + 法力扣除
- 攻击 / 死亡结算
- 6 个核心关键词实装（突袭 / 镇守 / 威名 / 遗志 / 神圣护盾 / 嘲讽）

---

## 📋 已知 / 可能要调

1. **某些立绘 object-position 微调**：现在统一 `50% 22%`，若某张立绘特殊构图导致脸偏可在 Card.module.css 单独 `[data-id="xxx"]` 调
2. **桃园 banner 容器宽度 260**：若 PNG 比例不同导致拉伸/留白可微调
3. **货币 pill 顶部对齐 -14px**：硬刷后若与玩家块不齐再调

---

## 📁 关键文件路径速查

```
代码：d:/三国炉石/game/src/
  ├─ App.tsx                          根 + 16:9 固定画布
  ├─ store/uiStore.ts                 屏幕路由 + 弹窗
  ├─ engine/types.ts                  CardData / Rarity 类型
  ├─ data/cards/{shu,neutral,weapons}.json
  ├─ data/cardLibrary.ts              卡牌查询接口
  ├─ data/assetLoader.ts              import.meta.glob 资源加载
  ├─ components/Card/                 卡牌组件
  ├─ components/Modal/                开发中弹窗
  └─ screens/                         7 个屏幕

资源：d:/三国炉石/game/src/assets/
  ├─ ui/                              121 张 PNG（清单见 ASSETS.md）
  ├─ portraits/                       11 张立绘（清单见 ASSETS.md）
  └─ video/intro.mp4

设计文档：d:/三国炉石/docs/           7 份策划文档
计划文件：C:/Users/zhall/.claude/plans/rustling-spinning-octopus.md
```

## 启动命令

```bash
cd d:/三国炉石/game
npm run dev
# → http://localhost:5173/
```

测试完整流程：DevTools → Application → Local Storage → 清掉 `sgls_intro_seen` → 刷新。

---

*W1 视觉打磨阶段于 2026-05-27 完成，等待出图后进入 W2 战场逻辑实装。*
