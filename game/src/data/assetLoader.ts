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
 * §26 LoadingScreen 全量预加载 · 返回需要预加载的所有 URL
 *
 * 包含:
 * - 所有立绘 (89 张, 70 MB)
 * - 所有卡面 cardvisual (71 张, 44 MB)
 * - 所有屏背景 / 边框 / 弹窗 / 主菜单 UI / 主公图 (~50 张)
 *
 * 不含:
 * - fx 序列帧 (战斗时再加载,占 10MB,加载时间是 ~150ms 一帧)
 * - 极小 ui icon (单张 <50KB · 自然加载零延迟)
 *
 * 配合 vercel.json 加 Cache-Control 1 年 immutable · 加载一次永久缓存
 */
export function getAllPreloadUrls(): string[] {
  const portraits = Object.values(portraitModules)
  const ui = Object.entries(uiModules)
    .filter(([path]) => {
      const name = path.split('/').pop() ?? ''
      // 排除明显不需要预加载的小型 icon (节省总时长)
      const isSmallIcon =
        name.startsWith('icon_') &&
        !name.startsWith('icon_anchor_') // 锚点 icon 战斗时显示,要预加载
      return !isSmallIcon
    })
    .map(([, url]) => url)
  return [...portraits, ...ui]
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
