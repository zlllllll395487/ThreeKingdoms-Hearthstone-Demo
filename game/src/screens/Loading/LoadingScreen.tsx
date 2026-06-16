import { useEffect, useRef, useState, type ReactNode } from 'react'
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

  // 美术资源（缺失则 CSS fallback）
  const tipScrollUrl = getUiAssetUrl('loading_tip_scroll.png')
  const tipLabelUrl = getUiAssetUrl('loading_tip_label.png')
  const progressFrameUrl = getUiAssetUrl('loading_progress_frame.png')

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
        <div
          className={styles.tipBlock}
          style={tipScrollUrl ? { backgroundImage: `url(${tipScrollUrl})` } : undefined}
        >
          <div
            className={styles.tipLabel}
            style={tipLabelUrl ? { backgroundImage: `url(${tipLabelUrl})` } : undefined}
          >
            {LABEL_BY_TARGET[pendingScreen ?? 'mainmenu'] ?? '调度兵马中'}
          </div>
          <div className={styles.tipText}>{renderTip(tip)}</div>
        </div>
      )}

      {/* 底部进度条 */}
      <div
        className={styles.bottomBar}
        style={progressFrameUrl ? { backgroundImage: `url(${progressFrameUrl})` } : undefined}
      >
        <div className={styles.textRow}>
          <span className={styles.statusText}>兵马未动，粮草先行</span>
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

/**
 * Tip 文本结构化渲染
 *
 * 文案池里有 3 类格式：
 *   1. 「四字短语 —— 释义」     (机制/技巧条目)
 *   2. 「【关键词】 —— 释义」    (关键词速查条目，方括号包关键词)
 *   3. 「半文言引文」             (风味典故，引号包整段)
 *
 * 前两类把破折号前的首段包成 .tipKeyword（加粗加大变深 + 呼吸动效），
 * 建立视觉层级。第三类整段普通显示。
 */
function renderTip(tip: string): ReactNode {
  const dashIdx = tip.indexOf(' —— ')
  if (dashIdx < 0) {
    // 纯引文 / 无破折号 → 整段普通显示
    return tip
  }
  const keyword = tip.slice(0, dashIdx)
  const rest = tip.slice(dashIdx)
  return (
    <>
      <span className={styles.tipKeyword}>{keyword}</span>
      {rest}
    </>
  )
}

/**
 * 匾额文案 · 严守 4 字格式，剔除现代词汇与重字语病
 * 由文案主策重构（前版混入「档案 / 接通 / 收发 / 阵前列阵」等违和词）
 */
const LABEL_BY_TARGET: Partial<Record<Screen, string>> = {
  mainmenu: '中军大帐',
  codex: '兵书阵卷',
  factionselect: '誓师点将',
  tutorial: '兵法研习',
  battle: '两军对垒',
  result: '论功行赏',
  storymode: '青史长卷',
  quest: '悬赏招榜',
  shop: '军需辎重',
  event: '岁时节庆',
  recruit: '招贤纳士',
  decks: '点将编伍',
  serverselect: '烽火传信',
  account: '执掌帅印',
  accountdetails: '功过名册',
  mail: '飞鸽传书',
  signin: '辕门点卯',
  friends: '袍泽之交',
  news: '九州风云',
}
