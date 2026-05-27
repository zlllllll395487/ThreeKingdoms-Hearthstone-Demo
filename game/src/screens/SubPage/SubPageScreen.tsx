import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './SubPageScreen.module.css'
import type { Screen } from '@/store/uiStore'

/**
 * 通用子页面 · 全屏 PNG 背景 + 左上角返回按钮
 *
 * 用于：剧情模式 / 任务 / 商城 / 设置 / 限定活动
 * 每个子页面单纯展示对应的 PNG，点返回回主菜单。
 */

const SUBPAGE_BG: Partial<Record<Screen, string>> = {
  storymode: 'subpage_story.png',
  quest: 'subpage_quest.png',
  shop: 'subpage_shop.png',
  settings: 'subpage_settings.png',
  event: 'subpage_event.png',
}

interface SubPageScreenProps {
  screen: Screen
}

export function SubPageScreen({ screen }: SubPageScreenProps) {
  const navigate = useUIStore((s) => s.navigate)
  const bgFile = SUBPAGE_BG[screen]
  const bgUrl = bgFile ? getUiAssetUrl(bgFile) : null
  const btnBackUrl = getUiAssetUrl('btn_back.png')

  return (
    <div className={styles.container}>
      {bgUrl && <img src={bgUrl} alt="" className={styles.bg} />}

      {/* 左上角返回按钮 */}
      <button
        className={styles.backBtn}
        onClick={() => navigate('mainmenu')}
        aria-label="返回主菜单"
      >
        {btnBackUrl ? (
          <img src={btnBackUrl} alt="返回" />
        ) : (
          <span>‹ 返回</span>
        )}
      </button>
    </div>
  )
}
