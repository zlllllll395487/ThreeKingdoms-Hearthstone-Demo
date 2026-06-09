/**
 * GameEngine · 三国炉石战斗引擎
 *
 * 职责：
 * - 维护 GameState
 * - 出牌 / 攻击 / 回合切换
 * - 触发卡牌效果（battlecry / deathrattle / onCast）
 * - 死亡链解算 + 胜负判定
 *
 * 设计原则：
 * - GameEngine 是同步的可变状态机，方法直接修改 this.state
 * - UI（gameStore）订阅完整 state 的变化触发 React 重渲染
 * - 不抛业务异常 — 用返回值或日志反馈
 */

import type {
  CardData,
  CardInstance,
  EffectTrigger,
  GamePhase,
  GameState,
  Hero,
  PlayerSide,
  PlayerState,
} from './types'
import { buildRandomDeck, drawCard as drawTopCard } from './deck'
import {
  logAttack,
  logDamage,
  logDeath,
  logDraw,
  logPlay,
  logTurn,
  logWin,
  type LogEntry,
} from './events'
import { ACTIONS } from './effects/actions'

export type TargetRef =
  | { kind: 'hero'; side: PlayerSide }
  | { kind: 'minion'; side: PlayerSide; instanceId: string }

export interface CreateGameOptions {
  cardPool: CardData[]
  playerHero: Hero
  aiHero: Hero
  deckSize?: number
  initialHand?: { player: number; ai: number }
}

export class GameEngine {
  state: GameState
  cardPool: CardData[]
  log: LogEntry[] = []
  spellPowerBonus: Record<PlayerSide, number> = { player: 0, ai: 0 }

  constructor(state: GameState, cardPool: CardData[]) {
    this.state = state
    this.cardPool = cardPool
  }

  static createGame(opts: CreateGameOptions): GameEngine {
    const deckSize = opts.deckSize ?? 30
    const handSize = opts.initialHand ?? { player: 3, ai: 4 }

    const playerDeck = buildRandomDeck(opts.cardPool, deckSize, 'player')
    const aiDeck = buildRandomDeck(opts.cardPool, deckSize, 'ai')

    const playerState: PlayerState = {
      hero: { ...opts.playerHero },
      mana: { current: 1, max: 1 },
      hand: [],
      deck: playerDeck,
      board: [],
      graveyard: [],
      weapon: null,
      fatigue: 0,
      heroPowerUsed: false,
    }
    const aiState: PlayerState = {
      hero: { ...opts.aiHero },
      mana: { current: 0, max: 0 },
      hand: [],
      deck: aiDeck,
      board: [],
      graveyard: [],
      weapon: null,
      fatigue: 0,
      heroPowerUsed: false,
    }

    // 起手抽牌
    for (let i = 0; i < handSize.player; i++) {
      const c = playerState.deck.shift()
      if (c) playerState.hand.push(c)
    }
    for (let i = 0; i < handSize.ai; i++) {
      const c = aiState.deck.shift()
      if (c) aiState.hand.push(c)
    }

    // 起手保证：手牌至少 1 张 cost ≤ 2，避免首回合无操作
    ensureLowCostInHand(playerState)
    ensureLowCostInHand(aiState)

    const initialState: GameState = {
      turn: 1,
      activePlayer: 'player',
      phase: 'main',
      player: playerState,
      ai: aiState,
    }

    const engine = new GameEngine(initialState, opts.cardPool)
    engine.log.push(logTurn(1, 'player'))
    return engine
  }

  // ============================================
  // 查询接口
  // ============================================

  findInstance(instanceId: string, side?: PlayerSide): CardInstance | null {
    const sides: PlayerSide[] = side ? [side] : ['player', 'ai']
    for (const s of sides) {
      const player = this.state[s]
      const onBoard = player.board.find((c) => c.instanceId === instanceId)
      if (onBoard) return onBoard
      const inHand = player.hand.find((c) => c.instanceId === instanceId)
      if (inHand) return inHand
      if (player.weapon?.instanceId === instanceId) return player.weapon
    }
    return null
  }

