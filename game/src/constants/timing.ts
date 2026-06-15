/**
 * 动画与延时常量
 *
 * 集中维护项目中常用的 setTimeout 时长，避免散落的 magic number。
 * 后续重构时可逐步替换源文件中的 hard-code 值，避免一次性大面积改动。
 */

export const ANIMATION_TIMING = {
  /** 卡牌双击窗口 */
  CARD_DOUBLE_CLICK_WINDOW_MS: 300,

  /** AI 出牌 / 攻击两次行动之间的间隔 */
  AI_ACTION_INTERVAL_MS: 700,

  /** AI 回合开始前的等待 */
  AI_TURN_START_DELAY_MS: 800,

  /** AI 回合结束前的等待 */
  AI_TURN_END_DELAY_MS: 600,

  /** 法术施法发光持续时间 */
  SPELL_CASTING_GLOW_MS: 600,

  /** 受击震动持续时间 */
  HIT_SHAKE_MS: 200,

  /** HP delta 浮字停留时间 */
  HP_DELTA_FLOAT_MS: 1500,

  /** 冲锋前摆位移持续时间 */
  CHARGE_OUT_MS: 200,

  /** 冲锋归位位移持续时间 */
  CHARGE_BACK_MS: 200,
} as const

export type AnimationTimingKey = keyof typeof ANIMATION_TIMING
