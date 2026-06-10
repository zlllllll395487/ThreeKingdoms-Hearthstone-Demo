import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import { Card } from '@/components/Card/Card'
import { BackButton } from '@/components/BackButton/BackButton'
import type { CardInstance, PlayerSide } from '@/engine/types'
import type { TargetRef } from '@/engine'
import { MinionToken } from './components/MinionToken'
import { HeroWeaponSlot } from '@/components/HeroWeaponSlot/HeroWeaponSlot'
import { FloatingNumber } from '@/components/FloatingNumber/FloatingNumber'
import { useHpDelta, useHitShake } from '@/components/FloatingNumber/useHpDelta'
import { FxSprite } from '@/components/FxSprite/FxSprite'
import { useFxStore, getFxFrameCount, getFxFrameSequence } from '@/store/fxStore'
import { registerTarget, unregisterTarget, getTargetCenter } from '@/utils/targetRegistry'
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
    engine,
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
  // Phase F-1 召唤反馈 / F-3 战吼启动：用 prevBoardRef diff 检测新进场
  const [battlecryIds, setBattlecryIds] = useState<Set<string>>(new Set())
  // Phase F-2 装备落下：prev weapon ref 检测 null → CardInstance 跃迁，触发 fx_summon 小尺寸
  const prevWeaponRef = useRef<{ player: string | null; ai: string | null }>({
    player: null,
    ai: null,
  })
  useEffect(() => {
    if (!state) return
    const curP = state.player.weapon?.instanceId ?? null
    const curA = state.ai.weapon?.instanceId ?? null
    const s = getCanvasScale()
    if (curP && curP !== prevWeaponRef.current.player) {
      window.setTimeout(() => {
        const center = getTargetCenter('hero_player')
        if (center) {
          useFxStore.getState().trigger('summon', {
            anchor: { x: center.x - 130 * s, y: center.y },
            size: 200 * s,
            durationMs: 700,
          })
        }
      }, 40)
    }
    if (curA && curA !== prevWeaponRef.current.ai) {
      window.setTimeout(() => {
        const center = getTargetCenter('hero_ai')
        if (center) {
          useFxStore.getState().trigger('summon', {
            anchor: { x: center.x - 130 * s, y: center.y },
            size: 200 * s,
            durationMs: 700,
          })
        }
      }, 40)
    }
    prevWeaponRef.current = { player: curP, ai: curA }
  }, [state])

  // §19.7.21 Phase D-4 · 计策施法者发光 (spell play → 对应 hero 金光一闪 600ms)
  const [castingSide, setCastingSide] = useState<'player' | 'ai' | null>(null)

  // §19.7.5 + §19.7.21 Phase D · 计策/效果文字浮起 + 仪式感分级
  // kind 'special' 给"连击/特殊效果触发/冻结/法力"等 → 大字号 + 不同颜色
  type ToastKind = 'normal' | 'combo' | 'special' | 'freeze' | 'mana'
  const [effectToasts, setEffectToasts] = useState<
    { id: string; text: string; kind: ToastKind }[]
  >([])
  const lastLogIdxRef = useRef(0)
  useEffect(() => {
    if (log.length <= lastLogIdxRef.current) {
      if (log.length === 0) {
        lastLogIdxRef.current = 0
        setEffectToasts([])
      }
      return
    }
    const newEntries = log.slice(lastLogIdxRef.current)
    lastLogIdxRef.current = log.length
    // Phase D-4 · 检测新的 spell play log → 触发对应 hero 发光
    const spellPlay = newEntries.find(
      (e) => e.kind === 'play' && e.cardType === 'spell',
    )
    if (spellPlay && spellPlay.side) {
      const side = spellPlay.side
      setCastingSide(side)
      window.setTimeout(() => {
        setCastingSide((cur) => (cur === side ? null : cur))
      }, 600)
    }
    const effects = newEntries.filter((e) => e.kind === 'effect')
    if (effects.length === 0) return
    const classifyToast = (text: string): ToastKind => {
      if (text.startsWith('【连击】')) return 'combo'
      if (text.startsWith('【特殊效果触发】')) return 'special'
      if (text.includes('冻结')) return 'freeze'
      if (text.includes('法力 +') || text.includes('退还')) return 'mana'
      return 'normal'
    }
    const toasts = effects.map((e, i) => ({
      id: `toast_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      text: e.text,
      kind: classifyToast(e.text),
    }))
    setEffectToasts((prev) => [...prev, ...toasts].slice(-4))
    toasts.forEach((t) => {
      // combo/special 大字仪式感留更久一点
      const dur = t.kind === 'combo' || t.kind === 'special' ? 1800 : 1500
      window.setTimeout(() => {
        setEffectToasts((prev) => prev.filter((p) => p.id !== t.id))
      }, dur)
    })
  }, [log])

  // §19.7.3 · 新卡入场动画 + 抽牌 draw_glow sprite
  const playerHandRef = useRef<HTMLDivElement>(null)
  const aiHandRef = useRef<HTMLDivElement>(null)
  // §19.7.18 · 手牌按死左键拖拽 · translateX 实现（不依赖 overflow，可保留 y 方向溢出）
  const [handScrollX, setHandScrollX] = useState(0)
  const handDragRef = useRef<{
    active: boolean
    startX: number
    startScroll: number
    dragged: boolean
  }>({ active: false, startX: 0, startScroll: 0, dragged: false })

  const handleHandDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    handDragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: handScrollX,
      dragged: false,
    }
  }
  const handleHandDragMove = (e: React.MouseEvent) => {
    const s = handDragRef.current
    if (!s.active) return
    const dx = e.clientX - s.startX
    if (Math.abs(dx) > 5) s.dragged = true
    setHandScrollX(s.startScroll + dx)
  }
  const handleHandDragEnd = () => {
    if (handDragRef.current.active) {
      handDragRef.current.active = false
      if (handDragRef.current.dragged) {
        window.setTimeout(() => {
          handDragRef.current.dragged = false
        }, 50)
      }
    }
  }
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

    // Phase F-1 / F-3 · 新进场 minion 检测
    const added = [
      ...curPlayer.filter((m) => !prev.player.find((c) => c.instanceId === m.instanceId)),
      ...curAi.filter((m) => !prev.ai.find((c) => c.instanceId === m.instanceId)),
    ]
    if (added.length > 0) {
      // F-1 · token (TK_*) 进场 → fx_summon 光柱
      // 防避免给从手牌打出的普通 minion 重复触发（minionAppear CSS 已经够了）
      const tokens = added.filter((m) => m.data.id.startsWith('TK_'))
      if (tokens.length > 0) {
        // 延迟 60ms 等 MinionToken mount + targetRegistry 注册 DOM ref
        window.setTimeout(() => {
          const s = getCanvasScale()
          tokens.forEach((m) => {
            const center = getTargetCenter(m.instanceId)
            if (!center) return
            useFxStore.getState().trigger('summon', {
              anchor: center,
              size: 260 * s,
              durationMs: 800,
            })
          })
        }, 60)
      }
      // F-3 · 带 battlecry 的新 minion → 边框金光环 600ms
      const battlecryMinions = added.filter(
        (m) =>
          !m.data.id.startsWith('TK_') &&
          (m.data.effects ?? []).some((e) => e.trigger === 'battlecry'),
      )
      if (battlecryMinions.length > 0) {
        setBattlecryIds((p) => {
          const next = new Set(p)
          battlecryMinions.forEach((m) => next.add(m.instanceId))
          return next
        })
        const ids = battlecryMinions.map((m) => m.instanceId)
        window.setTimeout(() => {
          setBattlecryIds((p) => {
            const next = new Set(p)
            ids.forEach((id) => next.delete(id))
            return next
          })
        }, 600)
      }
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
  // §19.7.7 · 友方目标检测：之前限定 type==='spell' 把带 battlecry 的 minion（魏延等）排除了
  // 改为读 effect trigger ∈ {onCast, battlecry} + action ∈ FRIENDLY_TARGET_ACTIONS
  const selectedSpellTargetsFriendly = !!(
    selectedCard &&
    hasPendingSpellTarget &&
    (selectedCard.data.effects ?? []).some(
      (e) =>
        (e.trigger === 'onCast' || e.trigger === 'battlecry') &&
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
    // §19.7.13 · 不可打原因反馈（之前 silent return）
    const card = state.player.hand.find((c) => c.instanceId === instanceId)
    if (!card) return
    if (state.player.mana.current < card.data.cost) {
      pushFeedback(
        `法力不足 · 需要 ${card.data.cost} 点（当前 ${state.player.mana.current}）`,
      )
      return
    }
    if (card.data.type === 'minion' && state.player.board.length >= 7) {
      pushFeedback('战场已满，最多 7 个武将')
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
    // §19.7.13 · canMinionAttack 失败时浮起原因（之前 silent return）
    const reason = whyCannotAttack(m)
    if (reason) {
      pushFeedback(reason)
      return
    }
    selectAttacker(m.instanceId)
  }

  const handlePlayerHeroClick = () => {
    if (!isPlayerTurn) return
    if (state.player.hero.attack <= 0) {
      pushFeedback('主公未装备武器，无法攻击')
      return
    }
    // §19.7.19 · 主公本回合已挥砍 → 拦下避免特效空响、引擎 silent return
    if (engine && !engine.canHeroAttackThisTurn('player')) {
      pushFeedback('主公本回合已攻击过')
      return
    }
    selectAttacker('hero_player')
  }

  const handleEnemyMinionClick = (m: CardInstance) => {
    if (!isPlayerTurn) return
    if (!hasPendingSpellTarget && !hasAttackerSelected) return
    // §19.7.13 · 嘲讽阻挡 → 浮起原因
    if (hasAttackerSelected && !canTargetMinion(state, m)) {
      pushFeedback('敌方有镇守，必须先攻击带镇守的武将')
      return
    }
    // §19.7.15 · spell 目标约束（maxCost 等）· 拒绝浪费卡牌
    if (hasPendingSpellTarget && selectedCard) {
      const v = isValidSpellTarget(selectedCard, m)
      if (!v.valid) {
        pushFeedback(v.reason ?? '该目标不满足卡牌生效条件')
        return
      }
    }
    const target: TargetRef = { kind: 'minion', side: 'ai', instanceId: m.instanceId }
    resolveTarget(target)
  }

  const handleEnemyHeroClick = () => {
    if (!isPlayerTurn) return
    if (!hasPendingSpellTarget && !hasAttackerSelected) return
    if (hasAttackerSelected) {
      const reason = whyCannotTargetHero(state, selectedAttackerId!)
      if (reason) {
        // §19.7.11 · 之前 silent return → 改为浮起原因告知（突袭/嘲讽不可点英雄）
        pushFeedback(reason)
        return
      }
    }
    resolveTarget({ kind: 'hero', side: 'ai' })
  }

  /** §19.7.11 · 一次性手动浮起反馈（不走 engine log 路径）*/
  const pushFeedback = (text: string) => {
    const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    setEffectToasts((prev) => [...prev, { id, text }].slice(-4))
    window.setTimeout(() => {
      setEffectToasts((prev) => prev.filter((p) => p.id !== id))
    }, 1500)
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

  // 敌方 minion 可作为目标：① 攻击者已选 + 嘲讽规则通过 ② 选中的 spell 是对敌法术且 spell 约束允许
  const enemyMinionTargetable = (m: CardInstance) => {
    if (!isPlayerTurn) return false
    if (selectedSpellTargetsEnemy) {
      // §19.7.15 · spell 还要满足 maxCost 等约束（反间计 ≤3 等）
      return isValidSpellTarget(selectedCard!, m).valid
    }
    return hasAttackerSelected && canTargetMinion(state, m)
  }

  // 非 taunt 单位被嘲讽锁定时变灰 · §19.7.15 spell 不满足条件的目标也变灰
  const enemyMinionDimmed = (m: CardInstance) => {
    if (!isPlayerTurn) return false
    if (hasAttackerSelected && enemyHasTaunt && !m.currentKeywords.has('taunt')) {
      return true
    }
    if (selectedSpellTargetsEnemy && !isValidSpellTarget(selectedCard!, m).valid) {
      return true
    }
    return false
  }

  // 敌方 hero 可作为目标：① 攻击者已选可斩杀 ② 选中的 spell 是对敌法术且可指英雄
  const enemyHeroTargetable =
    isPlayerTurn &&
    ((hasAttackerSelected &&
      !hasPendingSpellTarget &&
      canTargetHero(state, selectedAttackerId!)) ||
      selectedSpellTargetsEnemy)
  // §19.7.11 · 主公 dim：有攻击者选中但不能打主公（突袭/嘲讽阻挡）→ 灰态提示不可点
  const enemyHeroDimmed =
    isPlayerTurn &&
    hasAttackerSelected &&
    !hasPendingSpellTarget &&
    !canTargetHero(state, selectedAttackerId!)

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

      {/* ============ 左上：退出按钮 · §19.7.14 BackButton 体系 ============ */}
      <BackButton
        onClick={handleQuit}
        className={styles.quitFixed}
        ariaLabel="退出对战"
      >
        退出
      </BackButton>

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
          dimmed={enemyHeroDimmed}
          casting={castingSide === 'ai'}
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
          battlecry: battlecryIds.has(m.instanceId),
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
          battlecry: battlecryIds.has(m.instanceId),
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
          equipTarget={playerHeroIsEquipZone}
          casting={castingSide === 'player'}
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
        {/* §19.7.19 · 改用 modal_btn_short_on 底图 + React 文字 */}
        <span>回合记录</span>
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

      {/* ============ 玩家手牌（底部大扇）· §19.7.18 加按死左键拖拽滚动 ============ */}
      <div
        className={styles.playerHand}
        ref={playerHandRef}
        onMouseDown={handleHandDragStart}
        onMouseMove={handleHandDragMove}
        onMouseUp={handleHandDragEnd}
        onMouseLeave={handleHandDragEnd}
      >
        <div
          className={styles.playerHandInner}
          style={{ ['--hand-scroll-x' as string]: `${handScrollX}px` }}
        >
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
                  // §19.7.18 · 拖拽中不触发卡牌点击
                  if (handDragRef.current.dragged) return
                  // v5.5 UX: 单击=选中 / 双击=详情
                  handleCardClickV55(card, () => handleHandCardClick(card.instanceId))
                }}
              >
                <Card card={card.data} scale={0.75} />
              </div>
            )
          })}
        </div>
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
        <div className={styles.targetHint}>
          {selectedSpellTargetsFriendly ? '请选择友方武将' : '请选择目标'}
        </div>
      )}
      {/* §19.7.12 · 选中武器卡时提示 "点击主公装备" */}
      {playerHeroIsEquipZone && (
        <div className={styles.targetHint}>点击主公装备</div>
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
              className={`${styles.effectToast} ${styles[`toast_${t.kind}`] ?? ''}`}
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
  /** Phase F-3 战吼启动金光环 600ms */
  battlecry?: boolean
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
              battlecry={props.battlecry}
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
  /** §19.7.11 · 有攻击者但不可打主公（突袭/嘲讽阻挡）→ 视觉变灰 + 仍可点（点击触发原因浮起）*/
  dimmed?: boolean
  /** §19.7.12 · 装备目标态：选中武器卡时己方主公金色光环 · 与红色攻击目标态区分 */
  equipTarget?: boolean
  /** §19.7.21 Phase D-4 · 该方刚施法（spell 出牌）· 主公金色一闪 600ms */
  casting?: boolean
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
  dimmed,
  equipTarget,
  casting,
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
      className={`${styles.heroDisplay} ${selected ? styles.heroSelected : ''} ${canAttack ? styles.heroCanAttack : ''} ${targetable ? styles.heroTargetable : ''} ${isHit ? styles.heroHitShake : ''} ${isCharging ? styles.heroCharging : ''} ${dimmed ? styles.heroDimmed : ''} ${equipTarget ? styles.heroEquipTarget : ''} ${casting ? styles.heroCasting : ''}`}
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
      {/* attack 显示已挪到 HeroWeaponSlot 上的 cost gem，主公头像不再 chip 重复显示 */}
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
  // 玩家紧凑 bar 用新切的 ui_mana_slot.png（横条 + 左绿圈 + 右晶槽）
  // AI 顶部保持原 ui_mana_base.png 横向风格
  const manaBaseUrl = getUiAssetUrl(compact ? 'ui_mana_slot.png' : 'ui_mana_base.png')
  return (
    <div
      className={`${styles.manaDisplay} ${compact ? styles.manaDisplayCompact : ''}`}
      style={manaBaseUrl ? { backgroundImage: `url(${manaBaseUrl})` } : undefined}
    >
      <div className={styles.manaCounter}>
        <span>{compact ? current : `${current}/${max}`}</span>
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
  return whyCannotAttack(m) === null
}

/**
 * §19.7.15 · 检查 spell/battlecry 目标是否满足卡牌生效约束
 * 主要拦截 maxCost 限制（W20 反间计 ≤3 / W21 美人计 ≤3 等）
 * 让 invalid 目标不再 silent waste 卡牌
 */
function isValidSpellTarget(
  selectedCard: CardInstance,
  targetMinion: CardInstance,
): { valid: boolean; reason?: string } {
  for (const e of selectedCard.data.effects ?? []) {
    const isTargeted =
      (e.trigger === 'onCast' && selectedCard.data.type === 'spell') ||
      e.trigger === 'battlecry'
    if (!isTargeted) continue
    const params = (e.params ?? {}) as Record<string, unknown>
    const maxCost = params.maxCost
    if (typeof maxCost === 'number' && targetMinion.data.cost > maxCost) {
      return {
        valid: false,
        reason: `目标费用 ${targetMinion.data.cost}，超过限制（最多 ${maxCost}）`,
      }
    }
  }
  return { valid: true }
}

/** §19.7.13 · 解释为何 minion 不能攻击 · 返回原因文案或 null（可攻击）*/
function whyCannotAttack(m: CardInstance): string | null {
  if (m.currentAttack <= 0) return `${m.data.name} · 攻击力为 0，不能攻击`
  // 沉睡（登场回合无 charge/rush）
  if (m.exhausted && m.summonedThisTurn) {
    return `${m.data.name} · 刚登场，下回合才能攻击`
  }
  // 本回合已攻击过
  if (m.exhausted) return `${m.data.name} · 本回合已攻击过`
  const max = m.currentKeywords.has('windfury') ? 2 : 1
  if (m.attacksThisTurn >= max) {
    return m.currentKeywords.has('windfury')
      ? `${m.data.name} · 风怒已用尽（每回合 2 次）`
      : `${m.data.name} · 本回合已攻击过`
  }
  return null
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
  return whyCannotTargetHero(state, attackerId) === null
}

/**
 * §19.7.11 · 解释为何不能攻击敌方英雄 · 返回原因文案或 null（可攻击）
 * 用于 click 反馈浮起 + 主公 dim 状态判定
 */
function whyCannotTargetHero(
  state: { ai: { board: CardInstance[] }; player: { board: CardInstance[] } },
  attackerId: string,
): string | null {
  if (state.ai.board.some((m) => m.currentKeywords.has('taunt'))) {
    return '敌方有镇守，必须先攻击带镇守的武将'
  }
  if (attackerId !== 'hero_player') {
    const m = state.player.board.find((c) => c.instanceId === attackerId)
    if (
      m &&
      m.currentKeywords.has('rush') &&
      !m.currentKeywords.has('charge') &&
      m.summonedThisTurn
    ) {
      return '突袭 · 登场回合不可攻击英雄'
    }
  }
  return null
}
