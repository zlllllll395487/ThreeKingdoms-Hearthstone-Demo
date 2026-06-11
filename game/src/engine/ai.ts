/**
 * AI 启发式打分 v5.5
 *
 * v5.5 升级：
 * - 防自杀（牌库空时禁抽牌法术 score = -1000）
 * - 防过载（残血时强制清场最高威胁，生存判定 = 敌方下回合总攻 ≥ AI.hp）
 * - 锚点 setup 加分（W01/W02/W03）
 * - combo setup 加分（W18 / W20 → W19 / W21）
 * - 联动卡激活加分（card.anchorRequirement 匹配 → +5）
 * - 节奏缓冲 +300ms 阶段切换 + +600ms 收尾（在 gameStore.ts 里调）
 */

import type { GameEngine, TargetRef } from './index'
import type { CardInstance, PlayerSide, Keyword } from './types'

export async function takeAITurn(
  engine: GameEngine,
  onAfterAction: () => Promise<void>,
  /**
   * §19.6 Phase B · 攻击执行器（可选）· 注入带前冲动画的攻击流程
   * 没传则 fallback 直接 engine.attack 同步执行
   * gameStore 注入版会做：setCharging → 200ms → weapon_slash sprite → engine.attack → syncState → 200ms → clearCharging
   */
  performAttack?: (attackerId: string, target: TargetRef) => Promise<boolean>,
  /** §22 模拟器用 · 让 AI 帮 player 也走完一回合 · 默认 'ai' 保持向后兼容 */
  sideOverride?: PlayerSide,
): Promise<void> {
  const side: PlayerSide = sideOverride ?? 'ai'

  // ============================================
  // Phase A: 出牌（v5.5 启发式打分）
  // ============================================
  let safety = 0
  while (safety++ < 20) {
    if ((engine.state.phase as string) === 'ended') return
    const playable = engine.state[side].hand.filter((c) =>
      engine.canPlayCard(side, c.instanceId),
    )
    if (playable.length === 0) break

    // v5.5 启发式打分：每张可打的牌 → 综合得分
    const scored = playable.map((c) => ({
      card: c,
      score: scoreCardPlay(engine, c, side),
    }))
    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]
    if (best.score <= -500) break // 全部都是糟糕选择，停手
    const card = best.card

    let target: TargetRef | undefined
    if (engine.cardNeedsTarget(card)) {
      target = chooseSpellTarget(engine, card, side)
      if (!target) break
    }
    engine.playCard(side, card.instanceId, target)
    await onAfterAction()
    if ((engine.state.phase as string) === 'ended') return
  }

  // v5.5 出牌 → 攻击阶段缓冲（300ms，让玩家感知阶段切换）
  await onAfterAction()

  // ============================================
  // Phase B: 攻击（v5.5 加防过载生存判定）
  // ============================================
  safety = 0
  while (safety++ < 20) {
    if ((engine.state.phase as string) === 'ended') return
    const attackers = getAttackers(engine, side)
    if (attackers.length === 0) break
    attackers.sort((a, b) => b.attack - a.attack)
    const attacker = attackers[0]
    const target = chooseAttackTarget(engine, attacker, side)
    if (!target) break
    const ok = performAttack
      ? await performAttack(attacker.id, target)
      : engine.attack(side, attacker.id, target)
    if (!ok) break
    await onAfterAction()
    if ((engine.state.phase as string) === 'ended') return
  }

  // v5.5 回合结束前缓冲（让玩家看最终状态）
  await onAfterAction()
}

// ============================================
// v5.5 启发式打分
// ============================================

