/**
 * 简单贪心 AI
 *
 * 策略：
 * 1. 出牌阶段：从手牌中按优先级（高费 minion > 实用 spell）尝试打出
 * 2. 攻击阶段：每个可攻击单位选择「最优目标」
 *    - 能斩杀英雄 → 直击英雄
 *    - 嘲讽（强制）→ 优先打 taunt
 *    - 等价交换（双死）→ 优先
 *    - 削弱大威胁 → 攻击高攻随从
 *    - 默认 → 攻击英雄
 * 3. AI 不会保留法力
 */

import type { GameEngine, TargetRef } from './index'
import type { CardInstance, PlayerSide } from './types'

export async function takeAITurn(
  engine: GameEngine,
  onAfterAction: () => Promise<void>,
): Promise<void> {
  const side: PlayerSide = 'ai'

  // ============================================
  // Phase A: 出牌
  // ============================================
  let safety = 0
  while (safety++ < 20) {
    if (engine.state.phase === 'ended') return
    const playable = engine.state.ai.hand.filter((c) =>
      engine.canPlayCard(side, c.instanceId),
    )
    if (playable.length === 0) break
    // 选最高费的（消耗法力效率）
    playable.sort((a, b) => b.data.cost - a.data.cost)
    const card = playable[0]

    // 如果牌需要目标，选一个
    let target: TargetRef | undefined
    if (engine.cardNeedsTarget(card)) {
      target = chooseSpellTarget(engine, card, side)
      if (!target) {
        // 没合法目标，跳过这张牌（暂时忽略）
        // 简化处理：把这张牌从可打列表里"假性移除"——仅靠 break 不够，因为下次循环又会选它
        // 解决：我们把它放到牌组底，但更简单是直接 break 出整个出牌阶段
        break
      }
    }
    engine.playCard(side, card.instanceId, target)
    await onAfterAction()
    if (engine.state.phase === 'ended') return
  }

  // ============================================
  // Phase B: 攻击
  // ============================================
  safety = 0
  while (safety++ < 20) {
    if (engine.state.phase === 'ended') return
    const attackers = getAttackers(engine, side)
    if (attackers.length === 0) break
    // 优先用高攻击的
    attackers.sort((a, b) => b.attack - a.attack)
    const attacker = attackers[0]
    const target = chooseAttackTarget(engine, attacker, side)
    if (!target) break
    const ok = engine.attack(side, attacker.id, target)
    if (!ok) break
    await onAfterAction()
    if (engine.state.phase === 'ended') return
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
    if (m.attacksThisTurn > 0 && !m.currentKeywords.has('windfury')) continue
    if (m.currentAttack <= 0) continue
    // rush 当回合不能攻击英雄，暂时仍可加入候选（chooseAttackTarget 会过滤）
    result.push({ id: m.instanceId, attack: m.currentAttack, isHero: false })
  }
  // 英雄是否可攻击
  if (player.hero.attack > 0 && !engine['heroAttacked'][side]) {
    result.push({ id: `hero_${side}`, attack: player.hero.attack, isHero: true })
  }
  return result
}

// ============================================
// 选攻击目标
// ============================================

function chooseAttackTarget(
  engine: GameEngine,
  attacker: Attacker,
  side: PlayerSide,
): TargetRef | null {
  const enemySide: PlayerSide = side === 'player' ? 'ai' : 'player'
  const enemy = engine.state[enemySide]
  const myMinion =
    !attacker.isHero ? engine.findInstance(attacker.id, side) : null

  // 嘲讽规则：必须先打 taunt
  if (engine.hasTaunt(enemySide)) {
    const taunts = enemy.board.filter((m) => m.currentKeywords.has('taunt'))
    // 选低血 taunt 优先（更容易打死）
    taunts.sort((a, b) => a.currentHealth - b.currentHealth)
    return { kind: 'minion', side: enemySide, instanceId: taunts[0].instanceId }
  }

  // 能斩杀英雄 → 直接攻击英雄（如果 attacker 不是 rush 限制）
  const canHitHero = !(
    myMinion &&
    myMinion.currentKeywords.has('rush') &&
    !myMinion.currentKeywords.has('charge') &&
    myMinion.summonedThisTurn
  )
  if (canHitHero && attacker.attack >= enemy.hero.health) {
    return { kind: 'hero', side: enemySide }
  }

  // 优先消除高攻威胁（attack > 3）
  const enemyMinions = [...enemy.board]
  if (enemyMinions.length > 0) {
    enemyMinions.sort((a, b) => b.currentAttack - a.currentAttack)
    const biggest = enemyMinions[0]
    // 等价或正面交换：自己 attack >= 它 health 且 它 attack <= 自己 health
    if (
      biggest.currentAttack >= 3 &&
      attacker.attack >= biggest.currentHealth
    ) {
      return { kind: 'minion', side: enemySide, instanceId: biggest.instanceId }
    }
  }

  // 默认：攻击英雄（如果可以）
  if (canHitHero) {
    return { kind: 'hero', side: enemySide }
  }

  // rush 不能打英雄，但场上有敌方随从就打
  if (enemyMinions.length > 0) {
    return {
      kind: 'minion',
      side: enemySide,
      instanceId: enemyMinions[0].instanceId,
    }
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

  // 黄忠之类的「对一个敌方武将造成 X 伤害」：选血量最低且能斩杀的
  // 简化：选血量最低的敌方随从
  if (enemy.board.length === 0) {
    // 没目标但牌需要目标，说明这张牌打不出去
    return undefined
  }
  const sorted = [...enemy.board].sort(
    (a, b) => a.currentHealth - b.currentHealth,
  )
  return {
    kind: 'minion',
    side: enemySide,
    instanceId: sorted[0].instanceId,
  }
}
