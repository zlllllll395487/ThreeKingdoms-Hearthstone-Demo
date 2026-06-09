import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { CardData } from '@/engine/types'
import { getPortraitUrl, getUiAssetUrl } from '@/data/assetLoader'
import styles from './Card.module.css'

interface CardProps {
  card: CardData
  scale?: number
  onClick?: () => void
}

// ============================================
// 资源映射
// ============================================

/** 数值球文件名（1-10） */
function getNumberImage(prefix: 'cost' | 'attack' | 'health', n: number): string {
  const clamped = Math.max(1, Math.min(10, n))
  return `${prefix}_${clamped}.png`
}

/**
 * 从立绘文件名派生卡牌完整图文件名
 * 例：portrait="guanyu.png" → "cardvisual_guanyu.png"
 */
function getCardVisualFile(portraitFile: string | undefined): string | null {
  if (!portraitFile) return null
  const base = portraitFile.replace(/\.png$/i, '')
  return `cardvisual_${base}.png`
}

/** 关键词 → 图标文件名 */
const KEYWORD_BADGES: Record<string, string> = {
  taunt: 'kw_taunt.png',
  charge: 'kw_charge.png',
  rush: 'kw_rush.png',
  stealth: 'kw_stealth.png',
  divineShield: 'kw_divineshield.png',
  windfury: 'kw_windfury.png',
  poisonous: 'kw_poisonous.png',
  lifesteal: 'kw_lifesteal.png',
  freeze: 'kw_freeze.png',
  battlecry: 'kw_battlecry.png',
  deathrattle: 'kw_deathrattle.png',
  spellPower: 'kw_spellpower.png',
  silence: 'kw_silence.png',
}

// ============================================
// 卡牌组件
// ============================================

export function Card({ card, scale = 1, onClick }: CardProps) {
  const [zoomed, setZoomed] = useState(false)
  const portraitUrl = getPortraitUrl(card.portrait)
  const cardVisualFile = getCardVisualFile(card.portrait)
  const cardVisualUrl = cardVisualFile ? getUiAssetUrl(cardVisualFile) : null

  // 数值球
  const costUrl = getUiAssetUrl(getNumberImage('cost', card.cost))
  const attackUrl =
    card.attack !== undefined
      ? getUiAssetUrl(getNumberImage('attack', card.attack))
      : null
  // 兵器用 durability 顶替 health
  const healthValue = card.health ?? card.durability
  const healthUrl =
    healthValue !== undefined
      ? getUiAssetUrl(getNumberImage('health', healthValue))
      : null

  const handleVisualClick = (e: React.MouseEvent) => {
    if (!portraitUrl) return
    e.stopPropagation()
    setZoomed(true)
  }

  return (
    <>
      <div
        className={styles.card}
        data-rarity={card.rarity}
        data-type={card.type}
        style={{ transform: `scale(${scale})` }}
        onClick={onClick}
      >
        {/* 卡牌完整图（立绘 + 边框 + 空名带 + 空 parchment 一体烤入）· 点击放大原版立绘 */}
        <div className={styles.cardVisual} onClick={handleVisualClick}>
          {cardVisualUrl ? (
            <img
              src={cardVisualUrl}
              alt={card.name}
              className={styles.cardVisualImg}
              loading="lazy"
            />
          ) : (
            <div className={styles.cardVisualPlaceholder}>
              <span>{card.name}</span>
            </div>
          )}
        </div>

        {/* 描述文字（在边框底部 parchment 上） */}
        <div className={styles.descArea}>
          {card.description && (
            <p className={styles.descText}>{card.description}</p>
          )}
          {card.flavor && <p className={styles.flavorText}>「{card.flavor}」</p>}
        </div>

        {/* 名字（叠在边框内置名带上） */}
        <div className={styles.nameBanner}>
          <span className={styles.nameText}>{card.name}</span>
        </div>

        {/* 关键词图标（描述区上方一行） */}
        {card.keywords && card.keywords.length > 0 && (
          <div className={styles.keywordRow}>
            {card.keywords
              .filter((kw) => KEYWORD_BADGES[kw])
              .map((kw) => {
                const url = getUiAssetUrl(KEYWORD_BADGES[kw])
                return url ? (
                  <img
                    key={kw}
                    src={url}
                    alt={kw}
                    className={styles.keywordIcon}
                  />
                ) : null
              })}
          </div>
        )}

        {/* 费用宝石（左上） */}
        {costUrl && <img src={costUrl} alt="" className={styles.costGem} />}

        {/* 攻击力球（左下，仅武将/兵器） */}
        {attackUrl && (
          <img src={attackUrl} alt="" className={styles.attackOrb} />
        )}

        {/* 血量/耐久球（右下，仅武将/兵器） */}
        {healthUrl && (
          <img src={healthUrl} alt="" className={styles.healthOrb} />
        )}
      </div>

      {/* 立绘高清放大 · 渲染到 document.body 绕过父级 canvas 的 transform: scale */}
      {zoomed &&
        portraitUrl &&
        createPortal(
          <div
            className={styles.zoomOverlay}
            onClick={() => setZoomed(false)}
            role="dialog"
            aria-label={`${card.name} 立绘`}
          >
            <img
              src={portraitUrl}
              alt={card.name}
              className={styles.zoomImage}
            />
            <div className={styles.zoomCaption}>{card.name}</div>
            <div className={styles.zoomHint}>点击任意处关闭</div>
          </div>,
          document.body,
        )}
    </>
  )
}
