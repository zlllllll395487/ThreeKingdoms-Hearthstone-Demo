/**
 * 卡牌效果实现 · v5.5 全套 actions
 *
 * 与 cards/*.json 里 effects[].action 字段一一对应。
 * v5.5 新增 16+ 个 actions：refundMana / setNextTurnManaBoost / freeze / discover / steal 等
 */

import type { CardInstance, PlayerSide, PlayerState, Keyword } from '../types'
import type { GameEngine, TargetRef } from '../index'
import { getCard } from '@/data/cardLibrary'
import { instantiate } from '../deck'
import { logEffect } from '../events'

export type ActionFn = (
  engine: GameEngine,
  source: CardInstance,
  params: Record<string, unknown>,
  target?: TargetRef,
) => void

function getEnemySide(side: PlayerSide): PlayerSide {
  return side === 'player' ? 'ai' : 'player'
}

function getPlayer(engine: GameEngine, side: PlayerSide): PlayerState {
  return engine.state[side]
}

// ============================================
// 旧版兼容 (legacy actions, 保留向前兼容)
// ============================================

const equipWeapon: ActionFn = (engine, source, params) => {
  const weaponId = params.weaponId as string
  const weaponData = getCard(weaponId)
  const weaponInst = instantiate(weaponData, source.owner!)
  const player = getPlayer(engine, source.owner!)
  if (player.weapon) {
    player.graveyard.push(player.weapon)
  }
  player.weapon = weaponInst
  player.hero.attack += weaponInst.currentAttack
  engine.log.push(logEffect(`${source.data.name} 装备 ${weaponData.name}`))
}

// ============================================
// 伤害类 actions
// ============================================

/** 对全场某方目标造成伤害 */
const dealDamageAll: ActionFn = (engine, source, params) => {
  const sideParam = params.side as 'self' | 'enemy'
  const targetSide: PlayerSide =
    sideParam === 'self' ? source.owner! : getEnemySide(source.owner!)
  const amount = (params.amount as number) ?? 0
  const targetType = (params.targetType as string) ?? 'minion'
  const player = getPlayer(engine, targetSide)
  const bonus = engine.spellPowerBonus[source.owner!]
  const finalAmount = source.data.type === 'spell' ? amount + bonus : amount
  if (targetType === 'minion' || targetType === 'all') {
    for (const m of [...player.board]) {
      engine.dealDamageToMinion(m, finalAmount)
    }
  }
  if (targetType === 'all') {
    engine.dealDamageToHero(targetSide, finalAmount)
  }
  engine.log.push(logEffect(`${source.data.name}：对${sideParam === 'self' ? '己方' : '敌方'}全体武将造成 ${finalAmount} 点伤害`))
}

/** 对单体目标造成伤害（需 target） */
const dealDamage: ActionFn = (engine, source, params, target) => {
  const amount = (params.amount as number) ?? 0
  const bonus = engine.spellPowerBonus[source.owner!]
  const finalAmount = source.data.type === 'spell' ? amount + bonus : amount
  if (!target) return
  if (target.kind === 'hero') {
    engine.dealDamageToHero(target.side, finalAmount)
    engine.lastDamageTarget = { kind: 'hero', side: target.side }
  } else {
    const m = engine.findInstance(target.instanceId, target.side)
    if (m) {
      engine.dealDamageToMinion(m, finalAmount)
      engine.lastDamageTarget = { kind: 'minion', side: target.side, instanceId: target.instanceId }
    }
  }
  engine.log.push(logEffect(`${source.data.name}：造成 ${finalAmount} 点伤害`))
}

/** 对己方/敌方英雄造成伤害（W14 苦肉计 / W15 运筹帷幄）*/
const dealDamageHero: ActionFn = (engine, source, params) => {
  const sideParam = (params.side as 'self' | 'enemy') ?? 'self'
  const amount = (params.amount as number) ?? 0
  const targetSide: PlayerSide =
    sideParam === 'self' ? source.owner! : getEnemySide(source.owner!)
  engine.dealDamageToHero(targetSide, amount)
  engine.log.push(logEffect(`${source.data.name}：对${sideParam === 'self' ? '己方' : '敌方'}英雄造成 ${amount} 点伤害`))
}

