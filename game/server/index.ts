/**
 * 在线对战后端 · 里程碑 0「连通性验证」
 *
 * 目标：用最小代价验证「内网穿透 + WebSocket + 房间系统 + 引擎可在 Node 加载」
 * 这条后端链路通不通。验证通过后再往上堆对战逻辑（里程碑 1+）。
 *
 * 运行（在 game/ 目录下）：
 *   npx tsx --tsconfig=./tsconfig.app.json server/index.ts
 * 或用 package.json 脚本：
 *   npm run server          # 单次运行
 *   npm run server:watch    # 改动自动重启
 *
 * 复用引擎：通过 tsconfig.app.json 的 @/ 别名 import game/src/ 下的引擎，
 * 与 scripts/sim/ 在 Node 跑引擎同理，引擎代码零改动。
 */

import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { networkInterfaces } from 'node:os'
import type { ClientMessage, ServerMessage, PlayerSlot, OnlineFaction, GameAction } from '@/online/protocol'
import { PROTOCOL_VERSION } from '@/online/protocol'

// ── 引擎（在线对战权威裁判，与前端共用同一份）──
import { GameEngine } from '@/engine/index'
import type { TargetRef } from '@/engine/index'
import { getAllCardsIncludingTokens } from '@/data/cardLibrary'
import { getDeckByFaction } from '@/data/decks'
import { serializeState } from '@/online/stateCodec'
import { sanitizeStateFor } from './sanitize'
import type { Hero, PlayerSide } from '@/engine/types'

const PORT = Number(process.env.PORT) || 8787
const __dirname = dirname(fileURLToPath(import.meta.url))

/** 取本机局域网 IPv4（手机同 WiFi 时用这个地址连） */
function getLanIP(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return 'localhost'
}

// ============================================
// 房间系统（最小）
// ============================================

interface Room {
  code: string
  host: WebSocket
  guest: WebSocket | null
  hostFaction: OnlineFaction
  guestFaction: OnlineFaction | null
  /** 里程碑 2 · 房间的权威对战引擎（开局后创建，host=player 侧 / guest=ai 侧） */
  engine: GameEngine | null
}

const rooms = new Map<string, Room>()

// ── 开局工具 · 复用 gameStore.startGame 的 createGame 写法 ──
const HERO_BY_FACTION: Record<OnlineFaction, { name: string; faction: OnlineFaction }> = {
  shu: { name: '刘备', faction: 'shu' },
  wu: { name: '孙权', faction: 'wu' },
}
function makeHero(faction: OnlineFaction): Hero {
  return { ...HERO_BY_FACTION[faction], health: 30, maxHealth: 30, armor: 0, attack: 0 }
}
/** host → player 侧，guest → ai 侧（与 sanitizeStateFor 的视角约定一致） */
function createMatchEngine(hostFaction: OnlineFaction, guestFaction: OnlineFaction): GameEngine {
  return GameEngine.createGame({
    cardPool: getAllCardsIncludingTokens(),
    playerHero: makeHero(hostFaction),
    aiHero: makeHero(guestFaction),
    deckSize: 30,
    initialHand: { player: 3, ai: 4 },
    playerDeckCardIds: getDeckByFaction(hostFaction),
    aiDeckCardIds: getDeckByFaction(guestFaction),
  })
}
/** 给房间内两人各发个性化脱敏状态（每人都看到自己在 player 侧、对手 ai 侧脱敏） */
function sendMatchState(room: Room): void {
  if (!room.engine) return
  send(room.host, {
    type: 'matchState',
    state: serializeState(sanitizeStateFor(room.engine.state, 'player')),
    yourSide: 'player',
  })
  if (room.guest) {
    send(room.guest, {
      type: 'matchState',
      state: serializeState(sanitizeStateFor(room.engine.state, 'ai')),
      yourSide: 'player',
    })
  }
}