  getPlayer(side: PlayerSide): PlayerState {
    return this.state[side]
  }

  getEnemy(side: PlayerSide): PlayerState {
    return this.state[side === 'player' ? 'ai' : 'player']
  }

  hasTaunt(side: PlayerSide): boolean {
    return this.state[side].board.some((m) => m.currentKeywords.has('taunt'))
  }

  // ============================================
  // 出牌
  // ============================================

  canPlayCard(side: PlayerSide, instanceId: string): boolean {
    if (this.state.phase === 'ended') return false
    if (this.state.activePlayer !== side) return false
    const player = this.state[side]
    const card = player.hand.find((c) => c.instanceId === instanceId)
    if (!card) return false
    if (player.mana.current < card.data.cost) return false
    if (card.data.type === 'minion' && player.board.length >= 7) return false
    return true
  }

  /** 检查是否需要选目标（spell/battlecry 的 dealDamage） */
  cardNeedsTarget(card: CardInstance): boolean {
    return (card.data.effects ?? []).some(
      (e) =>
        e.action === 'dealDamage' &&
        ((e.trigger === 'onCast' && card.data.type === 'spell') ||
          e.trigger === 'battlecry'),
    )
  }

  playCard(side: PlayerSide, instanceId: string, target?: TargetRef): boolean {
    if (!this.canPlayCard(side, instanceId)) return false
    const player = this.state[side]
    const idx = player.hand.findIndex((c) => c.instanceId === instanceId)
    if (idx < 0) return false
    const card = player.hand[idx]
    player.hand.splice(idx, 1)
    player.mana.current -= card.data.cost
    this.log.push(logPlay(side, card))

    if (card.data.type === 'minion') {
      card.owner = side
      card.summonedThisTurn = true
      player.board.push(card)
      // 触发战吼
      this.triggerEffects(card, 'battlecry', target)
    } else if (card.data.type === 'spell') {
      // 触发计策
      this.triggerEffects(card, 'onCast', target)
      player.graveyard.push(card)
    } else if (card.data.type === 'weapon') {
      // 直接装备（不通过 equipWeapon action）
      if (player.weapon) player.graveyard.push(player.weapon)
      player.weapon = card
      player.hero.attack += card.currentAttack
    }

    this.resolvePendingDeaths()
    this.checkWinner()
    return true
  }

  private triggerEffects(
    source: CardInstance,
    trigger: EffectTrigger,
    target?: TargetRef,
  ): void {
    const effects = source.data.effects ?? []
    for (const eff of effects) {
      if (eff.trigger !== trigger) continue
      const fn = ACTIONS[eff.action]
      if (!fn) {
        console.warn(`Unknown action: ${eff.action}`)
        continue
      }
      fn(this, source, eff.params ?? {}, target)
    }
  }

  // ============================================
  // 攻击
  // ============================================

  canAttack(side: PlayerSide, attackerId: string, target: TargetRef): boolean {
    if (this.state.phase === 'ended') return false
    if (this.state.activePlayer !== side) return false

    let attackerAttack = 0
    let attackerKeywords: Set<string> = new Set()
    let isHero = false

    // attacker 可能是英雄（hero）或场上随从
    if (attackerId === `hero_${side}`) {
      isHero = true
      const hero = this.state[side].hero
      attackerAttack = hero.attack
      if (attackerAttack <= 0) return false
      // 英雄每回合只能攻击一次（无 windfury）
      if (this.state[side].hero.attack > 0 && this.heroAttacked[side]) return false
    } else {
      const m = this.state[side].board.find((c) => c.instanceId === attackerId)
      if (!m) return false
      if (m.exhausted) return false
      const maxAttacks = m.currentKeywords.has('windfury') ? 2 : 1
      if (m.attacksThisTurn >= maxAttacks) return false
      if (m.currentAttack <= 0) return false
      attackerAttack = m.currentAttack
      attackerKeywords = m.currentKeywords as Set<string>
      // rush: 当回合不能攻击英雄
      if (
        m.currentKeywords.has('rush') &&
        !m.currentKeywords.has('charge') &&
        m.summonedThisTurn &&
        target.kind === 'hero'
      ) {
        return false
      }
    }

    // 嘲讽规则：敌方有 taunt 时只能攻击 taunt
    const enemySide = target.side
    const enemy = this.state[enemySide]
    if (target.kind === 'hero') {
      if (this.hasTaunt(enemySide)) return false
    } else {
      const targetM = enemy.board.find((c) => c.instanceId === target.instanceId)
      if (!targetM) return false
      if (this.hasTaunt(enemySide) && !targetM.currentKeywords.has('taunt')) return false
    }

    void attackerAttack
    void attackerKeywords
    void isHero
    return true
  }

