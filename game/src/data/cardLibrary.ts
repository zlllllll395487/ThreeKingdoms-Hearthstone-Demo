/**
 * 卡牌库 · 把所有 JSON 卡牌定义聚合成可查询的 Map
 *
 * 用法：
 *   import { getCard, getAllCards } from '@/data/cardLibrary'
 *   const guanyu = getCard('S18')
 *
 * v5.5 更新：
 * - 新增 wu.json 加载（吴阵营 25 张）
 * - tokens.json 现在仅含 4 张 token（删除 TK_SHOUWEI_1/2 + TK_MIANYANG）
 * - weapons.json 删除（兵器已并入 shu.json/wu.json）
 */

import type { CardData, Faction } from '@/engine/types'
import shuCards from './cards/shu.json'
import wuCards from './cards/wu.json'
import neutralCards from './cards/neutral.json'
import tokenCards from './cards/tokens.json'

const ALL_CARDS: CardData[] = [
  ...(shuCards as CardData[]),
  ...(wuCards as CardData[]),
  ...(neutralCards as CardData[]),
  ...(tokenCards as CardData[]),
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

/** 玩家可见的牌（不含 token） · Codex / 牌组构筑用 */
export function getAllCards(): CardData[] {
  return ALL_CARDS.filter((c) => !c.id.startsWith('TK_'))
}

/** 含 token 在内的全部卡 · 引擎运行时用 */
export function getAllCardsIncludingTokens(): CardData[] {
  return ALL_CARDS
}

export function getCardsByFaction(faction: Faction): CardData[] {
  return getAllCards().filter((c) => c.faction === faction)
}

/** v5.5 工具：返回所有 token */
export function getAllTokens(): CardData[] {
  return ALL_CARDS.filter((c) => c.id.startsWith('TK_'))
}
