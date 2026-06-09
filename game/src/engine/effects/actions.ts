/**
 * 卡牌效果实现 · 9 个 action
 *
 * 与 cards/*.json 里 effects[].action 字段一一对应。
 */

import type { CardInstance, PlayerSide, PlayerState } from '../types'
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

/** S01 关羽威名：装备指定兵器 */
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

/** S02 张飞遗志 / N05 万箭齐发：对全场某方目标造成伤害 */
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

/** S03 桃园结义 / N09 募兵令：召唤 token */
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
    inst.exhausted = true // 召唤失调
    player.board.push(inst)
  }
  engine.log.push(logEffect(`${source.data.name}：召唤 ${count} 个 ${tokenData.name}`))
}

/** S04 仁德之政：所有友方武将 +X/+Y */
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
  engine.log.push(logEffect(`${source.data.name}：所有友方武将 +${attack}/+${health}`))
}

/** S05 黄忠：对一个敌方武将造成 X 伤害（需要目标） */
const dealDamage: ActionFn = (engine, source, params, target) => {
  const amount = (params.amount as number) ?? 0
  const bonus = engine.spellPowerBonus[source.owner!]
  const finalAmount = source.data.type === 'spell' ? amount + bonus : amount
  if (!target) return
  if (target.kind === 'hero') {
    engine.dealDamageToHero(target.side, finalAmount)
  } else {
    const m = engine.findInstance(target.instanceId, target.side)
    if (m) engine.dealDamageToMinion(m, finalAmount)
  }
  engine.log.push(logEffect(`${source.data.name}：造成 ${finalAmount} 点伤害`))
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

/** N03 李儒：本局法力伤害 +X */
const grantSpellPower: ActionFn = (engine, source, params) => {
  const amount = (params.amount as number) ?? 1
  engine.spellPowerBonus[source.owner!] += amount
  engine.log.push(logEffect(`${source.data.name}：计策伤害 +${amount}`))
}

/** N10 休养生息（治疗）+ 单独 heal 用 */
const heal: ActionFn = (engine, source, params) => {
  const targetType = (params.target as string) ?? 'hero'
  const sideParam = (params.side as 'self' | 'enemy') ?? 'self'
  const amount = (params.amount as number) ?? 0
  const targetSide: PlayerSide =
    sideParam === 'self' ? source.owner! : getEnemySide(source.owner!)
  const player = getPlayer(engine, targetSide)
  if (targetType === 'hero') {
    player.hero.health = Math.min(player.hero.maxHealth, player.hero.health + amount)
  }
  engine.log.push(logEffect(`${source.data.name}：恢复 ${amount} 点生命值`))
}

/** N11 谋士 / N10 休养生息：抽 X 张牌 */
const drawCard: ActionFn = (engine, source, params) => {
  const count = (params.count as number) ?? 1
  for (let i = 0; i < count; i++) {
    engine.drawCardForSide(source.owner!)
  }
}

export const ACTIONS: Record<string, ActionFn> = {
  equipWeapon,
  dealDamageAll,
  summonToken,
  buffAll,
  dealDamage,
  randomCardToHand,
  grantSpellPower,
  heal,
  drawCard,
}
