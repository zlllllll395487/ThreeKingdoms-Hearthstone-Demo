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

/**
 * §23 · AI 难度等级
 * - novice 新手: 评分噪声 + 随机目标 + 偏好打脸 (~ 30-40% 胜率 vs standard)
 * - standard 标准: iter6.1 基线启发式 (默认值)
 * - grandmaster 宗师: 跨回合 combo 规划 + 锚点保留判断 (~ 55-60% 胜率 vs standard)
 */
export type AIDifficulty = 'novice' | 'standard' | 'grandmaster'

/** §22 · trace mode · 让 simulator 抓 AI 每个决策的评分排名 + 选择 + 攻击目标理由 */
export interface AiTracer {
  /** 出牌阶段每一轮 · 候选评分 + 最终选择 */
  recordPlayDecision(info: {
    side: PlayerSide
    turn: number
    mana: { current: number; max: number }
    hand: CardInstance[]
    candidates: Array<{ card: CardInstance; score: number }>
    chosen: CardInstance | null
    chosenScore: number | null
    target?: TargetRef
    reason: 'played' | 'all-negative' | 'no-affordable' | 'no-target'
  }): void
  /** 攻击阶段每一次 · 攻击者 / 目标 / 选择理由 */
  recordAttackDecision(info: {
    side: PlayerSide
    turn: number
    attackerName: string
    attackerAtk: number
    targetDesc: string
    reason: string
  }): void
}

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
  /** §22 trace 模式 · 抓决策路径 */
  tracer?: AiTracer,
  /** §23 AI 难度 · 默认 'standard' */
  difficulty?: AIDifficulty,
): Promise<void> {
  const side: PlayerSide = sideOverride ?? 'ai'
  const aiLevel: AIDifficulty = difficulty ?? 'standard'

  // ============================================
  // Phase A: 出牌（v5.5 启发式打分）
  // ============================================
  // §22-iter6: 本回合无目标的卡 blacklist · 避免最高分但选不到目标的卡反复阻塞次优出牌
  const blockedThisTurn = new Set<string>()
  let safety = 0
  while (safety++ < 20) {
    if ((engine.state.phase as string) === 'ended') return
    const handSnapshot = [...engine.state[side].hand]
    const playable = engine.state[side].hand.filter(
      (c) => engine.canPlayCard(side, c.instanceId) && !blockedThisTurn.has(c.instanceId),
    )
    if (playable.length === 0) {
      tracer?.recordPlayDecision({
        side,
        turn: engine.state.turn,
        mana: { ...engine.state[side].mana },
        hand: handSnapshot,
        candidates: [],
        chosen: null,
        chosenScore: null,
        reason: 'no-affordable',
      })
      break
    }

    // v5.5 启发式打分：每张可打的牌 → 综合得分
    const scored = playable.map((c) => ({
      card: c,
      score: scoreCardPlay(engine, c, side, aiLevel),
    }))
    scored.sort((a, b) => b.score - a.score)
    // §23 新手：15% 概率从前 3 候选随机选（模拟新手判断失误）
    let chosenIdx = 0
    if (aiLevel === 'novice' && scored.length >= 2 && Math.random() < 0.25) {
      chosenIdx = Math.min(Math.floor(Math.random() * 3), scored.length - 1)
    }
    const best = scored[chosenIdx]
    if (best.score <= -500) {
      tracer?.recordPlayDecision({
        side,
        turn: engine.state.turn,
        mana: { ...engine.state[side].mana },
        hand: handSnapshot,
        candidates: scored,
        chosen: null,
        chosenScore: best.score,
        reason: 'all-negative',
      })
      break // 全部都是糟糕选择，停手
    }
    const card = best.card

    let target: TargetRef | undefined
    if (engine.cardNeedsTarget(card)) {
      target = chooseSpellTarget(engine, card, side, aiLevel)
      if (!target) {
        // §22-iter6: 此卡本回合无目标 · 拉黑后继续尝试次优 · 不再整回合 break
        blockedThisTurn.add(card.instanceId)
        tracer?.recordPlayDecision({
          side,
          turn: engine.state.turn,
          mana: { ...engine.state[side].mana },
          hand: handSnapshot,
          candidates: scored,
          chosen: null,
          chosenScore: best.score,
          reason: 'no-target',
        })
        continue
      }
    }
    tracer?.recordPlayDecision({
      side,
      turn: engine.state.turn,
      mana: { ...engine.state[side].mana },
      hand: handSnapshot,
      candidates: scored,
      chosen: card,
      chosenScore: best.score,
      target,
      reason: 'played',
    })
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
    const target = chooseAttackTarget(engine, attacker, side, aiLevel)
    if (!target) break
    if (tracer) {
      const attackerName = attacker.isHero
        ? `主公(${engine.state[side].hero.name})`
        : engine.findInstance(attacker.id, side)?.data.name ?? attacker.id
      const enemySide: PlayerSide = side === 'player' ? 'ai' : 'player'
      const targetDesc =
        target.kind === 'hero'
          ? `对方主公(${engine.state[enemySide].hero.name} HP=${engine.state[enemySide].hero.health})`
          : (() => {
              const m = engine.state[enemySide].board.find(
                (b) => b.instanceId === (target as { instanceId: string }).instanceId,
              )
              return m ? `${m.data.name}(${m.currentAttack}/${m.currentHealth})` : '?'
            })()
      const reason = explainAttackTarget(engine, attacker, target, side)
      tracer.recordAttackDecision({
        side,
        turn: engine.state.turn,
        attackerName,
        attackerAtk: attacker.attack,
        targetDesc,
        reason,
      })
    }
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

export function scoreCardPlay(
  engine: GameEngine,
  card: CardInstance,
  side: PlayerSide,
  difficulty: AIDifficulty = 'standard',
): number {
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
    // §22-trace-fix-4 · 生存压力下 setup 锚点是奢侈 · 敌方下回合可斩杀时大幅减分
    const enemyNextAttack = enemy.board.reduce((s, m) => s + m.currentAttack, 0)
    const survivalThreshold = player.hero.health * 0.7
    if (enemyNextAttack >= survivalThreshold) {
      // setup 不会立即兑现，让位给清场卡
      score -= 6 + matchingLinkedInHand * 1.5
    }
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
  let finalScore = score * 0.6 + efficiency * 0.4 * cost

  // §23 难度修正
  if (difficulty === 'novice') {
    // 新手：评分加 ±40% 随机噪声 · 但保留 -500 阈值（极差选项仍会避开）
    if (finalScore > -100) {
      finalScore = finalScore * (0.5 + Math.random())
    }
  } else if (difficulty === 'grandmaster') {
    // 宗师：积极兑现联动 + combo · 已有 standard 的留牌逻辑覆盖（不再 penalize）
    // 1. combo 件齐全时额外加权（鼓励 combo 兑现）
    if (data.comboFlagSet) {
      const partnerInHand = player.hand.some(
        (c) => c.data.comboFlagRequirement === data.comboFlagSet,
      )
      if (partnerInHand) finalScore += 3
    }
    // 2. 锚点联动卡 · 锚点已激活时额外加权（更看重联动收益）
    if (data.anchorRequirement) {
      const anchorOnBoard = engine.hasAnchorOnBoard(side, data.anchorRequirement)
      if (anchorOnBoard) finalScore += 2
    }
    // 3. 锚点武将自带额外加权（更愿铺锚点）
    if (data.anchorTag) {
      const matchingLinkedInHand = player.hand.filter(
        (c) => c.data.anchorRequirement === data.anchorTag,
      ).length
      finalScore += matchingLinkedInHand * 1.5
    }
  }

  return finalScore
}

function scoreSpellEffect(
  eff: { action: string; params?: Record<string, unknown>; trigger?: string },
  _side: PlayerSide,
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
      let amount = (p.amount as number) ?? 0
      // §22-iter7 · conditional 若敌方场上有匹配 tag 的目标，按替代伤害评估
      const conditional = p.conditional as
        | { ifTargetHasTag?: string; useAmountInstead?: number }
        | undefined
      if (
        conditional &&
        conditional.ifTargetHasTag &&
        typeof conditional.useAmountInstead === 'number' &&
        enemy.board.some((m) => m.tags?.has(conditional.ifTargetHasTag!))
      ) {
        amount = conditional.useAmountInstead
      }
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
      // §22-iter7 · 支持 maxTargets 上限 + lowTargetBonus 寡目标加伤
      const baseAmount = (p.amount as number) ?? 0
      const targetSide = (p.side as string) === 'self' ? player.board : enemy.board
      const maxTargets = p.maxTargets as number | undefined
      const lowTargetBonus = p.lowTargetBonus as
        | { threshold: number; bonus: number }
        | undefined
      const hitCount =
        typeof maxTargets === 'number'
          ? Math.min(targetSide.length, maxTargets)
          : targetSide.length
      const effectiveAmount =
        lowTargetBonus && hitCount > 0 && hitCount <= lowTargetBonus.threshold
          ? baseAmount + lowTargetBonus.bonus
          : baseAmount
      // killable 评估：随机选 N 时无法精确预知命中，按整体可斩杀数 × 命中比率近似
      const killableAll = targetSide.filter((m) => m.currentHealth <= effectiveAmount).length
      const hitRatio = targetSide.length > 0 ? hitCount / targetSide.length : 0
      const killable = Math.round(killableAll * hitRatio)
      return effectiveAmount * hitCount * 0.7 + killable * 2
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
      // §22-trace-fix-2 · 满 HP 时硬负 -1000（×0.6 = -600 < -500 阈值 → AI 不打）
      if (player.hero.health >= player.hero.maxHealth) return -1000
      const amount = (p.amount as number) ?? 0
      const missingHp = player.hero.maxHealth - player.hero.health
      const effective = Math.min(amount, missingHp)
      const hpPct = player.hero.health / player.hero.maxHealth
      // 几乎满血（剩 1-2 HP missing） → 仍负避免过度治疗
      if (missingHp <= 2) return -50
      // 残血时（<30% HP）×3 权重
      const weight = hpPct < 0.3 ? 1.5 : hpPct < 0.6 ? 0.8 : 0.4
      return effective * weight
    }
    case 'freeze':
    case 'cannotAttackThisTurn': {
      // §22.P2-6 · 看目标价值（敌方最高 atk minion）
      if (enemy.board.length === 0) return -1000
      const maxAtk = Math.max(...enemy.board.map((m) => m.currentAttack))
      return maxAtk >= 4 ? 5 : maxAtk >= 2 ? 3 : 1.5
    }
    case 'attackDebuff':
    case 'applyTagToTargetAndAdjacent': {
      // §22-trace-fix-3 · 旧火油 -2 atk + oiled · 价值看"我方是否会被攻击"
      if (enemy.board.length === 0) return -1000
      const amount = (p.amount as number) ?? 2
      const myMinionCount = player.board.length
      const hpDangerFactor = player.hero.health <= 10 ? 2 : player.hero.health <= 18 ? 1 : 0.4
      const protectFactor = myMinionCount > 0 ? 1.5 : hpDangerFactor
      return amount * 0.9 * protectFactor + 1
    }
    case 'applyDamageVulnerability': {
      // §22-iter7 · W18 火油 · 主目标 + 相邻共最多 3 个敌方武将 + N 受击额外伤害
      // 价值取决于：本回合我方能否对这些目标接续输出（手牌伤害 / 场上随从 / 武器）
      if (enemy.board.length === 0) return -1000
      const amount = (p.amount as number) ?? 1
      // 简化：假设平均命中 2 个相邻目标 × amount 等效附加伤害
      // 再叠加 oiled tag 触发组合的预期收益 +2
      const avgHits = Math.min(3, enemy.board.length)
      return amount * avgHits * 1.0 + 2
    }
    case 'freezeAll': {
      // §22-iter1 · W23 连环计 · 全场冰冻 · 敌方 board 越大越值
      const targetSide = (p.side as string) === 'self' ? player.board : enemy.board
      if (targetSide.length === 0) return -1000
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
      if (valid.length === 0) return -1000 // 无有效目标 → 别浪费
      const best = valid.reduce(
        (max, m) =>
          (m.currentAttack + m.currentHealth) > (max.currentAttack + max.currentHealth) ? m : max,
        valid[0],
      )
      // §22-trace-fix-1 · 加目标价值门槛 · 1/1 vanilla 不值得反间计
      const targetValue = best.currentAttack + best.currentHealth
      if (targetValue <= 2) return -200 // 太弱不值得
      return targetValue * 0.7 + 2
    }
    case 'refundMana':
      return ((p.amount as number) ?? 0) * 1.0
    case 'setNextTurnManaBoost':
      return ((p.amount as number) ?? 0) * 0.9
    case 'buffMinion': {
      // §22.P1-9 · 看目标 · 友方最高 atk 武将
      if (player.board.length === 0) return -1000
      const att = (p.attack as number) ?? 0
      const hp = (p.health as number) ?? 0
      const best = player.board.reduce(
        (max, m) => (m.currentAttack > max.currentAttack ? m : max),
        player.board[0],
      )
      // 高 atk 友方 +buff → 滚雪 / 助势，价值高
      return (att + hp) * 1.2 + best.currentAttack * 0.3
    }
    case 'grantExtraAttack':
      return player.board.length > 0 ? 3 : -1000
    case 'grantKeyword':
      return player.board.length > 0 ? 2.5 : -1000
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

// §22 trace · 解释 chooseAttackTarget 给出的目标背后的理由（与 chooseAttackTarget 的判定顺序保持同步）
function explainAttackTarget(
  engine: GameEngine,
  attacker: Attacker,
  target: TargetRef,
  side: PlayerSide,
): string {
  const enemySide: PlayerSide = side === 'player' ? 'ai' : 'player'
  const enemy = engine.state[enemySide]
  const me = engine.state[side]
  const enemyNextTurnAttack = enemy.board.reduce((s, m) => s + m.currentAttack, 0)
  if (enemyNextTurnAttack >= me.hero.health && target.kind === 'minion') {
    return `生存模式·敌方下回合总攻 ${enemyNextTurnAttack}≥我方HP ${me.hero.health}→清最高威胁`
  }
  if (engine.hasTaunt(enemySide) && target.kind === 'minion') {
    return '敌方有嘲讽·选最低血嘲讽'
  }
  if (target.kind === 'hero' && attacker.attack >= enemy.hero.health) {
    return `斩杀线·攻 ${attacker.attack}≥敌HP ${enemy.hero.health}`
  }
  if (target.kind === 'minion') {
    const m = enemy.board.find((b) => b.instanceId === target.instanceId)
    if (m?.data.anchorTag) {
      return `优先清锚点武将(${m.data.anchorTag})`
    }
    if (m && m.currentAttack >= 3 && attacker.attack >= m.currentHealth) {
      return `清高攻威胁·攻 ${m.currentAttack}≥3·可斩`
    }
    return '残留目标（无 face 通路）'
  }
  return '默认打脸'
}

// ============================================
// 选攻击目标（v5.5 加防过载）
// ============================================

function chooseAttackTarget(
  engine: GameEngine,
  attacker: Attacker,
  side: PlayerSide,
  difficulty: AIDifficulty = 'standard',
): TargetRef | null {
  const enemySide: PlayerSide = side === 'player' ? 'ai' : 'player'
  const enemy = engine.state[enemySide]
  const me = engine.state[side]
  const myMinion = !attacker.isHero ? engine.findInstance(attacker.id, side) : null

  // §23 新手：60% 概率直接打脸（无视嘲讽除外）· 不做防过载 / 锚点 / 威胁判断
  if (difficulty === 'novice') {
    const canHitHero = !(
      myMinion &&
      myMinion.currentKeywords.has('rush' as Keyword) &&
      !myMinion.currentKeywords.has('charge' as Keyword) &&
      myMinion.summonedThisTurn
    )
    if (engine.hasTaunt(enemySide)) {
      const taunts = enemy.board.filter((m) => m.currentKeywords.has('taunt' as Keyword))
      return { kind: 'minion', side: enemySide, instanceId: taunts[0].instanceId }
    }
    if (canHitHero && Math.random() < 0.6) {
      return { kind: 'hero', side: enemySide }
    }
    if (enemy.board.length > 0) {
      const random = enemy.board[Math.floor(Math.random() * enemy.board.length)]
      return { kind: 'minion', side: enemySide, instanceId: random.instanceId }
    }
    if (canHitHero) return { kind: 'hero', side: enemySide }
    return null
  }

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

  // §22-trace-fix-5 · 吴 control 偏好 trade · 任何可净换都换（不打脸）
  // 蜀 aggressive 维持原行为打脸
  if (me.hero.faction === 'wu' && enemyMinions.length > 0) {
    // 选可斩杀且不会反伤死自己的目标 · atk 最高优先
    const myMinion = !attacker.isHero ? engine.findInstance(attacker.id, side) : null
    const killable = enemyMinions.filter((m) => {
      const canKill = attacker.attack >= m.currentHealth
      // 反伤判定（主公没反伤·minion 有）
      const willSurvive = attacker.isHero || (myMinion && myMinion.currentHealth > m.currentAttack)
      return canKill && willSurvive
    })
    if (killable.length > 0) {
      killable.sort((a, b) => b.currentAttack - a.currentAttack)
      return { kind: 'minion', side: enemySide, instanceId: killable[0].instanceId }
    }
    // 没有 clean kill·但有高威胁 → 牺牲自己 trade（仅限大威胁 atk≥4）
    if (!attacker.isHero && enemyMinions[0].currentAttack >= 4) {
      return { kind: 'minion', side: enemySide, instanceId: enemyMinions[0].instanceId }
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
  difficulty: AIDifficulty = 'standard',
): TargetRef | undefined {
  const enemySide: PlayerSide = side === 'player' ? 'ai' : 'player'
  const enemy = engine.state[enemySide]
  const effects = card.data.effects ?? []

  // v5.5 buffMinion / grantExtraAttack / grantKeyword → 选自家高 atk 武将
  const targetingFriendly = ['buffMinion', 'grantExtraAttack', 'grantKeyword']
  if (effects.some((e) => targetingFriendly.includes(e.action))) {
    const friendly = engine.state[side].board
    if (friendly.length === 0) return undefined
    // §23 新手：40% 概率选随机友方（错失最优 buff 目标）
    if (difficulty === 'novice' && Math.random() < 0.4) {
      const random = friendly[Math.floor(Math.random() * friendly.length)]
      return { kind: 'minion', side, instanceId: random.instanceId }
    }
    const sorted = [...friendly].sort((a, b) => b.currentAttack - a.currentAttack)
    return { kind: 'minion', side, instanceId: sorted[0].instanceId }
  }

  if (enemy.board.length === 0) return undefined

  // §23 新手：40% 概率随机选敌方目标（错失斩杀线 / 错失高威胁清除）
  if (difficulty === 'novice' && Math.random() < 0.4) {
    const random = enemy.board[Math.floor(Math.random() * enemy.board.length)]
    return { kind: 'minion', side: enemySide, instanceId: random.instanceId }
  }

  // §22-trace-fix-1 · 控场卡（送回手/抢夺/冰冻/不能攻击/降攻）选 maxCost 内"最强威胁"
  // 不再用"血量最低"·因为反间计送 1/2 vanilla 是浪费
  const controlActions = ['returnToHand', 'steal', 'freeze', 'cannotAttackThisTurn', 'attackDebuff', 'applyTagToTargetAndAdjacent', 'applyDamageVulnerability']
  const controlEff = effects.find((e) => controlActions.includes(e.action))
  if (controlEff) {
    const maxCost = ((controlEff.params as Record<string, unknown> | undefined)?.maxCost as number | undefined) ?? Infinity
    const valid = enemy.board.filter((m) => m.data.cost <= maxCost)
    if (valid.length === 0) return undefined
    // 取 atk+hp 最大（最强威胁）·atk 优先（控制 atk 比控制 hp 价值高）
    const ranked = [...valid].sort(
      (a, b) =>
        (b.currentAttack * 2 + b.currentHealth) - (a.currentAttack * 2 + a.currentHealth),
    )
    return { kind: 'minion', side: enemySide, instanceId: ranked[0].instanceId }
  }

  // 伤害类法术：优先斩杀（hp ≤ amount），其次最高威胁
  const dmgEff = effects.find((e) => e.action === 'dealDamage')
  if (dmgEff) {
    const params = (dmgEff.params as Record<string, unknown> | undefined) ?? {}
    const baseAmount = (params.amount as number | undefined) ?? 0
    // §22-iter7 · 评估 conditional：若敌方场上有匹配 tag 的武将，按替代伤害评估并优先选中
    const cond = params.conditional as
      | { ifTargetHasTag?: string; useAmountInstead?: number }
      | undefined
    if (
      cond &&
      cond.ifTargetHasTag &&
      typeof cond.useAmountInstead === 'number'
    ) {
      const taggedTargets = enemy.board.filter((m) => m.tags?.has(cond.ifTargetHasTag!))
      if (taggedTargets.length > 0) {
        const amount = cond.useAmountInstead
        const lethalTagged = taggedTargets.filter((m) => m.currentHealth <= amount)
        const pool = lethalTagged.length > 0 ? lethalTagged : taggedTargets
        pool.sort((a, b) => b.currentAttack - a.currentAttack)
        return { kind: 'minion', side: enemySide, instanceId: pool[0].instanceId }
      }
    }
    const lethal = enemy.board.filter((m) => m.currentHealth <= baseAmount)
    if (lethal.length > 0) {
      // 可斩杀 → 选 atk 最高（清最威胁）
      lethal.sort((a, b) => b.currentAttack - a.currentAttack)
      return { kind: 'minion', side: enemySide, instanceId: lethal[0].instanceId }
    }
    // 无法斩杀 → 砸最高威胁血量
    const sorted = [...enemy.board].sort((a, b) => b.currentAttack - a.currentAttack)
    return { kind: 'minion', side: enemySide, instanceId: sorted[0].instanceId }
  }

  // 兜底：选血量最低（fallback 保持原行为）
  const sortedByHp = [...enemy.board].sort((a, b) => a.currentHealth - b.currentHealth)
  return { kind: 'minion', side: enemySide, instanceId: sortedByHp[0].instanceId }
}
