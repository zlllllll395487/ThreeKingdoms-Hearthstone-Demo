import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { Card } from '@/components/Card/Card'
import { getAllCards } from '@/data/cardLibrary'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './CodexScreen.module.css'

type CodexTab = 'shu' | 'wei' | 'wu' | 'qun' | 'neutral' | 'weapon'

const TAB_ORDER: CodexTab[] = ['shu', 'wei', 'wu', 'qun', 'neutral', 'weapon']

const TAB_STAMP_FILES: Record<CodexTab, string> = {
  shu: 'tab_shu.png',
  wei: 'tab_wei.png',
  wu: 'tab_wu.png',
  qun: 'tab_qun.png',
  neutral: 'tab_neutral.png',
  weapon: 'tab_weapon.png',
}

const TAB_LABELS: Record<CodexTab, string> = {
  shu: '蜀',
  wei: '魏',
  wu: '吴',
  qun: '群',
  neutral: '中立',
  weapon: '兵器',
}

/**
 * 图鉴页 · 浏览所有卡牌
 *
 * - 6 圆印章 Tab（蜀/魏/吴/群/中立/兵器）
 * - 印章 PNG 自带文字，CSS 不再渲染文字标签
 * - 暂无卡牌的 Tab 显示「暂无卡牌」
 */
export function CodexScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const [activeTab, setActiveTab] = useState<CodexTab>('shu')
  const allCards = getAllCards()

  // 按 Tab 过滤
  const filteredCards = allCards.filter((c) => {
    if (activeTab === 'weapon') return c.type === 'weapon'
    if (c.type === 'weapon') return false
    return c.faction === activeTab
  })

  return (
    <div className={styles.container}>
      <div
        className={styles.background}
        style={(() => {
          const bgUrl = getUiAssetUrl('codex_background.png')
          return bgUrl
            ? {
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        })()}
      />
      <div className={styles.vignette} />

      {/* L2 动效：灰尘粒子 */}
      <div className={styles.dustParticles}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.dust} />
        ))}
      </div>

      {/* 顶部 */}
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('mainmenu')}
          aria-label="返回主菜单"
        >
          {(() => {
            const btnBackUrl = getUiAssetUrl('btn_back.png')
            return btnBackUrl ? (
              <img src={btnBackUrl} alt="返回" className={styles.backButtonImg} />
            ) : (
              <span>‹ 返回</span>
            )
          })()}
        </button>
        {(() => {
          const logoUrl = getUiAssetUrl('logo_codex.png')
          return logoUrl ? (
            <img src={logoUrl} alt="卡牌图鉴" className={styles.titleLogo} />
          ) : (
            <h1 className={styles.title}>卡 牌 图 鉴</h1>
          )
        })()}
        <span className={styles.count}>共 {allCards.length} 张</span>
      </header>

      {/* Tab 切换 · 6 圆印章 */}
      <nav className={styles.tabBar}>
        {TAB_ORDER.map((tab) => {
          const stampUrl = getUiAssetUrl(TAB_STAMP_FILES[tab])
          return (
            <button
              key={tab}
              className={`${styles.tab} ${
                activeTab === tab ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab(tab)}
              aria-label={TAB_LABELS[tab]}
            >
              {stampUrl && <img src={stampUrl} alt={TAB_LABELS[tab]} />}
            </button>
          )
        })}
      </nav>

      {/* 卡牌网格 */}
      <main className={styles.cardsArea}>
        {filteredCards.length === 0 ? (
          <div className={styles.emptyHint}>—— 暂无卡牌 ——</div>
        ) : (
          <div className={styles.cardsGrid}>
            {filteredCards.map((card) => (
              <Card key={card.id} card={card} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
