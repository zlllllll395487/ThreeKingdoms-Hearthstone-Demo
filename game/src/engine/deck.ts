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

/**
 * §22-iter2 · 带联动加权的抽牌
 *
 * 不破坏纯随机感（仅 soft bias）：
 * - 友方场上有锚点武将 → 牌库中匹配该锚点的联动卡权重 ×1.8
 * - 手牌里有 comboFlagSet 卡 → 牌库中匹配该 combo 触发的卡权重 ×1.5
 * - 其他卡权重保持 1
 *
 * 计算总权重后用 weighted random 抽一张，从牌库中移除
 * 没卡 → 触发疲劳（同 drawCard）
 */
export function drawCardWithSynergy(player: PlayerState): CardInstance | null {
  if (player.deck.length === 0) {
    player.fatigue += 1
    player.hero.health -= player.fatigue
    return null
  }
  if (player.hand.length >= 10) {
    // 手牌满，弃顶牌
    const top = player.deck.shift()!
    player.graveyard.push(top)
    return null
  }

  // 收集场上锚点武将的 anchorTag
  const anchorsOnBoard = new Set<string>()
  for (const m of player.board) {
    if (m.data.anchorTag) anchorsOnBoard.add(m.data.anchorTag)
  }
  // 收集手牌里所有 comboFlagSet 标记
  const comboSetInHand = new Set<string>()
  for (const c of player.hand) {
    if (c.data.comboFlagSet) comboSetInHand.add(c.data.comboFlagSet)
  }

  // 计算每张牌的权重
  const weights = player.deck.map((c) => {
    let w = 1.0
    if (c.data.anchorRequirement && anchorsOnBoard.has(c.data.anchorRequirement)) {
      w *= 1.8
    }
    if (c.data.comboFlagRequirement && comboSetInHand.has(c.data.comboFlagRequirement)) {
      w *= 1.5
    }
    return w
  })

  const totalWeight = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * totalWeight
  let chosenIdx = 0
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) {
      chosenIdx = i
      break
    }
  }
  const card = player.deck.splice(chosenIdx, 1)[0]
  player.hand.push(card)
  return card
}
