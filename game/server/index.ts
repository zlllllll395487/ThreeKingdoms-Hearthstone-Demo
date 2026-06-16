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
import type { ClientMessage, ServerMessage, PlayerSlot } from '@/online/protocol'
import { PROTOCOL_VERSION } from '@/online/protocol'

// ── 引擎加载验证 ── 证明引擎与卡牌数据能在 Node 环境加载 ──
import { GameEngine } from '@/engine/index'
import { getAllCardsIncludingTokens } from '@/data/cardLibrary'

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
}

const rooms = new Map<string, Room>()

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
        const room: Room = { code, host: ws, guest: null }
        rooms.set(code, room)
        myRoom = room
        mySlot = 'host'
        send(ws, { type: 'roomCreated', roomCode: code, yourSlot: 'host', protocolVersion: PROTOCOL_VERSION })
        console.log(`[server] 建房 ${code}（当前房间数 ${rooms.size}）`)
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
        myRoom = room
        mySlot = 'guest'
        send(ws, { type: 'joinedRoom', roomCode: room.code, yourSlot: 'guest', protocolVersion: PROTOCOL_VERSION })
        send(room.host, { type: 'opponentJoined' })
        console.log(`[server] guest 加入 ${room.code}`)
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
