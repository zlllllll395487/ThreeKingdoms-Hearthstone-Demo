/**
 * §19.7.4 · Canvas scale 单例
 *
 * App.tsx 在 updateScale 时 setCanvasScale(scale)
 * FxSprite portal 出 canvas 后，size 需乘 scale 以匹配视觉比例
 *
 * 必须用单例 · 不走 zustand · 因为 gameStore.doAnimatedAttack 是同步函数
 * 不方便订阅 hook，简单 getter 即可
 */

let currentScale = 1

export function setCanvasScale(scale: number): void {
  currentScale = scale
}

export function getCanvasScale(): number {
  return currentScale
}
