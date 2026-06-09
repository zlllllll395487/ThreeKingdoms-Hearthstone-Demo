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
): Promise<void> {
  const side: PlayerSide = 'ai'

  // ============================================
  // Phase A: 出牌（v5.5 启发式打分）
  // ============================================
  let safety = 0
  while (safety++ < 20) {
    if (engine.state.phase === 'ended') return
    const playable = engine.state.ai.hand.filter((c) =>
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
    if (engine.state.phase === 'ended') return
  }

  // v5.5 出牌 → 攻击阶段缓冲（300ms，让玩家感知阶段切换）
  await onAfterAction()

  // ============================================
  // Phase B: 攻击（v5.5 加防过载生存判定）
  // ============================================
  safety = 0
  while (safety++ < 20) {
    if (engine.state.phase === 'ended') return
    const attackers = getAttackers(engine, side)
    if (attackers.length === 0) break
    attackers.sort((a, b) => b.attack - a.attack)
    const attacker = attackers[0]
    const target = chooseAttackTarget(engine, attacker, side)
    if (!target) break
    const ok = engine.attack(side, attacker.id, target)
    if (!ok) break
    await onAfterAction()
    if (engine.state.phase === 'ended') return
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

  // base 身材
  if (data.type === 'minion') {
    score += (data.attack ?? 0) + (data.health ?? 0)
  }

  // 关键词加成
  const kwBonus: Record<string, number> = {
    taunt: 1,
    rush: 1.5,
    charge: 2,
    windfury: 1.5,
    spellpower: 1,
  }
  for (const kw of (data.keywords ?? [])) {
    score += kwBonus[kw] ?? 0
  }

  // 锚点武将加分（5 费周瑜 / 4 费鲁肃 / 3 费大乔 优先 setup）
  if (data.anchorTag) {
    score += 3
  }

  // 联动卡激活：场上有匹配锚点 → 大幅加分
  if (data.anchorRequirement && engine.hasAnchorOnBoard(side, data.anchorRequirement)) {
    score += 5
  }

  // combo setup（W18 火油 / W20 反间计）
  if (data.comboFlagSet) {
    const partner = player.hand.find(
      (c) => c.data.comboFlagRequirement === data.comboFlagSet,
    )
    if (partner) score += 4
    else score += 1
  }
  // combo 已 setup → 后置卡 +3
  if (data.comboFlagRequirement && player.comboFlagsThisTurn.has(data.comboFlagRequirement)) {
    score += 3
  }

  // 法术效果价值
  if (data.type === 'spell') {
    for (const eff of data.effects ?? []) {
      score += scoreSpellEffect(engine, eff, side, player)
    }
  }

  return score
}

function scoreSpellEffect(
  engine: GameEngine,
  eff: { action: string; params?: Record<string, unknown> },
  side: PlayerSide,
  player: { deck: unknown[]; hero: { health: number; maxHealth: number } },
): number {
  const p = eff.params ?? {}
  switch (eff.action) {
    case 'dealDamage':
    case 'dealDamageAll':
      return ((p.amount as number) ?? 0) * 1.0
    case 'dealDamageEqualToAttack':
      return 3
    case 'drawCards': {
      // v5.5 防自杀：牌库空时禁抽牌（避免疲劳致死）
      if (player.deck.length === 0) return -1000
      return ((p.count as number) ?? 1) * 1.5
    }
    case 'healHero': {
      // 满血禁治疗
      if (player.hero.health >= player.hero.maxHealth) return -100
      return ((p.amount as number) ?? 0) * 0.4
    }
    case 'freeze':
    case 'cannotAttackThisTurn':
      return 3 // 控制类
    case 'discover':
      return 4
    case 'returnToHand':
    case 'steal':
      return 4
    case 'refundMana':
      return ((p.amount as number) ?? 0) * 1.0
    case 'setNextTurnManaBoost':
      return ((p.amount as number) ?? 0) * 0.8 // 贴现
    default:
      return 0.5
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
