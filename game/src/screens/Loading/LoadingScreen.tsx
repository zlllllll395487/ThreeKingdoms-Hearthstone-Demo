import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './LoadingScreen.module.css'

/**
 * 加载页 · 从 splash 进入 mainmenu 之间的过渡
 *
 * - 全屏背景图
 * - 底部 40px 深色文字行 + 4px 进度填充
 * - 3 秒内进度断断续续 0% → 100%
 * - 100% 后自动进入 mainmenu
 */
export function LoadingScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const [progress, setProgress] = useState(0)

  const bgUrl = getUiAssetUrl('loading_bg.png')

  useEffect(() => {
    // 断断续续的进度序列：跳一段 → 停一下 → 再跳
    // 总耗时 3000ms
    const sequence: Array<[number, number]> = [
      [0, 0],
      [180, 8],
      [450, 8],     // 停顿
      [720, 22],
      [1050, 22],   // 停顿
      [1320, 38],
      [1620, 41],
      [1880, 41],   // 停顿
      [2150, 58],
      [2350, 58],   // 停顿
      [2600, 75],
      [2780, 75],   // 停顿
      [2900, 92],
      [3000, 100],
    ]

    const timers: number[] = []
    for (const [t, p] of sequence) {
      timers.push(window.setTimeout(() => setProgress(p), t))
    }
    timers.push(window.setTimeout(() => navigate('mainmenu'), 3200))

    return () => {
      timers.forEach((id) => clearTimeout(id))
    }
  }, [navigate])

  return (
    <div className={styles.container}>
      {bgUrl && <img src={bgUrl} alt="" className={styles.background} />}

      <div className={styles.bottomBar}>
        <div className={styles.textRow}>
          <span className={styles.statusText}>
            正 在 调 度 兵 马 · 请 稍 候 片 刻
          </span>
          <span className={styles.percentText}>{Math.floor(progress)}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
