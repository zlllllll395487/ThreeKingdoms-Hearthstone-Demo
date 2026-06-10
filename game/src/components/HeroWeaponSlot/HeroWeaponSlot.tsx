/**
 * §19.5 主公装备武器槽 · 椭圆 clip-path + 立绘 + 描金 frame
 *
 * plan §2.3 三态视觉系统 · 装备阶段：
 *   立绘填满椭圆区域（object-fit: cover + clip-path: ellipse）
 *   外层叠 frame_weapon_slot.png 装饰描金椭圆
 *   攻击 / 耐久数字 angle 角落
 *
 * 挂载位置：HeroDisplay 子组件，绝对定位在主公头像旁
 */

import type { CardInstance } from '@/engine/types'
import { getPortraitUrl, getUiAssetUrl } from '@/data/assetLoader'
import styles from './HeroWeaponSlot.module.css'

interface Props {
  weapon: CardInstance
}

export function HeroWeaponSlot({ weapon }: Props) {
  const portraitUrl = getPortraitUrl(weapon.data.portrait)
  const frameUrl = getUiAssetUrl('frame_weapon_slot.png')
  const att = weapon.currentAttack
  const dur = weapon.currentDurability ?? 0
  // 攻击力：复用卡牌左上角的蓝色费用宝石（cost_X.png）· 1-10 烫好数字
  const attackGemUrl = getUiAssetUrl(
    `cost_${Math.max(1, Math.min(10, att))}.png`,
  )
  // 耐久：复用主公 HP 底座 + 动态文字
  const hpBaseUrl = getUiAssetUrl('ui_hp_base.png')

  return (
    <div className={styles.slot} title={weapon.data.name}>
      {/* 底层：立绘 · 椭圆裁切 · object-fit cover 填满 */}
      {portraitUrl && (
        <img
          src={portraitUrl}
          alt={weapon.data.name}
          className={styles.portrait}
        />
      )}
      {/* 顶层：装饰 frame · 透明 PNG */}
      {frameUrl && (
        <img
          src={frameUrl}
          alt=""
          aria-hidden
          className={styles.frame}
        />
      )}
      {/* 攻击力 · 左下蓝色费用宝石（复用 cost gem） */}
      {attackGemUrl && (
        <img
          src={attackGemUrl}
          alt=""
          aria-hidden
          className={styles.attackGem}
        />
      )}
      {/* 耐久 · 右下主公 HP 底座 + 数字 */}
      <div
        className={styles.durabilityBadge}
        style={hpBaseUrl ? { backgroundImage: `url(${hpBaseUrl})` } : undefined}
      >
        <span>{dur}</span>
      </div>
    </div>
  )
}
