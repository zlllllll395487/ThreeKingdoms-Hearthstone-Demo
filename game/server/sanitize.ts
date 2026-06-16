/**
 * 个性化脱敏 · 在线对战权威服务器核心
 *
 * sanitizeStateFor(state, viewerSide) 把服务器的完整 GameState 转成「发给某个玩家」的视图：
 *   1. 视角翻转：viewer 永远落在 player 侧、对手落在 ai 侧
 *      （这样前端 BattleScreen 的「我方=player 在下、对手=ai 在上」硬编码逻辑零改动）
 *   2. 脱敏：对手的 hand / deck 换成牌背占位（只留数量，无 cardId / data），
 *      对手的 combo flag / onceUsedKeys 清空（私密信息不外泄）
 *
 * 公开信息（不脱敏）：双方 hero / mana / board / weapon / graveyard。
 */

import type { CardData, CardInstance, GameState, PlayerSide, PlayerState } from '@/engine/types'

/** 牌背占位的静态数据 · 不含任何真实牌信息 */
const CARDBACK_DATA: CardData = {
  id: 'CARDBACK',
  name: '',
  cost: 0,
  type: 'minion',
  faction: 'neutral',
  rarity: 'common',
  description: '',
}

function makeCardBack(idx: number): CardInstance {
  return {
    instanceId: `back_${idx}`,
    cardId: 'CARDBACK',
    data: CARDBACK_DATA,
    currentAttack: 0,
    currentHealth: 0,
    maxHealth: 0,
    currentKeywords: new Set(),
    exhausted: false,
    attacksThisTurn: 0,
    hasBeenSilenced: false,
  }
}

/** 脱敏对手 PlayerState：hand/deck 换牌背、私密 Set 清空，其余公开 */
function sanitizeOpponent(opp: PlayerState): PlayerState {
  return {
    ...opp,
    hand: opp.hand.map((_, i) => makeCardBack(i)),
    deck: opp.deck.map((_, i) => makeCardBack(1000 + i)),
    comboFlagsThisTurn: new Set(),
    onceUsedKeys: new Set(),
  }
}

/**
 * 生成发给 viewerSide 玩家的个性化脱敏状态
 * @param state 服务器完整权威状态（player=host 侧，ai=guest 侧）
 * @param viewerSide viewer 在服务器 state 里的位置（host → 'player'，guest → 'ai'）
 */
export function sanitizeStateFor(state: GameState, viewerSide: PlayerSide): GameState {
  const oppSide: PlayerSide = viewerSide === 'player' ? 'ai' : 'player'
  const me = state[viewerSide]
  const opp = state[oppSide]

  return {
    turn: state.turn,
    // 回合归属也翻转到 viewer 视角
    activePlayer: state.activePlayer === viewerSide ? 'player' : 'ai',
    phase: state.phase,
    player: me, // viewer 自己 · 完整可见
    ai: sanitizeOpponent(opp), // 对手 · 脱敏
    winner: state.winner ? (state.winner === viewerSide ? 'player' : 'ai') : undefined,
  }
}
