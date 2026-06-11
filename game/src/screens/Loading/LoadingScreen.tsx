import { useEffect, useRef, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import {
  getUiAssetUrl,
  getEssentialPreloadUrls,
  preloadBatched,
} from '@/data/assetLoader'
import styles from './LoadingScreen.module.css'

/**
 * 加载页 · §26 两阶段预加载 · Phase 1
 *
 * 只阻塞加载主菜单必需的小型资源（~20 张 · ~5 MB · 秒级完成）
 * 大图（立绘 / 卡面）在 MainMenu 挂载后由 startBackgroundPreload() 后台静默拉取
 *
 * 进度条按真实加载数 / 总数刷新
 * - 最短显示 800ms（体验缓冲）
 * - 最长 8 秒兜底（即使网络极慢也不卡死）
 */
export function LoadingScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const [progress, setProgress] = useState(0)
  const navigatedRef = useRef(false)

  const bgUrl = getUiAssetUrl('loading_bg.png')

  useEffect(() => {
    const urls = getEssentialPreloadUrls()
    const total = urls.length || 1
    const startTime = Date.now()
    const MIN_DURATION = 800
    const MAX_DURATION = 8000

    let loaded = 0

    const finishOnce = () => {
      if (navigatedRef.current) return
      navigatedRef.current = true
      const elapsed = Date.now() - startTime
      const delay = Math.max(0, MIN_DURATION - elapsed)
      window.setTimeout(() => navigate('mainmenu'), delay)
    }

    if (urls.length === 0) {
      finishOnce()
      return
    }

    // §26 6 路并发批处理 · 完成一张补一张 · 比 fire-all-at-once 吞吐稳
    void preloadBatched(
      urls,
      () => {
        loaded += 1
        setProgress(Math.min(100, Math.floor((loaded / total) * 100)))
        if (loaded >= total) finishOnce()
      },
      6,
    )

    const safety = window.setTimeout(() => {
      console.warn(`[loading] safety timeout · ${loaded}/${total} loaded`)
      finishOnce()
    }, MAX_DURATION)

    return () => window.clearTimeout(safety)
  }, [navigate])

  return (
    <div className={styles.container}>
      {bgUrl && <img src={bgUrl} alt="" className={styles.background} />}

      <div className={styles.bottomBar}>
        <div className={styles.textRow}>
          <span className={styles.statusText}>
            正 在 调 度 兵 马 · 请 稍 候 片 刻
          </span>
          <span className={styles.percentText}>{progress}%</span>
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
