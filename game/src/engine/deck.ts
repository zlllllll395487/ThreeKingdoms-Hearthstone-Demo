/**
 * 牌组工具：CardData → CardInstance、洗牌、抽牌、疲劳
 */

import type { CardData, CardInstance, PlayerSide, PlayerState } from './types'

let nextInstanceId = 1
export function newInstanceId(): string {
  return `i${nextInstanceId++}`
}

export function instantiate(data: CardData, owner: PlayerSide): CardInstance {
  const keywords = new Set(data.keywords ?? [])
  return {
    instanceId: newInstanceId(),
    cardId: data.id,
    data,
    currentAttack: data.attack ?? 0,
    currentHealth: data.health ?? 0,
    maxHealth: data.health ?? 0,
    currentDurability: data.durability,
    currentKeywords: keywords,
    // 召唤失调：除非有 charge / rush，否则当回合不能攻击
    exhausted: !(keywords.has('charge') || keywords.has('rush')),
    attacksThisTurn: 0,
    hasBeenSilenced: false,
    owner,
  }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 简化版 Hearthstone 牌组规则
const RARITY_LIMITS: Record<string, number> = {
  legendary: 1,
  epic: 2,
  rare: 2,
  common: 2,
}

/** 从卡池随机构造一副牌（同卡池双方共用） */
export function buildRandomDeck(
  pool: CardData[],
  size: number,
  owner: PlayerSide,
): CardInstance[] {
  const candidates = pool.filter((c) => !c.id.startsWith('TK_'))
  const expanded: CardData[] = []
  for (const c of candidates) {
    const limit = RARITY_LIMITS[c.rarity] ?? 2
    for (let i = 0; i < limit; i++) expanded.push(c)
  }
  const shuffled = shuffle(expanded)
  const picked: CardData[] = []
  for (let i = 0; i < size; i++) {
    picked.push(shuffled[i % shuffled.length])
  }
  return shuffle(picked).map((c) => instantiate(c, owner))
}

/** v5.5 §19.3.1 按卡 ID 列表构造一副牌组（阵营隔离 · 替代 buildRandomDeck）
 *
 * 用法：传入 SHU_DECK / WU_DECK 的 ID 字符串数组
 * 每个 ID 实例化一张 CardInstance，最终 shuffle 一次返回
 * 找不到的 ID 会跳过（防御性 · 不抛错）
 */
export function buildDeckFromIds(
  pool: CardData[],
  ids: string[],
  owner: PlayerSide,
): CardInstance[] {
  const map = new Map(pool.map((c) => [c.id, c]))
  const cards: CardData[] = []
  for (const id of ids) {
    const c = map.get(id)
    if (c) cards.push(c)
  }
  return shuffle(cards).map((c) => instantiate(c, owner))
}

/** 从牌组顶抽一张到手牌；若牌组空触发疲劳 */
export function drawCard(player: PlayerState): CardInstance | null {
  if (player.deck.length === 0) {
    player.fatigue += 1
    player.hero.health -= player.fatigue
    return null
  }
  const card = player.deck.shift()!
  if (player.hand.length >= 10) {
    // 手牌满，弃牌
    player.graveyard.push(card)
    return null
  }
  player.hand.push(card)
  return card
}
