# 资源清单 · ASSETS

> `game/src/assets/` 下所有 PNG / MP4 资源的分类索引。121 张 UI + 11 张立绘 + 1 视频。

资源加载机制：`src/data/assetLoader.ts` 用 Vite `import.meta.glob` 把 `ui/` 和 `portraits/` 下所有 PNG 自动映射为 URL，组件通过 `getUiAssetUrl('name.png')` / `getPortraitUrl('name.png')` 取用。

---

## 一、UI 资源（`assets/ui/`）

### 1.1 Splash 屏（7）

| 文件 | 用途 |
|---|---|
| `splash_bg.png` | 全屏背景图（古城夜景）|
| `logo_main.png` | 「三国炉石」主 Logo（splash + mainmenu 共用）|
| `btn_enter_game.png` | 进入游戏按钮（朱漆牌匾）|
| `pill_server.png` | 服务器选择 pill（铜质）|
| `icon_account.png` | 右上工具图标 · 账号设置 |
| `icon_news.png` | 右上工具图标 · 游戏动态 |
| `icon_repair.png` | 右上工具图标 · 修复工具 |

### 1.2 Loading 屏（1）

| 文件 | 用途 |
|---|---|
| `loading_bg.png` | 加载页全屏背景 |

### 1.3 MainMenu 屏（18）

| 文件 | 用途 |
|---|---|
| `menu_background.png` | 主菜单议事厅背景 |
| `player_ui_block.png` | 顶左玩家信息整合块（八角头像+名字+等级）|
| `mainmenu_panel.png` | 议事台底板（云雾撕边底纹，三卡背景）|
| `card_battle.png` | 对战主卡 |
| `card_story.png` | 剧情模式长条卡 |
| `card_event.png` | 限时活动卡 |
| `banner_event.png` | 左下桃园结义限定活动横幅 |
| `icon_mail.png` | 侧栏 · 邮件 |
| `icon_calendar.png` | 侧栏 · 签到 |
| `icon_friends.png` | 侧栏 · 好友 |
| `icon_chat.png` | 底部长公告卷轴左端喇叭 |
| `icon_more.png` | 顶右独立金色 + 按钮 |
| `coin_silver.png` | 货币 · 银傅（含背景+数字+加号的完整 pill）|
| `coin_jade.png` | 货币 · 玉玦 |
| `coin_gem.png` | 货币 · 珠宝 |
| `tab_deck.png` | 底部 5 Tab · 卡组 |
| `tab_codex.png` | 底部 5 Tab · 图鉴 |
| `tab_quest.png` | 底部 5 Tab · 任务 |
| `tab_shop.png` | 底部 5 Tab · 商城 |
| `tab_settings.png` | 底部 5 Tab · 设置 |
| `avatar_frame.png` | （legacy）单独头像框，被 player_ui_block 取代 |

### 1.4 Codex 屏（2）

| 文件 | 用途 |
|---|---|
| `codex_background.png` | 卡牌图鉴背景 |
| `logo_codex.png` | 「卡牌图鉴」标题图 |

### 1.5 Battle 屏（4）

| 文件 | 用途 |
|---|---|
| `battle-background.png` | 战场背景图（地形）|
| `icon_weapons.png` | 中央双剑兵戈装饰图 |
| `text_battle_title.png` | 「两军对垒」标题图 |
| `btn_simulate_result.png` | 模拟结算按钮 |

### 1.6 Result 屏（4）

| 文件 | 用途 |
|---|---|
| `win_background.png` | 胜利结算背景 |
| `defeat_background.png` | 失败结算背景 |
| `text_victory.png` | 「胜」大字 |
| `text_defeat.png` | 「负」大字 |
| `btn_battle_again.png` | 再战一场按钮 |

### 1.7 通用按钮 / 模态（Battle 和 Result 共享）

| 文件 | 用途 |
|---|---|
| `btn_back_menu.png` | 返回主菜单按钮（Battle / Result 共享）|
| `modal_developing.png` | 「开发中」弹窗整体面板背景 |

### 1.8 Card 组件资源（76）

#### 4 种稀有度边框 × 卡牌组合（12，预合成）
- `common-minion.png` / `common-spell.png` / `common-weapon.png`
- `rare-minion.png` / `rare-spell.png` / `rare-weapen.png` ⚠️ 拼写为 weapen（注意一致）
- `epic-minion.png` / `epic-spell.png` / `epic-weapon.png`
- `legend-minion.png` / `legend-spell.png` / `legend-weapen.png` ⚠️ weapen

#### 单独边框（4，仍在 Card.tsx 使用）
- `frame_common.png` / `frame_rare.png` / `frame_epic.png` / `frame_legendary.png`

#### 名字横幅（3）
- `name_short.png`（卡名 ≤ 2 字）
- `name_medium.png`（≤ 4 字）
- `name_long.png`（> 4 字）

#### 数值球（30）
- `cost_1.png` ~ `cost_10.png`（费用宝石）
- `attack_1.png` ~ `attack_10.png`（攻击力球）
- `health_1.png` ~ `health_10.png`（血量球）