function scoreCardPlay(engine: GameEngine, card: CardInstance, side: PlayerSide): number {
  let score = 0
  const data = card.data
  const player = engine.state[side]
  const enemySide: PlayerSide = side === 'player' ? 'ai' : 'player'
  const enemy = engine.state[enemySide]

  // §22.P1-1 · base 身材 · minion / weapon 都算
  if (data.type === 'minion') {
    score += (data.attack ?? 0) + (data.health ?? 0)
  } else if (data.type === 'weapon') {
    // §22.P0-7 · weapon: 攻 × 耐久 是核心价值（一发斩杀+多发清场）
    const att = data.attack ?? 0
    const dur = data.durability ?? 1
    score += att * dur * 1.2
  }

  // 关键词加成
  const kwBonus: Record<string, number> = {
    taunt: 1.5,
    rush: 1.5,
    charge: 2,
    windfury: 1.5,
    spellpower: 1,
    divineShield: 2,
    poisonous: 2.5,
    lifesteal: 1.5,
  }
  for (const kw of (data.keywords ?? [])) {
    score += kwBonus[kw] ?? 0
  }

  // §22.P1-10 · 战吼 / 亡语 minion 比 vanilla 多加分
  const effectsList = data.effects ?? []
  const hasBattlecry = effectsList.some((e) => e.trigger === 'battlecry')
  const hasDeathrattle = effectsList.some((e) => e.trigger === 'deathrattle')
  if (data.type === 'minion' && hasBattlecry) score += 1.5
  if (data.type === 'minion' && hasDeathrattle) score += 1

  // §22-iter1 · 锚点武将加分 · setup 价值 = 基础 + 手牌里每张联动牌 +2.5
  // 这样吴 AI 看到周瑜/鲁肃/大乔 + 手里有联动法术 → 优先放下锚点
  if (data.anchorTag) {
    score += 3
    const matchingLinkedInHand = player.hand.filter(
      (c) => c.data.anchorRequirement === data.anchorTag,
    ).length
    score += matchingLinkedInHand * 2.5
  }

  // §22-iter1 · 联动卡价值评估
  if (data.anchorRequirement) {
    const anchorActive = engine.hasAnchorOnBoard(side, data.anchorRequirement)
    if (anchorActive) {
      // 锚点已激活 → 全功率释放
      score += 6
      // §22-iter1 关键修复：linkedEffects 自身价值也要算
      const linkedEffects = (data as { linkedEffects?: Array<{ action: string; params?: Record<string, unknown>; trigger?: string }> }).linkedEffects ?? []
      for (const eff of linkedEffects) {
        if (eff.trigger === 'onCast' || eff.trigger === 'battlecry') {
          score += scoreSpellEffect(eff, side, player, enemy) * 0.9 // 略折扣
        }
      }
    } else {
      // §22-iter1 · 锚点未激活 · 检查手牌是否能立刻 setup
      const anchorInHand = player.hand.find(
        (c) => c.data.anchorTag === data.anchorRequirement,
      )
      if (anchorInHand) {
        // 手里有对应锚点武将 → 保留此卡，本回合先 setup（小折扣 +1）
        score += 1
      } else {
        // 完全无锚点支持 → 仅基础效果 · 不加不减
      }
    }
  }

  // combo setup（W18 火油 / W20 反间计）
  if (data.comboFlagSet) {
    const partner = player.hand.find(
      (c) => c.data.comboFlagRequirement === data.comboFlagSet,
    )
    if (partner) score += 4
    else score += 1
  }
  // §22-iter1 · combo 触发 · 也算 comboLinkedEffects 价值
  if (data.comboFlagRequirement && player.comboFlagsThisTurn.has(data.comboFlagRequirement)) {
    score += 4
    const comboLinkedEffects = (data as { comboLinkedEffects?: Array<{ action: string; params?: Record<string, unknown>; trigger?: string }> }).comboLinkedEffects ?? []
    for (const eff of comboLinkedEffects) {
      if (eff.trigger === 'onCast' || eff.trigger === 'battlecry') {
        score += scoreSpellEffect(eff, side, player, enemy) * 0.9
      }
    }
  }

  // 战吼 / 法术效果价值（不仅 spell · battlecry/deathrattle 也算）
  if (data.type === 'spell' || data.type === 'minion') {
    for (const eff of effectsList) {
      // 仅算 trigger=onCast/battlecry/deathrattle 这些 onPlay 时机的
      if (eff.trigger === 'onCast' || eff.trigger === 'battlecry' || eff.trigger === 'deathrattle') {
        score += scoreSpellEffect(eff, side, player, enemy)
      }
    }
  }

  // §22.P0-1 · tempo 价值 · 用 mana 利用率惩罚浪费
  // 1 费打 3 分价值 vs 5 费打 3 分价值 → 1 费更高 tempo
  // 公式：score / (cost + 1) · cost 越高分数被压
  // 但保留 high-value 牌仍能高分（不至于全部偏好低费）
  const cost = data.cost ?? 0
  const efficiency = cost > 0 ? score / cost : score * 1.5
  // 综合分 = 60% 绝对价值 + 40% tempo 效率
  const finalScore = score * 0.6 + efficiency * 0.4 * cost
  return finalScore
}