// ── 里程碑 2b · 动作意图坐标翻转（客户端自身视角 → 权威坐标）──
//
// 客户端永远把自己当 player、对手当 ai 表达坐标。
// realSide 是发送者在权威引擎里的真实侧（host→player / guest→ai）。
//   realSide==='player'：客户端视角与权威一致，不翻转
//   realSide==='ai'   ：客户端 'player' ↔ 权威 'ai'，'ai' ↔ 权威 'player'

/** 把客户端视角的某一侧映射回权威侧 */
function flipSide(realSide: PlayerSide, viewSide: PlayerSide): PlayerSide {
  if (realSide === 'player') return viewSide
  return viewSide === 'player' ? 'ai' : 'player'
}

/** 翻转目标的 side（instanceId 为场上 / 主公引用，两端一致，不变） */
function flipTarget(realSide: PlayerSide, target: TargetRef): TargetRef {
  return { ...target, side: flipSide(realSide, target.side) }
}

/** 翻转攻击者 id：主公 'hero_player' / 'hero_ai' 需按视角换侧；场上 minion instanceId 不变 */
function flipAttackerId(realSide: PlayerSide, id: string): string {
  if (id === 'hero_player') return `hero_${flipSide(realSide, 'player')}`
  if (id === 'hero_ai') return `hero_${flipSide(realSide, 'ai')}`
  return id
}

/** 在权威引擎上执行一个动作（坐标已按发送者真实侧翻转）· 非法动作引擎内部自会 no-op */
function applyAction(engine: GameEngine, realSide: PlayerSide, action: GameAction): void {
  switch (action.kind) {
    case 'playCard': {
      const target = action.target ? flipTarget(realSide, action.target) : undefined
      engine.playCard(realSide, action.instanceId, target)
      break
    }
    case 'attack': {
      engine.attack(
        realSide,
        flipAttackerId(realSide, action.attackerId),
        flipTarget(realSide, action.target),
      )
      break
    }
    case 'endTurn': {
      engine.endTurn()
      break
    }
  }
}

/** 广播房间状态给房间内所有人 · 让双方互相看到对方阵营与是否就位 */
function broadcastRoomState(room: Room): void {
  const msg: ServerMessage = {
    type: 'roomState',
    host: { slot: 'host', faction: room.hostFaction },
    guest: room.guest && room.guestFaction
      ? { slot: 'guest', faction: room.guestFaction }
      : null,
  }
  send(room.host, msg)
  if (room.guest) send(room.guest, msg)
}

/** 生成 4 位大写字母 + 数字房间码，去掉易混淆字符（0/O/1/I/L） */
function genRoomCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  do {
    code = ''
    for (let i = 0; i < 4; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
  } while (rooms.has(code))
  return code
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function broadcast(room: Room, msg: ServerMessage): void {
  send(room.host, msg)
  if (room.guest) send(room.guest, msg)
}

// ============================================
// 启动
// ============================================

// 引擎自检 · import 不报错且数据可读 = 引擎链路在 Node 通
const cardCount = getAllCardsIncludingTokens().length
console.log(`[server] 引擎模块加载成功：GameEngine=${typeof GameEngine}，卡池 ${cardCount} 张`)

// HTTP 服务 · 托管测试页（手机同 WiFi 直接访问，零配置）
const TEST_CLIENT = join(__dirname, 'test-client.html')
const httpServer = createServer((req, res) => {
  if (req.url === '/' || req.url === '/test-client.html') {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(readFileSync(TEST_CLIENT, 'utf8'))
    } catch {
      res.writeHead(404)
      res.end('test-client.html not found')
    }
  } else {
    res.writeHead(404)
    res.end('not found')
  }
})

// WebSocket 挂在同一个 HTTP 服务上 · 一个端口搞定页面 + 实时通信
const wss = new WebSocketServer({ server: httpServer })

const lan = getLanIP()
httpServer.listen(PORT, () => {
  console.log(`[server] 测试页（本机）   http://localhost:${PORT}`)
  console.log(`[server] 测试页（同 WiFi）http://${lan}:${PORT}  ← 手机连这个`)
  console.log(`[server] 内网穿透（跨网络）ngrok http ${PORT}，把公网地址发给对手`)
})