  private heroAttacked: Record<PlayerSide, boolean> = { player: false, ai: false }

  attack(side: PlayerSide, attackerId: string, target: TargetRef): boolean {
    if (!this.canAttack(side, attackerId, target)) return false

    const isHero = attackerId === `hero_${side}`
    const player = this.state[side]
    const enemySide = target.side
    const enemy = this.state[enemySide]

    let attackerAttack = 0
    let attacker: CardInstance | null = null
    let attackerName = ''

    if (isHero) {
      attackerAttack = player.hero.attack
      attackerName = player.hero.name
      this.heroAttacked[side] = true
      // 兵器耐久 -1
      if (player.weapon) {
        player.weapon.currentDurability! -= 1
        if (player.weapon.currentDurability! <= 0) {
          player.hero.attack -= player.weapon.currentAttack
          player.graveyard.push(player.weapon)
          player.weapon = null
        }
      }
    } else {
      attacker = player.board.find((c) => c.instanceId === attackerId)!
      attackerAttack = attacker.currentAttack
      attackerName = attacker.data.name
      attacker.attacksThisTurn += 1
    }

    let targetName = ''
    let targetWasMinion = false
    let targetMinion: CardInstance | null = null

    if (target.kind === 'hero') {
      targetName = enemy.hero.name
      this.dealDamageToHero(enemySide, attackerAttack)
    } else {
      const m = enemy.board.find((c) => c.instanceId === target.instanceId)
      if (!m) return false
      targetMinion = m
      targetName = m.data.name
      targetWasMinion = true
      this.dealDamageToMinion(m, attackerAttack)
      // 反击：随从攻击随从时己方也受伤
      if (!isHero && attacker) {
        this.dealDamageToMinion(attacker, m.currentAttack)
      }
      if (isHero) {
        // 英雄被反击
        this.dealDamageToHero(side, m.currentAttack)
      }
    }

    this.log.push(logAttack(side, attackerName, targetName))

    // 青龙偃月刀特效：英雄装备它攻击武将后若武将存活再造成 1 伤
    if (
      isHero &&
      targetWasMinion &&
      targetMinion &&
      targetMinion.currentHealth > 0 &&
      player.weapon?.cardId === 'WQ1'
    ) {
      this.dealDamageToMinion(targetMinion, 1)
    }

    this.resolvePendingDeaths()
    this.checkWinner()
    return true
  }

  // ============================================
  // 伤害 / 死亡
  // ============================================

  dealDamageToHero(side: PlayerSide, amount: number): void {
    const hero = this.state[side].hero
    if (hero.armor > 0) {
      const absorbed = Math.min(hero.armor, amount)
      hero.armor -= absorbed
      amount -= absorbed
    }
    hero.health -= amount
    if (amount > 0) this.log.push(logDamage(hero.name, amount))
    // 饮血关键词处理（lifesteal）
    // 简化：只对 minion 攻击有效，本函数不处理
  }

  dealDamageToMinion(m: CardInstance, amount: number): void {
    if (amount <= 0) return
    if (m.currentKeywords.has('divineShield')) {
      m.currentKeywords.delete('divineShield')
      this.log.push(logDamage(m.data.name + '（铁壁吸收）', 0))
      return
    }
    m.currentHealth -= amount
    this.log.push(logDamage(m.data.name, amount))
  }