function scoreSpellEffect(
  eff: { action: string; params?: Record<string, unknown>; trigger?: string },
  side: PlayerSide,
  player: {
    deck: unknown[]
    hand: unknown[]
    hero: { health: number; maxHealth: number }
    board: CardInstance[]
  },
  enemy: { board: CardInstance[]; hero: { health: number; maxHealth: number } },
): number {
  const p = eff.params ?? {}
  switch (eff.action) {
    case 'dealDamage': {
      const amount = (p.amount as number) ?? 0
      // §22.P1-4 · 可斩杀目标 → 大幅加分
      const killable = enemy.board.filter((m) => m.currentHealth <= amount).length
      const heroKill = amount >= enemy.hero.health ? 50 : 0
      return amount * 0.8 + killable * 3 + heroKill
    }
    case 'dealDamageHero': {
      // §22-iter1 · W14 苦肉计 / W15 运筹帷幄 等"对己方主公伤害"
      // side='self' → 残血时严重惩罚 · 安全时小代价
      // side='enemy' → 像普通 dealDamage 打英雄
      const amount = (p.amount as number) ?? 0
      const targetSide = (p.side as string) ?? 'self'
      if (targetSide === 'self') {
        const hpAfter = player.hero.health - amount
        if (hpAfter <= 0) return -1000 // 别自杀
        if (hpAfter <= 5) return -30 // 残血禁用
        if (hpAfter <= 15) return -8 // 中血代价大
        return -3 // 安血代价小
      }
      // enemy
      const heroKill = amount >= enemy.hero.health ? 50 : 0
      return amount * 0.8 + heroKill
    }
    case 'dealDamageAll': {
      // §22.P0-3 · AoE 必须乘 board size · 否则群伤永远被低估
      const amount = (p.amount as number) ?? 0
      const targetSide = (p.side as string) === 'self' ? player.board : enemy.board
      const targetCount = targetSide.length
      const killable = targetSide.filter((m) => m.currentHealth <= amount).length
      return amount * targetCount * 0.7 + killable * 2
    }
    case 'dealDamageEqualToAttack':
      return 4
    case 'drawCards': {
      // §22.P1-5 · 手牌量加权 · 防自杀 + 防烧牌
      if (player.deck.length === 0) return -1000
      const count = (p.count as number) ?? 1
      const handSize = player.hand.length
      if (handSize >= 10) return -50 // 烧牌
      if (handSize >= 8) return count * 0.5 // 手满风险
      if (handSize <= 2) return count * 3 // 缺牌时高价值
      return count * 1.8
    }
    case 'healHero': {
      // §22.P1-8 · 残血时高权重
      if (player.hero.health >= player.hero.maxHealth) return -100
      const amount = (p.amount as number) ?? 0
      const missingHp = player.hero.maxHealth - player.hero.health
      const effective = Math.min(amount, missingHp)
      const hpPct = player.hero.health / player.hero.maxHealth
      // 残血时（<30% HP）×3 权重
      const weight = hpPct < 0.3 ? 1.5 : hpPct < 0.6 ? 0.8 : 0.4
      return effective * weight
    }
    case 'freeze':
    case 'cannotAttackThisTurn': {
      // §22.P2-6 · 看目标价值（敌方最高 atk minion）
      if (enemy.board.length === 0) return -100
      const maxAtk = Math.max(...enemy.board.map((m) => m.currentAttack))
      return maxAtk >= 4 ? 5 : maxAtk >= 2 ? 3 : 1.5
    }
    case 'freezeAll': {
      // §22-iter1 · W23 连环计 · 全场冰冻 · 敌方 board 越大越值
      const targetSide = (p.side as string) === 'self' ? player.board : enemy.board
      if (targetSide.length === 0) return -50
      const totalAtk = targetSide.reduce((s, m) => s + m.currentAttack, 0)
      return totalAtk * 1.2 + targetSide.length * 2
    }
    case 'reduceNextSpellCost': {
      // §22-iter1 · W17 借东风 · 下一张 spell -X mana · 看手牌 spell 数
      const amount = (p.amount as number) ?? 0
      const spellsInHand = (player.hand as { data: { type: string } }[]).filter(
        (c) => c.data.type === 'spell',
      ).length
      if (spellsInHand === 0) return -10
      return amount * 1.5 + spellsInHand * 0.5
    }
    case 'discover':
      return 4.5
    case 'returnToHand':
    case 'steal': {
      // §22.P2-6 · maxCost 约束：找匹配 cost 的最强目标
      const maxCost = (p.maxCost as number) ?? Infinity
      const valid = enemy.board.filter((m) => m.data.cost <= maxCost)
      if (valid.length === 0) return -100 // 无有效目标 → 别浪费
      const best = valid.reduce(
        (max, m) =>
          (m.currentAttack + m.currentHealth) > (max.currentAttack + max.currentHealth) ? m : max,
        valid[0],
      )
      return (best.currentAttack + best.currentHealth) * 0.7 + 2
    }
    case 'refundMana':
      return ((p.amount as number) ?? 0) * 1.0
    case 'setNextTurnManaBoost':
      return ((p.amount as number) ?? 0) * 0.9
    case 'buffMinion': {
      // §22.P1-9 · 看目标 · 友方最高 atk 武将
      if (player.board.length === 0) return -100
      const att = (p.attack as number) ?? 0
      const hp = (p.health as number) ?? 0
      const best = player.board.reduce(
        (max, m) => (m.currentAttack > max.currentAttack ? m : max),
        player.board[0],
      )
      // 高 atk 友方 +buff → 滚雪球，价值高
      return (att + hp) * 1.2 + best.currentAttack * 0.3
    }
    case 'grantExtraAttack':
      return player.board.length > 0 ? 3 : -100
    case 'grantKeyword':
      return player.board.length > 0 ? 2.5 : -100
    case 'summonToken':
      return ((p.count as number) ?? 1) * 2
    case 'addPermanentSpellPower':
      return 3
    default:
      return 1
  }
}