/** S15 黄忠：对一目标造成等于自己攻击力的伤害 */
const dealDamageEqualToAttack: ActionFn = (engine, source, _params, target) => {
  const amount = source.currentAttack
  if (!target) return
  if (target.kind === 'hero') {
    engine.dealDamageToHero(target.side, amount)
  } else {
    const m = engine.findInstance(target.instanceId, target.side)
    if (m) engine.dealDamageToMinion(m, amount)
  }
  engine.log.push(logEffect(`${source.data.name}：造成等于自身攻击力（${amount}）的伤害`))
}

// ============================================
// 召唤 / 加 buff / 抽牌
// ============================================

const summonToken: ActionFn = (engine, source, params) => {
  const tokenId = params.tokenId as string
  const count = (params.count as number) ?? 1
  const sideParam = (params.side as 'self' | 'enemy') ?? 'self'
  const targetSide: PlayerSide =
    sideParam === 'self' ? source.owner! : getEnemySide(source.owner!)
  const player = getPlayer(engine, targetSide)
  const tokenData = getCard(tokenId)
  for (let i = 0; i < count; i++) {
    if (player.board.length >= 7) break
    const inst = instantiate(tokenData, targetSide)
    inst.exhausted = true
    inst.summonedThisTurn = true
    player.board.push(inst)
  }
  engine.log.push(logEffect(`${source.data.name}：召唤 ${count} 个 ${tokenData.name}`))
}

/** 全友方武将 +X/+Y（用于 W22 春风化雨联动 + S22 万军取首联动）*/
const buffAll: ActionFn = (engine, source, params) => {
  const attack = (params.attack as number) ?? 0
  const health = (params.health as number) ?? 0
  const sideParam = (params.side as 'self' | 'enemy') ?? 'self'
  const targetSide: PlayerSide =
    sideParam === 'self' ? source.owner! : getEnemySide(source.owner!)
  const player = getPlayer(engine, targetSide)
  for (const m of player.board) {
    m.currentAttack += attack
    m.currentHealth += health
    m.maxHealth += health
  }
  engine.log.push(logEffect(`${source.data.name}：${sideParam === 'self' ? '友方' : '敌方'}武将全体 +${attack}/+${health}`))
}

/** v5.5 buff 单个武将（需要 target，S22 万军取首 / S09 魏延）*/
const buffMinion: ActionFn = (engine, source, params, target) => {
  if (!target || target.kind !== 'minion') return
  const m = engine.findInstance(target.instanceId, target.side)
  if (!m) return
  const attack = (params.attack as number) ?? 0
  const health = (params.health as number) ?? 0
  m.currentAttack += attack
  m.currentHealth += health
  m.maxHealth += health
  engine.log.push(logEffect(`${source.data.name}：${m.data.name} +${attack}/+${health}`))
}

/** v5.5 滚雪球公式（S18/S19/S20）：场上每个其他友方武将 → 自身 +N/+N */
const dynamicBuffByFriendlyCount: ActionFn = (engine, source, params, _target) => {
  const player = getPlayer(engine, source.owner!)
  const friendlyCount = player.board.filter((m) => m.instanceId !== source.instanceId).length
  const perFriendly = params.perFriendly as { attack: number; health: number }
  const attack = perFriendly.attack * friendlyCount
  const health = perFriendly.health * friendlyCount
  source.currentAttack += attack
  source.currentHealth += health
  source.maxHealth += health
  engine.log.push(logEffect(`${source.data.name}：滚雪球 +${attack}/+${health}（数 ${friendlyCount} 个友方）`))
}

