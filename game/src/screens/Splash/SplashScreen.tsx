import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './SplashScreen.module.css'

/**
 * 进入游戏 lobby 页（intro 之后展示）
 */
export function SplashScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const showModal = useUIStore((s) => s.showModal)
  const [agreed, setAgreed] = useState(false)
  const [shake, setShake] = useState(false)

  const bgUrl = getUiAssetUrl('splash_bg.png')
  const logoUrl = getUiAssetUrl('logo_main.png')
  const btnEnterGameUrl = getUiAssetUrl('btn_enter_game.png')
  const pillServerUrl = getUiAssetUrl('pill_server.png')
  const iconAccount = getUiAssetUrl('icon_account.png')
  const iconNews = getUiAssetUrl('icon_news.png')
  const iconRepair = getUiAssetUrl('icon_repair.png')

  function handleEnter() {
    if (!agreed) {
      setShake(true)
      setTimeout(() => setShake(false), 450)
      return
    }
    navigate('loading')
  }

  return (
    <div className={styles.container}>
      {bgUrl && <img src={bgUrl} alt="" className={styles.background} />}

      <div className={styles.topMask} />
      <div className={styles.bottomMask} />
      <div className={styles.legalMask} />
      <div className={styles.vignette} />

      {/* 7 个灯笼晕点 · 对照 splash 背景图实际灯笼位置 */}
      <div className={`${styles.lanternGlow} ${styles.lanternGlow1}`} />
      <div className={`${styles.lanternGlow} ${styles.lanternGlow2}`} />
      <div className={`${styles.lanternGlow} ${styles.lanternGlow3}`} />
      <div className={`${styles.lanternGlow} ${styles.lanternGlow4}`} />
      <div className={`${styles.lanternGlow} ${styles.lanternGlow5}`} />
      <div className={`${styles.lanternGlow} ${styles.lanternGlow6}`} />
      <div className={`${styles.lanternGlow} ${styles.lanternGlow7}`} />

      {/* 14 片落叶飘落（循环复用 7 张落叶图） */}
      <div className={styles.petals}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className={styles.petal} data-leaf={(i % 7) + 1} />
        ))}
      </div>

      {/* 右上角 3 工具按钮 */}
      <div className={styles.toolButtons}>
        <button
          className={styles.toolBtn}
          onClick={() => navigate('account')}
          aria-label="账号设置"
        >
          {iconAccount && <img src={iconAccount} alt="" />}
        </button>
        <button
          className={styles.toolBtn}
          onClick={() => navigate('news')}
          aria-label="游戏动态"
        >
          {iconNews && <img src={iconNews} alt="" />}
        </button>
        <button
          className={styles.toolBtn}
          onClick={() => showModal('修复工具')}
          aria-label="修复工具"
        >
          {iconRepair && <img src={iconRepair} alt="" />}
        </button>
      </div>

      {/* 中央：Logo + 进入游戏 + 合规控件 */}
      <div className={styles.center}>
        <div className={styles.logoWrap}>
          <div className={styles.logoBackdrop} />
          {logoUrl ? (
            <img src={logoUrl} alt="三国炉石" className={styles.logo} />
          ) : (
            <h1 className={styles.titleFallback}>三国炉石</h1>
          )}
        </div>

        <div className={styles.enterBlock}>
          <button
            className={styles.enterButton}
            data-locked={!agreed}
            onClick={handleEnter}
          >
            {btnEnterGameUrl ? (
              <img
                src={btnEnterGameUrl}
                alt="进入游戏"
                className={styles.enterButtonImg}
              />
            ) : (
              <span className={styles.enterText}>进 入 游 戏</span>
            )}
          </button>
        </div>

        <div className={styles.complianceBlock}>
          <button
            className={styles.serverPill}
            onClick={() => navigate('serverselect')}
          >
            {pillServerUrl ? (
              <img
                src={pillServerUrl}
                alt="服务器选择"
                className={styles.serverPillImg}
              />
            ) : (
              <>
                <span className={styles.serverDot} />
                <span className={styles.serverLabel}>已选 ·</span>
                <span className={styles.serverName}>S102 桃园结义</span>
                <span className={styles.serverChevron}>▾</span>
              </>
            )}
          </button>

          <div className={styles.agreementRow} data-shake={shake}>
            <div
              className={`${styles.checkbox} ${agreed ? styles.checkboxChecked : ''}`}
              onClick={() => setAgreed((v) => !v)}
              role="checkbox"
              aria-checked={agreed}
            >
              {agreed && <span className={styles.checkmark}>✓</span>}
            </div>
            <span>我已阅读并同意</span>
            <a
              className={styles.agreementLink}
              onClick={(e) => {
                e.stopPropagation()
                showModal('用户协议')
              }}
            >
              《用户协议》
            </a>
            <span>和</span>
            <a
              className={styles.agreementLink}
              onClick={(e) => {
                e.stopPropagation()
                showModal('隐私政策')
              }}
            >
              《隐私政策》
            </a>
          </div>
        </div>
      </div>

      {/* 底部防沉迷公益提示 */}
      <p className={styles.legalText}>{LEGAL_NOTICE}</p>
    </div>
  )
}

const LEGAL_NOTICE =
  '适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。'
