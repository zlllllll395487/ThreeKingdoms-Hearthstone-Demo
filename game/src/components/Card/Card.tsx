import type { CardData, Rarity } from '@/engine/types'
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

const FRAME_NAMES: Record<Rarity, string> = {
  common: 'frame_common.png',
  rare: 'frame_rare.png',
  epic: 'frame_epic.png',
  legendary: 'frame_legendary.png',
}

/** 按卡名长度选名字横幅 */
function pickNameBanner(name: string): string {
  const len = [...name].length // 兼容多字节
  if (len <= 2) return 'name_short.png'
  if (len <= 4) return 'name_medium.png'
  return 'name_long.png'
}

/** 数值球文件名（1-10） */
function getNumberImage(prefix: 'cost' | 'attack' | 'health', n: number): string {
  const clamped = Math.max(1, Math.min(10, n))
  return `${prefix}_${clamped}.png`
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
  const portraitUrl = getPortraitUrl(card.portrait)
  const frameUrl = getUiAssetUrl(FRAME_NAMES[card.rarity])
  const nameBannerUrl = getUiAssetUrl(pickNameBanner(card.name))

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

  return (
    <div
      className={styles.card}
      data-rarity={card.rarity}
      data-type={card.type}
      style={{ transform: `scale(${scale})` }}
      onClick={onClick}
    >
      {/* 立绘层（最底，被边框覆盖） */}
      <div className={styles.portraitArea}>
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt={card.name}
            className={styles.portraitImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.portraitPlaceholder}>
            <span>{card.name}</span>
          </div>
        )}
      </div>

      {/* 边框层 */}
      {frameUrl && <img src={frameUrl} alt="" className={styles.frame} />}

      {/* 描述文字（在边框底部面板上） */}
      <div className={styles.descArea}>
        {card.description && (
          <p className={styles.descText}>{card.description}</p>
        )}
        {card.flavor && <p className={styles.flavorText}>「{card.flavor}」</p>}
      </div>

      {/* 名字横幅（叠在边框底部面板顶端） */}
      <div className={styles.nameBanner}>
        {nameBannerUrl && (
          <img src={nameBannerUrl} alt="" className={styles.nameBannerImg} />
        )}
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
