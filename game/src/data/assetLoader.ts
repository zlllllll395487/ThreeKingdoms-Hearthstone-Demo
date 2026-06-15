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

// 把 portraits/ 下所有 png 收集成 { '/src/assets/portraits/guanyu.png': '/assets/guanyu-xxx.png' } 形式
const portraitModules = import.meta.glob('/src/assets/portraits/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

// UI 背景图同理
const uiModules = import.meta.glob('/src/assets/ui/*.png', {
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

/**
 * 根据文件名获取立绘 URL；不存在时返回 null（让 UI 显示占位符）
 */
export function getPortraitUrl(filename: string | undefined): string | null {
  if (!filename) return null
  const fullPath = `/src/assets/portraits/${filename}`
  return portraitModules[fullPath] ?? null
}

/**
 * 根据文件名获取 UI 背景图 URL
 */
export function getUiAssetUrl(filename: string): string | null {
  const fullPath = `/src/assets/ui/${filename}`
  return uiModules[fullPath] ?? null
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

/**
 * §26 两阶段预加载策略
 *
 * Phase 1 (LoadingScreen 阻塞): 主菜单进入前必须就绪的资源 · 总 ~5 MB · 秒级完成
 * Phase 2 (MainMenu 挂载后后台执行): Codex / Battle 用到的大图 · ~110 MB
 *   - 不阻塞 UI 交互
 *   - 拉完后 Codex/Battle 切屏无图片闪烁
 *   - 若用户在拉完前就进 Codex,单图按需加载 (退化为普通体验,无 bug)
 */

/**
 * §26 极简预加载 · 只加载主菜单必需的少量大图 (~10 张, <10 MB)
 *
 * Codex/Battle 的卡面/立绘改由 loading="lazy" + IntersectionObserver 按需加载
 * 配合 vercel.json Cache-Control immutable · 加载过一次的永久缓存
 *
 * 原因: 114 MB 全量预加载在 Vercel 跨洋 CDN 下吞吐太低,1% 也跑不动
 *      改用"看到才加载"+"持久缓存"组合方案更现实
 */
export function getAllPreloadUrls(): string[] {
  const essentialNames = [
    'loading_bg.png',
    'menu_background.png',
    'player_ui_block.png',
    'card_battle.png',
    'card_story.png',
    'card_event.png',
    'tab_codex.png',
    'tab_deck.png',
    'tab_recruit.png',
    'tab_quest.png',
    'tab_shop.png',
  ]
  return essentialNames
    .map((n) => uiModules[`/src/assets/ui/${n}`])
    .filter((u): u is string => !!u)
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
          // fetchPriority 在新浏览器已支持 · 旧浏览器忽略
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

/**
 * @deprecated §26 改回全量预加载策略 · 不再使用后台预加载
 * 保留空函数避免破坏 MainMenu 调用 · 后续可删
 */
export function startBackgroundPreload(): void {
  // no-op · 所有资源已在 LoadingScreen 一次性加载完毕
}
