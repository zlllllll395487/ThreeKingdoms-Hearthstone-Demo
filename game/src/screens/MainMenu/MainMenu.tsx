import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './MainMenu.module.css'

/**
 * 主菜单 · 商业化 Hub 布局
 *
 * 顶左：玩家头像 + 名称等级
 * 顶右：3 货币图（含背景 + 数字 + 加号都是 PNG 自带）+ 更多按钮
 * 左侧栏：3 圆按钮（邮件 / 日历 / 好友）
 * 中央：留空（背景透出）
 * 右侧：动作卡叠层（剧情模式在最上 + 对战 + 限时活动），背靠议事台底板
 * 左下：桃园活动横幅 + 聊天/世界公告框（聊天图标 + 跑马灯）
 * 底部：5 Tab（卡组 / 任务 / 图鉴 / 商城 / 设置）
 */
export function MainMenu() {
  const navigate = useUIStore((s) => s.navigate)
  const showModal = useUIStore((s) => s.showModal)

  const bgUrl = getUiAssetUrl('menu_background.png')
  const playerUiBlockUrl = getUiAssetUrl('player_ui_block.png')

  const iconMailUrl = getUiAssetUrl('icon_mail.png')
  const iconCalendarUrl = getUiAssetUrl('icon_calendar.png')
  const iconFriendsUrl = getUiAssetUrl('icon_friends.png')
  const iconChatUrl = getUiAssetUrl('icon_chat.png')
  const iconMoreUrl = getUiAssetUrl('icon_more.png')

  const coinSilverUrl = getUiAssetUrl('coin_silver.png')
  const coinJadeUrl = getUiAssetUrl('coin_jade.png')
  const coinGemUrl = getUiAssetUrl('coin_gem.png')

  const cardStoryUrl = getUiAssetUrl('card_story.png')
  const cardBattleUrl = getUiAssetUrl('card_battle.png')
  const cardEventUrl = getUiAssetUrl('card_event.png')
  const panelUrl = getUiAssetUrl('mainmenu_panel.png')

  const bannerEventUrl = getUiAssetUrl('banner_event.png')

  const tabDeckUrl = getUiAssetUrl('tab_deck.png')
  const tabQuestUrl = getUiAssetUrl('tab_quest.png')
  const tabCodexUrl = getUiAssetUrl('tab_codex.png')
  const tabShopUrl = getUiAssetUrl('tab_shop.png')
  const tabSettingsUrl = getUiAssetUrl('tab_settings.png')

  const dev = (label: string) => () => showModal(label)

  return (
    <div className={styles.container}>
      {/* 背景 + 暗角 + 烛光 */}
      <div
        className={styles.background}
        style={
          bgUrl
            ? {
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      />
      <div className={styles.vignette} />
      <div className={styles.candleGlowLeft} />
      <div className={styles.candleGlowRight} />

      <div className={styles.particles}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.particle} />
        ))}
      </div>

      {/* ============ 顶部 · 玩家信息 + 货币 + 更多 ============ */}
      <div className={styles.topBar}>
        <div className={styles.playerBlock}>
          {playerUiBlockUrl && (
            <img
              src={playerUiBlockUrl}
              alt="玩家信息"
              className={styles.playerBlockImg}
            />
          )}
        </div>

        <div className={styles.topRight}>
          <div className={styles.currencyBar}>
            {coinSilverUrl && (
              <img src={coinSilverUrl} alt="银傅" className={styles.currencyImg} />
            )}
            {coinJadeUrl && (
              <img src={coinJadeUrl} alt="玉玦" className={styles.currencyImg} />
            )}
            {coinGemUrl && (
              <img src={coinGemUrl} alt="珠宝" className={styles.currencyImg} />
            )}
          </div>
          <button
            className={styles.moreBtn}
            onClick={dev('更多')}
            aria-label="更多"
          >
            {iconMoreUrl && <img src={iconMoreUrl} alt="" />}
          </button>
        </div>
      </div>

      {/* ============ 左侧栏 · 3 图标 ============ */}
      <div className={styles.sideNav}>
        <SideButton iconUrl={iconMailUrl} onClick={dev('邮件')} badge="3" label="邮件" />
        <SideButton iconUrl={iconCalendarUrl} onClick={dev('每日签到')} label="签到" />
        <SideButton iconUrl={iconFriendsUrl} onClick={dev('好友')} label="好友" />
      </div>

      {/* ============ 右侧动作卡叠层 ============ */}
      <div className={styles.actionStack}>
        {panelUrl && <img src={panelUrl} alt="" className={styles.actionPanel} />}

        {/* 中层：对战主大卡 */}
        <button
          className={styles.cardBattle}
          onClick={() => navigate('battle')}
          aria-label="对战"
        >
          {cardBattleUrl && <img src={cardBattleUrl} alt="对战" />}
        </button>

        {/* 底层：限时活动 */}
        <button
          className={styles.cardEvent}
          onClick={dev('限时活动 · 桃园结义')}
          aria-label="限时活动"
        >
          {cardEventUrl && <img src={cardEventUrl} alt="限时活动" />}
        </button>

        {/* 顶层：剧情模式（z-index 最高，盖在对战之上） */}
        <div
          className={styles.cardStory}
          onClick={dev('剧情模式 · 演义壹之壹')}
          role="button"
        >
          {cardStoryUrl && <img src={cardStoryUrl} alt="剧情模式" />}
        </div>
      </div>

      {/* ============ 左下：桃园活动横幅（单独，缩小） ============ */}
      <div className={styles.bottomLeft}>
        <button
          className={styles.eventBanner}
          onClick={dev('桃园结义限定活动')}
          aria-label="桃园结义"
        >
          {bannerEventUrl && <img src={bannerEventUrl} alt="桃园结义" />}
        </button>
      </div>

      {/* ============ 底部中间：长公告卷轴 ============ */}
      <div className={styles.newsScroll}>
        <button
          className={styles.newsScrollIconBtn}
          onClick={dev('世界聊天')}
          aria-label="世界聊天"
        >
          {iconChatUrl && (
            <img src={iconChatUrl} alt="" className={styles.newsScrollIcon} />
          )}
        </button>
        <div className={styles.newsScrollText}>
          <span className={styles.newsScrollMarquee}>
            【世界】蜀汉招贤纳士中 · 凡有才者皆可请缨 · 新区桃园结义火热开放
          </span>
        </div>
      </div>

      {/* ============ 底部 5 Tab ============ */}
      <div className={styles.tabBar}>
        <button className={styles.tab} onClick={dev('卡组管理')}>
          {tabDeckUrl && <img src={tabDeckUrl} alt="卡组" />}
        </button>
        <button className={styles.tab} onClick={() => navigate('codex')}>
          {tabCodexUrl && <img src={tabCodexUrl} alt="图鉴" />}
        </button>
        <button className={styles.tab} onClick={dev('每日任务')}>
          {tabQuestUrl && <img src={tabQuestUrl} alt="任务" />}
        </button>
        <button className={styles.tab} onClick={dev('商城')}>
          {tabShopUrl && <img src={tabShopUrl} alt="商城" />}
        </button>
        <button className={styles.tab} onClick={dev('设置')}>
          {tabSettingsUrl && <img src={tabSettingsUrl} alt="设置" />}
        </button>
      </div>

      <div className={styles.versionTag}>v0.1.0 · DEMO W1</div>
    </div>
  )
}

// ============================================
// 子组件
// ============================================

interface SideButtonProps {
  iconUrl: string | null
  onClick: () => void
  badge?: string
  label: string
}

function SideButton({ iconUrl, onClick, badge, label }: SideButtonProps) {
  return (
    <button className={styles.sideBtn} onClick={onClick} aria-label={label}>
      {iconUrl && <img src={iconUrl} alt="" />}
      {badge && <span className={styles.sideBtnBadge}>{badge}</span>}
    </button>
  )
}
