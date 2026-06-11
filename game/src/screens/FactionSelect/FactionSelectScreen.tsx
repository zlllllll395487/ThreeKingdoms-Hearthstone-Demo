import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import { BackButton } from '@/components/BackButton/BackButton'
import type { AIDifficulty } from '@/engine/ai'
import styles from './FactionSelectScreen.module.css'

type Faction = 'shu' | 'wu'

const HERO_BY_FACTION: Record<Faction, string> = {
  shu: '刘备',
  wu: '孙权',
}

/** §23 AI 难度展示 · 名称 / 短描述 */
const DIFFICULTY_META: Array<{ key: AIDifficulty; label: string; sub: string }> = [
  { key: 'novice', label: '新手', sub: '草莽之辈' },
  { key: 'standard', label: '标准', sub: '军中谋士' },
  { key: 'grandmaster', label: '宗师', sub: '卧龙之谋' },
]

const LS_DIFFICULTY_KEY = 'sgls.aiDifficulty'

/**
 * 阵营选择屏 · 横屏 1920×1080
 *
 * 玩家 + AI 阵营独立双选（允许蜀 vs 蜀 / 吴 vs 吴）
 *
 * 布局：左半屏选玩家阵营，右半屏选 AI 阵营，底部确认按钮
 *
 * 流程：MainMenu「对战」→ FactionSelectScreen → 选 2 阵营 → 「确认」→ BattleScreen
 */
export function FactionSelectScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const startGame = useGameStore((s) => s.startGame)
  const [playerFaction, setPlayerFaction] = useState<Faction | null>(null)
  const [aiFaction, setAiFaction] = useState<Faction | null>(null)
  // §23 AI 难度：从 localStorage 读上次选择，默认 standard
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('standard')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_DIFFICULTY_KEY)
      if (saved === 'novice' || saved === 'standard' || saved === 'grandmaster') {
        setAiDifficulty(saved)
      }
    } catch {
      // localStorage 不可用 · 静默
    }
  }, [])

  const bgUrl = getUiAssetUrl('faction_select_bg.png')
  const shuCardUrl = getUiAssetUrl('faction_card_shu.png')
  const wuCardUrl = getUiAssetUrl('faction_card_wu.png')
  const btnStartUrl = getUiAssetUrl('btn_start_battle_v2.png')
  const btnBackUrl = getUiAssetUrl('btn_back.png')

  const bothSelected = !!playerFaction && !!aiFaction

  const handleStart = () => {
    if (!playerFaction || !aiFaction) return
    try {
      localStorage.setItem(LS_DIFFICULTY_KEY, aiDifficulty)
    } catch {
      // localStorage 不可用 · 静默
    }
    startGame({ playerFaction, aiFaction, aiDifficulty })
    navigate('battle')
  }

  const renderFactionColumn = (
    role: 'player' | 'ai',
    title: string,
    selected: Faction | null,
    setSelected: (f: Faction) => void,
  ) => (
    <div className={styles.column}>
      <h2 className={styles.columnTitle}>{title}</h2>
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
    </div>
  )

  return (
    <div className={styles.container}>
      {bgUrl && (
        <div
          className={styles.background}
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
      )}
      <div className={styles.vignette} />

      <BackButton
        onClick={() => navigate('mainmenu')}
        ariaLabel="返回主菜单"
        className={styles.backButton}
      >
        返回
      </BackButton>

      <h1 className={styles.title}>选择对战阵营</h1>

      <div className={styles.columnsRow}>
        {renderFactionColumn('player', '你的阵营', playerFaction, setPlayerFaction)}
        <div className={styles.vsDivider}>VS</div>
        {renderFactionColumn('ai', '对手阵营', aiFaction, setAiFaction)}
      </div>

      {/* §23 难度选择 */}
      <div className={styles.difficultyRow}>
        <h3 className={styles.difficultyTitle}>对手难度</h3>
        <div className={styles.difficultyButtons}>
          {DIFFICULTY_META.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`${styles.difficultyBtn} ${
                aiDifficulty === d.key ? styles.difficultyBtnActive : ''
              }`}
              onClick={() => setAiDifficulty(d.key)}
              aria-pressed={aiDifficulty === d.key}
              aria-label={`对手难度：${d.label}`}
            >
              <span className={styles.difficultyLabel}>{d.label}</span>
              <span className={styles.difficultySub}>{d.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.bottomBar}>
        {bothSelected && (
          <p className={styles.preview}>
            你: {HERO_BY_FACTION[playerFaction]}　vs　对手:{' '}
            {HERO_BY_FACTION[aiFaction]}
          </p>
        )}

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
      </div>
    </div>
  )
}
