/**
 * §19.6 浮起反馈数字 / 文字
 *
 * 受击 -X / 治疗 +X / 状态文字（"冻结" / "Combo!" 等）
 * 800ms 动画自动消失（200ms 上飘 + 600ms fade-out）
 *
 * 用法：
 *   <FloatingNumber kind="damage" value={3} />
 *   <FloatingNumber kind="heal" value={2} />
 *   <FloatingNumber kind="freeze" text="冻结" />
 */

import styles from './FloatingNumber.module.css'

export type FloatingKind =
  | 'damage'     // 红 -X
  | 'heal'       // 绿 +X
  | 'buff'       // 金 +X/+X
  | 'debuff'     // 紫 -X 攻
  | 'freeze'     // 蓝 冻结
  | 'silence'    // 紫 沉默
  | 'status'     // 通用状态文字

interface Props {
  kind: FloatingKind
  value?: number
  text?: string
  /** 唯一 key，让 React 重挂触发动画重播 */
  id?: string | number
}

export function FloatingNumber({ kind, value, text }: Props) {
  let display: string
  if (text) {
    display = text
  } else if (value === undefined) {
    display = ''
  } else if (kind === 'damage' || kind === 'debuff') {
    display = `-${Math.abs(value)}`
  } else {
    display = `+${value}`
  }

  return (
    <div className={`${styles.float} ${styles[`kind_${kind}`]}`}>
      {display}
    </div>
  )
}
