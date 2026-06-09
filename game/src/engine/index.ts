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
  /** v5.5 下一张谋略 -X 费（W17 借东风用） */
  nextSpellCostReduction: Record<PlayerSide, number> = { player: 0, ai: 0 }
  /** v5.5 最后一次伤害的目标（W19 赤焰焚营 combo 用） */
  lastDamageTarget: TargetRef | null = null

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
      // v5.5 新增字段
      faction: opts.playerHero.faction,
      comboFlagsThisTurn: new Set(),
      onceUsedKeys: new Set(),
      nextTurnManaBoost: 0,
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
      // v5.5 新增字段
      faction: opts.aiHero.faction,
      comboFlagsThisTurn: new Set(),
      onceUsedKeys: new Set(),
      nextTurnManaBoost: 0,
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

    // v5.5 起手双轨制：蜀强制 1 费 + 2 费 / 吴强制 2 费 + 3 费（跳过 1 费检查）
    ensureSmoothOpener(playerState)
    ensureSmoothOpener(aiState)

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

  /** 检查是否需要选目标（v5.5 扩展：含 dealDamage / freeze / steal / buffMinion / 等） */
  cardNeedsTarget(card: CardInstance): boolean {
    const targetingActions = new Set([
      'dealDamage',
      'dealDamageEqualToAttack',
      'freeze',
      'cannotAttackThisTurn',
      'cannotAttackAdjacent',
      'attackDebuff',
      'returnToHand',
      'steal',
      'buffMinion',
      'grantExtraAttack',
      'grantKeyword',
    ])
    return (card.data.effects ?? []).some(
      (e) =>
        targetingActions.has(e.action) &&
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

    // v5.5: 法力费用应用 nextSpellCostReduction（W17 借东风用）
    let actualCost = card.data.cost
    if (card.data.type === 'spell' && this.nextSpellCostReduction[side] > 0) {
      actualCost = Math.max(0, actualCost - this.nextSpellCostReduction[side])
      this.nextSpellCostReduction[side] = 0
    }
    player.mana.current -= actualCost
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
      // v5.5 锚点联动：anchorRequirement 匹配场上锚点 → 执行 linkedEffects
      if (card.data.anchorRequirement && this.hasAnchorOnBoard(side, card.data.anchorRequirement)) {
        this.triggerLinkedEffects(card, 'linkedEffects', target)
      }
      // v5.5 卡-卡 combo：comboFlagRequirement 已 set → 执行 comboLinkedEffects
      if (card.data.comboFlagRequirement && player.comboFlagsThisTurn.has(card.data.comboFlagRequirement)) {
        this.triggerLinkedEffects(card, 'comboLinkedEffects', target)
      }
      // v5.5 设置 combo flag（火油 / 反间计）
      if (card.data.comboFlagSet) {
        player.comboFlagsThisTurn.add(card.data.comboFlagSet)
      }
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

  /** v5.5 检查场上是否有匹配锚点的友方武将 */
  hasAnchorOnBoard(side: PlayerSide, anchor: string): boolean {
    return this.state[side].board.some((m) => m.data.anchorTag === anchor)
  }

  /** v5.5 触发锚点联动 / combo 联动效果 */
  private triggerLinkedEffects(
    source: CardInstance,
    field: 'linkedEffects' | 'comboLinkedEffects',
    target?: TargetRef,
  ): void {
    const effects = source.data[field] ?? []
    for (const eff of effects) {
      const fn = ACTIONS[eff.action]
      if (!fn) {
        console.warn(`Unknown linked action: ${eff.action}`)
        continue
      }
      fn(this, source, eff.params ?? {}, target)
    }
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
      // v5.5 冰冻 / cannotAttackThisTurn 拦截
      if (m.frozen) return false
      if (m.cannotAttackThisTurn) return false
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
      // 兵器耐久 -1 + v5.5 触发 weaponAttack 效果（雌雄双股剑）
      if (player.weapon) {
        // v5.5 触发 weaponAttack 效果
        this.triggerEffects(player.weapon, 'weaponAttack')
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

    // v5.5 救命机制：赵云受致命伤时留 1 HP（preventLethalToOne / onceUsedKey 限制）
    if (m.currentHealth <= 0 && m.owner) {
      const player = this.state[m.owner]
      const hasPreventLethal = (m.data.effects ?? []).some(
        (e) => e.action === 'preventLethalToOne' && e.trigger === 'onTakeDamage',
      )
      if (hasPreventLethal && m.data.onceUsedKey && !player.onceUsedKeys.has(m.data.onceUsedKey)) {
        m.currentHealth = 1
        player.onceUsedKeys.add(m.data.onceUsedKey)
        this.log.push(logDamage(m.data.name + '（救命）', 0))
        return
      }
    }

    // v5.5 受击触发（黄月英 onTakeDamage）
    if (m.currentHealth > 0 && m.owner) {
      const player = this.state[m.owner]
      const onTakeEffects = (m.data.effects ?? []).filter((e) => e.trigger === 'onTakeDamage')
      for (const eff of onTakeEffects) {
        // onceUsedKey 限制
        if (m.data.onceUsedKey && player.onceUsedKeys.has(m.data.onceUsedKey)) continue
        const fn = ACTIONS[eff.action]
        if (!fn) continue
        fn(this, m, eff.params ?? {})
        if (m.data.onceUsedKey) {
          player.onceUsedKeys.add(m.data.onceUsedKey)
        }
      }
    }
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

    // v5.5 清空本方 combo flag（仅本回合有效）
    this.state[side].comboFlagsThisTurn.clear()

    // 切换
    const nextSide: PlayerSide = side === 'player' ? 'ai' : 'player'
    this.state.activePlayer = nextSide
    if (nextSide === 'player') this.state.turn += 1

    // 法力上限 +1（封顶 10）+ 当前法力满
    const next = this.state[nextSide]
    next.mana.max = Math.min(10, next.mana.max + 1)
    next.mana.current = next.mana.max

    // v5.5 应用 nextTurnManaBoost (屯田 / 吕蒙暗度陈仓)
    if (next.nextTurnManaBoost > 0) {
      next.mana.current += next.nextTurnManaBoost
      // 注意：mana.current 可以临时超过 mana.max（破 cap，仅本回合）
      next.nextTurnManaBoost = 0
    }

    // 重置攻击次数 + 解除召唤失调 + v5.5 解冻 + 清 cannotAttackThisTurn
    for (const m of next.board) {
      // 冰冻：解冻但本回合不能攻击
      if (m.frozen) {
        m.frozen = false
        m.cannotAttackThisTurn = true
      } else {
        m.cannotAttackThisTurn = false
      }
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
// v5.5 起手双轨制
// ============================================

/**
 * 蜀 = 强制保证 1 张 1 费 + 1 张 2 费
 * 吴 = 跳过 1 费检查（火油是吴 1 费唯一卡，强制塞会 100% 固化），强制 1 张 2 费 + 1 张 3 费
 */
function ensureSmoothOpener(player: PlayerState) {
  const requiredCosts: number[] = player.faction === 'shu' ? [1, 2] : [2, 3]
  for (const cost of requiredCosts) {
    if (player.hand.some((c) => c.data.cost === cost)) continue
    // 牌组里找该费用的卡
    const candidateIdx = player.deck.findIndex((c) => c.data.cost === cost)
    if (candidateIdx < 0) continue // 牌组没有就跳过
    // 手牌里换出最高费的（避免换核心战术卡）
    let maxHandIdx = 0
    for (let i = 1; i < player.hand.length; i++) {
      if (player.hand[i].data.cost > player.hand[maxHandIdx].data.cost) {
        maxHandIdx = i
      }
    }
    const drawn = player.deck[candidateIdx]
    const sentBack = player.hand[maxHandIdx]
    player.deck.splice(candidateIdx, 1)
    player.hand[maxHandIdx] = drawn
    player.deck.push(sentBack)
  }
}
