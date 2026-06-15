import { useEffect, useRef, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import {
  getUiAssetUrl,
  getAllPreloadUrls,
  preloadBatched,
} from '@/data/assetLoader'
import styles from './LoadingScreen.module.css'

/**
 * 加载页 · §26 全量预加载策略
 *
 * 一次性加载所有 portraits / cardvisuals / 屏背景 / 边框 / 弹窗
 * 配合 vercel.json Cache-Control immutable · 加载一次永久缓存
 * 后续切屏 MainMenu / Codex / Battle / Tutorial 全部秒开,无再加载
 *
 * 并发 12 路 · HTTP/2 多路复用下吞吐最大化
 * 最短显示 1 秒(体验缓冲) · 最长 60 秒兜底(慢网也能进游戏)
 */
export function LoadingScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const [progress, setProgress] = useState(0)
  const navigatedRef = useRef(false)

  const bgUrl = getUiAssetUrl('loading_bg.png')

  useEffect(() => {
    const urls = getAllPreloadUrls()
    const total = urls.length || 1
    const startTime = Date.now()
    const MIN_DURATION = 1000
    const MAX_DURATION = 5000

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
