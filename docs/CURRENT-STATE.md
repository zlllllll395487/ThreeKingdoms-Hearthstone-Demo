# 项目当前真相 · CURRENT-STATE

> **最后更新**：2026-06-16 · 对应 commit `e163909`
>
> 这是项目的**单页快照**，不讲历史，只讲「现在是什么」。
> 新协作者 / 新对话 / 新 AI 接手时**第一份读它**。
> 决策来龙去脉看 [DECISIONS.md](DECISIONS.md)，操作约定看 [HANDOFF-AI.md](HANDOFF-AI.md)。

---

## 一句话定位

三国题材 Hearthstone 风格卡牌对战游戏的 Web 端 Demo。React 19 + TypeScript 6 + Vite 8。已部署至 GitHub Pages，AI 对战模拟框架支撑数值平衡决策。

**在线访问**：https://zlllllll395487.github.io/ThreeKingdoms-Hearthstone-Demo/

---

## 现在能跑得通的功能

| 模块 | 状态 |
|:--|:-:|
| 启动流程：splash → loading → mainmenu | ✓ |
| 主菜单 hub（货币 / Tab / 三卡叠层 / 侧栏） | ✓ |
| 卡牌图鉴（蜀 / 魏 / 吴 / 群 / 中 / 器 六 Tab） | ✓ |
| 阵营选择 + AI 难度选择（生手 / 标准 / 宗师） | ✓ |
| 教程屏（竖屏 1080×1920，7 页） | ✓ |
| 战斗（拖拽出牌 / 攻击 / 死亡结算 / 13 关键词） | ✓ |
| 战斗内自动托管 + 取消托管提示 | ✓ |
| 战后结算 → 返回主菜单 | ✓ |
| 13 个子页面（剧情 / 任务 / 商城 / 活动 / 招募 / 卡组等占位背景） | ✓ |
| 自定义鼠标光标（长枪 PNG + hover 光晕 + 点击波纹） | ✓ |
| 分屏渐进预加载（按目标屏阻塞加载所需资源） | ✓ |
| Loading 屏（4 张随机背景 + 卷轴 Tip + 匾额 + 进度条金属化） | ✓ |
| ErrorBoundary 异常兜底 | ✓ |

---

## 现在**没有**的功能（不是 bug，是简化）

| 缺什么 | 备注 |
|:--|:--|
| Mulligan 开局换牌 | 用固定起手 + 起手保证机制替代 |
| 主公技（Hero Power） | 已预留 `heroPowerUsed` 字段但未实装 |
| The Coin 先后手补偿 | 后手仅多 1 张起手卡 |
| 玩家选择目标的 Discover UI | 简化为随机抽取（`engine/effects/actions.ts` 有 TODO 标记） |
| 兵器选择目标 | 简化为攻击英雄 |
| Battlepet / Mercenary 等大版本机制 | 不在 Demo 范围 |

新协作者看代码时遇到「为什么这里没做」，多数是上面之一，不是 bug。

---

## 卡牌数据规模

| 阵营 | 张数 |
|:--|:-:|
| 蜀 | 23 |
| 吴 | 29 |
| 中立 | 10 |
| Token | 4 |
| **合计** | **66** |

魏 / 群两阵营当前**仅有 Tab，无卡**（图鉴 Tab 显示「暂无卡牌」），M0 范围之外。

---

## 资源规模

| 类目 | 数量 | 体积 | 格式 |
|:--|:-:|:-:|:-:|
| UI 资源 | ~260 张 | ~30 MB | PNG 主体 |
| cardvisual（卡牌主视觉） | 71 张 | 9.1 MB | WebP q=88 / 800×1104 |
| 立绘 portraits | 89 张 | 18.5 MB | WebP q=88 |
| Loading 背景 | 4 张 | 0.6 MB | WebP q=88 |
| 总和（dist 构建产物） | — | ~110 MB | — |

---

## 上一轮工作（commit `e163909`）

