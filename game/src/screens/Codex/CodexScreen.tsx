import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useUIStore } from '@/store/uiStore'
import { Card } from '@/components/Card/Card'
import { getAllCards } from '@/data/cardLibrary'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './CodexScreen.module.css'

type CodexTab = 'shu' | 'neutral' | 'weapon'

const TAB_LABELS: Record<CodexTab, string> = {
  shu: '蜀',
  neutral: '中立',
  weapon: '兵器',
}

/**
 * 图鉴页 · 浏览所有卡牌
 *
 * 设计：
 *   - Tab 切换（蜀 / 中立 / 兵器）
 *   - 复用 Card 组件
 *   - 不做编辑功能（M0 只浏览）
 */
export function CodexScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const [activeTab, setActiveTab] = useState<CodexTab>('shu')
  const bgUrl = getUiAssetUrl('codex_background.png')
  const btnTabUrl = getUiAssetUrl('btn_tab.png')

  const allCards = getAllCards()

  // 按 Tab 过滤
  const filteredCards = allCards.filter((c) => {
    if (activeTab === 'weapon') return c.type === 'weapon'
    if (activeTab === 'shu') return c.faction === 'shu' && c.type !== 'weapon'
    if (activeTab === 'neutral')
      return c.faction === 'neutral' && c.type !== 'weapon'
    return false
  })

  return (
    <div
      className={styles.container}
      style={{
        '--btn-tab-bg': btnTabUrl ? `url(${btnTabUrl})` : 'none',
      } as CSSProperties}
    >
      <div
        className={styles.background}
        style={
          bgUrl
            ? {
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
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
        >
          ‹ 返回
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

      {/* Tab 切换 */}
      <nav className={styles.tabBar}>
        {(Object.keys(TAB_LABELS) as CodexTab[]).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${
              activeTab === tab ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
            <span
              style={{
                fontSize: '11px',
                marginLeft: '8px',
                opacity: 0.6,
                letterSpacing: 0,
              }}
            >
              ({getCountForTab(tab)})
            </span>
          </button>
        ))}
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

// ============================================
// 工具：每个 Tab 的数量
// ============================================

function getCountForTab(tab: CodexTab): number {
  const allCards = getAllCards()
  if (tab === 'weapon') return allCards.filter((c) => c.type === 'weapon').length
  if (tab === 'shu')
    return allCards.filter((c) => c.faction === 'shu' && c.type !== 'weapon')
      .length
  if (tab === 'neutral')
    return allCards.filter(
      (c) => c.faction === 'neutral' && c.type !== 'weapon'
    ).length
  return 0
}