/** v5.5 S22 万军取首：让一友方武将本回合再攻击 1 次 */
const grantExtraAttack: ActionFn = (engine, source, params, target) => {
  void engine // mark used

  if (!target || target.kind !== 'minion') return
  const m = engine.findInstance(target.instanceId, target.side)
  if (!m) return
  // 让其本回合还能再攻击 N 次（默认 1）
  const count = (params.count as number) ?? 1
  m.attacksThisTurn = Math.max(0, m.attacksThisTurn - count)
  m.exhausted = false
  engine.log.push(logEffect(`${source.data.name}：${m.data.name} 可再攻击 ${count} 次`))
}

/** S21 武勇：赋予关键词 */
const grantKeyword: ActionFn = (engine, source, params, target) => {
  if (!target || target.kind !== 'minion') return
  const m = engine.findInstance(target.instanceId, target.side)
  if (!m) return
  const keyword = params.keyword as Keyword
  m.currentKeywords.add(keyword)
  // rush 关键词允许打武将（清除 exhausted 但不允许打英雄）
  if (keyword === 'rush' || keyword === 'charge') {
    m.exhausted = false
  }
  engine.log.push(logEffect(`${source.data.name}：${m.data.name} 获得 ${keyword}`))
}

/** 治疗英雄（N07 金疮药 / W22 春风化雨） */
const healHero: ActionFn = (engine, source, params) => {
  const sideParam = (params.side as 'self' | 'enemy') ?? 'self'
  const amount = (params.amount as number) ?? 0
  const targetSide: PlayerSide =
    sideParam === 'self' ? source.owner! : getEnemySide(source.owner!)
  const player = getPlayer(engine, targetSide)
  const healAmount = Math.min(amount, player.hero.maxHealth - player.hero.health)
  player.hero.health += healAmount
  engine.log.push(logEffect(`${source.data.name}：${sideParam === 'self' ? '己方' : '敌方'}英雄恢复 ${healAmount} HP`))
}

/** 抽牌 */
const drawCards: ActionFn = (engine, source, params) => {
  const count = (params.count as number) ?? 1
  for (let i = 0; i < count; i++) {
    engine.drawCardForSide(source.owner!)
  }
  engine.log.push(logEffect(`${source.data.name}：抽 ${count} 张牌`))
}

/** N02 庞统：随机将一张某类型的牌加入手牌 */
const randomCardToHand: ActionFn = (engine, source, params) => {
  const typeFilter = params.type as string
  const player = getPlayer(engine, source.owner!)
  const candidates = engine.cardPool.filter(
    (c) => c.type === typeFilter && !c.id.startsWith('TK_'),
  )
  if (candidates.length === 0) return
  const picked = candidates[Math.floor(Math.random() * candidates.length)]
  if (player.hand.length < 10) {
    player.hand.push(instantiate(picked, source.owner!))
  }
  engine.log.push(logEffect(`${source.data.name}：将一张 ${picked.name} 加入手牌`))
}

// ============================================
// v5.5 新增 actions
// ============================================

/** 法力返还（仅本回合）：W09 火烧赤壁联动 / W11/W13/W14/W15 抽牌系联动 */
const refundMana: ActionFn = (engine, source, params) => {
  const amount = (params.amount as number) ?? 0
  const player = getPlayer(engine, source.owner!)
  player.mana.current += amount
  engine.log.push(logEffect(`${source.data.name}：当回合法力 +${amount}`))
}

/** S08 屯田 / W06 吕蒙暗度陈仓：下一回合开始时 mana +X */
const setNextTurnManaBoost: ActionFn = (engine, source, params) => {
  const amount = (params.amount as number) ?? 0
  const player = getPlayer(engine, source.owner!)
  player.nextTurnManaBoost += amount
  engine.log.push(logEffect(`${source.data.name}：下回合法力 +${amount}`))
}

/** N03 李儒：本局法术伤害永久 +X */
const addPermanentSpellPower: ActionFn = (engine, source, params) => {
  const amount = (params.amount as number) ?? 1
  engine.spellPowerBonus[source.owner!] += amount
  engine.log.push(logEffect(`${source.data.name}：本局法术伤害 +${amount}`))
}