// ============================================
// 工具：可攻击单位列表
// ============================================

interface Attacker {
  id: string
  attack: number
  isHero: boolean
}

function getAttackers(engine: GameEngine, side: PlayerSide): Attacker[] {
  const result: Attacker[] = []
  const player = engine.state[side]
  for (const m of player.board) {
    if (m.exhausted) continue
    if (m.frozen) continue
    if (m.cannotAttackThisTurn) continue
    if (m.attacksThisTurn > 0 && !m.currentKeywords.has('windfury' as Keyword)) continue
    if (m.currentAttack <= 0) continue
    result.push({ id: m.instanceId, attack: m.currentAttack, isHero: false })
  }
  if (player.hero.attack > 0 && !engine['heroAttacked'][side]) {
    result.push({ id: `hero_${side}`, attack: player.hero.attack, isHero: true })
  }
  return result
}

// ============================================
// 选攻击目标（v5.5 加防过载）
// ============================================

function chooseAttackTarget(
  engine: GameEngine,
  attacker: Attacker,
  side: PlayerSide,
): TargetRef | null {
  const enemySide: PlayerSide = side === 'player' ? 'ai' : 'player'
  const enemy = engine.state[enemySide]
  const me = engine.state[side]
  const myMinion = !attacker.isHero ? engine.findInstance(attacker.id, side) : null

  // v5.5 防过载：残血时优先清场最高威胁
  const enemyNextTurnAttack = enemy.board.reduce((s, m) => s + m.currentAttack, 0)
  if (enemyNextTurnAttack >= me.hero.health) {
    // 生存模式：强制清场最高威胁
    const sorted = [...enemy.board].sort((a, b) => b.currentAttack - a.currentAttack)
    if (sorted.length > 0) {
      return { kind: 'minion', side: enemySide, instanceId: sorted[0].instanceId }
    }
  }

  // 嘲讽规则
  if (engine.hasTaunt(enemySide)) {
    const taunts = enemy.board.filter((m) => m.currentKeywords.has('taunt' as Keyword))
    taunts.sort((a, b) => a.currentHealth - b.currentHealth)
    return { kind: 'minion', side: enemySide, instanceId: taunts[0].instanceId }
  }

  // 斩杀英雄
  const canHitHero = !(
    myMinion &&
    myMinion.currentKeywords.has('rush' as Keyword) &&
    !myMinion.currentKeywords.has('charge' as Keyword) &&
    myMinion.summonedThisTurn
  )
  if (canHitHero && attacker.attack >= enemy.hero.health) {
    return { kind: 'hero', side: enemySide }
  }

  // v5.5 锚点优先清除（敌方周瑜 / 鲁肃 / 大乔）
  const anchorMinion = enemy.board.find((m) => m.data.anchorTag)
  if (anchorMinion && attacker.attack >= anchorMinion.currentHealth) {
    return { kind: 'minion', side: enemySide, instanceId: anchorMinion.instanceId }
  }

  // 优先消除高攻威胁
  const enemyMinions = [...enemy.board]
  if (enemyMinions.length > 0) {
    enemyMinions.sort((a, b) => b.currentAttack - a.currentAttack)
    const biggest = enemyMinions[0]
    if (biggest.currentAttack >= 3 && attacker.attack >= biggest.currentHealth) {
      return { kind: 'minion', side: enemySide, instanceId: biggest.instanceId }
    }
  }

  // 默认攻击英雄
  if (canHitHero) {
    return { kind: 'hero', side: enemySide }
  }
  if (enemyMinions.length > 0) {
    return { kind: 'minion', side: enemySide, instanceId: enemyMinions[0].instanceId }
  }
  return null
}

// ============================================
// 选法术目标
// ============================================

function chooseSpellTarget(
  engine: GameEngine,
  card: CardInstance,
  side: PlayerSide,
): TargetRef | undefined {
  const enemySide: PlayerSide = side === 'player' ? 'ai' : 'player'
  const enemy = engine.state[enemySide]

  // v5.5 buffMinion / grantExtraAttack / grantKeyword → 选自家高 atk 武将
  const targetingFriendly = ['buffMinion', 'grantExtraAttack', 'grantKeyword']
  if ((card.data.effects ?? []).some((e) => targetingFriendly.includes(e.action))) {
    const friendly = engine.state[side].board
    if (friendly.length === 0) return undefined
    const sorted = [...friendly].sort((a, b) => b.currentAttack - a.currentAttack)
    return { kind: 'minion', side, instanceId: sorted[0].instanceId }
  }

  // 敌方目标：选血量最低的（最易斩杀）
  if (enemy.board.length === 0) return undefined
  const sorted = [...enemy.board].sort((a, b) => a.currentHealth - b.currentHealth)
  return { kind: 'minion', side: enemySide, instanceId: sorted[0].instanceId }
}
