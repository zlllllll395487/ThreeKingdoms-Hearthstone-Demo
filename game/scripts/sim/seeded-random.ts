/**
 * §22 · Seeded PRNG (mulberry32)
 *
 * 包装 Math.random，让一个 seed 完全决定一局结果
 * 用法：setSeed(42) → 后续所有 Math.random() 返回可复现序列
 */

let state = 1

export function setSeed(seed: number): void {
  state = seed >>> 0 || 1
}

function mulberry32(): number {
  let t = (state += 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const originalRandom = Math.random

export function installSeeded(): void {
  Math.random = mulberry32
}

export function restoreRandom(): void {
  Math.random = originalRandom
}
