/**
 * §19.6 Phase C · FX 序列帧播放器
 *
 * 按 durationMs / totalFrames 速率切帧，播完调 onComplete
 * 默认 1000ms（plan §19.6.7 拍板）
 *
 * 用法：
 *   <FxSprite name="heal_pillar" totalFrames={7} durationMs={700} onComplete={...} />
 *   <FxSprite name="fire_aoe" totalFrames={11} durationMs={1000} />
 */

import { useEffect, useState } from 'react'
import { getFxFrame } from '@/data/assetLoader'
import styles from './FxSprite.module.css'

interface Props {
  name: string
  totalFrames: number
  durationMs?: number
  /** 锚定位置：'center' 整屏中央 | { x, y } 像素坐标 | 'targetRect' 由父层 absolute 控制 */
  anchor?: 'center' | 'targetRect' | { x: number; y: number }
  /** 像素尺寸 · 默认 200 */
  size?: number
  /** 播完触发 */
  onComplete?: () => void
}

export function FxSprite({
  name,
  totalFrames,
  durationMs = 1000,
  anchor = 'targetRect',
  size = 200,
  onComplete,
}: Props) {
  const [frame, setFrame] = useState(1)

  useEffect(() => {
    const interval = durationMs / totalFrames
    let cur = 1
    const timer = setInterval(() => {
      cur += 1
      if (cur > totalFrames) {
        clearInterval(timer)
        onComplete?.()
        return
      }
      setFrame(cur)
    }, interval)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const url = getFxFrame(name, frame)
  if (!url) return null

  const style: React.CSSProperties = {
    width: size,
    height: size,
  }
  if (anchor === 'center') {
    style.position = 'fixed'
    style.left = '50%'
    style.top = '50%'
    style.transform = 'translate(-50%, -50%)'
    style.zIndex = 200
  } else if (typeof anchor === 'object') {
    style.position = 'fixed'
    style.left = anchor.x
    style.top = anchor.y
    style.transform = 'translate(-50%, -50%)'
    style.zIndex = 200
  } else {
    // targetRect：父层 absolute 控制
    style.position = 'absolute'
    style.left = '50%'
    style.top = '50%'
    style.transform = 'translate(-50%, -50%)'
    style.zIndex = 30
  }

  return (
    <img
      src={url}
      alt=""
      aria-hidden
      className={styles.sprite}
      style={style}
    />
  )
}
