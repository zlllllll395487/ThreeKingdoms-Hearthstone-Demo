import { useEffect, useRef, useState } from 'react'
import { useUIStore, type Screen } from '@/store/uiStore'
import {
  getAllLoadingBgUrls,
  getUiAssetUrl,
  preloadForScreen,
} from '@/data/assetLoader'
import { pickRandomTip } from '@/data/loadingTips'
import styles from './LoadingScreen.module.css'

/**
 * 加载页 · 分屏渐进预加载
 *
 * 行为：
 * 1. 挂载时根据 uiStore.pendingScreen 决定目标屏（默认 'mainmenu'）
 * 2. 预加载目标屏所需的全部资源，期间显示进度条
 * 3. 资源就绪后 navigate 到目标屏，清空 pendingScreen
 *
 * 视觉：
 * - 随机选取 loading_bg*.png 中的一张作为全屏背景
 * - 中部偏下显示一条随机 Tip（30 条文案池）
 * - 底部加粗进度条 + 状态文案 + 百分比
 *
 * 兜底：
 * - MIN_DURATION 1.2s 防止资源已缓存时屏幕一闪而过
 * - MAX_DURATION 60s 防止慢网完全无响应
 */
export function LoadingScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const pendingScreen = useUIStore((s) => s.pendingScreen)
  const clearPending = useUIStore.setState
  const [progress, setProgress] = useState(0)
  const navigatedRef = useRef(false)

  // 挂载时随机选取一次背景与 Tip · re-render 不会变
  const [bgUrl] = useState<string | null>(() => {
    const all = getAllLoadingBgUrls()
    if (all.length > 0) return all[Math.floor(Math.random() * all.length)]
    return getUiAssetUrl('loading_bg.png')
  })
  const [tip] = useState<string>(() => pickRandomTip())

  useEffect(() => {
    const target: Screen = pendingScreen ?? 'mainmenu'
    const startTime = Date.now()
    const MIN_DURATION = 1200
    const MAX_DURATION = 60000

    const finishOnce = () => {
      if (navigatedRef.current) return
      navigatedRef.current = true
      const elapsed = Date.now() - startTime
      const delay = Math.max(0, MIN_DURATION - elapsed)
      window.setTimeout(() => {
        clearPending({ pendingScreen: null })
        navigate(target)
      }, delay)
    }

    void preloadForScreen(target, (loaded, total) => {
      const pct = total === 0 ? 100 : Math.min(100, Math.floor((loaded / total) * 100))
      setProgress(pct)
      if (loaded >= total) finishOnce()
    })

    const safety = window.setTimeout(() => {
      console.warn('[loading] safety timeout')
      finishOnce()
    }, MAX_DURATION)

    return () => window.clearTimeout(safety)
  }, [pendingScreen, navigate, clearPending])

  return (
    <div className={styles.container}>
      {bgUrl && <img src={bgUrl} alt="" className={styles.background} />}
      <div className={styles.dimOverlay} />

      {/* 中部 Tip 卷轴 */}
      {tip && (
        <div className={styles.tipBlock}>
          <div className={styles.tipLabel}>{LABEL_BY_TARGET[pendingScreen ?? 'mainmenu'] ?? '调度兵马中'}</div>
          <div className={styles.tipText}>{tip}</div>
        </div>
      )}

      {/* 底部进度条 */}
      <div className={styles.bottomBar}>
        <div className={styles.textRow}>
          <span className={styles.statusText}>正在准备资源 · 请稍候片刻</span>
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

const LABEL_BY_TARGET: Partial<Record<Screen, string>> = {
  mainmenu: '调度兵马中',
  codex: '整理卷宗武略',
  factionselect: '调遣麾下旌旗',
  tutorial: '研读三韬六略',
  battle: '列阵于阵前',
  result: '清点战果',
  storymode: '研读剧本',
  quest: '召集军务',
  shop: '盘点军资',
  event: '准备桃园',
  recruit: '招募英雄',
  decks: '整编卡组',
  serverselect: '接通烽燧',
  account: '整理印信',
  accountdetails: '查阅档案',
  mail: '收发军报',
  signin: '记录功勋',
  friends: '联络同袍',
  news: '汇集时讯',
}
