# 三国炉石 · 接手手册（HANDOFF）

> 协作者或新对话接手本项目时的速通文档。预期阅读时长 10 分钟。

---

## 一、项目概述

三国题材 Hearthstone 风格卡牌对战游戏的 Web 端 Demo。独立开发者项目，目标是在 4–6 周内完成 M0 阶段交付（蜀阵营 + 17 张卡 + 13 关键词 + AI 对人对战）。

核心策划文档：

| 文档 | 内容 |
|:--|:--|
| [docs/09-三国炉石策划终稿-v5.md](docs/09-三国炉石策划终稿-v5.md) | 玩法策划终稿（v5 定稿，覆盖玩法 + 卡牌 + 数值） |
| [docs/05-Demo实施方案.md](docs/05-Demo实施方案.md) | Demo 实施路线图 |
| [docs/10-三国炉石美术Prompt清单-v5.md](docs/10-三国炉石美术Prompt清单-v5.md) | 美术资源 prompt 清单 |
| [docs/12-卡牌验收清单-v5.2.md](docs/12-卡牌验收清单-v5.2.md) | 卡牌验收清单 |
| [docs/13-数值与玩法审查-v5.3.md](docs/13-数值与玩法审查-v5.3.md) | 数值与玩法审查报告 |
| [docs/AUDIT-2026-06-15.md](docs/AUDIT-2026-06-15.md) | 项目综合审计报告 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 架构与目录结构 |
| [docs/SECTIONS.md](docs/SECTIONS.md) | § 任务编号字典 |
| [docs/HANDOFF-AI.md](docs/HANDOFF-AI.md) | AI 协作专用接手指南 |
| [game/src/assets/ASSETS.md](game/src/assets/ASSETS.md) | 美术资源清单 |

---

## 二、项目阶段

| 阶段 | 状态 |
|:--|:-:|
| W1 视觉打磨 | Done |
| W2–W4 战场逻辑（含 §19 全部子项） | Done |
| §22 数值平衡（iter1 → iter6.1，阵营差 5.6%） | Done |
| §23 AI 难度系统（生手 / 标准 / 宗师） | Done |
| §24 战斗内自动托管 | Done |
| §25 教程屏（竖屏 1080×1920） | Done |
| §26 资源预加载优化 | Done |
| §27 自定义鼠标光标（长枪 PNG + 光晕 + 波纹） | Done |
| §28 commit 历史规范化（Conventional Commits） | Done |
| GitHub Pages 自动部署 workflow | Done |
| W09 / W13 / W28 吴方 AoE 二轮微调（iter7） | In Progress |
| W5 体验层面打磨 | Pending |

详情参阅 [game/PROGRESS.md](game/PROGRESS.md)。

---

## 三、本地开发命令

```bash
cd d:/三国炉石/game
npm install              # 首次或克隆后安装依赖
npm run dev              # 启动开发服务器，监听 http://localhost:5173/
npm run build            # 生产构建至 game/dist/
npm run preview          # 本地预览生产构建
npx tsc --noEmit         # TypeScript 静态检查，要求 0 错误
```

若 splash 屏在刷新后不再播放 intro，可在浏览器开发者工具 → Application → Local Storage 中清除 `sgls_intro_seen` 后再次刷新。

AI 对战模拟（1000 局批量约 1.5 秒）：

```bash
cd game
npx tsx --tsconfig=./tsconfig.app.json scripts/sim/run-sims.ts \
  --games 1000 --label myrun
```

输出报告位于 `docs/sim-reports/sim-YYYY-MM-DD-myrun.md`。

---

## 四、关键文件速查