  private resolvePendingDeaths(): void {
    let safety = 0
    while (safety++ < 50) {
      let anyDied = false
      for (const side of ['player', 'ai'] as PlayerSide[]) {
        const player = this.state[side]
        const dead = player.board.filter((m) => m.currentHealth <= 0)
        for (const m of dead) {
          player.board = player.board.filter((c) => c.instanceId !== m.instanceId)
          player.graveyard.push(m)
          this.log.push(logDeath(m.data.name))
          // 触发遗志
          this.triggerEffects(m, 'deathrattle')
          anyDied = true
        }
      }
      if (!anyDied) break
    }
  }

  // ============================================
  // 回合 / 抽牌
  // ============================================

  drawCardForSide(side: PlayerSide): void {
    const before = this.state[side].deck.length
    const drawn = drawTopCard(this.state[side])
    if (drawn) {
      this.log.push(logDraw(side, drawn.data.name))
    } else if (before === 0) {
      // 疲劳已在 drawCard 内处理
    }
  }

  endTurn(): void {
    if (this.state.phase === 'ended') return
    const side = this.state.activePlayer
    // 触发回合结束效果
    for (const m of this.state[side].board) {
      this.triggerEffects(m, 'endTurn')
    }
    this.resolvePendingDeaths()
    this.checkWinner()
    if ((this.state.phase as GamePhase) === 'ended') return

    // 切换
    const nextSide: PlayerSide = side === 'player' ? 'ai' : 'player'
    this.state.activePlayer = nextSide
    if (nextSide === 'player') this.state.turn += 1

    // 法力上限 +1（封顶 10）+ 当前法力满
    const next = this.state[nextSide]
    next.mana.max = Math.min(10, next.mana.max + 1)
    next.mana.current = next.mana.max

    // 重置攻击次数 + 解除召唤失调
    for (const m of next.board) {
      m.exhausted = false
      m.attacksThisTurn = 0
      m.summonedThisTurn = false
    }
    this.heroAttacked[nextSide] = false
    next.heroPowerUsed = false

    // 抽牌
    this.drawCardForSide(nextSide)

    // 触发回合开始效果
    for (const m of next.board) {
      this.triggerEffects(m, 'startTurn')
    }

    this.log.push(logTurn(this.state.turn, nextSide))
    this.checkWinner()
  }

  checkWinner(): void {
    if (this.state.phase === 'ended') return
    const playerDead = this.state.player.hero.health <= 0
    const aiDead = this.state.ai.hero.health <= 0
    if (playerDead || aiDead) {
      this.state.phase = 'ended'
      this.state.winner = aiDead ? 'player' : 'ai'
      this.log.push(logWin(this.state.winner))
    }
  }
}

// ============================================
// 起手保证：手牌至少 1 张 cost ≤ threshold
// ============================================

function ensureLowCostInHand(player: PlayerState, threshold = 2) {
  const hasLow = player.hand.some((c) => c.data.cost <= threshold)
  if (hasLow) return
  // 找牌组里最低费的
  let minIdx = -1
  let minCost = Infinity
  for (let i = 0; i < player.deck.length; i++) {
    if (player.deck[i].data.cost < minCost) {
      minCost = player.deck[i].data.cost
      minIdx = i
    }
  }
  if (minIdx < 0 || minCost > threshold) return // 牌组也无低费牌，放弃
  // 找手牌里最高费的
  let maxHandIdx = 0
  for (let i = 1; i < player.hand.length; i++) {
    if (player.hand[i].data.cost > player.hand[maxHandIdx].data.cost) {
      maxHandIdx = i
    }
  }
  // 交换：低费牌进手牌，高费牌回牌组底
  const drawn = player.deck[minIdx]
  const sentBack = player.hand[maxHandIdx]
  player.deck.splice(minIdx, 1)
  player.hand[maxHandIdx] = drawn
  player.deck.push(sentBack)
}
