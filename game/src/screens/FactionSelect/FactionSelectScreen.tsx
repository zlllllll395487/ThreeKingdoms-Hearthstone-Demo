import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './FactionSelectScreen.module.css'

type Faction = 'shu' | 'wu'

const HERO_BY_FACTION: Record<Faction, string> = {
  shu: '刘备',
  wu: '孙权',
}

/**
 * 阵营选择 · 玩家和 AI 各自独立选阵营（允许同阵营对战）
 *
 * 流程：
 *   MainMenu「对战」→ FactionSelectScreen → 选玩家阵营 + AI 阵营 → 「确认」→ BattleScreen
 */
export function FactionSelectScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const startGame = useGameStore((s) => s.startGame)
  const [playerFaction, setPlayerFaction] = useState<Faction | null>(null)
  const [aiFaction, setAiFaction] = useState<Faction | null>(null)

  const bgUrl = getUiAssetUrl('faction_select_bg.png')
  const shuCardUrl = getUiAssetUrl('faction_card_shu.png')
  const wuCardUrl = getUiAssetUrl('faction_card_wu.png')
  const btnStartUrl = getUiAssetUrl('btn_start_battle_v2.png')
  const btnBackUrl = getUiAssetUrl('btn_back.png')

  const handleStart = () => {
    if (!playerFaction || !aiFaction) return
    startGame({ playerFaction, aiFaction })
    navigate('battle')
  }

  const renderFactionPair = (
    role: 'player' | 'ai',
    selected: Faction | null,
    setSelected: (f: Faction) => void,
  ) => (
    <div className={styles.cards}>
      <div className={styles.factionSlot} data-selected={selected === 'shu'}>
        <button
          className={`${styles.factionCard} ${selected === 'shu' ? styles.selected : ''}`}
          onClick={() => setSelected('shu')}
          aria-label={`${role === 'player' ? '玩家' : 'AI'}选择蜀阵营`}
        >
          {shuCardUrl ? (
            <img src={shuCardUrl} alt="蜀" className={styles.factionCardImg} />
          ) : (
            <div className={styles.placeholderShu}>蜀</div>
          )}
          {selected === 'shu' && <div className={styles.selectedGlow} />}
        </button>
        <div className={styles.factionLabel}>蜀</div>
      </div>

      <div className={styles.factionSlot} data-selected={selected === 'wu'}>
        <button
          className={`${styles.factionCard} ${selected === 'wu' ? styles.selected : ''}`}
          onClick={() => setSelected('wu')}
          aria-label={`${role === 'player' ? '玩家' : 'AI'}选择吴阵营`}
        >
          {wuCardUrl ? (
            <img src={wuCardUrl} alt="吴" className={styles.factionCardImg} />
          ) : (
            <div className={styles.placeholderWu}>吴</div>
          )}
          {selected === 'wu' && <div className={styles.selectedGlow} />}
        </button>
        <div className={styles.factionLabel}>吴</div>
      </div>
    </div>
  )

  const bothSelected = !!playerFaction && !!aiFaction

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

      <div className={styles.centerStack}>
        <section className={styles.pickSection}>
          <h2 className={styles.title}>选择你的阵营</h2>
          {renderFactionPair('player', playerFaction, setPlayerFaction)}
        </section>

        <section className={styles.pickSection}>
          <h2 className={styles.title}>选择对手阵营</h2>
          {renderFactionPair('ai', aiFaction, setAiFaction)}
        </section>

        <button
          className={styles.startButton}
          onClick={handleStart}
          disabled={!bothSelected}
          data-disabled={!bothSelected}
        >
          {btnStartUrl && (
            <img
              src={btnStartUrl}
              alt=""
              aria-hidden
              className={styles.startButtonImg}
            />
          )}
          <span className={styles.startText}>确 认</span>
        </button>

        {bothSelected && (
          <p className={styles.preview}>
            你: {HERO_BY_FACTION[playerFaction]}　vs　对手:{' '}
            {HERO_BY_FACTION[aiFaction]}
          </p>
        )}
      </div>
    </div>
  )
}
