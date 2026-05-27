/**
 * 卡牌库 · 把所有 JSON 卡牌定义聚合成可查询的 Map
 *
 * 用法：
 *   import { getCard, getAllCards } from '@/data/cardLibrary'
 *   const guanyu = getCard('S01')
 */

import type { CardData } from '@/engine/types'
import shuCards from './cards/shu.json'
import neutralCards from './cards/neutral.json'
import weaponCards from './cards/weapons.json'

// TypeScript 不会自动把 JSON 推成精确的 CardData[]，需要断言一次
const ALL_CARDS: CardData[] = [
  ...(shuCards as CardData[]),
  ...(neutralCards as CardData[]),
  ...(weaponCards as CardData[]),
]

const cardMap = new Map<string, CardData>()
for (const card of ALL_CARDS) {
  cardMap.set(card.id, card)
}

export function getCard(id: string): CardData {
  const card = cardMap.get(id)
  if (!card) {
    throw new Error(`Card not found: ${id}`)
  }
  return card
}

export function getAllCards(): CardData[] {
  return ALL_CARDS
}

export function getCardsByFaction(faction: CardData['faction']): CardData[] {
  return ALL_CARDS.filter((c) => c.faction === faction)
}
