# 决策日志 · DECISIONS

> 项目重要决策的来龙去脉。**append-only**（只新增不删除）。
>
> 接手者看到代码里反直觉的实现，先查这里。
> 每条记录回答三个问题：**为什么这么做** / **考虑过的备选方案** / **是否被后续撤销过**。

---

## 索引

- [D-001 设计画布固定 1920×1080 + transform: scale 缩放](#d-001-设计画布固定-1920x1080--transform-scale-缩放)
- [D-002 全游戏禁用 `<img loading="lazy">`](#d-002-全游戏禁用-img-loadinglazy)
- [D-003 cardvisual 资源格式的三次反转](#d-003-cardvisual-资源格式的三次反转)
- [D-004 庞统 rarity 故意降为 rare](#d-004-庞统-rarity-故意降为-rare)
- [D-005 立绘 portraits 全部转 WebP](#d-005-立绘-portraits-全部转-webp)
- [D-006 Loading 屏分级渐进预加载](#d-006-loading-屏分级渐进预加载)
- [D-007 W18 火油机制改造（iter7，待玩家验收）](#d-007-w18-火油机制改造iter7待玩家验收)
- [D-008 ESLint id-length 设为 warn 而非 error](#d-008-eslint-id-length-设为-warn-而非-error)
- [D-009 全游戏 img 禁用拖拽与选中](#d-009-全游戏-img-禁用拖拽与选中)
- [D-012 在线对战架构：权威服务器复用前端引擎](#d-012-在线对战架构权威服务器复用前端引擎)
- [D-010 教程屏返回目标按入口动态判定](#d-010-教程屏返回目标按入口动态判定)
- [D-011 `preloadBatched` 的 `onerror` 也算 done](#d-011-preloadbatched-的-onerror-也算-done)

---

## D-001 设计画布固定 1920×1080 + transform: scale 缩放

- **日期**：W1 阶段
- **Context**：浏览器窗口大小千差万别。Web 游戏需要一致的视觉布局，每个屏元素位置不能因窗口大小而漂移。
- **Decision**：所有屏组件按 1920×1080（横屏）或 1080×1920（竖屏）固定尺寸布局，根组件 `App.tsx` 用 CSS `transform: scale(scale)` 等比缩放到当前窗口，余下空间填黑色 letterbox。
- **Alternatives 考虑过但拒绝**：
  - 响应式 flex / grid 布局 — 拒绝理由：每个屏需要重新设计断点；卡牌、立绘等美术资源不能弹性
  - vw / vh 单位 — 拒绝理由：缩放容器内 vh 会基于窗口高度而非画布高度计算，导致溢出
- **后果（重要！）**：
  - 子组件**必须**用 `width: 100% / height: 100%`，禁用 `vw / vh`
  - `transform` 父容器导致 Chrome 的 IntersectionObserver 算可见性失败 → [D-002](#d-002-全游戏禁用-img-loadinglazy) 的根因
- **撤销**：从未撤销，是项目核心架构约束。

---

## D-002 全游戏禁用 `<img loading="lazy">`

- **日期**：2026-06-15 · commit `27f407a`
- **Context**：Codex 卡牌图鉴渲染时，cardvisual 文件 Network 显示 200 已下载，但 `<img>` 元素仍渲染为空白。
- **根因**：[D-001](#d-001-设计画布固定-1920x1080--transform-scale-缩放) 的 `transform: scale()` 父容器让 Chrome 的 native lazy loading 计算可见性失败（IntersectionObserver bug），`<img>` 始终停留在「待加载」零尺寸状态。
- **Decision**：所有 `<img>` 去掉 `loading="lazy"`，改用 `decoding="async"` 让浏览器立即下载但异步解码。
- **Alternatives 考虑过但拒绝**：
  - 自定义 IntersectionObserver 显式管理 — 拒绝理由：维护成本高
  - 砍掉 `transform: scale()` 改响应式 — 拒绝理由：D-001 的核心架构，改造成本极高
- **撤销**：从未撤销。本项目所有 `<img>` 都不要写 lazy。

---

## D-003 cardvisual 资源格式的三次反转

cardvisual_*.png 是 71 张「卡牌 + 边框」合成图，作为图鉴主视觉。**这是项目里反转最多的资源决策**，新接手者看到代码必看本条。

### v1（W1 → 2026-06-15）：保留全 PNG

- **理由**：cardvisual 是图鉴展示给玩家看的，画质优先
- **状态**：71 张 PNG，总和 43.9 MB
- **撤销原因**：弱网下 Codex 加载 + 解码体感非常差

### v2（commit `19d77af`）：转 WebP q=92 / 1133×1563 保持原分辨率

- **理由**：q=92 在卡牌艺术上肉眼无差异，体积节省 50%
- **状态**：71 张 WebP，总和 20.6 MB
- **撤销原因**：1133→190 px 6× down-scale 让浏览器需平均过多像素，反而模糊；体积仍偏大

### v3（commit `e163909`）：重压至 800×1104 q=88（当前）

- **理由**：800→190 px 4.2× down-scale 更接近原生采样率，反而更锐利；zoom modal 800→600 px 1.33× 肉眼不可分辨
- **状态**：71 张 WebP，总和 9.1 MB
- **回滚保障**：原 45 MB PNG 仍在 `backup-original-png/cardvisuals/`（已 .gitignore）
- **撤销**：当前为最终方案，未撤销

### 经验教训

新接手者若觉得「cardvisual 应该再压一压 / 应该回到 PNG」，请先看 v1 / v2 撤销原因。

---

## D-004 庞统 rarity 故意降为 rare

- **日期**：2026-06-15 · commit `606e7b9`
- **Context**：玩家发现庞统卡名带位置异常，与其它 epic 卡（黄月英 / 魏延 / 鲁肃等）对比错位。
- **根因**：`cardvisual_pangtong.png` 出图时按 **绿色 rare 模板**生成（其它 12 张 epic 卡均为蓝色 epic 模板）。Card.module.css 按 `data-rarity="epic"` 把 nameBanner 上移到 `top: 56%`，与素材的名带位置（rare 模板的 61%）错位，文字浮在错的位置。
- **Decision**：把 `neutral.json` 中 N02 庞统的 `"rarity": "epic"` 改为 `"rarity": "rare"`，让数据匹配素材。
- **Alternatives 考虑过但拒绝**：
  - 重新出 epic 模板的 cardvisual_pangtong.png — 拒绝理由：需要重新美术工作流，临时方案先解决眼前 bug
  - 改 Card.module.css 容忍两种位置 — 拒绝理由：会引入更多复杂度
- **影响范围**：rarity 字段不参与 AI 评分（`engine/ai.ts` 中 grep `rarity` 结果为 0）与战斗逻辑，仅影响视觉
- **撤销条件**：若后续重新出 epic 模板的 cardvisual_pangtong.png，可同步把 rarity 改回 epic
- **撤销**：当前未撤销

---

## D-005 立绘 portraits 全部转 WebP

- **日期**：2026-06-15 · commit `2742842`
- **Context**：89 张立绘原为 PNG，总和 71 MB；弱网首次加载耗时长
- **Decision**：全部转 WebP q=88（与 cardvisual 一起，由 `convert-to-webp.mjs` 处理）
- **关键发现**：89 张立绘均**无 alpha 通道**（`check-alpha.mjs` 验证），所以转 WebP 无需考虑透明度损失
- **效果**：71 MB → 18.5 MB（节省 74%）
- **回滚保障**：原 PNG 备份在 `backup-original-png/portraits/`
- **撤销**：未撤销

---

## D-006 Loading 屏分级渐进预加载

- **日期**：2026-06-15 · commit `ceba17d`
- **Context**：原始预加载策略是「全部资源 + 60 秒 safety timeout」，弱网用户经常被 timeout 强跳到主菜单后看到大量黑屏
- **Decision**：每个目标屏定义自己的「必现资源」清单（约 30-100 张小 UI），LoadingScreen 阻塞等待这些就绪后跳转；非必现资源（如 cardvisual / portraits）由 Card 组件加载时按需下载
- **关键改动**：
  - `uiStore` 新增 `pendingScreen` 状态 + `navigateWithLoading(target)` 动作
  - 每屏 caption 文案差异化（兵书阵卷 / 中军大帐 等）
  - LoadingScreen 随机 4 张背景 + 30 条 Tip 文案池
- **撤销**：未撤销
- **后续微调**：
  - commit `c677c53`：Codex / Battle 预加载移除 cardvisual + portraits（避免 100+ 文件 HTTP 队列拥塞）
  - commit `606e7b9`：Codex 加回首 Tab（蜀）的 cardvisual + portrait，让进度条诚实反映「默认 tab 就绪」

---

## D-007 W18 火油机制改造（iter7，待玩家验收）

- **日期**：2026-06-15 · commit `8de2ee5`
- **Context**：吴方 AoE 在 iter6.1 模拟数据中偏强，用户反馈对蜀方实际游戏体感也过强
- **Decision**：
  - W18 火油：`attackDebuff -2 攻击` → `applyDamageVulnerability +1 受击伤害`
  - W19 赤焰焚营：combo flag 模式 → conditional 单体（带 oiled 标记的目标改造成 6 伤害）
  - W09 火烧赤壁、W13 草船借箭、W28 截江断流：加 `maxTargets` + `lowTargetBonus` 寡目标加伤机制
  - W06 吕蒙：新增 `anchor_ramp` 锚点，W28 改吃此锚点
- **iter7 1000 局模拟结果**：阵营差从 5.6% 扩大到 15.2%（吴方在 AI 对战中变弱），但跨阵营双向胜率达标
- **状态**：**待玩家实际体验验收**。用户决策：「以玩家体验为准，先别基于模拟数据再回调」
- **撤销条件**：若玩家反馈火油过弱，需考虑回退至 attackDebuff 旧机制
- **撤销**：当前未撤销，观察中

---

## D-008 ESLint id-length 设为 warn 而非 error

- **日期**：2026-06-15 · commit `233c00f`
- **Context**：Tier 1 加固期，希望长期约束单字母变量名（避免 `const x = ...` 这类）
- **Decision**：`eslint.config.js` 加 `'id-length': ['warn', { min: 2, exceptions: ['_', 'i', 'j', 'x', 'y'] }]`，仅警告不阻塞构建
- **Alternatives 考虑过但拒绝**：
  - `error` 级别 — 拒绝理由：现存代码有大量短变量名，立刻 error 会阻塞所有 commit
  - 完全不加 — 拒绝理由：失去长期改善的杠杆
- **后续工作**：单文件改动时顺手把警告处的变量名改长，逐步清零
- **撤销**：未撤销

---

## D-009 全游戏 img 禁用拖拽与选中

- **日期**：2026-06-15 · commit `27f407a`
- **Context**：玩家鼠标长按图片时，浏览器默认显示半透明拖拽预览并选中元素，体验突兀
- **Decision**：`index.css` 全局 `img { -webkit-user-drag: none; user-select: none; }`
- **Alternatives 考虑过但拒绝**：
  - `pointer-events: none` — 拒绝理由：会破坏 onClick 等交互事件
  - 按需在每个组件单独设 — 拒绝理由：散落维护成本高
- **撤销**：未撤销

---

## D-010 教程屏返回目标按入口动态判定

- **日期**：2026-06-15 · commit `a260d08`
- **Context**：教程屏有两条入口：
  - 主菜单「更多」按钮 → 看完教程应回主菜单
  - FactionSelect 确认后 → 看完教程应进战斗
  - 旧实现一律跳 battle，导致主菜单入口下进入未初始化的 BattleScreen 死状态
- **Decision**：在 TutorialScreen 内部检测 `useGameStore.getState().engine`：
  - engine !== null（FactionSelect 已调用 startGame） → 返回 battle
  - engine === null（主菜单查看） → 返回 mainmenu
  - 按钮文案同步切换（「跳过 / 开始对战」 vs 「关闭 / 返回主菜单」）
- **撤销**：未撤销

---

## D-011 `preloadBatched` 的 `onerror` 也算 done

- **日期**：W1 阶段沿用至今
- **Context**：图片预加载工具用 `new Image()` 触发下载，监听 `onload` 与 `onerror`
- **Decision**：两个事件都调用同一个 `done()` 回调，标记该图加载完成（无论成败）
- **理由**：防止单张图加载失败永久卡住进度条
- **副作用（已知）**：进度条 100% 不等于所有图都真的在缓存里。若某张失败，后续 `<img src=...>` 渲染时仍需重新请求
- **后续优化方向（未实施）**：
  - 加 `failedUrls` Set 记录失败项
  - 进度条 100% 时若有失败项，显示「网络不稳定，重试 / 跳过」按钮
- **撤销**：未撤销，当前是「快但不严」的平衡选择

---

## D-012 在线对战架构：权威服务器复用前端引擎

- **日期**：2026-06-16 · 里程碑 0 验证通过
- **Context**：用户要做在线真人对战（先朋友约战房间码，架构为公开匹配留接口，MVP 起步）。
  当前是纯前端单机（React + Zustand + 同步引擎），部署在 GitHub Pages（纯静态托管，无后端）。
- **Decision**：采用**权威服务器**模型，服务器**复用同一份 `game/src/engine`** 当裁判。
  - 后端放 `game/server/`，用 `tsx --tsconfig=./tsconfig.app.json` 跑，通过 `@/` 别名 import 引擎（与 `scripts/sim/` 在 Node 跑引擎同理，引擎零改动）
  - 裸 `ws` 库 + 自管房间 Map（不用 Colyseus）
  - 前后端共享消息协议 `game/src/online/protocol.ts`（契约层）
  - 客户端发动作意图 → 服务器验证 + 跑引擎 + 脱敏广播（藏对手手牌）
  - 部署形态：本地后端 + 内网穿透（ngrok/cloudflared）做 MVP，验证后再迁云做 7×24
- **关键红利**：引擎是确定性纯 TS 同步状态机，零浏览器/React 依赖（调研确认），
  前后端共用一份规则代码，免掉「服务端客户端规则不一致」这个多人游戏最大坑。
- **Alternatives 考虑过但拒绝**：
  - Colyseus 框架 — 拒绝理由：其核心卖点 @colyseus/schema 增量同步与我们「发完整脱敏 JSON 快照」模式冲突，MVP 用不上，反成负担；等公开匹配阶段再评估
  - 房主中继（host 跑引擎，服务器只转发） — 拒绝理由：host 能作弊 + 对手手牌泄露，不满足「为公开匹配留接口」
  - Firebase/Supabase 实时数据库 — 拒绝理由：隐藏信息难处理，权威性弱
- **里程碑 0 验证结果（已通过）**：引擎在 Node 加载成功（卡池 66 张）+ WebSocket 房间系统 + 跨真实设备（电脑↔手机同 WiFi）实时互通。最难的架构级不确定性已消除。
- **gameStore 改造是工作量大头（约 40%）**：现在 gameStore 同步直调 `engine.playCard()`，在线模式要改成「发动作给服务器 + 收状态」的双模式。
- **撤销**：未撤销，里程碑 0 验证后确立为方向。

### 里程碑 2 落地细节（2a/2b/2c 全部完成 · 2026-06-17）

- **个性化脱敏 + 视角翻转**（`server/sanitize.ts` `sanitizeStateFor(state, viewerSide)`）：服务器给每个客户端发的状态里，**接收者恒在 `player` 侧、对手恒在 `ai` 侧**，对手 hand/deck 脱敏成等量牌背（`CARDBACK` 占位）。由此 **BattleScreen 的「我方在下 / 对手在上」硬编码视角零改动**直接复用 —— 这是里程碑 2 的最大简化点。
- **Set 序列化**（`src/online/stateCodec.ts`，前后端共用）：`GameState` 多处含 `Set`（`currentKeywords`/`tags`/`comboFlagsThisTurn`/`onceUsedKeys`），`JSON.stringify` 会丢。用 `serializeState`/`deserializeState` 把 Set ↔ `{__set__: [...]}` 互转。
- **动作意图协议**（`protocol.ts` `GameAction`，协议 v4）：`playCard`/`attack`/`endTurn`，坐标统一以**客户端自身视角**表达（永远把自己当 player）。服务器按发送者真实 slot（host→player / guest→ai）`flipSide` 翻转回权威坐标后执行；`flipAttackerId` 处理 `hero_player`/`hero_ai` 换侧，场上 minion instanceId 两端一致不变。
- **前端瘦客户端 + 影子引擎**：在线模式 `gameStore` 用服务器状态 `new GameEngine(state, cardPool)` 构造一个**只读影子引擎**，仅供 UI 判定复用（`canPlayCard`/`cardNeedsTarget`/`hasValidTargetsForCard`），**绝不在在线模式 mutate 它**；玩家动作经 `registerOnlineActionSender` 注入的发送器发往服务器，不本地结算。`onlineMode` 标记区分双模式，回合归属天然复用 `activePlayer === 'player'` 守卫（脱敏已把「轮到我」翻成 player 侧）。
- **反馈复用**：伤害浮字（`useHpDelta` 监听 health）、死亡淡出、召唤光柱、抽牌微光、武器落下**全是状态比对驱动**，服务器状态一更新即自动播放，无需下发动画指令。
- **2c 收尾**：对手离开 → 服务器 `opponentLeft`（ws close 时发 + 删房）→ 战斗页弹「对局结束」覆盖层（`onlineStore.matchInterrupted`）；退出 / 结算页按钮在在线模式下先 `onlineReset()` 断连重置，「再战一场」回大厅另开房而非本地 AI 局。
- **已知留作后续（非 bug）**：① 效果文字 toast（连击/特殊/冻结）与「回合记录」依赖 log，在线未下发 —— 安全下发需逐视角脱敏（`logDraw` 含对手抽到的牌名会泄露）+ 翻转「你/对手」措辞；② 在线攻击无前冲动画，仅受击浮字；③ 主公本回合攻击后 UI 仍可点（`heroAttacked` 是引擎私有字段、影子引擎重建会重置），但服务器权威校验会拦截，仅 affordance 差异。

---

## 维护本文档的纪律

新做出**架构级或反直觉决策**时（不限于代码，也包含数据 / 资源策略 / UI 约定），按这个模板追加：

```
## D-XXX 标题

- **日期**：YYYY-MM-DD · commit `xxxxxxx`
- **Context**：当时为啥要决定
- **Decision**：选了啥
- **Alternatives 考虑过但拒绝**：
  - 备选方案 1 — 拒绝理由
  - 备选方案 2 — 拒绝理由
- **撤销条件 / 撤销记录**：（若发生反转，追加日期 + commit + 新方向）
```

**追加同时** 把索引加上 + 在 [CURRENT-STATE.md](CURRENT-STATE.md) 的「已知坑」表里登记一行（如果是反直觉点）。