/** W12 周郎顾曲：冻结一个敌方武将 */
const freeze: ActionFn = (engine, source, _params, target) => {
  if (!target || target.kind !== 'minion') return
  const m = engine.findInstance(target.instanceId, target.side)
  if (!m) return
  m.frozen = true
  engine.log.push(logEffect(`${source.data.name}：${m.data.name} 被冻结`))
}

/** W23 连环计：冻结所有敌方武将 */
const freezeAll: ActionFn = (engine, source, params) => {
  const sideParam = (params.side as 'self' | 'enemy') ?? 'enemy'
  const targetSide: PlayerSide =
    sideParam === 'self' ? source.owner! : getEnemySide(source.owner!)
  const player = getPlayer(engine, targetSide)
  for (const m of player.board) {
    m.frozen = true
  }
  engine.log.push(logEffect(`${source.data.name}：${sideParam === 'enemy' ? '敌方' : '己方'}全场冻结`))
}

/** W18 火油：使一个敌方武将本回合无法攻击 */
const cannotAttackThisTurn: ActionFn = (engine, source, _params, target) => {
  if (!target || target.kind !== 'minion') return
  const m = engine.findInstance(target.instanceId, target.side)
  if (!m) return
  m.cannotAttackThisTurn = true
  engine.log.push(logEffect(`${source.data.name}：${m.data.name} 本回合无法攻击`))
}

/** W26 画地为牢：使一个敌方武将本回合无法攻击 + 相邻武将下回合无法攻击 */
const cannotAttackAdjacent: ActionFn = (engine, source, _params, target) => {
  if (!target || target.kind !== 'minion') return
  const m = engine.findInstance(target.instanceId, target.side)
  if (!m) return
  m.cannotAttackThisTurn = true
  const player = getPlayer(engine, target.side)
  const idx = player.board.findIndex((b) => b.instanceId === m.instanceId)
  // 相邻武将（左 + 右）下回合无法攻击 → 标记一个 pendingDebuff
  // 这里简化：直接在相邻武将上也设 cannotAttackThisTurn（注意 turn 会推进，所以效果在下回合到位）
  // 简单实现：扫描相邻位
  const neighbors: CardInstance[] = []
  if (idx > 0) neighbors.push(player.board[idx - 1])
  if (idx < player.board.length - 1) neighbors.push(player.board[idx + 1])
  for (const n of neighbors) {
    n.cannotAttackThisTurn = true
  }
  engine.log.push(logEffect(`${source.data.name}：${m.data.name} 及相邻共 ${1 + neighbors.length} 个武将受困`))
}

/** v5.5 攻击 debuff（W12 联动 / W25 程普）*/
const attackDebuff: ActionFn = (engine, source, params, target) => {
  if (!target || target.kind !== 'minion') return
  const m = engine.findInstance(target.instanceId, target.side)
  if (!m) return
  const amount = (params.amount as number) ?? 1
  m.currentAttack = Math.max(0, m.currentAttack - amount)
  // duration: 'permanent' | 'turn'（暂未单独跟踪 turn-only 衰退）
  engine.log.push(logEffect(`${source.data.name}：${m.data.name} 攻击力 -${amount}`))
}

/** W20 反间计：将敌方武将弹回对方手牌（受 maxCost 限制）*/
const returnToHand: ActionFn = (engine, source, params, target) => {
  if (!target || target.kind !== 'minion') return
  const m = engine.findInstance(target.instanceId, target.side)
  if (!m) return
  const maxCost = (params.maxCost as number) ?? Infinity
  if (m.data.cost > maxCost) return
  const enemyPlayer = getPlayer(engine, target.side)
  enemyPlayer.board = enemyPlayer.board.filter((b) => b.instanceId !== m.instanceId)
  if (enemyPlayer.hand.length < 10) {
    // 重置 stat
    m.currentAttack = m.data.attack ?? 0
    m.currentHealth = m.data.health ?? 0
    m.maxHealth = m.currentHealth
    m.exhausted = true
    m.frozen = false
    m.cannotAttackThisTurn = false
    enemyPlayer.hand.push(m)
  }
  engine.log.push(logEffect(`${source.data.name}：${m.data.name} 被弹回手牌`))
}