#### 13 个关键词印章
- `kw_taunt.png` 镇守
- `kw_charge.png` 冲锋
- `kw_rush.png` 突袭
- `kw_stealth.png` 潜伏
- `kw_divineshield.png` 神圣护盾
- `kw_windfury.png` 风怒
- `kw_poisonous.png` 剧毒
- `kw_lifesteal.png` 生命偷取
- `kw_freeze.png` 冰冻
- `kw_battlecry.png` 战吼/威名
- `kw_deathrattle.png` 亡语/遗志
- `kw_spellpower.png` 法强/谋略
- `kw_silence.png` 沉默

#### 5 阵营印章
- `emblem_shu.png` 蜀
- `emblem_wei.png` 魏
- `emblem_wu.png` 吴
- `emblem_qun.png` 群
- `emblem_neutral.png` 中立

#### 3 类型徽章
- `badge_minion.png` 武将
- `badge_spell.png` 计策
- `badge_weapon.png` 兵器

### 1.9 Legacy / 未使用（可清理或保留作备用）

| 文件 | 状态 |
|---|---|
| `splash_full.png` | 原 splash 整图，已被新 splash_bg.png 替代 |
| `btn_battle_start.png` | 原主菜单大按钮，已被 card_battle.png 替代 |
| `btn_circular.png` | 备用圆按钮 |
| `btn_primary.png` | 备用主按钮 |
| `btn_secondary.png` | 备用次按钮 |
| `btn_tab.png` | 备用 Tab 按钮 |
| `gem_cost.png` | 备用费用宝石样式 |
| `orb_attack.png` | 备用攻击球 |
| `orb_health.png` | 备用血量球 |

---

## 二、武将立绘（`assets/portraits/`）

### 2.1 已有（18）

| 文件 | 卡名 | 阵营 | 稀有度 / 类型 |
|---|---|---|---|
| `guanyu.png` | 关羽 | 蜀 | legendary |
| `zhangfei.png` | 张飞 | 蜀 | epic |
| `huangzhong.png` | 黄忠 | 蜀 | rare |
| `soldierofshu.png` | 蜀国步兵 | 蜀 | common |
| `liaohua.png` | 廖化 | 蜀 | common |
| `guanping.png` | 关平 | 蜀 | common |
| `madai.png` | 马岱 | 蜀 | common |
| `pangtong.png` | 庞统 | 中立 | rare |
| `liru.png` | 李儒 | 中立 | rare |
| `panfeng.png` | 潘凤 | 中立 | common |
| `xingdaorong.png` | 邢道荣 | 中立 | common |
| `taoyuan.png` | 桃园结义 | 蜀 | rare（计策）|
| `rende.png` | 仁德之政 | 蜀 | rare（计策）|
| `wanjian.png` | 万箭齐发 | 中立 | rare（计策）|
| `mubing.png` | 募兵令 | 中立 | common（计策）|
| `xiuyang.png` | 休养生息 | 中立 | common（计策）|
| `moushi.png` | 谋士 | 中立 | common（武将）|
| `qinglongdao.png` | 青龙偃月刀 | 蜀 | rare（兵器）|

### 2.2 待出 ✅ 已全部完成（2026-05-27）

7 张缺失立绘已于 2026-05-27 来自 `assetofsanguo/组件4.0/` 全部接入。

---

## 三、视频（`assets/video/`）

| 文件 | 时长 | 用途 |
|---|---|---|
| `intro.mp4` | 15s | 开场动画（IntroVideo.tsx 播放） |

---

## 四、资源命名规范

- **UI**：英文 + 下划线（`snake_case` 或 `kebab-case`），分类前缀：`btn_` / `card_` / `tab_` / `icon_` / `frame_` / `kw_` / `coin_` / `emblem_` / `badge_` / `text_`
- **立绘**：全小写拼音单词（`guanyu.png` / `zhangfei.png`），多字直接拼接不加分隔
- **数值序列**：`cost_1.png` ~ `cost_10.png`（带分隔下划线 + 数字）

新资源加进 `ui/` 或 `portraits/` 后**无需**改 `assetLoader.ts`，Vite 会自动 glob 扫到。组件代码用 `getUiAssetUrl('name.png')` 取用，若返回 null 说明文件名错或资源缺失。

---

## 五、原始素材源（`assetofsanguo/`，git 仓库根目录外）

工作目录，每次 AI 出图后人工选 + 重命名 + 复制到 `game/src/assets/`。当前包含：
- `组件3.0/` 最新 UI 套
- `组件Splash/` Splash 专属
- `组件ui按钮/` Battle/Result 按钮
- `切图结果/` 卡牌组件切片源
- `组件2.0/` 旧版组件
- 武将立绘原文件 + 开屏动画.mp4

复制脚本：`game/scripts/copy_assets.py`（批量复制 + 重命名 + 中文 → 英文映射）。

---

*最后更新：2026-05-27 · 121 UI + 11 portraits + 1 video*
