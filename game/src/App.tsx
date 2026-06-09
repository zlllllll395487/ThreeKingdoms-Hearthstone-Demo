import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { SplashScreen } from '@/screens/Splash/SplashScreen'
import { IntroVideo } from '@/screens/Intro/IntroVideo'
import { LoadingScreen } from '@/screens/Loading/LoadingScreen'
import { MainMenu } from '@/screens/MainMenu/MainMenu'
import { CodexScreen } from '@/screens/Codex/CodexScreen'
import { SubPageScreen } from '@/screens/SubPage/SubPageScreen'
import { BattleScreen } from '@/screens/Battle/BattleScreen'
import { ResultScreen } from '@/screens/Result/ResultScreen'
import { DevelopingModal } from '@/components/Modal/DevelopingModal'

/**
 * App · 根组件
 *
 * 固定 1920×1080（16:9）设计画布，自动按窗口大小等比缩放，
 * 多余空间显示为黑色 letterbox。确保所有界面在任何分辨率下
 * 比例统一、不变形、不丢内容。
 */

const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

function App() {
  const currentScreen = useUIStore((s) => s.currentScreen)
  const [scale, setScale] = useState(1)

  // 监听窗口大小，等比缩放设计画布
  useEffect(() => {
    function updateScale() {
      const sx = window.innerWidth / DESIGN_WIDTH
      const sy = window.innerHeight / DESIGN_HEIGHT
      setScale(Math.min(sx, sy))
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return (
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
      {/* 固定设计画布 · 居中 + 等比缩放 */}
      <div
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
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
        {currentScreen === 'battle' && <BattleScreen />}
        {currentScreen === 'result' && <ResultScreen />}

        {/* 全局弹窗 */}
        <DevelopingModal />
      </div>
    </div>
  )
}

export default App
