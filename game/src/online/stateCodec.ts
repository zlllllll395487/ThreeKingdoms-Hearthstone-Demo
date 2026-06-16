/**
 * GameState 序列化编解码 · 前后端共用
 *
 * 关键坑：GameState 里多处用 Set（见 engine/types.ts）：
 *   - CardInstance.currentKeywords / tags
 *   - PlayerState.comboFlagsThisTurn / onceUsedKeys
 * JSON.stringify(Set) 得到 {} 会丢数据。
 *
 * 方案：序列化时用 replacer 把任意 Set → { __set__: [...] }，
 * 反序列化时用 reviver 转回 Set。通用，自动覆盖所有嵌套层级，
 * 无需手动遍历每个字段。
 *
 * matchState 消息里 state 字段就是 serializeState 的输出 string，
 * 整条消息再普通 JSON.stringify 时不会二次丢 Set（state 已是纯 string）。
 */

import type { GameState } from '@/engine/types'

const SET_TAG = '__set__'

interface SetEnvelope {
  [SET_TAG]: unknown[]
}

function isSetEnvelope(value: unknown): value is SetEnvelope {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>)[SET_TAG])
  )
}

/** GameState → JSON string（Set 安全） */
export function serializeState(state: GameState): string {
  return JSON.stringify(state, (_key, value) => {
    if (value instanceof Set) {
      return { [SET_TAG]: Array.from(value as Set<unknown>) }
    }
    return value
  })
}

/** JSON string → GameState（Set 还原） */
export function deserializeState(raw: string): GameState {
  return JSON.parse(raw, (_key, value) => {
    if (isSetEnvelope(value)) {
      return new Set(value[SET_TAG])
    }
    return value
  }) as GameState
}
