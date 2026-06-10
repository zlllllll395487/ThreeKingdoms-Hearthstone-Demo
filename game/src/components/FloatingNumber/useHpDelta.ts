/**
 * §19.6 Hook · 检测 HP 数值变化，输出"应该弹什么数字"
 *
 * 用法：
 *   const delta = useHpDelta(minion.currentHealth)
 *   {delta && <FloatingNumber kind={delta.kind} value={delta.value} id={delta.id} />}
 */

import { useEffect, useRef, useState } from 'react'

interface HpDelta {
  id: number          // 每次触发递增，让 React key 重挂使动画重播
  kind: 'damage' | 'heal'
  value: number
}

export function useHpDelta(currentHp: number): HpDelta | null {
  const prevRef = useRef<number>(currentHp)
  const [delta, setDelta] = useState<HpDelta | null>(null)
  const idRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const prev = prevRef.current
    if (currentHp !== prev) {
      const change = currentHp - prev
      idRef.current += 1
      setDelta({
        id: idRef.current,
        kind: change < 0 ? 'damage' : 'heal',
        value: Math.abs(change),
      })
      // 800ms 后清除（与 floatFadeOut 时长一致）
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setDelta(null)
        timerRef.current = null
      }, 850)
      prevRef.current = currentHp
    }
  }, [currentHp])

  return delta
}

/**
 * §19.6 Hook · 检测「单位受击」事件触发震动 class
 *
 * 输入 currentHp，当 HP 减少时返回 true 维持 200ms
 */
export function useHitShake(currentHp: number): boolean {
  const prevRef = useRef<number>(currentHp)
  const [hitting, setHitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const prev = prevRef.current
    if (currentHp < prev) {
      setHitting(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setHitting(false)
        timerRef.current = null
      }, 220)
    }
    prevRef.current = currentHp
  }, [currentHp])

  return hitting
}
