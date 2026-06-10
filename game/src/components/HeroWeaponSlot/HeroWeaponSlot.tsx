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
      {/* 数字：左下攻击 + 右下耐久 */}
      <div className={styles.attack}>{att}</div>
      <div className={styles.durability}>{dur}</div>
    </div>
  )
}