- cardvisual 71 张从 PNG 备份重新压缩至 800×1104（q=88 WebP）
  - 20.6 MB → 9.1 MB（节省 56%）
  - 从原始 PNG 算累计节省 80%
  - 4.2× down-scale 比 6× 更接近原生采样，显示更锐利
- Loading 屏 5 项视觉调优（字体层级 / 金属化进度条 / 暗角加强 / 文字呼吸 / Tip 关键词加粗）
- 文案主策审校的 30 条 Tip + 19 条匾额 caption + 「兵马未动，粮草先行」状态文案

---

## 下一步打算

| 优先级 | 项 |
|:--|:--|
| 等用户验收 | iter7 吴方 AoE 二轮微调（commit `8de2ee5`）— 代码已 ready，等玩家实际游戏体验决定保留或回调 |
| Pending | W5 体验层面打磨（音效 / 战斗细节动效 / 卡牌交互手感） |
| Pending | 玩家 UI 12 件套拆分（当前用 `player_ui_block.png` 单图整合版） |
| 视情况 | BattleScreen.tsx（1293 行）拆分 |

---

## 已知坑 / 反直觉点（很重要）

接手者读代码时遇到下面这些先别改，去 [DECISIONS.md](DECISIONS.md) 查为什么这么做。

| 反直觉点 | 一句话解释 |
|:--|:--|
| 全游戏禁用 `loading="lazy"` | 我们的 App.tsx 用 `transform: scale()` 等比缩放设计画布，Chrome IntersectionObserver 在 transform 父容器下算不出可见性 |
| 庞统（N02）`rarity: rare` 不是 epic | cardvisual_pangtong.png 当时按 rare 模板出图了，让数据匹配素材；rarity 不影响 AI 评分与战斗逻辑 |
| 设计画布是固定 1920×1080 / 1080×1920 | 不是响应式布局；缩放交给 transform，子组件用 `width: 100% / height: 100%`，禁用 vw / vh |
| Battle 与 Tutorial 用竖屏 | 其余屏全横屏，`App.tsx` 中 `PORTRAIT_SCREENS` 集合决定切换 |
| 卡牌 portrait 字段仍写 `.png` 但磁盘是 `.webp` | `assetLoader.ts` 中 `tryWebpFallback` 透明转向，零修改卡牌 JSON |
| `cardvisual_*.png` 已不存在，全部 `.webp` | 同上，`getUiAssetUrl` fallback 处理 |
| `loadedUrls` 全局 Set 缓存已加载 URL | 重复进入同一屏几乎瞬时完成，不要清空 |
| `endTurn` 中清空 `damageVulnerability` | iter7 火油机制需要，跨回合不残留 |
| `preloadBatched` 的 `img.onerror` 也算 `done()` | 设计如此 — 防止单张图失败永久卡进度条 |

---

## 部署 / 上线

- **触发**：push 到 master 分支 → GitHub Actions 自动构建 + 部署
- **workflow**：`.github/workflows/deploy-pages.yml`
- **构建命令**：`cd game && npm ci && npm run build`
- **构建产物**：`game/dist/`
- **访问地址**：`https://zlllllll395487.github.io/ThreeKingdoms-Hearthstone-Demo/`
- **构建时长**：1.5–3 分钟

如何判断 push 后线上是否生效：见 [HANDOFF-AI.md](HANDOFF-AI.md) 中「Deployment Verification」节，或直接看 GitHub Actions 页面绿色 ✓。

---

## 维护这份文档的纪律

**每次有意义的 commit（feat / fix / perf / refactor）后**，作者（人或 AI）需做：

1. 若改了**规模数字 / 阶段状态 / 已知坑**，更新本文件对应章节
2. 若做了**架构级或反直觉决策**，往 [DECISIONS.md](DECISIONS.md) 追加一条
3. 顶部「最后更新 commit hash」改为本次 commit hash
4. 文档改动**与代码改动同一 commit 一起 push**

这是 docs-as-code，仓库 = 单一可信源。
