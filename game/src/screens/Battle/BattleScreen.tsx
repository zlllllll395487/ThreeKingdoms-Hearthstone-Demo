import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import { Card } from '@/components/Card/Card'
import type { CardInstance, PlayerSide } from '@/engine/types'
import type { TargetRef } from '@/engine'
import { MinionToken } from './components/MinionToken'
import styles from './BattleScreen.module.css'

const BOARD_MAX = 7
const DOUBLE_CLICK_MS = 300 // v5.5 UX 双击检测窗口

/**
 * 对战界面 · 玩家 vs AI（HS 风分区布局）
 *
 * 布局（1920×1080）:
 *   左上：退出
 *   顶中：AI 手牌扇 → AI 头像 → AI 战场 7 槽位
 *   顶右：AI 法力 X/X + 水晶横排 + 牌组小角标
 *   中央：分隔线 + 回合切换浮现提示（1.5s 淡出）
 *   底中：玩家战场 7 槽位 → 玩家头像 → 手牌扇
 *   底右：玩家法力 X/X + 水晶横排 + 牌组小角标
 *   右中：结束回合按钮独立悬浮
 */
export function BattleScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const {
    state,
    selectedCardId,
    selectedAttackerId,
    pendingTargetForCard,
    aiThinking,
    startGame,
    selectCard,
    selectAttacker,
    resolveTarget,
    endTurn,
    endGame,
  } = useGameStore()

  // 进入屏幕自动开局
  useEffect(() => {
    if (!state) startGame()
  }, [state, startGame])

  // 战斗结束自动跳结算
  useEffect(() => {
    if (state?.phase === 'ended') {
      const t = setTimeout(() => navigate('result'), 1600)
      return () => clearTimeout(t)
    }
  }, [state?.phase, navigate])

  // 回合切换提示：用 key 触发动画重挂
  const turnKey = state ? `${state.turn}-${state.activePlayer}` : 'init'

  // v5.5 UX: 单击选中 / 双击详情（替代长按）
  const [detailViewCard, setDetailViewCard] = useState<CardInstance | null>(null)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastClickedCardRef = useRef<string | null>(null)

  /** v5.5 双击检测：300ms 内同一张卡再次 click = 详情，否则单击 = 选中 */
  const handleCardClickV55 = (card: CardInstance, onSingleClick: () => void) => {
    if (clickTimerRef.current && lastClickedCardRef.current === card.instanceId) {
      // 双击触发：取消挂起的单击 + 弹详情
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      lastClickedCardRef.current = null
      setDetailViewCard(card)
      return
    }
    // 第一次 click：设 300ms 计时器等待第二次
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    lastClickedCardRef.current = card.instanceId
    clickTimerRef.current = setTimeout(() => {
      onSingleClick()
      clickTimerRef.current = null
      lastClickedCardRef.current = null
    }, DOUBLE_CLICK_MS)
  }

  // 死亡淡出队列：跟踪上一帧战场，新一帧消失的 minion 留 0.4s 淡出
  const prevBoardRef = useRef<{ player: CardInstance[]; ai: CardInstance[] }>({
    player: [],
    ai: [],
  })
  const [dyingMinions, setDyingMinions] = useState<CardInstance[]>([])

  useEffect(() => {
    if (!state) return
    const prev = prevBoardRef.current
    const curPlayer = state.player.board
    const curAi = state.ai.board
    const removed = [
      ...prev.player.filter((m) => !curPlayer.find((c) => c.instanceId === m.instanceId)),
      ...prev.ai.filter((m) => !curAi.find((c) => c.instanceId === m.instanceId)),
    ]
    if (removed.length > 0) {
      setDyingMinions((q) => [...q, ...removed])
      const ids = removed.map((m) => m.instanceId)
      const t = setTimeout(() => {
        setDyingMinions((q) => q.filter((m) => !ids.includes(m.instanceId)))
      }, 400)
      // cleanup not critical - timer cleared on next removal too
      void t
    }
    prevBoardRef.current = { player: curPlayer, ai: curAi }
  }, [state])

  if (!state) {
    return <div className={styles.loadingScreen}>正在排兵布阵…</div>
  }

  const bgUrl = getUiAssetUrl('battle_background_v3.png')
  const cardbackUrl = getUiAssetUrl('cardback.png')
  const heroPlayerUrl = getUiAssetUrl('hero_player.png')
  const heroAiUrl = getUiAssetUrl('hero_ai.png')
  const manaFullUrl = getUiAssetUrl('mana_full.png')
  const manaEmptyUrl = getUiAssetUrl('mana_empty.png')
  const btnEndTurnUrl = getUiAssetUrl('btn_end_turn.png')
  const btnBackUrl = getUiAssetUrl('btn_back.png')

  const isPlayerTurn = state.activePlayer === 'player' && state.phase === 'main'
  const hasPendingSpellTarget = !!pendingTargetForCard
  const hasAttackerSelected = !!selectedAttackerId

  // ============================================
  // 点击逻辑
  // ============================================

  const handleHandCardClick = (instanceId: string) => {
    if (!isPlayerTurn) return
    if (selectedCardId === instanceId) {
      selectCard(null)
      return
    }
    selectCard(instanceId)
  }

  const handlePlayerMinionClick = (m: CardInstance) => {
    if (!isPlayerTurn) return
    if (hasPendingSpellTarget) return
    if (selectedAttackerId === m.instanceId) {
      selectAttacker(null)
      return
    }
    if (canMinionAttack(m)) {
      selectAttacker(m.instanceId)
    }
  }

  const handlePlayerHeroClick = () => {
    if (!isPlayerTurn) return
    if (state.player.hero.attack > 0) {
      selectAttacker('hero_player')
    }
  }

  const handleEnemyMinionClick = (m: CardInstance) => {
    if (!isPlayerTurn) return
    if (!hasPendingSpellTarget && !hasAttackerSelected) return
    // 嘲讽规则检查：非 taunt 在 enemy 有 taunt 时不可选
    if (hasAttackerSelected && !canTargetMinion(state, m)) return
    const target: TargetRef = { kind: 'minion', side: 'ai', instanceId: m.instanceId }
    resolveTarget(target)
  }

  const handleEnemyHeroClick = () => {
    if (!isPlayerTurn) return
    if (!hasPendingSpellTarget && !hasAttackerSelected) return
    if (hasAttackerSelected && !canTargetHero(state, selectedAttackerId!)) return
    resolveTarget({ kind: 'hero', side: 'ai' })
  }

  const handleBackgroundClick = () => {
    if (selectedCardId) selectCard(null)
    if (selectedAttackerId) selectAttacker(null)
  }

  const handleQuit = () => {
    endGame()
    navigate('mainmenu')
  }

  // ============================================
  // 目标可选态计算
  // ============================================

  const enemyHasTaunt = state.ai.board.some((m) => m.currentKeywords.has('taunt'))

  const enemyMinionTargetable = (m: CardInstance) =>
    isPlayerTurn &&
    (hasPendingSpellTarget ||
      (hasAttackerSelected && canTargetMinion(state, m)))

  // 非 taunt 单位被嘲讽锁定时变灰
  const enemyMinionDimmed = (m: CardInstance) =>
    isPlayerTurn &&
    hasAttackerSelected &&
    enemyHasTaunt &&
    !m.currentKeywords.has('taunt')

  const enemyHeroTargetable =
    isPlayerTurn &&
    !hasPendingSpellTarget &&
    hasAttackerSelected &&
    canTargetHero(state, selectedAttackerId!)

  const playerMinionCanAttack = (m: CardInstance) =>
    isPlayerTurn && canMinionAttack(m)

  // ============================================
  // 渲染
  // ============================================

  return (
    <div
      className={styles.container}
      onClick={handleBackgroundClick}
      data-active={state.activePlayer}
      data-ended={state.phase === 'ended'}
    >
      {/* 背景 */}
      {bgUrl && <img src={bgUrl} alt="" className={styles.bg} />}
      <div className={styles.bgVignette} />

      {/* ============ 左上：退出按钮 ============ */}
      <button
        className={styles.quitFixed}
        onClick={(e) => {
          e.stopPropagation()
          handleQuit()
        }}
        aria-label="退出对战"
      >
        {btnBackUrl ? <img src={btnBackUrl} alt="退出" /> : <span>退出</span>}
      </button>

      {/* ============ AI 手牌（顶中小扇） ============ */}
      <div className={styles.aiHandRow}>
        {state.ai.hand.map((_, i) => {
          const offset = i - (state.ai.hand.length - 1) / 2
          return (
            <div
              key={i}
              className={styles.cardBack}
              style={{
                transform: `rotate(${offset * 6}deg) translateY(${Math.abs(offset) * 5}px)`,
              }}
            >
              {cardbackUrl && <img src={cardbackUrl} alt="" />}
            </div>
          )
        })}
      </div>

      {/* ============ AI 头像（顶中） ============ */}
      <div className={styles.aiHeroBox}>
        <HeroDisplay
          name={state.ai.hero.name}
          health={state.ai.hero.health}
          maxHealth={state.ai.hero.maxHealth}
          attack={state.ai.hero.attack}
          armor={state.ai.hero.armor}
          weapon={state.ai.weapon}
          portraitUrl={heroAiUrl}
          targetable={enemyHeroTargetable}
          onClick={handleEnemyHeroClick}
        />
      </div>

      {/* ============ AI 法力（顶右） ============ */}
      <div className={styles.aiManaBox}>
        <ManaDisplay
          current={state.ai.mana.current}
          max={state.ai.mana.max}
          fullUrl={manaFullUrl}
          emptyUrl={manaEmptyUrl}
        />
      </div>

      {/* ============ AI 牌组（顶右角小角标） ============ */}
      <div className={styles.aiDeckBadge}>
        {cardbackUrl && <img src={cardbackUrl} alt="" />}
        <span>{state.ai.deck.length}</span>
      </div>

      {/* ============ AI 战场 ============ */}
      <BoardZone
        side="ai"
        minions={state.ai.board}
        dyingMinions={dyingMinions.filter((m) => m.owner === 'ai')}
        getMinionProps={(m) => ({
          targetable: enemyMinionTargetable(m),
          dimmed: enemyMinionDimmed(m),
          onClick: () => handleEnemyMinionClick(m),
        })}
      />

      {/* 中央 · 回合切换提示
          - 玩家回合：图自带「你的回合」文字（key 重挂触发淡出）
          - AI 回合：不显示这条，由下方 aiThinkingHint 替代
          - 对局结束：纯文字胜负 */}
      {state.phase === 'main' && state.activePlayer === 'player' && (
        <div
          key={turnKey}
          className={styles.turnIndicator}
          style={{
            backgroundImage: `url(${getUiAssetUrl('ui_turn_indicator_base.png')})`,
          }}
        />
      )}
      {state.phase === 'ended' && (
        <div className={styles.endedText}>
          {state.winner === 'player' ? '你赢了' : '你输了'}
        </div>
      )}

      {/* ============ 玩家战场 ============ */}
      <BoardZone
        side="player"
        minions={state.player.board}
        dyingMinions={dyingMinions.filter((m) => m.owner === 'player')}
        getMinionProps={(m) => ({
          selected: selectedAttackerId === m.instanceId,
          canAttack: playerMinionCanAttack(m),
          onClick: () => handlePlayerMinionClick(m),
        })}
      />

      {/* ============ 玩家头像（底中） ============ */}
      <div className={styles.playerHeroBox}>
        <HeroDisplay
          name={state.player.hero.name}
          health={state.player.hero.health}
          maxHealth={state.player.hero.maxHealth}
          attack={state.player.hero.attack}
          armor={state.player.hero.armor}
          weapon={state.player.weapon}
          portraitUrl={heroPlayerUrl}
          selected={selectedAttackerId === 'hero_player'}
          canAttack={isPlayerTurn && state.player.hero.attack > 0}
          onClick={handlePlayerHeroClick}
        />
      </div>

      {/* ============ 玩家法力（底右） ============ */}
      <div className={styles.playerManaBox}>
        <ManaDisplay
          current={state.player.mana.current}
          max={state.player.mana.max}
          fullUrl={manaFullUrl}
          emptyUrl={manaEmptyUrl}
        />
      </div>

      {/* ============ 玩家牌组（底右角小角标） ============ */}
      <div className={styles.playerDeckBadge}>
        {cardbackUrl && <img src={cardbackUrl} alt="" />}
        <span>{state.player.deck.length}</span>
      </div>

      {/* ============ 结束回合按钮（右中独立悬浮） ============ */}
      <button
        className={styles.endTurnFixed}
        onClick={(e) => {
          e.stopPropagation()
          endTurn()
        }}
        disabled={!isPlayerTurn}
        aria-label="结束回合"
      >
        {btnEndTurnUrl ? (
          <img src={btnEndTurnUrl} alt="结束回合" />
        ) : (
          <span>结束回合</span>
        )}
      </button>

      {/* ============ 玩家手牌（底部大扇） ============ */}
      <div className={styles.playerHand}>
        {state.player.hand.map((card, i) => {
          const playable = isPlayerTurn && card.data.cost <= state.player.mana.current
          const selected = selectedCardId === card.instanceId
          const total = state.player.hand.length
          const offset = i - (total - 1) / 2
          const angle = offset * 12
          const lift = Math.abs(offset) * 8
          return (
            <div
              key={card.instanceId}
              className={`${styles.handSlot} ${selected ? styles.handSlotSelected : ''} ${!playable ? styles.handSlotUnplayable : ''}`}
              style={{
                ['--rot' as string]: `${angle}deg`,
                ['--lift' as string]: `${lift}px`,
                ['--idx' as string]: i,
                zIndex: 10 + i,
              }}
              onClick={(e) => {
                e.stopPropagation()
                // v5.5 UX: 单击=选中 / 双击=详情
                handleCardClickV55(card, () => handleHandCardClick(card.instanceId))
              }}
            >
              <Card card={card.data} scale={0.55} />
            </div>
          )
        })}
      </div>

      {/* AI 思考 / 待选目标 提示 */}
      {aiThinking && (
        <div
          className={styles.aiThinkingHint}
          style={{
            backgroundImage: `url(${getUiAssetUrl('ui_ai_thinking_base.png')})`,
          }}
        />
      )}
      {hasPendingSpellTarget && (
        <div className={styles.targetHint}>请选择目标（点击敌方武将）</div>
      )}

      {/* 长按详情弹窗（createPortal 绕过父级 transform: scale）*/}
      {detailViewCard &&
        createPortal(
          <div
            className={styles.detailOverlay}
            onClick={() => setDetailViewCard(null)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className={styles.detailCardWrap}>
              <Card card={detailViewCard.data} scale={2} />
            </div>
            <div className={styles.detailHint}>点击任意处关闭</div>
          </div>,
          document.body,
        )}
    </div>
  )
}

