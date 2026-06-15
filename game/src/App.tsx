import { useEffect, useState } from 'react'
import { useUIStore, type Screen } from '@/store/uiStore'
import { setCanvasScale } from '@/utils/canvasScale'
import { SplashScreen } from '@/screens/Splash/SplashScreen'
import { IntroVideo } from '@/screens/Intro/IntroVideo'
import { LoadingScreen } from '@/screens/Loading/LoadingScreen'
import { MainMenu } from '@/screens/MainMenu/MainMenu'
import { CodexScreen } from '@/screens/Codex/CodexScreen'
import { SubPageScreen } from '@/screens/SubPage/SubPageScreen'
import { BattleScreen } from '@/screens/Battle/BattleScreen'
import { FactionSelectScreen } from '@/screens/FactionSelect/FactionSelectScreen'
import { ResultScreen } from '@/screens/Result/ResultScreen'
import { TutorialScreen } from '@/screens/Tutorial/TutorialScreen'
import { DevelopingModal } from '@/components/Modal/DevelopingModal'
import { CustomCursor } from '@/components/CustomCursor/CustomCursor'
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary'

/**
 * App · 根组件
 *
 * v5.5.1 · per-screen canvas：
 * - Battle 屏：竖屏 1080×1920（炉石手游 portrait 体验）
 * - 其他所有屏：横屏 1920×1080（PC hub 体验）
 *
 * canvas 在进入 / 离开 Battle 时切换尺寸，scale 重算适配窗口。
 */

const PORTRAIT_SCREENS = new Set<Screen>(['battle', 'tutorial'])
const PORTRAIT_W = 1080
const PORTRAIT_H = 1920
const LANDSCAPE_W = 1920
const LANDSCAPE_H = 1080

function App() {
  const currentScreen = useUIStore((s) => s.currentScreen)
  const [scale, setScale] = useState(1)

  const isPortrait = PORTRAIT_SCREENS.has(currentScreen)
  const designWidth = isPortrait ? PORTRAIT_W : LANDSCAPE_W
  const designHeight = isPortrait ? PORTRAIT_H : LANDSCAPE_H

  // 窗口大小变化 / canvas 尺寸切换 → 重算 scale
  useEffect(() => {
    function updateScale() {
      const sx = window.innerWidth / designWidth
      const sy = window.innerHeight / designHeight
      const s = Math.min(sx, sy)
      setScale(s)
      // §19.7.4 · 同步给 canvasScale 单例 · FxSprite portal 后 size 用它换算
      setCanvasScale(s)
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [designWidth, designHeight])

  return (
    <ErrorBoundary>
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000', // letterbox 黑边
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 设计画布 · 居中 + 等比缩放 · 按当前屏 portrait/landscape 切换尺寸 */}
      <div
        style={{
          width: `${designWidth}px`,
          height: `${designHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {currentScreen === 'splash' && <SplashScreen />}
        {currentScreen === 'intro' && <IntroVideo />}
        {currentScreen === 'loading' && <LoadingScreen />}
        {currentScreen === 'mainmenu' && <MainMenu />}
        {currentScreen === 'codex' && <CodexScreen />}
        {currentScreen === 'storymode' && <SubPageScreen screen="storymode" />}
        {currentScreen === 'quest' && <SubPageScreen screen="quest" />}
        {currentScreen === 'shop' && <SubPageScreen screen="shop" />}
        {currentScreen === 'event' && <SubPageScreen screen="event" />}
        {currentScreen === 'recruit' && <SubPageScreen screen="recruit" />}
        {currentScreen === 'decks' && <SubPageScreen screen="decks" />}
        {currentScreen === 'serverselect' && <SubPageScreen screen="serverselect" />}
        {currentScreen === 'account' && <SubPageScreen screen="account" />}
        {currentScreen === 'accountdetails' && <SubPageScreen screen="accountdetails" />}
        {currentScreen === 'mail' && <SubPageScreen screen="mail" />}
        {currentScreen === 'signin' && <SubPageScreen screen="signin" />}
        {currentScreen === 'friends' && <SubPageScreen screen="friends" />}
        {currentScreen === 'news' && <SubPageScreen screen="news" />}
        {currentScreen === 'factionselect' && <FactionSelectScreen />}
        {currentScreen === 'tutorial' && <TutorialScreen />}
        {currentScreen === 'battle' && <BattleScreen />}
        {currentScreen === 'result' && <ResultScreen />}

        {/* 全局弹窗 */}
        <DevelopingModal />
      </div>

      {/* §27 自定义鼠标光标 · 跨屏全局 · 不参与 canvas scale 变换 */}
      <CustomCursor />
    </div>
    </ErrorBoundary>
  )
}

export default App
