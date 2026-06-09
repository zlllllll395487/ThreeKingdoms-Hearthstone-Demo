import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './FactionSelectScreen.module.css'

type Faction = 'shu' | 'wu'

/**
 * 阵营选择 · 玩家在进入对战前选择蜀 / 吴
 *
 * 流程：
 *   MainMenu「对战」→ FactionSelectScreen → 选阵营 → 「开始对战」→ BattleScreen
 *
 * AI 阵营自动取玩家的反面（蜀对吴，吴对蜀）
 */
export function FactionSelectScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const startGame = useGameStore((s) => s.startGame)
  const [selected, setSelected] = useState<Faction | null>(null)

  const bgUrl = getUiAssetUrl('faction_select_bg.png')
  const shuCardUrl = getUiAssetUrl('faction_card_shu.png')
  const wuCardUrl = getUiAssetUrl('faction_card_wu.png')
  const btnStartUrl = getUiAssetUrl('btn_start_battle_v2.png')
  const btnBackUrl = getUiAssetUrl('btn_back.png')

  const handleStart = () => {
    if (!selected) return
    const aiFaction: Faction = selected === 'shu' ? 'wu' : 'shu'
    startGame({ playerFaction: selected, aiFaction })
    navigate('battle')
  }

  return (
    <div className={styles.container}>
      {bgUrl && (
        <div
          className={styles.background}
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
      )}
      <div className={styles.vignette} />

      <button
        className={styles.backButton}
        onClick={() => navigate('mainmenu')}
        aria-label="返回主菜单"
      >
        {btnBackUrl ? (
          <img src={btnBackUrl} alt="返回" />
        ) : (
          <span>‹ 返回</span>
        )}
      </button>

      <h1 className={styles.title}>选择你的阵营</h1>

      <div className={styles.cards}>
        <button
          className={`${styles.factionCard} ${selected === 'shu' ? styles.selected : ''}`}
          onClick={() => setSelected('shu')}
          aria-label="选择蜀阵营"
        >
          {shuCardUrl ? (
            <img src={shuCardUrl} alt="蜀" className={styles.factionCardImg} />
          ) : (
            <div className={styles.placeholderShu}>蜀</div>
          )}
          {selected === 'shu' && <div className={styles.selectedGlow} />}
        </button>

        <button
          className={`${styles.factionCard} ${selected === 'wu' ? styles.selected : ''}`}
          onClick={() => setSelected('wu')}
          aria-label="选择吴阵营"
        >
          {wuCardUrl ? (
            <img src={wuCardUrl} alt="吴" className={styles.factionCardImg} />
          ) : (
            <div className={styles.placeholderWu}>吴</div>
          )}
          {selected === 'wu' && <div className={styles.selectedGlow} />}
        </button>
      </div>

      <button
        className={styles.startButton}
        onClick={handleStart}
        disabled={!selected}
        data-disabled={!selected}
      >
        {btnStartUrl ? (
          <img src={btnStartUrl} alt="开始对战" className={styles.startButtonImg} />
        ) : (
          <span className={styles.startText}>开 始 对 战</span>
        )}
      </button>

      {selected && (
        <p className={styles.preview}>
          {selected === 'shu' ? '刘备' : '孙权'} (你) vs{' '}
          {selected === 'shu' ? '孙权' : '刘备'} (AI)
        </p>
      )}
    </div>
  )
}
