import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import { BackButton } from '@/components/BackButton/BackButton'
import styles from './SubPageScreen.module.css'
import type { Screen } from '@/store/uiStore'

/**
 * 通用子页面 · 全屏 PNG 背景 + 左上角返回按钮
 *
 * 用于：剧情模式 / 任务 / 商城 / 限定活动
 * 每个子页面单纯展示对应的 PNG，点返回回主菜单。
 */

const SUBPAGE_BG: Partial<Record<Screen, string>> = {
  storymode: 'subpage_story.png',
  quest: 'subpage_quest.png',
  shop: 'subpage_shop.png',
  event: 'subpage_event.png',
  recruit: 'subpage_recruit.png',
  decks: 'subpage_decks.png',
  serverselect: 'subpage_serverselect.png',
  account: 'subpage_account.png',
  accountdetails: 'subpage_accountdetails.png',
  mail: 'subpage_mail.png',
  signin: 'subpage_signin.png',
  friends: 'subpage_friends.png',
  news: 'subpage_news.png',
}

/** 子页面返回目标 · 优先用 previousScreen，没有则按映射，最后兜底 mainmenu */
const SUBPAGE_BACK_DEFAULT: Partial<Record<Screen, Screen>> = {
  serverselect: 'splash',
}

interface SubPageScreenProps {
  screen: Screen
}

export function SubPageScreen({ screen }: SubPageScreenProps) {
  const navigate = useUIStore((s) => s.navigate)
  const previousScreen = useUIStore((s) => s.previousScreen)
  const bgFile = SUBPAGE_BG[screen]
  const bgUrl = bgFile ? getUiAssetUrl(bgFile) : null
  const btnBackUrl = getUiAssetUrl('btn_back.png')
  // 优先返回上一屏；如无则按映射；最后兜底 mainmenu
  const backTarget: Screen =
    previousScreen ?? SUBPAGE_BACK_DEFAULT[screen] ?? 'mainmenu'

  return (
    <div className={styles.container}>
      {bgUrl && <img src={bgUrl} alt="" className={styles.bg} />}

      {/* 左上角返回按钮 */}
      <BackButton
        onClick={() => navigate(backTarget)}
        className={styles.backBtn}
      >
        返回
      </BackButton>
    </div>
  )
}
