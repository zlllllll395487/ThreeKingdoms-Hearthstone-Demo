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
  draw_glow: 6,
  weapon_slash: 6,
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

interface FxStore {
  events: FxEvent[]
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
  /** 清空所有（如战斗结束 / 重开局）*/
  clear: () => void
}

let nextId = 1

export const useFxStore = create<FxStore>((set) => ({
  events: [],
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
  clear: () => set({ events: [] }),
}))

export function getFxFrameCount(kind: FxKind): number {
  return FX_FRAME_COUNT[kind]
}
