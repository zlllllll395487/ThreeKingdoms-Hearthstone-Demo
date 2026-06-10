/**
 * §19.6 Phase C · FX 队列管理（轻量版）
 *
 * 用 Zustand 维护一组当前播放中的 FX 事件
 * BattleScreen 渲染 fxStore.events 数组（每个一个 FxSprite）
 * 单个 FX 播完自动从 store 移除
 */

import { create } from 'zustand'

export type FxKind =
  | 'heal_pillar'        // 治疗光柱 7 帧
  | 'fire_aoe'           // 火焰 AoE 11 帧
  | 'fire_projectile'    // 火球飞行 8 帧
  | 'freeze'             // 冰冻 7 帧
  | 'summon'             // 召唤光柱 8 帧
  | 'draw_glow'          // 抽牌发光 6 帧
  | 'weapon_slash'       // 武器斩击 6 帧

export interface FxEvent {
  id: string
  kind: FxKind
  /** 中央定位 'center' / 或者像素坐标 */
  anchor: 'center' | { x: number; y: number }
  size: number
  durationMs: number
}

const FX_FRAME_COUNT: Record<FxKind, number> = {
  heal_pillar: 7,
  fire_aoe: 11,
  fire_projectile: 8,
  freeze: 7,
  summon: 8,
  draw_glow: 4,   // 用户切图原 6 帧，后 2 帧是光柱（不要），改 ping-pong 播 1234321
  weapon_slash: 6,
}

/**
 * 自定义帧播放顺序 · 不在此表的 kind 走 1..totalFrames 线性
 * draw_glow: 用户要求 1→2→3→4→3→2→1 视觉「光圈变大后变小」
 */
const FX_FRAME_SEQUENCE: Partial<Record<FxKind, number[]>> = {
  draw_glow: [1, 2, 3, 4, 3, 2, 1],
}

export function getFxFrameSequence(kind: FxKind): number[] | undefined {
  return FX_FRAME_SEQUENCE[kind]
}

const FX_DEFAULT_DURATION: Record<FxKind, number> = {
  heal_pillar: 700,
  fire_aoe: 1000,
  fire_projectile: 700,
  freeze: 700,
  summon: 800,
  draw_glow: 600,
  weapon_slash: 500,
}

/** §19.6 Phase B · 攻击者前冲状态 */
export interface ChargingAttacker {
  /** 攻击者 id · minion.instanceId 或 'hero_player' / 'hero_ai' */
  id: string
  /** 攻击者所属阵营 · 决定冲击方向（player 向上 / ai 向下）*/
  side: 'player' | 'ai'
}

interface FxStore {
  events: FxEvent[]
  /** §19.6 Phase B · 当前正在前冲的攻击者（同时只有一个）*/
  chargingAttacker: ChargingAttacker | null
  /** 触发一个 fx · 返回事件 id */
  trigger: (
    kind: FxKind,
    opts?: {
      anchor?: 'center' | { x: number; y: number }
      size?: number
      durationMs?: number
    },
  ) => string
  /** 移除已播完的 fx */
  remove: (id: string) => void
  /** §19.6 Phase B · 设置 / 清除攻击者前冲态 */
  setCharging: (c: ChargingAttacker | null) => void
  /** 清空所有（如战斗结束 / 重开局）*/
  clear: () => void
}

let nextId = 1

export const useFxStore = create<FxStore>((set) => ({
  events: [],
  chargingAttacker: null,
  setCharging: (c) => set({ chargingAttacker: c }),
  trigger: (kind, opts) => {
    const id = `fx_${nextId++}`
    const event: FxEvent = {
      id,
      kind,
      anchor: opts?.anchor ?? 'center',
      size: opts?.size ?? 280,
      durationMs: opts?.durationMs ?? FX_DEFAULT_DURATION[kind],
    }
    set((s) => ({ events: [...s.events, event] }))
    return id
  },
  remove: (id) => {
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }))
  },
  clear: () => set({ events: [], chargingAttacker: null }),
}))

export function getFxFrameCount(kind: FxKind): number {
  return FX_FRAME_COUNT[kind]
}
