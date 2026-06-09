/**
 * 战斗日志 / 事件类型
 *
 * Engine 在执行操作时往 log 数组追加 LogEntry，UI 可订阅显示。
 */

import type { CardInstance, PlayerSide } from './types'

export type LogKind =
  | 'turn'           // 回合开始
  | 'play'           // 出牌
  | 'attack'         // 攻击
  | 'damage'         // 伤害结算
  | 'heal'           // 治疗
  | 'death'          // 武将死亡
  | 'effect'         // 效果触发
  | 'draw'           // 抽牌
  | 'fatigue'        // 疲劳
  | 'win'            // 胜负

export interface LogEntry {
  kind: LogKind
  text: string
  side?: PlayerSide
}

export function logTurn(turn: number, side: PlayerSide): LogEntry {
  return { kind: 'turn', side, text: `第 ${turn} 回合 · ${side === 'player' ? '你的' : '对手的'}回合开始` }
}

export function logPlay(side: PlayerSide, instance: CardInstance): LogEntry {
  return { kind: 'play', side, text: `${side === 'player' ? '你' : 'AI'}打出 ${instance.data.name}` }
}

export function logAttack(side: PlayerSide, attacker: string, target: string): LogEntry {
  return { kind: 'attack', side, text: `${attacker} 攻击 ${target}` }
}

export function logDamage(target: string, amount: number): LogEntry {
  return { kind: 'damage', text: `${target} 受到 ${amount} 点伤害` }
}

export function logHeal(target: string, amount: number): LogEntry {
  return { kind: 'heal', text: `${target} 恢复 ${amount} 点生命值` }
}

export function logDeath(name: string): LogEntry {
  return { kind: 'death', text: `${name} 阵亡` }
}

export function logEffect(text: string): LogEntry {
  return { kind: 'effect', text }
}

export function logDraw(side: PlayerSide, name: string): LogEntry {
  return { kind: 'draw', side, text: `${side === 'player' ? '你' : 'AI'}抽到 ${name}` }
}

export function logWin(side: PlayerSide): LogEntry {
  return { kind: 'win', side, text: `${side === 'player' ? '你赢了！' : '你输了…'}` }
}