/** W21 美人计：夺取敌方武将（受 maxCost 限制）*/
const steal: ActionFn = (engine, source, params, target) => {
  if (!target || target.kind !== 'minion') return
  const m = engine.findInstance(target.instanceId, target.side)
  if (!m) return
  const maxCost = (params.maxCost as number) ?? Infinity
  if (m.data.cost > maxCost) return
  const enemyPlayer = getPlayer(engine, target.side)
  enemyPlayer.board = enemyPlayer.board.filter((b) => b.instanceId !== m.instanceId)
  m.owner = source.owner
  m.exhausted = true // 召唤失调
  const ownPlayer = getPlayer(engine, source.owner!)
  if (ownPlayer.board.length < 7) {
    ownPlayer.board.push(m)
  }
  engine.log.push(logEffect(`${source.data.name}：夺取 ${m.data.name}`))
}

/** W16 固守待援：发现 1 张谋略卡（≤ maxCost）*/
const discover: ActionFn = (engine, source, params) => {
  const typeFilter = params.type as string
  const maxCost = (params.maxCost as number) ?? Infinity
  const player = getPlayer(engine, source.owner!)
  // 候选池
  const candidates = engine.cardPool.filter(
    (c) =>
      c.type === typeFilter &&
      c.cost <= maxCost &&
      !c.id.startsWith('TK_') &&
      (c.faction === 'wu' || c.faction === 'neutral'),
  )
  if (candidates.length === 0) return
  // 简化版：直接随机选 1 张（demo 阶段，正式 UI 弹窗 3 选 1 待 Phase 5 UI）
  // TODO: 接入 DiscoverModal UI 让玩家 3 选 1
  const picked = candidates[Math.floor(Math.random() * candidates.length)]
  if (player.hand.length < 10) {
    player.hand.push(instantiate(picked, source.owner!))
  }
  engine.log.push(logEffect(`${source.data.name}：发现 ${picked.name}`))
}

/** W17 借东风：下一张谋略 -X 费 */
const reduceNextSpellCost: ActionFn = (engine, source, params) => {
  const amount = (params.amount as number) ?? 2
  engine.nextSpellCostReduction[source.owner!] += amount
  engine.log.push(logEffect(`${source.data.name}：下张谋略 -${amount} 费`))
}

/** S20 赵云：受致命伤时留 1 HP（onceUsedKey 限制） */
const preventLethalToOne: ActionFn = (engine, source) => {
  // 这个 action 由 engine 的伤害计算钩子主动调用
  // 此处仅记录 log；逻辑由 engine/index.ts dealDamageToMinion 内特殊处理
  engine.log.push(logEffect(`${source.data.name}：留下 1 HP`))
}

// ============================================
// 导出注册表
// ============================================

export const ACTIONS: Record<string, ActionFn> = {
  // legacy
  equipWeapon,
  dealDamageAll,
  dealDamage,
  summonToken,
  buffAll,
  randomCardToHand,

  // v5.5 新增 + 重命名兼容
  dealDamageHero,
  dealDamageEqualToAttack,
  buffMinion,
  dynamicBuffByFriendlyCount,
  grantExtraAttack,
  grantKeyword,
  healHero,
  drawCards,
  refundMana,
  setNextTurnManaBoost,
  addPermanentSpellPower,
  freeze,
  freezeAll,
  cannotAttackThisTurn,
  cannotAttackAdjacent,
  attackDebuff,
  returnToHand,
  steal,
  discover,
  reduceNextSpellCost,
  preventLethalToOne,

  // legacy aliases (for backward compat)
  drawCard: drawCards,
  heal: healHero,
  grantSpellPower: addPermanentSpellPower,
}
