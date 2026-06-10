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
