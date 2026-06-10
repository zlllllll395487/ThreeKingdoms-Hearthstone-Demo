/**
 * 战场上的随从 token · 立绘 + 攻击/血量数字球（炉石风格 minion token）
 */

import { useRef } from 'react'
import type { CardInstance } from '@/engine/types'
import { getPortraitUrl, getUiAssetUrl } from '@/data/assetLoader'
import styles from './MinionToken.module.css'

const DOUBLE_CLICK_MS = 300

interface Props {
  minion: CardInstance
  selected?: boolean
  targetable?: boolean
  canAttack?: boolean
  dimmed?: boolean
  onClick?: () => void
  /** v5.5 双击场上 minion 查看完整卡牌详情 */
  onDoubleClick?: () => void
}

function getNumberImage(prefix: 'attack' | 'health', n: number): string {
  const clamped = Math.max(1, Math.min(10, n))
  return `${prefix}_${clamped}.png`
}

const KW_ICON: Record<string, string> = {
  taunt: 'kw_taunt.png',
  rush: 'kw_rush.png',
  charge: 'kw_charge.png',
  stealth: 'kw_stealth.png',
  divineShield: 'kw_divineshield.png',
  windfury: 'kw_windfury.png',
  poisonous: 'kw_poisonous.png',
  lifesteal: 'kw_lifesteal.png',
  freeze: 'kw_freeze.png',
}

export function MinionToken({ minion, selected, targetable, canAttack, dimmed, onClick, onDoubleClick }: Props) {
  const portraitUrl = getPortraitUrl(minion.data.portrait)
  const attackUrl = getUiAssetUrl(getNumberImage('attack', minion.currentAttack))
  const healthUrl = getUiAssetUrl(getNumberImage('health', minion.currentHealth))

  const damaged = minion.currentHealth < minion.maxHealth

  // v5.5 双击检测：300ms 内点 2 次 = 详情；否则单击 = 攻击者选中 / 目标
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      onDoubleClick?.()
      return
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      onClick?.()
    }, DOUBLE_CLICK_MS)
  }

  return (
    <button
      className={`${styles.token} ${selected ? styles.selected : ''} ${targetable ? styles.targetable : ''} ${canAttack ? styles.canAttack : ''} ${dimmed ? styles.dimmed : ''}`}
      data-rarity={minion.data.rarity}
      onClick={handleClick}
      aria-label={minion.data.name}
    >
      <div className={styles.portraitWrap}>
        {portraitUrl ? (
          <img src={portraitUrl} alt={minion.data.name} className={styles.portrait} />
        ) : (
          <div className={styles.portraitPlaceholder}>{minion.data.name}</div>
        )}
      </div>
      <div className={styles.nameBar}>{minion.data.name}</div>

      {/* 关键词印章排列 */}
      <div className={styles.keywords}>
        {Array.from(minion.currentKeywords).map((kw) => {
          const url = getUiAssetUrl(KW_ICON[kw])
          return url ? <img key={kw} src={url} alt={kw} className={styles.kwIcon} /> : null
        })}
      </div>

      {/* 攻击 / 血量 数字球 */}
      {attackUrl && <img src={attackUrl} alt="" className={styles.attackOrb} />}
      {healthUrl && (
        <img
          src={healthUrl}
          alt=""
          className={`${styles.healthOrb} ${damaged ? styles.healthDamaged : ''}`}
        />
      )}
    </button>
  )
}
