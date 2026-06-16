/**
 * 在线对战 · 前后端共享的 WebSocket 消息协议
 *
 * 前端（game/src/）与后端（game/server/）都 import 本文件（@/online/protocol），
 * 单一来源保证两端消息结构一致。这是在线对战的「契约层」。
 *
 * 里程碑划分（见 docs/DECISIONS.md，规划中）：
 * - 里程碑 0（当前）：连通性验证消息 createRoom / joinRoom / echo
 * - 里程碑 2（待做）：对战消息 action / stateUpdate / gameStart / gameOver
 *
 * 设计原则：所有消息都是 JSON。`type` 字段为判别式（discriminated union）。
 */

/** 房间内的两个位置 · host = 建房者，guest = 加入者 */
export type PlayerSlot = 'host' | 'guest'

/** 协议版本 · 前后端不一致时可据此提示用户刷新 */
export const PROTOCOL_VERSION = 1

// ============================================
// 客户端 → 服务器
// ============================================

export type ClientMessage =
  /** 建房 · 服务器生成房间码返回 */
  | { type: 'createRoom' }
  /** 凭房间码加入 */
  | { type: 'joinRoom'; roomCode: string }
  /** 里程碑 0 连通测试 · 把文本广播给房间内两人 */
  | { type: 'echo'; text: string }

// ============================================
// 服务器 → 客户端
// ============================================

export type ServerMessage =
  /** 建房成功 · 返回房间码与本端位置 */
  | { type: 'roomCreated'; roomCode: string; yourSlot: PlayerSlot; protocolVersion: number }
  /** 加入成功 */
  | { type: 'joinedRoom'; roomCode: string; yourSlot: PlayerSlot; protocolVersion: number }
  /** 对手已加入（发给 host） */
  | { type: 'opponentJoined' }
  /** 对手离开（断线 / 关页） */
  | { type: 'opponentLeft' }
  /** 里程碑 0 连通测试回显 */
  | { type: 'echo'; from: PlayerSlot; text: string }
  /** 错误（房间不存在 / 已满 / 非法消息等） */
  | { type: 'error'; message: string }
