/**
 * 图片资源加载器 · 把静态文件名映射成 Vite 处理后的 URL
 *
 * 用法：
 *   const url = getPortraitUrl('guanyu.png')
 *   <img src={url} />
 *
 * 原理：
 *   Vite 的 import.meta.glob 在构建时把所有匹配的图片资源打包，
 *   并提供运行时按文件名查找的能力。
 */

import type { Screen } from '@/store/uiStore'

// 把 portraits/ 下所有立绘资源收集成 { '/src/assets/portraits/guanyu.webp': '/assets/guanyu-xxx.webp' } 形式
// 立绘已全部转 WebP（无 alpha，无画质损失），仍接受 .png 引用 → 自动 fallback 到 .webp
const portraitModules = import.meta.glob('/src/assets/portraits/*.{png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

// UI 资源 · 大部分保留 PNG，仅 loading_bg* 转为 WebP
const uiModules = import.meta.glob('/src/assets/ui/*.{png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

// §19.6 Phase C · FX 序列帧
const fxModules = import.meta.glob('/src/assets/fx/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** 把 .png / .jpg 扩展名替换为 .webp 试探查找，用于卡牌 JSON 仍写 png 时透明命中已转的 webp */
function tryWebpFallback(modules: Record<string, string>, fullPath: string): string | null {
  const direct = modules[fullPath]
  if (direct) return direct
  const swapped = fullPath.replace(/\.(png|jpg|jpeg)$/i, '.webp')
  return modules[swapped] ?? null
}

/**
 * 根据文件名获取立绘 URL；不存在时返回 null（让 UI 显示占位符）
 *
 * 自动 fallback：卡牌 JSON 仍写 'guanyu.png'，若磁盘只有 'guanyu.webp' 也能命中
 */
export function getPortraitUrl(filename: string | undefined): string | null {
  if (!filename) return null
  return tryWebpFallback(portraitModules, `/src/assets/portraits/${filename}`)
}

/**
 * 根据文件名获取 UI 资源 URL
 *
 * 自动 fallback：调用方写 'loading_bg.png'，若磁盘是 'loading_bg.webp' 也能命中
 */
export function getUiAssetUrl(filename: string): string | null {
  return tryWebpFallback(uiModules, `/src/assets/ui/${filename}`)
}

/**
 * §19.6 获取 FX 序列帧 URL
 * 例：getFxFrame('fire_aoe', 5) → /src/assets/fx/fx_fire_aoe_05.png 的 hash URL
 */
export function getFxFrame(name: string, frame: number): string | null {
  const file = `fx_${name}_${String(frame).padStart(2, '0')}.png`
  const fullPath = `/src/assets/fx/${file}`
  return fxModules[fullPath] ?? null
}

// ============================================
// 通用工具
// ============================================

/** 从 UI 模块列表筛选匹配指定前缀的所有 URL */
function uiUrlsByPrefix(prefix: string): string[] {
  return Object.entries(uiModules)
    .filter(([k]) => k.startsWith(`/src/assets/ui/${prefix}`))
    .map(([, v]) => v)
}

/** 从 UI 模块列表按指定文件名列表批量取 URL，跳过不存在项；自动尝试 .webp fallback */
function uiUrlsByNames(names: string[]): string[] {
  return names
    .map((n) => tryWebpFallback(uiModules, `/src/assets/ui/${n}`))
    .filter((u): u is string => !!u)
}


// ============================================
// Loading 屏背景池
// ============================================

/**
 * 取全部 loading 背景 URL（命名规范：loading_bg*.png）
 * 用户随时往 assets/ui 添加新的 loading_bg_N.png，glob 自动收录
 */
export function getAllLoadingBgUrls(): string[] {
  return uiUrlsByPrefix('loading_bg')
}

// ============================================
// 分屏资源清单 · 每屏进入前必须就绪的资源
// ============================================

const MAINMENU_UI_NAMES = [
  'menu_background.png',
  'player_ui_block.png',
  'card_battle.png',
  'card_story.png',
  'card_event.png',
  'coin_silver.png',
  'coin_jade.png',
  'coin_gem.png',
  'icon_mail.png',
  'icon_calendar.png',
  'icon_friends.png',
  'icon_chat.png',
  'icon_more.png',
  'icon_account.png',
  'icon_news.png',
  'icon_repair.png',
  'btn_switch_bg.png',
  'modal_switch_bg.png',
  'modal_chat.png',
  'modal_resource.png',
  'modal_developing.png',
  'tab_codex.png',
  'tab_deck.png',
  'tab_recruit.png',
  'tab_quest.png',
  'tab_shop.png',
  'btn_back.png',
  'banner_event.png',
  'leaf_1.png',
  'leaf_2.png',
  'leaf_3.png',
  'leaf_4.png',
  'leaf_5.png',
  'leaf_6.png',
  'leaf_7.png',
]

const CODEX_UI_NAMES = [
  'codex_background.png',
  'frame_common.png',
  'frame_rare.png',
  'frame_epic.png',
  'frame_legendary.png',
  'frame_weapon_slot.png',
  'cardback.png',
  'name_short.png',
  'name_medium.png',
  'name_long.png',
  'badge_minion.png',
  'badge_spell.png',
  'badge_weapon.png',
  'btn_back.png',
  'tab_base.png',
  'tab_shu.png',
  'tab_wei.png',
  'tab_wu.png',
  'tab_qun.png',
  'tab_neutral.png',
  'tab_weapon.png',
]

const FACTIONSELECT_UI_NAMES = [
  'faction_card_shu.png',
  'faction_card_wu.png',
  'btn_difficulty.png',
  'btn_battle_start.png',
  'btn_start_battle_v2.png',
  'btn_primary.png',
  'btn_secondary.png',
  'btn_back.png',
  'hero_shu.png',
  'hero_wu.png',
  'hero_wu_sunquan.png',
]

const TUTORIAL_UI_NAMES = [
  'tutorial_frame.png',
  'tutorial_frame_23.png',
  'tutorial_btn_long_on.png',
  'tutorial_btn_long_off.png',
  'tutorial_btn_short_on.png',
  'tutorial_btn_short_off.png',
  'btn_back.png',
]

const BATTLE_UI_NAMES = [
  'battle-background.png',
  'battle_background_v2.png',
  'battle_background_v3.png',
  'battle_bg_portrait.png',
  'frame_common.png',
  'frame_rare.png',
  'frame_epic.png',
  'frame_legendary.png',
  'frame_onboard_neutral.png',
  'frame_onboard_shu.png',
  'frame_onboard_wu.png',
  'frame_weapon_slot.png',
  'cardback.png',
  'name_short.png',
  'name_medium.png',
  'name_long.png',
  'mana_empty.png',
  'mana_full.png',
  'ui_hp_base.png',
  'ui_mana_base.png',
  'ui_mana_slot.png',
  'ui_turn_indicator_base.png',
  'ui_ai_thinking_base.png',
  'btn_end_turn.png',
  'btn_back_menu.png',
  'btn_turn_log.png',
  'btn_circular.png',
  'hero_player.png',
  'hero_ai.png',
  'hero_shu.png',
  'hero_wu.png',
  'hero_wu_sunquan.png',
  'avatar_frame.png',
  'text_battle_title.png',
]

const RESULT_UI_NAMES = [
  'win_background.png',
  'defeat_background.png',
  'text_victory.png',
  'text_defeat.png',
  'btn_battle_again.png',
  'btn_back_menu.png',
]

const SUBPAGE_FILE_MAP: Partial<Record<Screen, string>> = {
  storymode: 'subpage_story.png',
  quest: 'subpage_quest.png',
  shop: 'subpage_shop.png',
  event: 'subpage_event.png',
  recruit: 'subpage_recruit.png',
  decks: 'subpage_decks.png',
  serverselect: 'subpage_serverselect.png',
  account: 'subpage_account.png',
  accountdetails: 'subpage_accountdetails.png',
  mail: 'subpage_mail.png',
  signin: 'subpage_signin.png',
  friends: 'subpage_friends.png',
  news: 'subpage_news.png',
}

/**
 * 返回某目标屏进入前应预加载的全部资源 URL
 *
 * 预加载只覆盖「屏幕骨架与必现的小 UI 元素」，单卡的 cardvisual / 立绘
 * 已由 Card 组件 loading="lazy" 按可视区域懒加载，不再强制预加载，
 * 避免 100+ 张大图独立请求 → HTTP 队列拥塞 → LoadingScreen 超时强跳。
 *
 * 子页面只需对应 subpage_*.png 一张背景。
 */
export function getPreloadUrlsForScreen(target: Screen): string[] {
  switch (target) {
    case 'mainmenu':
      return uiUrlsByNames(MAINMENU_UI_NAMES)

    case 'codex':
      return [
        ...uiUrlsByNames(CODEX_UI_NAMES),
        // 卡牌渲染所需的通用小 UI 元素（数值球 / 关键词印章 / 阵营印章）
        ...uiUrlsByPrefix('kw_'),
        ...uiUrlsByPrefix('emblem_'),
        ...uiUrlsByPrefix('cost_'),
        ...uiUrlsByPrefix('attack_'),
        ...uiUrlsByPrefix('health_'),
        // cardvisual 与 portraits 改由 Card 组件 loading="lazy" 懒加载
      ]

    case 'factionselect':
      return uiUrlsByNames(FACTIONSELECT_UI_NAMES)

    case 'tutorial':
      return uiUrlsByNames(TUTORIAL_UI_NAMES)

    case 'battle':
      return [
        ...uiUrlsByNames(BATTLE_UI_NAMES),
        // 卡牌通用小 UI 元素
        ...uiUrlsByPrefix('kw_'),
        ...uiUrlsByPrefix('emblem_'),
        ...uiUrlsByPrefix('cost_'),
        ...uiUrlsByPrefix('attack_'),
        ...uiUrlsByPrefix('health_'),
        ...Object.values(fxModules),
        // cardvisual 与 portraits 同样改为懒加载
        // FX 序列帧体积小且战斗中频繁触发，保留预加载
      ]

    case 'result':
      return uiUrlsByNames(RESULT_UI_NAMES)

    case 'storymode':
    case 'quest':
    case 'shop':
    case 'event':
    case 'recruit':
    case 'decks':
    case 'serverselect':
    case 'account':
    case 'accountdetails':
    case 'mail':
    case 'signin':
    case 'friends':
    case 'news': {
      const name = SUBPAGE_FILE_MAP[target]
      return name ? uiUrlsByNames([name, 'btn_back.png']) : []
    }

    case 'splash':
    case 'intro':
    case 'loading':
    default:
      return []
  }
}

// ============================================
// 预加载执行 · 带 URL 缓存（已加载的 URL 不再重复请求）
// ============================================

const loadedUrls = new Set<string>()

/**
 * 预加载指定屏所需的全部资源
 *
 * @param target 目标屏
 * @param onTick (loaded, total) 每张资源完成时回调，用于驱动进度条
 *
 * 已加载过的 URL 会跳过，重复进入同一屏几乎瞬时完成。
 */
export async function preloadForScreen(
  target: Screen,
  onTick?: (loaded: number, total: number) => void,
): Promise<void> {
  const urls = getPreloadUrlsForScreen(target)
  const toLoad = urls.filter((u) => !loadedUrls.has(u))
  const total = toLoad.length
  if (total === 0) {
    onTick?.(0, 0)
    return
  }
  let loaded = 0
  await preloadBatched(
    toLoad,
    () => {
      loaded += 1
      onTick?.(loaded, total)
    },
    12,
  )
  for (const u of toLoad) loadedUrls.add(u)
}

/**
 * 通用预加载工具 · N 路并发批处理
 *
 * @param urls 待加载的 URL 列表
 * @param onTick 每张完成时回调（可用于更新进度）
 * @param concurrent 并发上限 · 默认 6
 * @param fetchPriority 浏览器请求优先级 · 'low' 让位给前台请求 · 默认 'auto'
 */
export async function preloadBatched(
  urls: string[],
  onTick?: () => void,
  concurrent = 6,
  fetchPriority: 'high' | 'low' | 'auto' = 'auto',
): Promise<void> {
  if (urls.length === 0) return
  let idx = 0

  async function worker() {
    while (idx < urls.length) {
      const myIdx = idx++
      if (myIdx >= urls.length) return
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        if (fetchPriority !== 'auto') {
          ;(img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
            fetchPriority
        }
        const done = () => {
          onTick?.()
          resolve()
        }
        img.onload = done
        img.onerror = done
        img.src = urls[myIdx]
      })
    }
  }

  const workers = Array.from({ length: Math.min(concurrent, urls.length) }, () =>
    worker(),
  )
  await Promise.all(workers)
}

// ============================================
// 兼容旧 API · 保留以避免破坏外部引用
// ============================================

/** @deprecated 改用 preloadForScreen('mainmenu') · 仅保留导出便于过渡 */
export function getAllPreloadUrls(): string[] {
  return getPreloadUrlsForScreen('mainmenu')
}

/** @deprecated 资源改为按需预加载 · 主菜单挂载后无需额外触发 */
export function startBackgroundPreload(): void {
  // no-op
}
