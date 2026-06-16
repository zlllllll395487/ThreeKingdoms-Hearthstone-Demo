import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useOnlineStore } from '@/online/onlineStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import { BackButton } from '@/components/BackButton/BackButton'
import type { OnlineFaction } from '@/online/protocol'
import styles from './OnlineLobbyScreen.module.css'

/**
 * 在线对战大厅 · 竖屏 1080×1920（与教程、战斗一致，便于无缝衔接）
 *
 * 流程（里程碑 1）：
 *   选阵营 → 创建房间（得房间码）/ 输码加入 → 两人到齐 → 房主点开始
 *   → 双方进教程页 → 对战页（对战逻辑里程碑 2）
 *
 * 美术：复用 battle_bg_portrait 竖屏背景 + btn_primary（创建）/ btn_secondary（加入）
 * / btn_battle_start（自带「开始对战」金字）三种按钮模板。
 */

const FACTION_META: Record<OnlineFaction, { label: string; card: string; hero: string }> = {
  shu: { label: '蜀', card: 'faction_card_shu.png', hero: '刘备' },
  wu: { label: '吴', card: 'faction_card_wu.png', hero: '孙权' },
}

export function OnlineLobbyScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const navigateWithLoading = useUIStore((s) => s.navigateWithLoading)

  const connPhase = useOnlineStore((s) => s.connPhase)
  const lobbyPhase = useOnlineStore((s) => s.lobbyPhase)
  const errorMsg = useOnlineStore((s) => s.errorMsg)
  const myFaction = useOnlineStore((s) => s.myFaction)
  const mySlot = useOnlineStore((s) => s.mySlot)
  const roomCode = useOnlineStore((s) => s.roomCode)
  const host = useOnlineStore((s) => s.host)
  const guest = useOnlineStore((s) => s.guest)
  const serverUrl = useOnlineStore((s) => s.serverUrl)

  const setMyFaction = useOnlineStore((s) => s.setMyFaction)
  const setServerUrl = useOnlineStore((s) => s.setServerUrl)
  const connect = useOnlineStore((s) => s.connect)
  const createRoom = useOnlineStore((s) => s.createRoom)
  const joinRoom = useOnlineStore((s) => s.joinRoom)
  const startGame = useOnlineStore((s) => s.startGame)
  const reset = useOnlineStore((s) => s.reset)

  // 美术资源
  const bgUrl = getUiAssetUrl('battle_bg_portrait.png')
  const btnPrimaryUrl = getUiAssetUrl('btn_primary.png')
  const btnSecondaryUrl = getUiAssetUrl('btn_secondary.png')
  const btnBattleStartUrl = getUiAssetUrl('btn_battle_start.png')

  // 进屏自动连接服务器；离屏断开重置
  useEffect(() => {
    connect()
    return () => reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 房主点开始 → 服务器广播 gameStarting → 双方 lobbyPhase 变 starting → 衔接教程页
  useEffect(() => {
    if (lobbyPhase === 'starting') {
      navigateWithLoading('tutorial')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyPhase])

  const inRoom = lobbyPhase === 'hosting' || lobbyPhase === 'joined' || lobbyPhase === 'ready'
  const bothReady = lobbyPhase === 'ready'
  const factionLocked = inRoom // 进房后阵营锁定

  // 对手阵营（从 roomState 推导）
  const opponentInfo = mySlot === 'host' ? guest : host
  const myInfo = mySlot === 'host' ? host : guest

  const [codeInput, setCodeInput] = useState('')

  function handleBack() {
    reset()
    navigate('mainmenu')
  }

  const bgStyle = bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined

  return (
    <div className={styles.container} style={bgStyle}>
      <div className={styles.vignette} />

      <BackButton onClick={handleBack} ariaLabel="返回主菜单" className={styles.backBtn}>
        返回
      </BackButton>

      <h1 className={styles.title}>玩家对战</h1>

      {/* 连接状态 */}
      <div className={styles.connRow} data-phase={connPhase}>
        {connPhase === 'connecting' && '正在连接服务器…'}
        {connPhase === 'connected' && '● 已连接'}
        {connPhase === 'error' && '✕ 连接失败'}
        {connPhase === 'idle' && '未连接'}
        {connPhase === 'error' && (
          <button className={styles.retryBtn} onClick={connect}>重试</button>
        )}
      </div>

      {/* 阵营选择 */}
      <div className={styles.sectionLabel}>选择你的阵营</div>
      <div className={styles.factionRow}>
        {(['shu', 'wu'] as OnlineFaction[]).map((f) => {
          const meta = FACTION_META[f]
          const url = getUiAssetUrl(meta.card)
          const selected = myFaction === f
          return (
            <button
              key={f}
              className={`${styles.factionCard} ${selected ? styles.factionSelected : ''}`}
              onClick={() => !factionLocked && setMyFaction(f)}
              disabled={factionLocked}
              aria-label={`选择${meta.label}阵营`}
            >
              {url ? <img src={url} alt={meta.label} /> : <span>{meta.label}</span>}
              <div className={styles.factionName}>{meta.label} · {meta.hero}</div>
              {selected && <div className={styles.factionGlow} />}
            </button>
          )
        })}
      </div>

      {/* 建房 / 加入 区（未进房时显示） */}
      {!inRoom && (
        <div className={styles.actionArea}>
          <button
            className={styles.artBtnPrimary}
            style={btnPrimaryUrl ? { backgroundImage: `url(${btnPrimaryUrl})` } : undefined}
            onClick={createRoom}
            disabled={connPhase !== 'connected'}
          >
            <span className={styles.artBtnTextGold}>创建房间</span>
          </button>

          <div className={styles.orDivider}>— 或 —</div>

          <div className={styles.joinRow}>
            <input
              className={styles.codeInput}
              placeholder="输入房间码"
              maxLength={4}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            />
            <button
              className={styles.artBtnJoin}
              style={btnSecondaryUrl ? { backgroundImage: `url(${btnSecondaryUrl})` } : undefined}
              onClick={() => joinRoom(codeInput)}
              disabled={connPhase !== 'connected'}
            >
              <span className={styles.artBtnTextWood}>加入</span>
            </button>
          </div>
        </div>
      )}

      {/* 房间状态（进房后显示） */}
      {inRoom && (
        <div className={styles.roomArea}>
          <div className={styles.roomCodeLabel}>房间码</div>
          <div className={styles.roomCode}>{roomCode}</div>
          <div className={styles.roomHint}>把房间码发给对手</div>

          <div className={styles.vsRow}>
            <div className={styles.vsSide}>
              <div className={styles.vsWho}>你</div>
              <div className={styles.vsFaction}>
                {myInfo ? FACTION_META[myInfo.faction].label : FACTION_META[myFaction].label}
              </div>
              <div className={styles.vsReady}>✓ 就位</div>
            </div>
            <div className={styles.vsMid}>VS</div>
            <div className={styles.vsSide}>
              <div className={styles.vsWho}>对手</div>
              <div className={styles.vsFaction}>
                {opponentInfo ? FACTION_META[opponentInfo.faction].label : '—'}
              </div>
              <div className={styles.vsReady} data-ready={!!opponentInfo}>
                {opponentInfo ? '✓ 就位' : '等待加入…'}
              </div>
            </div>
          </div>

          {mySlot === 'host' ? (
            bothReady ? (
              // 自带「开始对战」金字双龙
              <button
                className={styles.startBtnArt}
                style={btnBattleStartUrl ? { backgroundImage: `url(${btnBattleStartUrl})` } : undefined}
                onClick={startGame}
                aria-label="开始对战"
              />
            ) : (
              <button
                className={styles.artBtnJoin}
                style={btnSecondaryUrl ? { backgroundImage: `url(${btnSecondaryUrl})` } : undefined}
                disabled
              >
                <span className={styles.artBtnTextWood}>等待对手加入…</span>
              </button>
            )
          ) : (
            <div className={styles.waitHost}>
              {bothReady ? '等待房主开始…' : '等待配对…'}
            </div>
          )}
        </div>
      )}

      {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}

      {/* 高级 · 服务器地址（部署时改 wss://，本地默认 ws://localhost:8787） */}
      <details className={styles.advanced}>
        <summary>服务器地址</summary>
        <div className={styles.advancedRow}>
          <input
            className={styles.serverInput}
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
          />
          <button className={styles.smallBtn} onClick={connect}>重连</button>
        </div>
      </details>
    </div>
  )
}
