import { useEffect, useRef, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl, getCriticalPreloadUrls } from '@/data/assetLoader'
import styles from './LoadingScreen.module.css'

/**
 * 加载页 · §26 真预加载实现
 *
 * - 全屏背景图
 * - 底部 40px 深色文字行 + 4px 进度填充
 * - 进度按"图片加载完成数 / 总数"实时更新
 * - 全部加载完后再进 mainmenu (保证 Codex / Battle 不再卡顿)
 * - 最长等待 30 秒 · 安全兜底
 * - 最短显示 1.2 秒 · 体验缓冲
 */
export function LoadingScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const [progress, setProgress] = useState(0)
  const navigatedRef = useRef(false)

  const bgUrl = getUiAssetUrl('loading_bg.png')

  useEffect(() => {
    const urls = getCriticalPreloadUrls()
    const total = urls.length || 1
    const startTime = Date.now()
    const MIN_DURATION = 1200 // 最短 1.2s 显示
    const MAX_DURATION = 30000 // 最长 30s 兜底

    let loaded = 0

    const finishOnce = () => {
      if (navigatedRef.current) return
      navigatedRef.current = true
      const elapsed = Date.now() - startTime
      const delay = Math.max(0, MIN_DURATION - elapsed)
      window.setTimeout(() => navigate('mainmenu'), delay + 200)
    }

    const tick = () => {
      loaded += 1
      const pct = Math.min(100, Math.floor((loaded / total) * 100))
      setProgress(pct)
      if (loaded >= total) finishOnce()
    }

    // 真预加载：为每个 URL 触发 Image 请求
    // 浏览器自动并发 6 个,其余排队 · 无需手动节流
    for (const url of urls) {
      const img = new Image()
      img.onload = tick
      img.onerror = tick // 失败也计数,避免卡进度
      img.src = url
    }

    // 安全兜底 · 30 秒强制进入主菜单
    const safety = window.setTimeout(() => {
      console.warn(`[loading] timeout · ${loaded}/${total} loaded`)
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
