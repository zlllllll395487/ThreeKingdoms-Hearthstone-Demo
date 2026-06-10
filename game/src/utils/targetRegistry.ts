/**
 * §19.6 Phase B · 战场单位 DOM ref 注册表
 *
 * MinionToken / HeroDisplay 在挂载时 registerTarget(id, el)
 * gameStore.doAnimatedAttack 通过 getTargetRect(id) 拿命中位置触发 weapon_slash sprite
 *
 * id 约定：
 *   武将 → minion.instanceId
 *   英雄 → 'hero_player' / 'hero_ai'
 */

const refs = new Map<string, HTMLElement>()

export function registerTarget(id: string, el: HTMLElement | null): void {
  if (!el) {
    refs.delete(id)
    return
  }
  refs.set(id, el)
}

export function unregisterTarget(id: string): void {
  refs.delete(id)
}

export function getTargetRect(id: string): DOMRect | null {
  const el = refs.get(id)
  if (!el) return null
  return el.getBoundingClientRect()
}

export function getTargetCenter(id: string): { x: number; y: number } | null {
  const r = getTargetRect(id)
  if (!r) return null
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
