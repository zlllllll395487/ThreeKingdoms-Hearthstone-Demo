/**
 * §19.7.14 · 共用返回/退出按钮 · 复用 modal_btn_short_on.png / long_on.png
 *
 * 全局所有返回按钮（Codex / FactionSelect / SubPage / Result / Battle / MainMenu switch modal）
 * 统一用此组件 · 文字直接叠在按钮上（无需额外切图）
 *
 * 用法：
 *   <BackButton onClick={() => navigate('mainmenu')}>返回</BackButton>
 *   <BackButton variant="long" onClick={...}>返回主菜单</BackButton>
 */

import type { ReactNode } from 'react'
import styles from './BackButton.module.css'

interface Props {
  onClick: () => void
  children?: ReactNode
  /** short = 227×88 单/双字 · long = 415×88 多字 */
  variant?: 'short' | 'long'
  /** 父级定位类（绝对定位等）*/
  className?: string
  /** 自定义 aria-label，默认取 children */
  ariaLabel?: string
}

export function BackButton({
  onClick,
  children = '返回',
  variant = 'short',
  className = '',
  ariaLabel,
}: Props) {
  const cls = variant === 'long' ? styles.btnLong : styles.btnShort
  return (
    <button
      className={`${styles.btn} ${cls} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel ?? (typeof children === 'string' ? children : '返回')}
    >
      <span className={styles.text}>{children}</span>
    </button>
  )
}
