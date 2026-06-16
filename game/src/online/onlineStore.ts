/**
 * 在线对战 · 前端 WebSocket 状态（Zustand）
 *
 * 与 gameStore 解耦：onlineStore 只负责「连接服务器 + 房间大厅状态」。
 * 里程碑 2 真正对战时，再由 onlineStore 转发动作 / 接收脱敏状态喂给 gameStore。
 *
 * 服务器地址可配置（本地默认 ws://localhost:8787；部署时改 wss://），记到 localStorage。
 */

import { create } from 'zustand'
import type {
  ClientMessage,
  ServerMessage,
  OnlineFaction,
  PlayerSlot,
  RoomMemberInfo,
} from './protocol'
import { deserializeState } from './stateCodec'
import { useGameStore, registerOnlineActionSender } from '@/store/gameStore'

const LS_SERVER_URL = 'sgls.online.serverUrl'

function loadServerUrl(): string {
  try {
    return localStorage.getItem(LS_SERVER_URL) || defaultServerUrl()
  } catch {
    return defaultServerUrl()
  }
}

/** 默认服务器地址 · 本地开发用当前主机的 8787 端口 */
function defaultServerUrl(): string {
  if (typeof location !== 'undefined' && location.hostname && location.hostname !== 'localhost') {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://'
    return `${proto}${location.hostname}:8787`
  }
  return 'ws://localhost:8787'
}

export type ConnPhase = 'idle' | 'connecting' | 'connected' | 'error'
/** 大厅阶段：选阵营 → 已建房等待 / 已加入 → 双方就位 → 开始 */
export type LobbyPhase = 'choosing' | 'hosting' | 'joined' | 'ready' | 'starting'

interface OnlineState {
  serverUrl: string
  setServerUrl: (url: string) => void

  connPhase: ConnPhase
  lobbyPhase: LobbyPhase
  errorMsg: string | null

  myFaction: OnlineFaction
  setMyFaction: (f: OnlineFaction) => void

  mySlot: PlayerSlot | null
  roomCode: string | null
  /** 双方成员（含阵营），来自服务器 roomState 广播 */
  host: RoomMemberInfo | null
  guest: RoomMemberInfo | null

  /** 对手是否已就位（两人都在房间） */
  opponentReady: boolean

  /** 里程碑 2 · 是否已进入对局（收到 matchState 后置 true，教程后据此进 battle 而非 mainmenu） */
  inMatch: boolean

  connect: () => void
  disconnect: () => void
  createRoom: () => void
  joinRoom: (code: string) => void
  startGame: () => void
  reset: () => void
}

let ws: WebSocket | null = null

export const useOnlineStore = create<OnlineState>((set, get) => ({
  serverUrl: loadServerUrl(),
  setServerUrl: (url) => {
    try {
      localStorage.setItem(LS_SERVER_URL, url)
    } catch {
      // localStorage 不可用 · 静默
    }
    set({ serverUrl: url })
  },

  connPhase: 'idle',
  lobbyPhase: 'choosing',
  errorMsg: null,

  myFaction: 'shu',
  setMyFaction: (f) => set({ myFaction: f }),

  mySlot: null,
  roomCode: null,
  host: null,
  guest: null,
  opponentReady: false,
  inMatch: false,

  connect: () => {
    const { serverUrl } = get()
    if (ws) {
      try {
        ws.close()
      } catch {
        // ignore
      }
    }
    set({ connPhase: 'connecting', errorMsg: null })
    try {
      ws = new WebSocket(serverUrl)
    } catch {
      // 连接类错误只更新 connPhase（顶部状态行显示「✕ 连接失败 [重试]」），不弹长提示框
      set({ connPhase: 'error' })
      return
    }

    ws.onopen = () => set({ connPhase: 'connected', errorMsg: null })
    ws.onclose = () => set({ connPhase: 'idle' })
    ws.onerror = () => set({ connPhase: 'error' })
    ws.onmessage = (e) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(e.data) as ServerMessage
      } catch {
        return
      }
      handleServerMessage(msg, set, get)
    }
  },

  disconnect: () => {
    if (ws) {
      try {
        ws.close()
      } catch {
        // ignore
      }
      ws = null
    }
    set({ connPhase: 'idle' })
  },

  createRoom: () => {
    const { myFaction } = get()
    sendMsg({ type: 'createRoom', faction: myFaction })
  },

  joinRoom: (code) => {
    const { myFaction } = get()
    const clean = code.trim().toUpperCase()
    if (!clean) {
      set({ errorMsg: '请输入房间码' })
      return
    }
    sendMsg({ type: 'joinRoom', roomCode: clean, faction: myFaction })
  },

  startGame: () => sendMsg({ type: 'startGame' }),

  reset: () => {
    if (ws) {
      try {
        ws.close()
      } catch {
        // ignore
      }
      ws = null
    }
    set({
      connPhase: 'idle',
      lobbyPhase: 'choosing',
      errorMsg: null,
      mySlot: null,
      roomCode: null,
      host: null,
      guest: null,
      opponentReady: false,
      inMatch: false,
    })
  },
}))

function sendMsg(msg: ClientMessage): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

// 里程碑 2b · 把「发动作意图给服务器」的能力注入 gameStore（避免 gameStore 反向依赖 onlineStore）。
// gameStore 在线模式下的玩家动作经此发往权威服务器，服务器裁决后回推 matchState。
registerOnlineActionSender((action) => sendMsg({ type: 'action', action }))

function handleServerMessage(
  msg: ServerMessage,
  set: (partial: Partial<OnlineState>) => void,
  get: () => OnlineState,
): void {
  switch (msg.type) {
    case 'roomCreated':
      set({ mySlot: msg.yourSlot, roomCode: msg.roomCode, lobbyPhase: 'hosting', errorMsg: null })
      break
    case 'joinedRoom':
      set({ mySlot: msg.yourSlot, roomCode: msg.roomCode, lobbyPhase: 'joined', errorMsg: null })
      break
    case 'roomState': {
      const bothPresent = !!msg.guest
      set({
        host: msg.host,
        guest: msg.guest,
        opponentReady: bothPresent,
        lobbyPhase: bothPresent ? 'ready' : get().lobbyPhase,
      })
      break
    }
    case 'gameStarting':
      set({ lobbyPhase: 'starting' })
      break
    case 'matchState': {
      // 里程碑 2a · 收到个性化脱敏状态 → 反序列化灌入 gameStore（在线模式）
      const state = deserializeState(msg.state)
      set({ inMatch: true })
      useGameStore.getState().applyServerMatchState(state)
      break
    }
    case 'opponentLeft':
      set({ opponentReady: false, guest: null, errorMsg: '对手离开了房间' })
      break
    case 'error':
      set({ errorMsg: msg.message })
      break
    case 'echo':
      // 里程碑 1 大厅不用 echo
      break
  }
}
