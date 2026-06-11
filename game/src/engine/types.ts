/**
 * 三国炉石 · 核心类型定义（v5.5）
 *
 * 配套：docs/09-三国炉石策划终稿-v5.md v5.5 + docs/12-卡牌验收清单-v5.2.md v5.5
 * v5.5 新增字段：anchorTag / anchorRequirement / linkedEffects / comboFlag / nextTurnManaBoost / onceUsedKey
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
  | 'spellpower'      // 神算（法术伤害 +1）

/** 触发时机（v5.5 扩展） */
export type EffectTrigger =
  | 'battlecry'         // 威名（打出时）
  | 'deathrattle'       // 遗志（死亡时）
  | 'endTurn'           // 回合结束时
  | 'startTurn'         // 回合开始时
  | 'onCast'            // 计策施放时（计策牌专用）
  | 'onTakeDamage'      // 受击时（v5.5 新增，黄月英 / 救命）
  | 'weaponAttack'      // 主公用兵器攻击后（v5.5 新增，雌雄双股剑）
  | 'aura'              // 持续光环（v5.5 新增，未来用）

/** v5.5 锚点标签（吴阵营 anchor 系统） */
export type AnchorTag = 'anchor_fire' | 'anchor_draw' | 'anchor_heal'

/** v5.5 卡-卡联动 flag */
export type ComboFlag = 'combo_fire' | 'combo_betrayal'

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

  // ============ v5.5 新增 · 锚点联动系统 ============
  /** 自身是锚点武将（周瑜/鲁肃/大乔） */
  anchorTag?: AnchorTag
  /** 需要这种锚点在场才触发联动效果 */
  anchorRequirement?: AnchorTag
  /** 锚点联动激活时额外执行的效果 */
  linkedEffects?: CardEffect[]

  // ============ v5.5 新增 · 卡-卡联动 combo ============
  /** 打出时设置 combo flag */
  comboFlagSet?: ComboFlag
  /** 检查 flag 才触发联动效果 */
  comboFlagRequirement?: ComboFlag
  /** combo 联动激活时额外执行的效果 */
  comboLinkedEffects?: CardEffect[]

  // ============ v5.5 新增 · 一次性效果限制 ============
  /** 每张每局只触发 1 次的 key（黄月英受击 / 赵云救命） */
  onceUsedKey?: string

  // 视觉与文案
  portrait?: string           // 立绘文件名
  cardvisual?: string         // v5.5 cardvisual 合成版文件名（asset/新增ui组件0605/边框+立绘/）
  description: string         // 卡牌效果文本（玩家可见）
  flavor?: string             // 风味文字（小字斜体）
}

// ============================================
// 卡牌运行时实例（同一张卡可能在场上有多个 buff/debuff）
// ============================================

/**
 * 卡牌实例：基于 CardData 派生，但带运行时状态
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
  frozen?: boolean            // v5.5 冰冻态（W12/W23/W26）
  cannotAttackThisTurn?: boolean  // v5.5 本回合无法攻击（W18 火油 / W26 画地为牢）
  tags?: Set<string>          // §22-iter3 任意标记（如 'oiled' 火油标记）· 为未来 combo 联动卡留接口

  // 阵营归属（场上时记录控制者）
  owner?: 'player' | 'ai'
}

// ============================================
// 对局状态
// ============================================

export interface Hero {
  name: string                // "刘备" / "孙权" 等
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

  // ============ v5.5 新增 ============
  faction: Faction                  // 玩家所选阵营（shu / wu）
  comboFlagsThisTurn: Set<ComboFlag>  // 本回合已激活的 combo flag
  onceUsedKeys: Set<string>         // 已用过的 onceUsedKey（每局生效）
  nextTurnManaBoost: number         // 下回合开始时 mana 临时 +N（屯田 / 暗度陈仓）
  nextTurnDrawBoost: number         // §22-iter2 下回合开始时额外抽 +N 张（W27 谋议）
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
