# AI 接手 Prompt · 粘贴即用

> 新对话 / 新模型 / 新协作者接手三国炉石项目时，把本文件**斜体下方**的内容整段复制粘贴给新 AI，作为开场首条消息。
>
> AI 读完即拥有完整上下文，可立刻开工。

---

## 复制下面这段（直到分隔线）：

---

你即将接手「三国炉石（Three Kingdoms Hearthstone）」Web 端 Demo 项目，位于 `d:/三国炉石/`。

按这个顺序读以下文件，建立上下文：

### 必读（顺序很重要）

1. **`docs/CURRENT-STATE.md`** ← 项目当前真相，单页快照。读这一份就能掌握「现在是什么」
2. **`docs/DECISIONS.md`** ← 关键决策日志，含反转记录。看到反直觉代码先查这里
3. **`docs/HANDOFF-AI.md`** ← AI 协作约定（commit 规范 / 文档语气 / 常见坑）
4. **`docs/ARCHITECTURE.md`** ← 三层架构图 + 屏幕导航流程 + 目录结构
5. **`docs/SECTIONS.md`** ← § 任务编号字典（§19–§30 各阶段范围）

### 速读

6. 最近 10 个 commit：执行 `git log --oneline -10`
7. **`game/PROGRESS.md`** ← 阶段表（Done / In Progress / Pending）
8. **`README.md`** ← 项目门面 + 简化机制声明

### 持久记忆

9. **`C:\Users\zhall\.claude\projects\d------\memory\MEMORY.md`** ← 用户偏好与项目记忆索引（每个会话自动加载）

### 工作中查阅

10. **`game/src/assets/ASSETS.md`** ← 美术资源清单
11. **`docs/sim-reports/sim-*-iter*.md`** ← AI 对战模拟报告归档（数值平衡决策依据）

---

### 不要读

- `docs/历史文档/*` ← 已废弃归档
- `backup-original-png/*` ← 资源备份，回滚用，不是参考
- `compression-preview/*` ← 开发者比较样本
- `release/*` ← 旧构建产物
- 任何带 `@deprecated` JSDoc 标记的函数实现

---

### 协作规则简要

- **Commit 信息**：Conventional Commits 格式 `<type>(<scope>): <summary>`，正式书面语，禁口语 / slang / 中英混杂。详见 `docs/HANDOFF-AI.md`
- **文档语气**：正式书面语，避免「跑」「搞定」「修一下」「加个」等口语
- **画布约束**：横屏 1920×1080 / 竖屏 1080×1920 固定尺寸，子组件用 `width: 100% / height: 100%`，禁用 vw / vh
- **TypeScript 检查**：每次提交前 `npx tsc --noEmit` 要 0 错误
- **AI 模拟**：1000 局约 1.5 秒，详见 `game/scripts/sim/`

---

### 开工前请答（自我验证上下文加载成功）

请用 1–2 段话回答以下问题，确认你已阅读必读文件：

1. **项目当前阶段是 §__？**（答：§30，立绘 / 背景 / cardvisual 全部 WebP 化已完成）
2. **当前**有哪 5 项炉石机制是简化或未实装的？
3. **庞统 rarity 为什么是 rare 不是 epic？**（去 DECISIONS.md 找 D-004）
4. **全游戏禁用 `loading="lazy"` 的根因是什么？**（D-002）
5. **上一轮 commit hash 是什么？主要做了什么？**（看 `git log -1`）

如能正确答出上述 5 题（特别是 3 和 4 必须查 DECISIONS.md），说明上下文加载成功，可以接手任务。

---

### 工作纪律

每次做完一个有意义的 commit（feat / fix / perf / refactor），按本顺序自检：

1. 是否需要更新 `docs/CURRENT-STATE.md`（规模数字 / 阶段 / 已知坑）？
2. 是否做了**架构级或反直觉决策**？若是，往 `docs/DECISIONS.md` 追加一条 D-XXX
3. 顶部 commit hash 字段是否要更新？
4. 文档改动**与代码改动同一 commit** 一起 push

这是 docs-as-code，仓库 = 单一可信源。文档与代码同步是接手者的福音。

---

（粘贴到此结束）
