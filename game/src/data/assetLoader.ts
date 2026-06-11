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
 * §26 LoadingScreen 真预加载 · 返回必须预加载的资源 URL 列表
 *
 * 分类策略：
 * - critical: 主菜单 / Codex / 战斗用到的所有大图（立绘 + 卡面 + cardvisual）
 *   占总资源约 70% 体积,预加载完后 Codex 进入不再卡顿
 * - 不含 fx 序列帧（仅战斗时用 · 占 ~10MB · 战斗启动时再加载）
 * - 不含小型 ui icon（自然加载即可,体积小不卡）
 */
export function getCriticalPreloadUrls(): string[] {
  const portraits = Object.values(portraitModules)
  // cardvisual_*.png 位于 ui/ 目录 · 单独筛出 (Codex 主要靠这些)
  const cardvisuals = Object.entries(uiModules)
    .filter(([path]) => path.includes('/cardvisual_'))
    .map(([, url]) => url)
  // UI 中含「frame」「modal」「bg」「menu」等关键背景大图
  const criticalUi = Object.entries(uiModules)
    .filter(([path]) => {
      const name = path.split('/').pop() ?? ''
      return (
        name.startsWith('frame_') ||
        name.startsWith('modal_') ||
        name.startsWith('menu_') ||
        name.startsWith('faction_') ||
        name.startsWith('tutorial_') ||
        name.startsWith('hero_') ||
        name.startsWith('card_') ||
        name === 'battle_bg.png' ||
        name === 'battle_bg_portrait.png' ||
        name === 'codex_bg.png' ||
        name === 'loading_bg.png'
      )
    })
    .map(([, url]) => url)

  return [...portraits, ...cardvisuals, ...criticalUi]
}