wss.on('connection', (ws) => {
  let myRoom: Room | null = null
  let mySlot: PlayerSlot | null = null

  ws.on('message', (data) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(data.toString()) as ClientMessage
    } catch {
      send(ws, { type: 'error', message: '消息不是合法 JSON' })
      return
    }

    switch (msg.type) {
      case 'createRoom': {
        const code = genRoomCode()
        const room: Room = { code, host: ws, guest: null, hostFaction: msg.faction, guestFaction: null, engine: null }
        rooms.set(code, room)
        myRoom = room
        mySlot = 'host'
        send(ws, { type: 'roomCreated', roomCode: code, yourSlot: 'host', protocolVersion: PROTOCOL_VERSION })
        broadcastRoomState(room)
        console.log(`[server] 建房 ${code}（${msg.faction}，当前房间数 ${rooms.size}）`)
        break
      }

      case 'joinRoom': {
        const room = rooms.get(msg.roomCode?.toUpperCase?.() ?? '')
        if (!room) {
          send(ws, { type: 'error', message: `房间 ${msg.roomCode} 不存在` })
          return
        }
        if (room.guest) {
          send(ws, { type: 'error', message: '房间已满' })
          return
        }
        room.guest = ws
        room.guestFaction = msg.faction
        myRoom = room
        mySlot = 'guest'
        send(ws, { type: 'joinedRoom', roomCode: room.code, yourSlot: 'guest', protocolVersion: PROTOCOL_VERSION })
        broadcastRoomState(room)
        console.log(`[server] guest 加入 ${room.code}（${msg.faction}）`)
        break
      }

      case 'startGame': {
        if (!myRoom || mySlot !== 'host') {
          send(ws, { type: 'error', message: '只有房主可以开始对战' })
          return
        }
        if (!myRoom.guest || !myRoom.guestFaction) {
          send(ws, { type: 'error', message: '对手尚未加入' })
          return
        }
        // 里程碑 2a · 服务器开局：创建权威引擎，给两人各发个性化脱敏初始状态
        myRoom.engine = createMatchEngine(myRoom.hostFaction, myRoom.guestFaction)
        broadcast(myRoom, { type: 'gameStarting' })
        sendMatchState(myRoom)
        console.log(`[server] 房间 ${myRoom.code} 开局（${myRoom.hostFaction} vs ${myRoom.guestFaction}）`)
        break
      }

      case 'action': {
        if (!myRoom || !mySlot || !myRoom.engine) {
          send(ws, { type: 'error', message: '当前不在对局中' })
          return
        }
        const realSide: PlayerSide = mySlot === 'host' ? 'player' : 'ai'
        // 回合归属校验 · 只有当前行动方能出动作（防作弊 / 防越权）
        if (myRoom.engine.state.activePlayer !== realSide) {
          send(ws, { type: 'error', message: '现在不是你的回合' })
          return
        }
        applyAction(myRoom.engine, realSide, msg.action)
        // 执行后给两人各重发个性化脱敏状态（含胜负 winner / phase，前端据此进结算）
        sendMatchState(myRoom)
        break
      }

      case 'echo': {
        if (!myRoom || !mySlot) {
          send(ws, { type: 'error', message: '尚未加入任何房间' })
          return
        }
        broadcast(myRoom, { type: 'echo', from: mySlot, text: msg.text })
        break
      }

      default: {
        send(ws, { type: 'error', message: `未知消息类型` })
      }
    }
  })

  ws.on('close', () => {
    if (!myRoom) return
    const other = mySlot === 'host' ? myRoom.guest : myRoom.host
    if (other) send(other, { type: 'opponentLeft' })
    rooms.delete(myRoom.code)
    console.log(`[server] ${mySlot} 离开 ${myRoom.code}，房间关闭（当前房间数 ${rooms.size}）`)
  })
})
