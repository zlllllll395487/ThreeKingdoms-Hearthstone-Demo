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
import type { GameState } from '@/engine/types'
import type { LogEntry } from '@/engine/events'
import { getAllCardsIncludingTokens } from '@/data/cardLibrary'
import { getDeckByFaction } from '@/data/decks'
import { takeAITurn } from '@/engine/ai'
import { useFxStore } from '@/store/fxStore'
import { getTargetCenter } from '@/utils/targetRegistry'
import { getCanvasScale } from '@/utils/canvasScale'

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
  /** v5.5 UX：选中 minion / 无目标 spell 后，点击我方场上 BoardZone 确认出牌 */
  playSelectedToBoard: () => void
  /** v5.5 UX：选中 weapon 后，点击我方主公确认装备 */
  playSelectedToHero: () => void
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
    // v5.5 §19.3.1：用预制阵营牌组（SHU_DECK / WU_DECK），保证阵营隔离
    const engine = GameEngine.createGame({
      cardPool: getAllCardsIncludingTokens(),
      playerHero: makeHero(playerFaction),
      aiHero: makeHero(aiFaction),
      deckSize: 30,
      initialHand: { player: 3, ai: 4 },
      playerDeckCardIds: getDeckByFaction(playerFaction),
      aiDeckCardIds: getDeckByFaction(aiFaction),
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
    // v5.5 UX：手牌点击只「选中」，需玩家点击场上对战区 / 主公 / 目标 才结算
    // - minion → 等待玩家点己方场上 BoardZone（即 playMinionToBoard）
    // - 需要目标的 spell → pendingTargetForCard，等点目标
    // - 不需要目标的 spell（heal/draw/AoE）→ 等玩家点己方 BoardZone 确认
    // - weapon → 等玩家点己方主公确认
    const needsTarget = engine.cardNeedsTarget(card)
    set({
      selectedCardId: instanceId,
      pendingTargetForCard: needsTarget ? instanceId : null,
      selectedAttackerId: null,
    })
  },

  /** v5.5 UX：选中 minion / 无目标 spell 后，点击我方场上 BoardZone 确认出牌 */
  playSelectedToBoard: () => {
    const { engine, state, selectedCardId, pendingTargetForCard } = get()
    if (!engine || !state || !selectedCardId) return
    if (pendingTargetForCard) return // 需要目标的牌不能从 board click 直接打出
    const card = state.player.hand.find((c) => c.instanceId === selectedCardId)
    if (!card) return
    // minion 类型 / 无目标 spell：直接 play
    if (card.data.type === 'minion' || card.data.type === 'spell') {
      engine.playCard('player', selectedCardId)
      set({ selectedCardId: null, pendingTargetForCard: null })
      get().syncState()
    }
  },

  /** v5.5 UX：选中 weapon 后，点击我方主公确认装备 */
  playSelectedToHero: () => {
    const { engine, state, selectedCardId, pendingTargetForCard } = get()
    if (!engine || !state || !selectedCardId) return
    if (pendingTargetForCard) return
    const card = state.player.hand.find((c) => c.instanceId === selectedCardId)
    if (!card) return
    if (card.data.type === 'weapon') {
      engine.playCard('player', selectedCardId)
      set({ selectedCardId: null, pendingTargetForCard: null })
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
      // §19.6 Phase B · 立即清选中态，攻击进入异步前冲流程
      const attackerId = selectedAttackerId
      set({ selectedAttackerId: null })
      void doAnimatedAttack('player', attackerId, target)
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

  // v5.5 节奏：每个 AI 动作之间 700ms（基础节拍）
  // takeAITurn 内会额外调 2 次 onAfterAction 表示「出牌→攻击阶段切换」(+300ms 节拍) + 「回合结束前」(+600ms 节拍)
  let actionCount = 0
  await takeAITurn(
    engine,
    async () => {
      store.syncState()
      actionCount++
      // 阶段切换 / 收尾的 onAfterAction 调用：判断是否是 attack/end 阶段切换
      // 简化处理：让每次 onAfterAction 都是 700ms，不细分（v5.5 设计宪法允许）
      await delay(700)
    },
    // §19.6 Phase B · AI 攻击走带前冲动画的路径
    (attackerId, target) => doAnimatedAttack('ai', attackerId, target),
  )

  await delay(600) // v5.5 AI 回合结束前给玩家看一眼最终状态
  void actionCount

  engine.endTurn()
  useGameStore.setState({ aiThinking: false })
  useGameStore.getState().syncState()
}

/**
 * §19.6 Phase B · 带前冲动画的攻击
 *
 * 流程：
 *   1. 设 chargingAttacker（攻击者 CSS keyframe 朝目标方向冲）
 *   2. 等 200ms（冲到顶点）
 *   3. 触发 weapon_slash 火花 sprite 在目标位 + engine.attack（HP 立刻变化 → 浮起数字 + 受击震动）
 *   4. 等 200ms（弹回）
 *   5. 清 chargingAttacker
 *
 * 总时长 400ms · 与 useHpDelta / useHitShake 同步触发
 */
async function doAnimatedAttack(
  side: 'player' | 'ai',
  attackerId: string,
  target: TargetRef,
): Promise<boolean> {
  const fx = useFxStore.getState()
  fx.setCharging({ id: attackerId, side })
  await delay(200)

  // 触发命中火花在目标位（复用 weapon_slash sprite · plan §19.6 C 方案）
  // §19.7.4 · sprite portal 到 body 已逃出 canvas transform → size 用 viewport 像素
  // 220 是 canvas design 像素，乘 canvasScale 还原视觉比例
  const targetId =
    target.kind === 'hero' ? `hero_${target.side}` : target.instanceId
  const center = getTargetCenter(targetId)
  if (center) {
    const canvasScale = getCanvasScale()
    fx.trigger('weapon_slash', {
      anchor: center,
      size: 220 * canvasScale,
      durationMs: 360,
    })
  }

  const engine = useGameStore.getState().engine
  if (!engine) {
    fx.setCharging(null)
    return false
  }
  const ok = engine.attack(side, attackerId, target)
  useGameStore.getState().syncState()

  await delay(200)
  fx.setCharging(null)
  return ok
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
