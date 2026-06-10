import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './MainMenu.module.css'

/**
 * 主菜单 · 商业化 Hub 布局
 */
export function MainMenu() {
  const navigate = useUIStore((s) => s.navigate)
  const showModal = useUIStore((s) => s.showModal)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [showResourceModal, setShowResourceModal] = useState(false)

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

  const btnSwitchBgUrl = getUiAssetUrl('btn_switch_bg.png')
  const modalSwitchBgUrl = getUiAssetUrl('modal_switch_bg.png')
  const modalChatUrl = getUiAssetUrl('modal_chat.png')
  const modalResourceUrl = getUiAssetUrl('modal_resource.png')
  const btnBackUrl = getUiAssetUrl('btn_back.png')

  const tabDeckUrl = getUiAssetUrl('tab_deck.png')
  const tabRecruitUrl = getUiAssetUrl('tab_recruit.png')
  const tabQuestUrl = getUiAssetUrl('tab_quest.png')
  const tabShopUrl = getUiAssetUrl('tab_shop.png')
  const tabCodexUrl = getUiAssetUrl('tab_codex.png')

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

      <div className={`${styles.candleGlow} ${styles.candleGlowOilLamp}`} />
      <div className={`${styles.candleGlow} ${styles.candleGlowFarCity}`} />

      <div className={styles.smokeWrap}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.smokeWisp} />
        ))}
      </div>

      <div className={styles.particles}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.particle} />
        ))}
      </div>

      {/* ============ 顶部 · 玩家信息 + 货币 + 更多 ============ */}
      <div className={styles.topBar}>
        <button
          className={styles.playerBlock}
          onClick={() => navigate('accountdetails')}
          aria-label="账号详情"
        >
          {playerUiBlockUrl && (
            <img
              src={playerUiBlockUrl}
              alt="玩家信息"
              className={styles.playerBlockImg}
            />
          )}
        </button>

        <div className={styles.topRight}>
          <div className={styles.currencyBar}>
            {coinSilverUrl && (
              <img
                src={coinSilverUrl}
                alt="银傅"
                className={styles.currencyImg}
                onClick={() => setShowResourceModal(true)}
              />
            )}
            {coinJadeUrl && (
              <img
                src={coinJadeUrl}
                alt="玉玦"
                className={styles.currencyImg}
                onClick={() => setShowResourceModal(true)}
              />
            )}
            {coinGemUrl && (
              <img
                src={coinGemUrl}
                alt="珠宝"
                className={styles.currencyImg}
                onClick={() => setShowResourceModal(true)}
              />
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
        <SideButton iconUrl={iconMailUrl} onClick={() => navigate('mail')} badge="3" label="邮件" />
        <SideButton iconUrl={iconCalendarUrl} onClick={() => navigate('signin')} label="签到" />
        <SideButton iconUrl={iconFriendsUrl} onClick={() => navigate('friends')} label="好友" />
      </div>

      {/* ============ 右侧动作卡叠层（无 war-room 底盘） ============ */}
      <div className={styles.actionStack}>
        {/* 中层：对战主大卡 */}
        <button
          className={styles.cardBattle}
          onClick={() => navigate('factionselect')}
          aria-label="对战"
        >
          {cardBattleUrl && <img src={cardBattleUrl} alt="对战" />}
        </button>

        {/* 底层：限时活动 */}
        <button
          className={styles.cardEvent}
          onClick={() => navigate('event')}
          aria-label="限时活动"
        >
          {cardEventUrl && <img src={cardEventUrl} alt="限时活动" />}
        </button>

        {/* 顶层：剧情模式（z-index 最高，盖在对战之上） */}
        <div
          className={styles.cardStory}
          onClick={() => navigate('storymode')}
          role="button"
        >
          {cardStoryUrl && <img src={cardStoryUrl} alt="剧情模式" />}
        </div>
      </div>

      {/* ============ 左下专属容器：切换背景按钮 + 跑马灯（悬浮） ============ */}
      <div className={styles.bottomLeft}>
        <button
          className={styles.switchBgBtn}
          onClick={() => setShowSwitchModal(true)}
          aria-label="切换背景"
        >
          {btnSwitchBgUrl && <img src={btnSwitchBgUrl} alt="切换背景" />}
        </button>

        <div
          className={styles.newsScroll}
          onClick={() => setShowChatModal((prev) => !prev)}
          role="button"
          tabIndex={0}
          aria-label="打开世界聊天"
        >
          {iconChatUrl && (
            <img src={iconChatUrl} alt="" className={styles.newsScrollIcon} />
          )}
          <div className={styles.newsScrollText}>
            <span className={styles.newsScrollMarquee}>
              【世界】蜀汉招贤纳士中 · 凡有才者皆可请缨 · 新区桃园结义火热开放
            </span>
          </div>
        </div>
      </div>

      {/* ============ 右下 5 Tab（悬浮，紧凑 Button Group） ============ */}
      <div className={styles.tabBar}>
        <button className={styles.tab} onClick={() => navigate('decks')} aria-label="卡组">
          {tabDeckUrl && <img src={tabDeckUrl} alt="卡组" />}
        </button>
        <button className={styles.tab} onClick={() => navigate('recruit')} aria-label="招募">
          {tabRecruitUrl && <img src={tabRecruitUrl} alt="招募" />}
        </button>
        <button className={styles.tab} onClick={() => navigate('quest')} aria-label="任务">
          {tabQuestUrl && <img src={tabQuestUrl} alt="任务" />}
        </button>
        <button className={styles.tab} onClick={() => navigate('shop')} aria-label="商城">
          {tabShopUrl && <img src={tabShopUrl} alt="商城" />}
        </button>
        <button className={styles.tab} onClick={() => navigate('codex')} aria-label="图鉴">
          {tabCodexUrl && <img src={tabCodexUrl} alt="图鉴" />}
        </button>
      </div>

      <div className={styles.versionTag}>v0.1.0 · DEMO W1</div>

      {/* 切换背景模态 · 全屏图片 + 返回按钮 */}
      {showSwitchModal && (
        <div className={styles.switchModalOverlay}>
          {modalSwitchBgUrl && (
            <img
              src={modalSwitchBgUrl}
              alt="切换页面"
              className={styles.switchModalImg}
            />
          )}
          <BackButton
            onClick={() => setShowSwitchModal(false)}
            className={styles.switchModalBack}
            ariaLabel="关闭"
          >
            关闭
          </BackButton>
        </div>
      )}

      {/* 聊天扩展面板 · 左下角浮窗（非全屏，参考真实游戏聊天 widget） */}
      {showChatModal && modalChatUrl && (
        <div className={styles.chatModalPanel}>
          <img src={modalChatUrl} alt="世界聊天" />
        </div>
      )}

      {/* 资源详情模态 · 居中浮窗，点击右上 X 关闭 */}
      {showResourceModal && modalResourceUrl && (
        <div
          className={styles.resourceModalOverlay}
          onClick={() => setShowResourceModal(false)}
        >
          <div
            className={styles.resourceModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={modalResourceUrl} alt="资源详情" />
            <button
              className={styles.resourceModalClose}
              onClick={() => setShowResourceModal(false)}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        </div>
      )}
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
