import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import { Card } from '@/components/Card/Card'
import type { CardInstance, PlayerSide } from '@/engine/types'
import type { TargetRef } from '@/engine'
import { MinionToken } from './components/MinionToken'
import { HeroWeaponSlot } from '@/components/HeroWeaponSlot/HeroWeaponSlot'
import { FloatingNumber } from '@/components/FloatingNumber/FloatingNumber'
import { useHpDelta, useHitShake } from '@/components/FloatingNumber/useHpDelta'
import { FxSprite } from '@/components/FxSprite/FxSprite'
import { useFxStore, getFxFrameCount, getFxFrameSequence } from '@/store/fxStore'
import { registerTarget, unregisterTarget } from '@/utils/targetRegistry'
import { getCanvasScale } from '@/utils/canvasScale'
import { TurnLogModal } from '@/components/TurnLogModal/TurnLogModal'
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
    log,
    selectedCardId,
    selectedAttackerId,
    pendingTargetForCard,
    aiThinking,
    startGame,
    selectCard,
    selectAttacker,
    resolveTarget,
    playSelectedToBoard,
    playSelectedToHero,
    endTurn,
    endGame,
  } = useGameStore()

  // §19.6 Phase C · FX 队列（基础设施 · 自动触发先关）
  // 旧版按 log.kind 自动触发被回退：AI 回合时每条 damage/heal log 都炸 sprite
  // 糊在「对手思考中」hint 上面 + 误触发于回合结束。
  // 留 Phase E 在引擎层直接 emit fx intent + 锚点位置，再开。
  const fxEvents = useFxStore((s) => s.events)
  const fxRemove = useFxStore((s) => s.remove)
  const fxClear = useFxStore((s) => s.clear)

  // 离开战场清空 fx 队列
  useEffect(() => {
    return () => fxClear()
  }, [fxClear])

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
  // §19.7-2 回合记录弹窗
  const [turnLogOpen, setTurnLogOpen] = useState(false)
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

  // §19.7.5 · 计策/效果文字浮起：监听 log kind='effect' 新增 → 中央上方浮起 1500ms 自动消失
  const [effectToasts, setEffectToasts] = useState<{ id: string; text: string }[]>([])
  const lastLogIdxRef = useRef(0)
  useEffect(() => {
    if (log.length <= lastLogIdxRef.current) {
      // log 被清空（新局开始）→ 重置
      if (log.length === 0) {
        lastLogIdxRef.current = 0
        setEffectToasts([])
      }
      return
    }
    const newEntries = log.slice(lastLogIdxRef.current)
    lastLogIdxRef.current = log.length
    const effects = newEntries.filter((e) => e.kind === 'effect')
    if (effects.length === 0) return
    const toasts = effects.map((e, i) => ({
      id: `toast_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      text: e.text,
    }))
    setEffectToasts((prev) => [...prev, ...toasts].slice(-4)) // 最多同时显示 4 条
    toasts.forEach((t) => {
      window.setTimeout(() => {
        setEffectToasts((prev) => prev.filter((p) => p.id !== t.id))
      }, 1500)
    })
  }, [log])

  // §19.7.3 · 新卡入场动画 + 抽牌 draw_glow sprite
  const playerHandRef = useRef<HTMLDivElement>(null)
  const aiHandRef = useRef<HTMLDivElement>(null)
  const prevPlayerHandRef = useRef<Set<string>>(new Set())
  const prevAiHandCountRef = useRef<number>(0)
  const handInitRef = useRef<boolean>(false)
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!state) return
    const curPlayerIds = new Set(state.player.hand.map((c) => c.instanceId))
    const curAiCount = state.ai.hand.length

    // 首次同步不放炮（避免战斗开局所有起手牌一起入场，太吵）
    if (!handInitRef.current) {
      prevPlayerHandRef.current = curPlayerIds
      prevAiHandCountRef.current = curAiCount
      handInitRef.current = true
      return
    }

    // 玩家：新增 instanceId → 入场动画 + draw_glow sprite
    const newPlayerIds: string[] = []
    curPlayerIds.forEach((id) => {
      if (!prevPlayerHandRef.current.has(id)) newPlayerIds.push(id)
    })
    if (newPlayerIds.length > 0) {
      setEnteringIds((prev) => {
        const next = new Set(prev)
        newPlayerIds.forEach((id) => next.add(id))
        return next
      })
      window.setTimeout(() => {
        setEnteringIds((prev) => {
          const next = new Set(prev)
          newPlayerIds.forEach((id) => next.delete(id))
          return next
        })
      }, 500)

      const handEl = playerHandRef.current
      if (handEl) {
        const rect = handEl.getBoundingClientRect()
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height * 0.35,
        }
        const s = getCanvasScale()
        useFxStore.getState().trigger('draw_glow', {
          anchor: center,
          size: 280 * s,
          durationMs: 500,
        })
      }
    }

    // AI：手牌数量增加 → 在 AI 手牌区中央放 draw_glow（小尺寸，盲触感知）
    const aiDelta = curAiCount - prevAiHandCountRef.current
    if (aiDelta > 0) {
      const handEl = aiHandRef.current
      if (handEl) {
        const rect = handEl.getBoundingClientRect()
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
        const s = getCanvasScale()
        useFxStore.getState().trigger('draw_glow', {
          anchor: center,
          size: 220 * s,
          durationMs: 500,
        })
      }
    }

    prevPlayerHandRef.current = curPlayerIds
    prevAiHandCountRef.current = curAiCount
  }, [state])

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

  const bgUrl = getUiAssetUrl('battle_bg_portrait.png')
  const cardbackUrl = getUiAssetUrl('cardback.png')
  // §19.7-5 主公头像按阵营动态选 · shu=刘备 / wu=孙权
  // 替代之前 hardcode 的 hero_player.png（刘备）+ hero_ai.png（曹操）
  const heroPlayerUrl = getUiAssetUrl(
    state.player.hero.faction === 'wu' ? 'hero_wu.png' : 'hero_shu.png',
  )
  const heroAiUrl = getUiAssetUrl(
    state.ai.hero.faction === 'wu' ? 'hero_wu.png' : 'hero_shu.png',
  )
  const manaFullUrl = getUiAssetUrl('mana_full.png')
  const manaEmptyUrl = getUiAssetUrl('mana_empty.png')
  const btnEndTurnUrl = getUiAssetUrl('btn_end_turn.png')
  const btnTurnLogUrl = getUiAssetUrl('btn_turn_log.png')
  const btnBackUrl = getUiAssetUrl('btn_back.png')

  const isPlayerTurn = state.activePlayer === 'player' && state.phase === 'main'
  const hasPendingSpellTarget = !!pendingTargetForCard
  const hasAttackerSelected = !!selectedAttackerId

  // v5.5 选中卡牌的分类（决定 UI 高亮哪里 + 哪些是合法目标）
  const selectedCard = selectedCardId
    ? state.player.hand.find((c) => c.instanceId === selectedCardId)
    : null
  const FRIENDLY_TARGET_ACTIONS = new Set([
    'buffMinion',
    'grantExtraAttack',
    'grantKeyword',
  ])
  const selectedSpellTargetsFriendly = !!(
    selectedCard &&
    selectedCard.data.type === 'spell' &&
    hasPendingSpellTarget &&
    (selectedCard.data.effects ?? []).some((e) =>
      FRIENDLY_TARGET_ACTIONS.has(e.action),
    )
  )
  const selectedSpellTargetsEnemy =
    !!selectedCard && hasPendingSpellTarget && !selectedSpellTargetsFriendly

  // 类型：'minion-to-board' | 'spell-no-target' | 'weapon-to-hero' | null
  const selectedNeedsBoardClick =
    !!selectedCard &&
    !hasPendingSpellTarget &&
    (selectedCard.data.type === 'minion' || selectedCard.data.type === 'spell')
  const selectedNeedsHeroClick =
    !!selectedCard &&
    !hasPendingSpellTarget &&
    selectedCard.data.type === 'weapon'

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

  // 敌方 minion 可作为目标：① 攻击者已选 + 嘲讽规则通过 ② 选中的 spell 是对敌法术
  const enemyMinionTargetable = (m: CardInstance) =>
    isPlayerTurn &&
    (selectedSpellTargetsEnemy ||
      (hasAttackerSelected && canTargetMinion(state, m)))

  // 非 taunt 单位被嘲讽锁定时变灰
  const enemyMinionDimmed = (m: CardInstance) =>
    isPlayerTurn &&
    hasAttackerSelected &&
    enemyHasTaunt &&
    !m.currentKeywords.has('taunt')

  // 敌方 hero 可作为目标：① 攻击者已选可斩杀 ② 选中的 spell 是对敌法术且可指英雄
  const enemyHeroTargetable =
    isPlayerTurn &&
    ((hasAttackerSelected &&
      !hasPendingSpellTarget &&
      canTargetHero(state, selectedAttackerId!)) ||
      selectedSpellTargetsEnemy)

  // 友方 minion 可作为目标：选中的 spell 是友方 buff 法术
  const friendlyMinionTargetable = (_m: CardInstance) =>
    isPlayerTurn && selectedSpellTargetsFriendly

  const playerMinionCanAttack = (m: CardInstance) =>
    isPlayerTurn && canMinionAttack(m)

  // 出牌区高亮：选中 minion 或无目标 spell → 我方场上 BoardZone 可点击
  const playerBoardIsDropZone = isPlayerTurn && selectedNeedsBoardClick
  // 主公高亮：选中 weapon → 我方主公可装备
  const playerHeroIsEquipZone = isPlayerTurn && selectedNeedsHeroClick

  // 我方 minion 点击行为：
  // - 若有选中 friendly buff 法术 → 当作 spell 目标
  // - 否则 → 进入攻击者选中
  const handleFriendlyMinionForSpell = (m: CardInstance) => {
    if (!isPlayerTurn || !selectedSpellTargetsFriendly) return
    resolveTarget({ kind: 'minion', side: 'player', instanceId: m.instanceId })
  }

  // 我方 BoardZone 点击：出 minion / 无目标 spell
  const handlePlayerBoardZoneClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!playerBoardIsDropZone) return
    playSelectedToBoard()
  }

  // 双击场上 minion 看详情（CP4）
  const handleMinionDoubleClick = (m: CardInstance) => {
    setDetailViewCard(m)
  }

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
      <div className={styles.aiHandRow} ref={aiHandRef}>
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
          side="ai"
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
          onDoubleClick: () => handleMinionDoubleClick(m),
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

      {/* ============ 玩家战场（出牌区 · 选中 minion 时点这里出牌） ============ */}
      <BoardZone
        side="player"
        minions={state.player.board}
        dyingMinions={dyingMinions.filter((m) => m.owner === 'player')}
        isDropZone={playerBoardIsDropZone}
        onZoneClick={handlePlayerBoardZoneClick}
        getMinionProps={(m) => ({
          selected: selectedAttackerId === m.instanceId,
          canAttack: playerMinionCanAttack(m),
          targetable: friendlyMinionTargetable(m),
          onClick: () => {
            // 若是友方 buff spell，把 minion 当作目标
            if (selectedSpellTargetsFriendly) {
              handleFriendlyMinionForSpell(m)
              return
            }
            handlePlayerMinionClick(m)
          },
          onDoubleClick: () => handleMinionDoubleClick(m),
        })}
      />

      {/* ============ 玩家头像（底中 · 选中 weapon 时点这里装备） ============ */}
      <div className={styles.playerHeroBox}>
        <HeroDisplay
          side="player"
          name={state.player.hero.name}
          health={state.player.hero.health}
          maxHealth={state.player.hero.maxHealth}
          attack={state.player.hero.attack}
          armor={state.player.hero.armor}
          weapon={state.player.weapon}
          portraitUrl={heroPlayerUrl}
          selected={selectedAttackerId === 'hero_player'}
          canAttack={isPlayerTurn && state.player.hero.attack > 0}
          targetable={playerHeroIsEquipZone}
          onClick={() => {
            if (playerHeroIsEquipZone) {
              playSelectedToHero()
              return
            }
            handlePlayerHeroClick()
          }}
        />
      </div>

      {/* §19.2 玩家法力 · 左侧紧凑方形 130×130，与右侧 endTurn 对称 */}
      <div className={styles.playerManaBox}>
        <ManaDisplay
          current={state.player.mana.current}
          max={state.player.mana.max}
          fullUrl={manaFullUrl}
          emptyUrl={manaEmptyUrl}
          compact
        />
      </div>

      {/* ============ 玩家牌组（底右角小角标） ============ */}
      <div className={styles.playerDeckBadge}>
        {cardbackUrl && <img src={cardbackUrl} alt="" />}
        <span>{state.player.deck.length}</span>
      </div>

      {/* §19.7-2 回合记录按钮（endTurn 左侧）*/}
      <button
        className={styles.turnLogFixed}
        onClick={(e) => {
          e.stopPropagation()
          setTurnLogOpen(true)
        }}
        aria-label="查看回合记录"
      >
        {btnTurnLogUrl ? (
          <img src={btnTurnLogUrl} alt="回合记录" />
        ) : (
          <span>回合记录</span>
        )}
      </button>

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
      <div className={styles.playerHand} ref={playerHandRef}>
        {state.player.hand.map((card, i) => {
          const playable = isPlayerTurn && card.data.cost <= state.player.mana.current
          const selected = selectedCardId === card.instanceId
          const total = state.player.hand.length
          const offset = i - (total - 1) / 2
          const angle = offset * 12
          const lift = Math.abs(offset) * 8
          const entering = enteringIds.has(card.instanceId)
          return (
            <div
              key={card.instanceId}
              className={`${styles.handSlot} ${selected ? styles.handSlotSelected : ''} ${!playable ? styles.handSlotUnplayable : ''} ${entering ? styles.handCardEntering : ''}`}
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
              <Card card={card.data} scale={0.75} />
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

      {/* §19.7-2 回合记录弹窗 · 全屏 modal */}
      <TurnLogModal
        open={turnLogOpen}
        onClose={() => setTurnLogOpen(false)}
        log={log}
      />

      {/* §19.7.5 · 计策/效果文字浮起 · 中央上方堆叠 */}
      {effectToasts.length > 0 && (
        <div className={styles.effectToastStack}>
          {effectToasts.map((t, i) => (
            <div
              key={t.id}
              className={styles.effectToast}
              style={{ ['--toast-delay' as string]: `${i * 80}ms` }}
            >
              {t.text}
            </div>
          ))}
        </div>
      )}

      {/* §19.6 Phase C · FX 序列帧覆盖层（fixed 定位，覆盖全屏，不挡交互）*/}
      {fxEvents.map((e) => (
        <FxSprite
          key={e.id}
          name={e.kind}
          totalFrames={getFxFrameCount(e.kind)}
          frames={getFxFrameSequence(e.kind)}
          durationMs={e.durationMs}
          size={e.size}
          anchor={e.anchor}
          onComplete={() => fxRemove(e.id)}
        />
      ))}

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
  onDoubleClick?: () => void
}

interface BoardZoneProps {
  side: PlayerSide
  minions: CardInstance[]
  dyingMinions: CardInstance[]
  getMinionProps: (m: CardInstance) => MinionExtra
  /** v5.5 出牌区高亮：选中 minion / 无目标 spell 时点击此区域出牌 */
  isDropZone?: boolean
  onZoneClick?: (e: React.MouseEvent) => void
}

function BoardZone({
  side,
  minions,
  dyingMinions,
  getMinionProps,
  isDropZone,
  onZoneClick,
}: BoardZoneProps) {
  return (
    <div
      className={`${styles.boardZone} ${side === 'ai' ? styles.boardAi : styles.boardPlayer}`}
      data-drop-zone={isDropZone ? 'true' : 'false'}
      onClick={onZoneClick}
    >
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
              onDoubleClick={props.onDoubleClick}
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
  side: PlayerSide
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
  side,
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
  // §19.6 Phase A · HP 变化检测 → 浮起数字 + 受击震动
  const hpDelta = useHpDelta(health)
  const isHit = useHitShake(health)
  // §19.6 Phase B · 攻击者前冲订阅
  const heroId = side === 'player' ? 'hero_player' : 'hero_ai'
  const charging = useFxStore((s) => s.chargingAttacker)
  const isCharging = charging?.id === heroId
  const chargeSide = isCharging ? charging!.side : undefined
  // §19.6 Phase B · 注册 DOM ref 供 doAnimatedAttack 计算命中位置
  const heroRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    registerTarget(heroId, heroRef.current)
    return () => unregisterTarget(heroId)
  }, [heroId])
  return (
    <button
      ref={heroRef}
      className={`${styles.heroDisplay} ${selected ? styles.heroSelected : ''} ${canAttack ? styles.heroCanAttack : ''} ${targetable ? styles.heroTargetable : ''} ${isHit ? styles.heroHitShake : ''} ${isCharging ? styles.heroCharging : ''}`}
      data-charge-side={chargeSide}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      aria-label={name}
    >
      {/* §19.6 浮起数字 · -X 红 / +X 绿 */}
      {hpDelta && (
        <FloatingNumber
          key={hpDelta.id}
          kind={hpDelta.kind}
          value={hpDelta.value}
        />
      )}
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
      {/* §19.5 装备槽 · 椭圆 frame + 立绘 clip-path + 攻击/耐久数字 */}
      {weapon && <HeroWeaponSlot weapon={weapon} />}
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
  /** §19.2 紧凑方形模式（130×130 配合 endTurn 对称）· 玩家用 true / AI 用 false */
  compact?: boolean
}

function ManaDisplay({ current, max, fullUrl, emptyUrl, compact = false }: ManaProps) {
  if (max === 0) return null // AI 第一回合无法力时隐藏
  const manaBaseUrl = getUiAssetUrl('ui_mana_base.png')
  return (
    <div
      className={`${styles.manaDisplay} ${compact ? styles.manaDisplayCompact : ''}`}
      style={
        !compact && manaBaseUrl
          ? { backgroundImage: `url(${manaBaseUrl})` }
          : undefined
      }
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
