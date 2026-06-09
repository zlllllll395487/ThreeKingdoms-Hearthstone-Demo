/**
 * 战斗状态管理 · GameEngine 的 React 桥
 *
 * 负责：
 * - 持有 engine 实例
 * - 管理 UI 选中态（手牌选中 / 战场单位选中 / 待选目标）
 * - 触发 React 重渲染（每次 engine 改了 state，调 syncState()）
 * - 调度 AI 回合
 */

import { create } from 'zustand'
import { GameEngine, type TargetRef } from '@/engine'
import type { GameState, PlayerSide } from '@/engine/types'
import type { LogEntry } from '@/engine/events'
import { getAllCardsIncludingTokens } from '@/data/cardLibrary'
import { takeAITurn } from '@/engine/ai'

interface GameStore {
  engine: GameEngine | null
  state: GameState | null
  log: LogEntry[]
  /** 手牌选中：玩家选中要打的牌 */
  selectedCardId: string | null
  /** 战场选中：玩家选中要攻击的单位（含英雄 hero_player） */
  selectedAttackerId: string | null
  /** 是否需要等待玩家选目标（出 dealDamage 类的牌时）*/
  pendingTargetForCard: string | null
  /** AI 思考中标记 */
  aiThinking: boolean

  // ============================================
  // Actions
  // ============================================
  startGame: (opts?: { playerFaction?: 'shu' | 'wu'; aiFaction?: 'shu' | 'wu' }) => void
  endGame: () => void

  selectCard: (instanceId: string | null) => void
  selectAttacker: (instanceId: string | null) => void
  /** 选中目标后确认（用于打需要目标的牌 OR 攻击指定目标）*/
  resolveTarget: (target: TargetRef) => void
  /** 打不需要目标的牌（点空白处或卡片再次确认）*/
  playSelectedCardNoTarget: () => void
  endTurn: () => void

  syncState: () => void
}

/** v5.5 阵营 → 主公映射 */
const HERO_BY_FACTION = {
  shu: { name: '刘备', faction: 'shu' as const },
  wu: { name: '孙权', faction: 'wu' as const },
}

function makeHero(faction: 'shu' | 'wu') {
  return {
    ...HERO_BY_FACTION[faction],
    health: 30,
    maxHealth: 30,
    armor: 0,
    attack: 0,
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  state: null,
  log: [],
  selectedCardId: null,
  selectedAttackerId: null,
  pendingTargetForCard: null,
  aiThinking: false,

  startGame: (opts) => {
    const playerFaction = opts?.playerFaction ?? 'shu'
    const aiFaction = opts?.aiFaction ?? 'wu'
    const engine = GameEngine.createGame({
      cardPool: getAllCardsIncludingTokens(),
      playerHero: makeHero(playerFaction),
      aiHero: makeHero(aiFaction),
      deckSize: 30,
      initialHand: { player: 3, ai: 4 },
    })
    set({
      engine,
      state: { ...engine.state },
      log: [...engine.log],
      selectedCardId: null,
      selectedAttackerId: null,
      pendingTargetForCard: null,
      aiThinking: false,
    })
  },

  endGame: () => {
    set({
      engine: null,
      state: null,
      log: [],
      selectedCardId: null,
      selectedAttackerId: null,
      pendingTargetForCard: null,
      aiThinking: false,
    })
  },

  syncState: () => {
    const e = get().engine
    if (!e) return
    set({ state: { ...e.state }, log: [...e.log] })
  },

  selectCard: (instanceId) => {
    const { engine, state } = get()
    if (!engine || !state) return
    if (state.activePlayer !== 'player' || state.phase !== 'main') return
    if (instanceId === null) {
      set({ selectedCardId: null, pendingTargetForCard: null, selectedAttackerId: null })
      return
    }
    const card = state.player.hand.find((c) => c.instanceId === instanceId)
    if (!card) return
    if (!engine.canPlayCard('player', instanceId)) return
    const needsTarget = engine.cardNeedsTarget(card)
    set({
      selectedCardId: instanceId,
      pendingTargetForCard: needsTarget ? instanceId : null,
      selectedAttackerId: null,
    })
    // 不需要目标的牌，立即打出
    if (!needsTarget) {
      engine.playCard('player', instanceId)
      set({
        selectedCardId: null,
        pendingTargetForCard: null,
      })
      get().syncState()
    }
  },

  selectAttacker: (instanceId) => {
    const { engine, state } = get()
    if (!engine || !state) return
    if (state.activePlayer !== 'player' || state.phase !== 'main') return
    if (instanceId === null) {
      set({ selectedAttackerId: null })
      return
    }
    set({
      selectedAttackerId: instanceId,
      selectedCardId: null,
      pendingTargetForCard: null,
    })
  },

  resolveTarget: (target) => {
    const { engine, pendingTargetForCard, selectedAttackerId } = get()
    if (!engine) return
    // 路径 1：出需要目标的牌
    if (pendingTargetForCard) {
      engine.playCard('player', pendingTargetForCard, target)
      set({ selectedCardId: null, pendingTargetForCard: null })
      get().syncState()
      return
    }
    // 路径 2：用选中的攻击者攻击目标
    if (selectedAttackerId) {
      engine.attack('player', selectedAttackerId, target)
      set({ selectedAttackerId: null })
      get().syncState()
      return
    }
  },

  playSelectedCardNoTarget: () => {
    const { engine, selectedCardId, pendingTargetForCard } = get()
    if (!engine || !selectedCardId || pendingTargetForCard) return
    engine.playCard('player', selectedCardId)
    set({ selectedCardId: null })
    get().syncState()
  },

  endTurn: () => {
    const { engine, state } = get()
    if (!engine || !state) return
    if (state.activePlayer !== 'player' || state.phase !== 'main') return
    engine.endTurn()
    set({
      selectedCardId: null,
      selectedAttackerId: null,
      pendingTargetForCard: null,
    })
    get().syncState()
    // AI 回合
    if (engine.state.activePlayer === 'ai' && engine.state.phase === 'main') {
      set({ aiThinking: true })
      // 异步 AI 行动，给玩家观察空间
      void runAITurn()
    }
  },
}))

async function runAITurn() {
  const store = useGameStore.getState()
  const engine = store.engine
  if (!engine) return

  await delay(800) // AI 开始思考前停一拍

  await takeAITurn(engine, async () => {
    store.syncState()
    await delay(700) // 每个 AI 动作之间停一拍
  })

  // AI 自动结束回合
  engine.endTurn()
  useGameStore.setState({ aiThinking: false })
  useGameStore.getState().syncState()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