// ============================================
// 子组件 · BoardZone（带 7 槽位 placeholder）
// ============================================

interface MinionExtra {
  selected?: boolean
  canAttack?: boolean
  targetable?: boolean
  dimmed?: boolean
  onClick?: () => void
}

interface BoardZoneProps {
  side: PlayerSide
  minions: CardInstance[]
  dyingMinions: CardInstance[]
  getMinionProps: (m: CardInstance) => MinionExtra
}

function BoardZone({ side, minions, dyingMinions, getMinionProps }: BoardZoneProps) {
  return (
    <div className={`${styles.boardZone} ${side === 'ai' ? styles.boardAi : styles.boardPlayer}`}>
      {/* 7 个槽位虚线占位（z:0，被 minion 覆盖时不可见）*/}
      <div className={styles.slotRow}>
        {Array.from({ length: BOARD_MAX }).map((_, i) => (
          <div
            key={`slot-${i}`}
            className={styles.slot}
            data-occupied={i < minions.length ? 'true' : 'false'}
          />
        ))}
      </div>
      {/* minions */}
      <div className={styles.minionRow}>
        {minions.map((m) => {
          const props = getMinionProps(m)
          return (
            <MinionToken
              key={m.instanceId}
              minion={m}
              selected={props.selected}
              canAttack={props.canAttack}
              targetable={props.targetable}
              dimmed={props.dimmed}
              onClick={props.onClick}
            />
          )
        })}
        {/* 死亡淡出 */}
        {dyingMinions.map((m) => (
          <div key={`dying-${m.instanceId}`} className={styles.dyingMinion}>
            <MinionToken minion={m} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// 子组件 · HeroDisplay
// ============================================

interface HeroProps {
  name: string
  health: number
  maxHealth: number
  attack: number
  armor: number
  weapon: CardInstance | null
  portraitUrl: string | null
  selected?: boolean
  canAttack?: boolean
  targetable?: boolean
  onClick?: () => void
}

function HeroDisplay({
  name,
  health,
  maxHealth,
  attack,
  armor,
  weapon,
  portraitUrl,
  selected,
  canAttack,
  targetable,
  onClick,
}: HeroProps) {
  const damaged = health < maxHealth
  const hpBaseUrl = getUiAssetUrl('ui_hp_base.png')
  return (
    <button
      className={`${styles.heroDisplay} ${selected ? styles.heroSelected : ''} ${canAttack ? styles.heroCanAttack : ''} ${targetable ? styles.heroTargetable : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      aria-label={name}
    >
      <div className={styles.heroPortraitWrap}>
        {portraitUrl ? (
          <img src={portraitUrl} alt={name} className={styles.heroPortrait} />
        ) : (
          <div className={styles.heroPortraitPlaceholder}>{name[0]}</div>
        )}
      </div>
      <div
        className={`${styles.heroHealth} ${damaged ? styles.heroHealthDamaged : ''}`}
        style={hpBaseUrl ? { backgroundImage: `url(${hpBaseUrl})` } : undefined}
      >
        <span>{health}</span>
      </div>
      {attack > 0 && <div className={styles.heroAttack}>⚔ {attack}</div>}
      {armor > 0 && <div className={styles.heroArmor}>🛡 {armor}</div>}
      {weapon && (
        <div className={styles.heroWeapon} title={weapon.data.name}>
          {weapon.data.name} {weapon.currentAttack}/{weapon.currentDurability}
        </div>
      )}
    </button>
  )
}

// ============================================
// 子组件 · ManaDisplay（X/X + 水晶横排）
// ============================================

interface ManaProps {
  current: number
  max: number
  fullUrl: string | null
  emptyUrl: string | null
}

function ManaDisplay({ current, max, fullUrl, emptyUrl }: ManaProps) {
  if (max === 0) return null // AI 第一回合无法力时隐藏
  const manaBaseUrl = getUiAssetUrl('ui_mana_base.png')
  return (
    <div
      className={styles.manaDisplay}
      style={manaBaseUrl ? { backgroundImage: `url(${manaBaseUrl})` } : undefined}
    >
      <div className={styles.manaCounter}>
        <span>{current}/{max}</span>
      </div>
      <div className={styles.manaCrystals}>
        {Array.from({ length: max }).map((_, i) => {
          const isFull = i < current
          const url = isFull ? fullUrl : emptyUrl
          return url ? (
            <img key={i} src={url} alt="" className={styles.manaCrystal} />
          ) : (
            <div key={i} className={styles.manaCrystalFallback} data-full={isFull} />
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// 攻击规则工具
// ============================================

function canMinionAttack(m: CardInstance): boolean {
  if (m.exhausted) return false
  if (m.currentAttack <= 0) return false
  const max = m.currentKeywords.has('windfury') ? 2 : 1
  if (m.attacksThisTurn >= max) return false
  return true
}

function canTargetMinion(
  state: { ai: { board: CardInstance[] } },
  target: CardInstance,
): boolean {
  const enemyHasTaunt = state.ai.board.some((m) => m.currentKeywords.has('taunt'))
  if (enemyHasTaunt && !target.currentKeywords.has('taunt')) return false
  return true
}

function canTargetHero(
  state: { ai: { board: CardInstance[] }; player: { board: CardInstance[] } },
  attackerId: string,
): boolean {
  if (state.ai.board.some((m) => m.currentKeywords.has('taunt'))) return false
  if (attackerId !== 'hero_player') {
    const m = state.player.board.find((c) => c.instanceId === attackerId)
    if (
      m &&
      m.currentKeywords.has('rush') &&
      !m.currentKeywords.has('charge') &&
      m.summonedThisTurn
    ) {
      return false
    }
  }
  return true
}
