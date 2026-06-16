/**
 * 在线对战 · 前后端共享的 WebSocket 消息协议
 *
 * 前端（game/src/）与后端（game/server/）都 import 本文件（@/online/protocol），
 * 单一来源保证两端消息结构一致。这是在线对战的「契约层」。
 *
 * 里程碑划分（见 docs/DECISIONS.md D-012）：
 * - 里程碑 0：连通性验证（createRoom / joinRoom / echo）✅
 * - 里程碑 1（当前）：大厅与房间 —— 阵营选择 + 建房/加入 + 配对 + roomState 广播
 * - 里程碑 2（待做）：对战消息 action / stateUpdate / gameOver
 *
 * 设计原则：所有消息都是 JSON。`type` 字段为判别式（discriminated union）。
 */

/** 房间内的两个位置 · host = 建房者，guest = 加入者 */
export type PlayerSlot = 'host' | 'guest'

/** 在线对战支持的阵营（当前仅蜀 / 吴有完整卡池） */
export type OnlineFaction = 'shu' | 'wu'

/** 协议版本 · 前后端不一致时可据此提示用户刷新 */
export const PROTOCOL_VERSION = 2

/** 房间成员信息 · 用于 roomState 广播让双方互相看到对方阵营 */
export interface RoomMemberInfo {
  slot: PlayerSlot
  faction: OnlineFaction
}

// ============================================
// 客户端 → 服务器
// ============================================

export type ClientMessage =
  /** 建房 · 带上自己选的阵营，服务器生成房间码返回 */
  | { type: 'createRoom'; faction: OnlineFaction }
  /** 凭房间码加入 · 带上自己选的阵营 */
  | { type: 'joinRoom'; roomCode: string; faction: OnlineFaction }
  /** 房主点「开始对战」· 两人到齐后触发，双方进入教程 → 对战流程 */
  | { type: 'startGame' }
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
  /** 房间状态广播 · 任一方加入 / 离开 / 改阵营时推送给房间内所有人 */
  | { type: 'roomState'; host: RoomMemberInfo; guest: RoomMemberInfo | null }
  /** 房主已点开始 · 双方进入教程 → 对战流程（里程碑 1 仅作流程跳转信号） */
  | { type: 'gameStarting' }
  /** 对手离开（断线 / 关页） */
  | { type: 'opponentLeft' }
  /** 里程碑 0 连通测试回显 */
  | { type: 'echo'; from: PlayerSlot; text: string }
  /** 错误（房间不存在 / 已满 / 非法消息 / 协议不符等） */
  | { type: 'error'; message: string }
