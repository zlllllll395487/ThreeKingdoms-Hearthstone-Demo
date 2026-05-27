import { useRef } from 'react'
import { useUIStore } from '@/store/uiStore'
import styles from './IntroVideo.module.css'
import introVideoUrl from '@/assets/video/intro.mp4'

/**
 * 开场视频 · intro.mp4
 *
 * - 跳过按钮一开始就可见
 * - 视频结束或点击跳过 → markIntroSeen + navigate('splash')
 * - 已看过的下次启动直接进 splash（uiStore 初始化时判断）
 */
export function IntroVideo() {
  const navigate = useUIStore((s) => s.navigate)
  const markIntroSeen = useUIStore((s) => s.markIntroSeen)
  const videoRef = useRef<HTMLVideoElement>(null)

  function finish() {
    markIntroSeen()
    navigate('splash')
  }

  return (
    <div className={styles.container}>
      <video
        ref={videoRef}
        className={styles.video}
        src={introVideoUrl}
        autoPlay
        muted
        playsInline
        onEnded={finish}
      />

      {/* 跳过按钮 · 立即可见 */}
      <button className={styles.skipButton} onClick={finish}>
        跳过 ›
      </button>
    </div>
  )
}