```
game/src/
├─ App.tsx                              根组件：横屏 / 竖屏画布切换 + 屏幕路由
├─ index.css                            全局样式 + Google Fonts + CSS 变量
├─ store/uiStore.ts                     Zustand store · currentScreen / showModal / introSeen
├─ engine/
│  ├─ types.ts                          CardData / Rarity / Screen / AnchorTag 等类型定义
│  ├─ index.ts                          战斗规则主入口（伤害结算 / 抽牌 / 起手保证）
│  ├─ ai.ts                             AI 决策（启发式评分 + trace 接口）
│  ├─ effects/actions.ts                法术与技能 action 实现
│  └─ deck.ts                           牌库与抽牌（含联动加权）
├─ data/
│  ├─ cards/{shu,wu,neutral,weapons}.json   卡牌数据
│  ├─ cardLibrary.ts                    卡牌查询接口
│  └─ assetLoader.ts                    Vite import.meta.glob 资源映射
├─ screens/                             各屏幕组件
│  ├─ Splash / Intro / Loading / MainMenu / Codex
│  ├─ SubPage                           5 个子页面（剧情 / 任务 / 商城 / 设置 / 活动）
│  ├─ FactionSelect / Tutorial / Battle / Result
├─ components/
│  ├─ Card/                             卡牌渲染（按 rarity 加载边框）
│  ├─ Modal/DevelopingModal.tsx         全局开发中弹窗
│  └─ CustomCursor/                     §27 自定义鼠标光标
└─ assets/
   ├─ ui/                               约 260 张 UI 资源（主体 PNG + Loading 背景 WebP）
   ├─ portraits/                        89 张立绘（WebP）
   └─ video/intro.mp4
```

---

## 五、设计画布约束

- 设计画布尺寸：横屏 1920×1080 与竖屏 1080×1920，根据屏幕类型在 `App.tsx` 中动态切换
- 缩放策略：CSS transform scale 等比缩放，多余空间以黑色 letterbox 填充
- 所有屏幕组件须使用 `width: 100% / height: 100%`，避免使用 `100vh`，否则在缩放容器内会出现尺寸异常
- 单位优先使用 px 或百分比（相对于设计画布），不使用 vw / vh

---

## 六、资源命名规范

| 类别 | 命名约定 | 示例 |
|:--|:--|:--|
| UI PNG | 小写英文 + 下划线，按类型前缀分类 | `btn_back.png` / `card_frame_legendary.png` / `tab_codex.png` |
| 武将立绘 | 全小写拼音 | `guanyu.png` / `zhouyu.png` |
| 关键词印章 | `kw_` 前缀 + 英文关键词 | `kw_taunt.png` / `kw_charge.png` |
| 阵营印章 | `emblem_` 前缀 + 阵营英文 | `emblem_shu.png` / `emblem_wu.png` |

完整资源映射参见 [game/src/assets/ASSETS.md](game/src/assets/ASSETS.md)。

---

## 七、协作惯例

| 项 | 约定 |
|:--|:--|
| 回复风格 | 简洁中文，差异以表格列出 |
| 设计原则 | 直接使用已交付的美术 PNG，禁止以代码自创 UI 仿造 |
| 静默假设 | 涉及数值改动须先说明原因再实施 |
| 任务跟踪 | 3 件以上任务必须使用 TodoWrite 维护清单 |
| TypeScript 检查 | 每次提交前执行 `npx tsc --noEmit`，要求 0 错误 |
| Commit 信息 | 遵循 Conventional Commits 规范（`type(scope): summary`），使用正式书面语 |
| 文档语气 | 正式书面语，避免口语、slang 与中英混杂行话 |

---

## 八、与 Claude / Anthropic 工具协作的注意事项

- 用户环境会在部分 turn 末尾注入「版权安全提示」文本。该文本属于工具行为，并非用户输入，遇到时应直接继续后续流程而无须回应
- 用户的 plan 文件位于 `C:\Users\zhall\.claude\plans\`，仅 Claude Code 工具可访问
- 用户偏好 Plan Mode 流程：先编辑 plan 文件，再 ExitPlanMode 进入执行阶段

---

## 九、迁移至其他设备或新对话的步骤

1. 克隆仓库至新设备
2. 新对话开局时，引导 AI 先阅读以下三份文档：
   - 本份 HANDOFF.md
   - [game/PROGRESS.md](game/PROGRESS.md)
   - [game/src/assets/ASSETS.md](game/src/assets/ASSETS.md)
3. 执行 `cd game && npm install && npm run dev`
4. 验证 splash → loading → mainmenu 流程可正常跑通
5. 按 PROGRESS.md 列出的待办项继续推进

---

*最后更新：2026-06-15*
