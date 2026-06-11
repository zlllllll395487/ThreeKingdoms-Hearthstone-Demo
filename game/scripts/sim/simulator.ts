/**
 * §22 · 单局模拟器
 *
 * 给定 seed + 两边阵营，跑完 AI vs AI 一局，返回 endState + 全 log
 */

import { GameEngine } from '../../src/engine/index.js'
import type { GameState } from '../../src/engine/types.js'
import type { LogEntry } from '../../src/engine/events.js'
import type { TargetRef } from '../../src/engine/index.js'
import { getAllCardsIncludingTokens } from '../../src/data/cardLibrary.js'
import { getDeckByFaction } from '../../src/data/decks.js'
import { setSeed } from './seeded-random.js'

export type Faction = 'shu' | 'wu'
export type SimDifficulty = 'novice' | 'standard' | 'grandmaster'

export interface SimConfig {
  seed: number
  playerFaction: Faction
  aiFaction: Faction
  /** 哪边先手 · 默认 player */
  firstPlayer?: 'player' | 'ai'
  maxTurns?: number
  /** §23 两边 AI 难度 · 用来跑梯度验证 */
  playerDifficulty?: SimDifficulty
  aiDifficulty?: SimDifficulty
}

export interface SimResult {
  seed: number
  playerFaction: Faction
  aiFaction: Faction
  winner: 'player' | 'ai' | 'draw'
  turnCount: number
  endHp: { player: number; ai: number }
  /** 是否疲劳致死（fatigue log 触发）*/
  fatigueDeath: boolean
  /** 最终 log */
  log: LogEntry[]
  /** 每方实际打出的卡 ID 列表（按时序）*/
  playedCards: { player: string[]; ai: string[] }
  /** §22-iter1 体验指标 */
  experience: {
    /** 终结方式 */
    endReason: 'hp0' | 'fatigue' | 'turnCap' | 'draw'
    /** 每方每回合空过次数 (0 张牌出 0 次攻击) */
    idleTurns: { player: number; ai: number }
    /** 起手 T1 是否无牌可打 */
    openingStuck: { player: boolean; ai: boolean }
    /** 每方手牌数序列（每回合开始时）*/
    handSizeSequence: { player: number[]; ai: number[] }
    /** 平均每回合出牌数 */
    avgCardsPerTurn: { player: number; ai: number }
    /** 终局时双方手牌数 */
    endHandSize: { player: number; ai: number }
    /** 终局时双方牌库剩余 */
    endDeckSize: { player: number; ai: number }
  }
}

function makeHero(faction: Faction) {
  return {
    name: faction === 'shu' ? '刘备' : '孙权',
    faction,
    health: 30,
    maxHealth: 30,
    armor: 0,
    attack: 0,
  }
}

/** 极简启发式 AI 决策器（复用 ai.ts 的 takeAITurn 但带 sideOverride 让 player 也走 AI）*/
async function runOneTurn(
  engine: GameEngine,
  side: 'player' | 'ai',
  difficulty?: SimDifficulty,
): Promise<void> {
  const { takeAITurn } = await import('../../src/engine/ai.js')
  await takeAITurn(engine, async () => {}, undefined, side, undefined, difficulty)
}

export async function simulateGame(cfg: SimConfig): Promise<SimResult> {
  setSeed(cfg.seed)
  const maxTurns = cfg.maxTurns ?? 50

  const engine = GameEngine.createGame({
    cardPool: getAllCardsIncludingTokens(),
    playerHero: makeHero(cfg.playerFaction),
    aiHero: makeHero(cfg.aiFaction),
    deckSize: 30,
    initialHand: { player: 3, ai: 4 },
    playerDeckCardIds: getDeckByFaction(cfg.playerFaction),
    aiDeckCardIds: getDeckByFaction(cfg.aiFaction),
  })

  // 用 firstPlayer 控制谁先手（默认 player；createGame 默认是 player 起始）
  if (cfg.firstPlayer === 'ai') {
    // 把 activePlayer 切到 ai，然后让 ai 开始
    engine.state.activePlayer = 'ai'
  }

  const playedCards: { player: string[]; ai: string[] } = { player: [], ai: [] }
  let prevLogLen = 0
  // §22-iter1 体验指标 telemetry
  const handSizeSequence: { player: number[]; ai: number[] } = { player: [], ai: [] }
  const cardsPlayedThisTurn: { player: number; ai: number } = { player: 0, ai: 0 }
  const idleTurns: { player: number; ai: number } = { player: 0, ai: 0 }
  let turnCountForAvg = { player: 0, ai: 0 }
  const openingStuck = { player: false, ai: false }
  let hitTurnCap = false

  let safety = 0
  while (engine.state.phase === 'main' && safety++ < maxTurns * 4) {
    const active = engine.state.activePlayer
    // 记录回合开始时手牌数
    handSizeSequence[active].push(engine.state[active].hand.length)
    turnCountForAvg[active] += 1
    const cardsBefore = playedCards[active].length

    if (active === 'player') {
      await runOneTurn(engine, 'player', cfg.playerDifficulty)
      engine.endTurn()
    } else {
      await runOneTurn(engine, 'ai', cfg.aiDifficulty)
      engine.endTurn()
    }

    // 收集本回合 play log
    const newLogs = engine.log.slice(prevLogLen)
    prevLogLen = engine.log.length
    for (const e of newLogs) {
      if (e.kind === 'play' && e.side) {
        const text = e.text
        const cardName = text.replace(/^(你|AI)打出 /, '')
        playedCards[e.side].push(cardName)
      }
    }

    const cardsPlayedNow = playedCards[active].length - cardsBefore
    if (cardsPlayedNow === 0) {
      idleTurns[active] += 1
      // 起手 T1 卡死检测
      if (turnCountForAvg[active] === 1) {
        openingStuck[active] = true
      }
    }
    cardsPlayedThisTurn[active] += cardsPlayedNow
  }
  if (safety >= maxTurns * 4) hitTurnCap = true

  const winner: 'player' | 'ai' | 'draw' =
    engine.state.winner === 'player' || engine.state.winner === 'ai'
      ? engine.state.winner
      : 'draw'

  const fatigueDeath = engine.log.some((e) => e.kind === 'fatigue')

  let endReason: 'hp0' | 'fatigue' | 'turnCap' | 'draw' = 'draw'
  if (hitTurnCap) endReason = 'turnCap'
  else if (fatigueDeath) endReason = 'fatigue'
  else if (winner !== 'draw') endReason = 'hp0'

  return {
    seed: cfg.seed,
    playerFaction: cfg.playerFaction,
    aiFaction: cfg.aiFaction,
    winner,
    turnCount: engine.state.turn,
    endHp: {
      player: engine.state.player.hero.health,
      ai: engine.state.ai.hero.health,
    },
    fatigueDeath,
    log: engine.log,
    playedCards,
    experience: {
      endReason,
      idleTurns,
      openingStuck,
      handSizeSequence,
      avgCardsPerTurn: {
        player: turnCountForAvg.player > 0
          ? cardsPlayedThisTurn.player / turnCountForAvg.player
          : 0,
        ai: turnCountForAvg.ai > 0 ? cardsPlayedThisTurn.ai / turnCountForAvg.ai : 0,
      },
      endHandSize: {
        player: engine.state.player.hand.length,
        ai: engine.state.ai.hand.length,
      },
      endDeckSize: {
        player: engine.state.player.deck.length,
        ai: engine.state.ai.deck.length,
      },
    },
  }
}

export function _unusedRef(): GameState | undefined {
  return undefined
}

export type { TargetRef }
