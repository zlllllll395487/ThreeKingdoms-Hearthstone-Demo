import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { CardData } from '@/engine/types'
import { getPortraitUrl, getUiAssetUrl } from '@/data/assetLoader'
import styles from './Card.module.css'

interface CardProps {
  card: CardData
  scale?: number
  onClick?: () => void
  /** 点击立绘是否弹放大预览（Codex 用 true，对战手牌用 false） */
  enableZoom?: boolean
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
 *
 * 返回 .png 名仅作 key；cardvisual 实际已全部转 WebP（见 docs/DECISIONS.md D-003），
 * 调用方 getUiAssetUrl 内的 tryWebpFallback 会透明命中 .webp。
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
// CardBody · 纯展示子组件（无 zoom 状态）
// 同时被默认小卡 + zoom modal detail 模式复用，
// 保证「详情大图」也有文字 + 数字 badge
// ============================================

interface CardBodyProps {
  card: CardData
  scale: number
  onClick?: () => void
  onVisualClick?: (e: React.MouseEvent) => void
}

function CardBody({ card, scale, onClick, onVisualClick }: CardBodyProps) {
  const cardVisualFile = getCardVisualFile(card.portrait)
  const cardVisualUrl = cardVisualFile ? getUiAssetUrl(cardVisualFile) : null

  const costUrl = getUiAssetUrl(getNumberImage('cost', card.cost))
  const attackUrl =
    card.attack !== undefined
      ? getUiAssetUrl(getNumberImage('attack', card.attack))
      : null
  const healthValue = card.health ?? card.durability
  const healthUrl =
    healthValue !== undefined
      ? getUiAssetUrl(getNumberImage('health', healthValue))
      : null

  return (
    <div
      className={styles.card}
      data-rarity={card.rarity}
      data-type={card.type}
      style={{ transform: `scale(${scale})` }}
      onClick={onClick}
    >
      {/* cardvisual 烫入（立绘 + 边框 + 空名带 + 空 parchment）
       *
       * 注意：禁用 loading="lazy" — 我们的根组件用 transform: scale() 等比缩放设计画布，
       * Chrome 的 native lazy loading 基于 IntersectionObserver，在 transform 父容器内
       * 计算可见区域出错，导致 <img> 永远不触发加载，卡牌渲染为空白。
       * 改用 eager + decoding="async"，让浏览器立即下载但异步解码，避免阻塞渲染。
       */}
      <div className={styles.cardVisual} onClick={onVisualClick}>
        {cardVisualUrl ? (
          <img
            src={cardVisualUrl}
            alt={card.name}
            className={styles.cardVisualImg}
            decoding="async"
          />
        ) : (
          <div className={styles.cardVisualPlaceholder}>
            <span>{card.name}</span>
          </div>
        )}
      </div>

      {/* 描述文字（叠在边框底部 parchment 上） */}
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
  )
}

// ============================================
// 卡牌组件 · 主体 + zoom modal 切换
// ============================================

type ZoomMode = 'closed' | 'detail' | 'portrait'

export function Card({ card, scale = 1, onClick, enableZoom = false }: CardProps) {
  const [zoomMode, setZoomMode] = useState<ZoomMode>('closed')
  const portraitUrl = getPortraitUrl(card.portrait)
  const cardVisualFile = getCardVisualFile(card.portrait)
  const cardVisualUrl = cardVisualFile ? getUiAssetUrl(cardVisualFile) : null

  const handleVisualClick = (e: React.MouseEvent) => {
    if (!enableZoom) return
    if (!cardVisualUrl && !portraitUrl) return
    e.stopPropagation()
    setZoomMode('detail')
  }

  // 弹窗内点显示的图：toggle detail ↔ portrait（两者都存在才可切换）
  const handleZoomImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (cardVisualUrl && portraitUrl) {
      setZoomMode((m) => (m === 'detail' ? 'portrait' : 'detail'))
    }
  }

  const closeZoom = () => setZoomMode('closed')

  return (
    <>
      {/* 默认小卡 */}
      <CardBody
        card={card}
        scale={scale}
        onClick={onClick}
        onVisualClick={handleVisualClick}
      />

      {/* 详情 / 立绘 切换弹窗 */}
      {zoomMode !== 'closed' &&
        createPortal(
          <div
            className={styles.zoomOverlay}
            onClick={closeZoom}
            role="dialog"
            aria-label={`${card.name} ${zoomMode === 'detail' ? '详情' : '立绘'}`}
          >
            {zoomMode === 'detail' ? (
              // detail 模式：渲染完整 CardBody 在 scale 2.5x，保证文字 + 名带 + 描述都显示
              <div
                className={styles.zoomCardWrap}
                onClick={handleZoomImageClick}
              >
                <CardBody card={card} scale={1} />
              </div>
            ) : (
              // portrait 模式：纯立绘大图
              portraitUrl && (
                <img
                  src={portraitUrl}
                  alt={card.name}
                  className={styles.zoomImage}
                  onClick={handleZoomImageClick}
                />
              )
            )}
            <div className={styles.zoomCaption}>{card.name}</div>
            <div className={styles.zoomHint}>
              {cardVisualUrl && portraitUrl
                ? `点卡片切换 ${zoomMode === 'detail' ? '立绘' : '详情'} · 点外部关闭`
                : '点击任意处关闭'}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
