/**
 * 三国炉石 · 核心类型定义
 *
 * 这个文件是所有"卡牌 / 对局"概念的源头定义。
 * 配套：03-三国炉石核心玩法策划案-v2.md / 04-三国炉石基础卡牌设计表-v2.md
 */

// ============================================
// 卡牌静态定义（数据驱动，从 JSON 读取）
// ============================================

export type CardType = 'minion' | 'spell' | 'weapon'
export type Faction = 'shu' | 'wei' | 'wu' | 'qun' | 'neutral'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type Tribe = 'infantry' | 'cavalry' | 'strategist'

/** 关键词标识（与 engine/effects/ 下的实现文件对应） */
export type Keyword =
  | 'taunt'           // 镇守
  | 'charge'          // 冲锋
  | 'rush'            // 突袭
  | 'stealth'         // 伏兵
  | 'divineShield'    // 铁壁
  | 'windfury'        // 连斩
  | 'poisonous'       // 淬毒
  | 'lifesteal'       // 饮血
  | 'freeze'          // 困阵

/** 触发时机 */
export type EffectTrigger =
  | 'battlecry'       // 威名（打出时）
  | 'deathrattle'     // 遗志（死亡时）
  | 'endTurn'         // 回合结束时
  | 'startTurn'       // 回合开始时
  | 'onCast'          // 计策施放时（计策牌专用）

/** 单个效果定义 */
export interface CardEffect {
  trigger: EffectTrigger
  /** 实现函数名，对应 engine/effects/actions.ts 里的 key */
  action: string
  /** 传给 action 的参数 */
  params?: Record<string, unknown>
}

/** 卡牌静态数据（一张卡的"定义" / "模板"） */
export interface CardData {
  id: string                  // "S01" / "N02" 等唯一 ID
  name: string                // "关羽"
  cost: number                // 法力费用
  type: CardType
  faction: Faction
  rarity: Rarity

  // 武将专属
  attack?: number
  health?: number
  tribe?: Tribe

  // 兵器专属
  durability?: number

  keywords?: Keyword[]
  effects?: CardEffect[]

  // 视觉与文案
  portrait?: string           // 立绘文件名（指向 src/assets/portraits/xxx.png）
  description: string         // 卡牌效果文本（玩家可见）
  flavor?: string             // 风味文字（小字斜体）
}

// ============================================
// 卡牌运行时实例（同一张卡可能在场上有多个 buff/debuff）
// ============================================

/**
 * 卡牌实例：基于 CardData 派生，但带运行时状态
 * （比如生命值掉血、攻击力被 buff、关键词被沉默移除等）
 */
export interface CardInstance {
  instanceId: string          // 唯一实例 ID（区分两张关羽）
  cardId: string              // 指向 CardData.id
  data: CardData              // 静态数据快照（方便直接读）

  // 当前运行时状态
  currentAttack: number
  currentHealth: number
  maxHealth: number
  currentDurability?: number
  currentKeywords: Set<Keyword>

  // 战场状态标记
  exhausted: boolean          // 召唤失调（本回合不能攻击）
  attacksThisTurn: number
  hasBeenSilenced: boolean
  summonedThisTurn?: boolean  // rush 限制英雄攻击用

  // 阵营归属（场上时记录控制者）
  owner?: 'player' | 'ai'
}

// ============================================
// 对局状态
// ============================================

export interface Hero {
  name: string                // "刘备" / "曹操" 等
  faction: Faction
  health: number
  maxHealth: number
  armor: number
  attack: number              // 装备兵器或临时增加
}

export interface Mana {
  current: number             // 当前可用法力
  max: number                 // 本回合上限
}

export interface PlayerState {
  hero: Hero
  mana: Mana
  hand: CardInstance[]
  deck: CardInstance[]
  board: CardInstance[]
  graveyard: CardInstance[]
  weapon: CardInstance | null
  fatigue: number             // 疲劳计数器
  heroPowerUsed: boolean
}

export type GamePhase = 'mulligan' | 'main' | 'ended'
export type PlayerSide = 'player' | 'ai'

export interface GameState {
  turn: number
  activePlayer: PlayerSide
  phase: GamePhase
  player: PlayerState
  ai: PlayerState
  /** 胜负结果（仅在 phase = 'ended' 时有效） */
  winner?: PlayerSide
}
