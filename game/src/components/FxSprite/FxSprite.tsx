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
import { createPortal } from 'react-dom'
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
  /** 自定义帧序列 · 例如 [1,2,3,4,3,2,1] ping-pong；不传则用 1..totalFrames 线性 */
  frames?: number[]
  /** 播完触发 */
  onComplete?: () => void
}

export function FxSprite({
  name,
  totalFrames,
  durationMs = 1000,
  anchor = 'targetRect',
  size = 200,
  frames,
  onComplete,
}: Props) {
  const [frame, setFrame] = useState(frames ? frames[0] : 1)

  useEffect(() => {
    const seq = frames ?? Array.from({ length: totalFrames }, (_, i) => i + 1)
    const interval = durationMs / seq.length
    let idx = 0
    const timer = setInterval(() => {
      idx += 1
      if (idx >= seq.length) {
        clearInterval(timer)
        onComplete?.()
        return
      }
      setFrame(seq[idx])
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

  const img = (
    <img
      src={url}
      alt=""
      aria-hidden
      className={styles.sprite}
      style={style}
    />
  )

  // §19.7.4 · canvas 用 transform: scale 居中适配，会导致子元素 position:fixed
  // 失效降级为相对 canvas 定位（CSS containing block 规则）→ {x,y} viewport 坐标错位。
  // center / {x,y} 模式 portal 到 body 逃出 transform 容器；targetRect 模式仍走原 absolute。
  if (anchor === 'center' || typeof anchor === 'object') {
    return createPortal(img, document.body)
  }
  return img
}
