import { useEffect, useState } from 'react'
import { useUIStore, type Screen } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './TutorialScreen.module.css'

/**
 * 教程屏 · 竖屏 1080×1920
 *
 * 触发：FactionSelect 确认后 + 首次进入 (localStorage `sgls.tutorialSeen`)
 * 末页「开始对战」+ 关闭 / 跳过 → navigate('battle')
 *
 * 资源：
 *   - tutorial_frame_23.png (2:3 弹窗主框)
 *   - tutorial_btn_long_off/on.png (主按钮 · 上一页 / 下一页 / 开始)
 *   - tutorial_btn_short_off/on.png (次按钮 · 跳过)
 */

/**
 * §25 教程触发状态 · 改为内存变量
 * 用户反馈：希望刷新页面后能重看教程（方便测试 + 新用户每次进游戏都有教程提醒）
 * - 当前页面会话内：看完后不再重复弹（避免回到主菜单再次进战斗时重弹）
 * - 浏览器刷新 / 关闭标签：状态重置，下次进入又会弹
 */
let tutorialSeenInSession = false

interface PageContent {
  title: string
  body: Array<{ kind: 'h' | 'p' | 'li'; text: string }>
}

/** 内容拆成 7 页 · 每页 10-14 行 · 充实内容防止留白 · 正式书面语 */
const PAGES: PageContent[] = [
  {
    title: '欢迎',
    body: [
      {
        kind: 'p',
        text: '《三国炉石》为回合制对战卡牌游戏。玩家通过召唤武将、装备兵器、施放谋略，攻击对方主公。主公生命值降至零即告负，胜负由生命值高低决定。',
      },
      { kind: 'h', text: '回合基本流程' },
      { kind: 'li', text: '法力上限提升 1 点（上限 10）' },
      { kind: 'li', text: '抽取 1 张手牌（第 6 回合起改为 2 张）' },
      { kind: 'li', text: '使用手牌：召唤武将、装备兵器或施放谋略' },
      { kind: 'li', text: '攻击：友方武将攻击敌方武将或敌方主公' },
      { kind: 'li', text: '点击「结束回合」进入对方回合' },
    ],
  },
  {
    title: '战场布局',
    body: [
      { kind: 'h', text: '上方区域 · 对手' },
      { kind: 'li', text: '对手主公：含生命值、法力槽与已装备兵器' },
      { kind: 'li', text: '对手手牌：仅显示卡背与数量' },
      { kind: 'li', text: '对手场上武将：可被攻击或谋略选中' },
      { kind: 'h', text: '下方区域 · 己方' },
      { kind: 'li', text: '己方场上武将：可主动发起攻击' },
      { kind: 'li', text: '己方主公：可装备兵器参与战斗' },
      { kind: 'li', text: '己方手牌：完整显示卡面与描述' },
    ],
  },
  {
    title: '操作面板',
    body: [
      { kind: 'h', text: '屏幕右侧' },
      {
        kind: 'li',
        text: '托管：开启后由 AI 代为执行本方回合，可随时取消恢复手动',
      },
      { kind: 'li', text: '结束回合：完成本回合所有操作后点击，进入对方回合' },
      { kind: 'h', text: '屏幕左侧' },
      { kind: 'li', text: '回合记录：查看本局所有出牌与战斗历史' },
      { kind: 'li', text: '退出：放弃本局并返回主菜单' },
    ],
  },
  {
    title: '出牌与施法',
    body: [
      { kind: 'h', text: '选牌操作' },
      { kind: 'li', text: '单击手牌：选中并高亮发光' },
      { kind: 'li', text: '双击手牌：查看完整卡牌描述' },
      { kind: 'li', text: '法力不足时手牌变灰，无法选中' },
      { kind: 'h', text: '打出方式' },
      { kind: 'li', text: '武将卡：选中后点击「出牌区」放置上场' },
      { kind: 'li', text: '兵器卡：选中后点击己方主公完成装备' },
      { kind: 'li', text: '需选目标的谋略：屏幕提示后点击合法单位' },
    ],
  },
  {
    title: '战斗规则',
    body: [
      { kind: 'h', text: '攻击流程' },
      { kind: 'li', text: '点击己方武将选中，再点击敌方目标发起攻击' },
      { kind: 'li', text: '攻击双方同时按攻击力扣除对方生命值' },
      { kind: 'li', text: '武将每回合默认攻击 1 次，攻击后进入疲劳' },
      { kind: 'h', text: '召唤失调' },
      { kind: 'li', text: '本回合刚召唤的武将默认无法攻击' },
      { kind: 'li', text: '具备「突袭」或「冲锋」关键词的武将无此限制' },
      { kind: 'h', text: '卫戍与韬光' },
      { kind: 'li', text: '敌方存在「卫戍」武将时，必须优先攻击该单位' },
      { kind: 'li', text: '处于「韬光」状态的武将无法被选为目标' },
    ],
  },
  {
    title: '法力与发牌',
    body: [
      { kind: 'h', text: '法力系统' },
      { kind: 'li', text: '第 1 回合法力上限 1 点，每回合提升 1 点' },
      { kind: 'li', text: '法力上限最高 10 点，达到后不再增长' },
      { kind: 'li', text: '回合开始时法力补满至当前上限' },
      { kind: 'li', text: '法力消耗等于卡牌左上角费用' },
      { kind: 'h', text: '发牌节奏' },
      { kind: 'li', text: '初始手牌：先手 3 张，后手 4 张' },
      { kind: 'li', text: '第 1-5 回合：每回合开始抽 1 张' },
      { kind: 'li', text: '第 6 回合起：每回合开始抽 2 张' },
      { kind: 'li', text: '手牌上限 10 张，超出部分将被销毁' },
    ],
  },
  {
    title: '蜀阵营 · 速攻流派',
    body: [
      {
        kind: 'p',
        text: '蜀阵营定位为节奏压制型阵营，以低费武将快速建立场面优势，依靠群体增益形成正面强攻。代表主公：刘备。',
      },
      { kind: 'h', text: '核心机制' },
      { kind: 'li', text: '助势：场上每存在一名其他友方武将，触发卡获得 +1/+1' },
      { kind: 'li', text: '突袭 / 冲锋：召唤当回合即可发动攻击' },
      { kind: 'li', text: '兵器体系：主公装备兵器后亲自参与输出' },
      { kind: 'li', text: '低费武将充足，适合多卡铺场抢节奏' },
      { kind: 'h', text: '推荐节奏' },
      { kind: 'li', text: '第 1-4 回合：铺设武将，建立场面优势' },
      { kind: 'li', text: '第 5-7 回合：集中爆发，完成致命一击' },
    ],
  },
  {
    title: '吴阵营 · 谋略流派',
    body: [
      {
        kind: 'p',
        text: '吴阵营定位为资源运营型阵营，以「锚点联动」与谋略串联为核心，通过抽牌与控场实现中后期决胜。代表主公：孙权。',
      },
      { kind: 'h', text: '核心机制' },
      {
        kind: 'li',
        text: '锚点联动：周瑜 / 鲁肃 / 大乔在场时，对应谋略触发额外效果',
      },
      { kind: 'li', text: '卡-卡连击：火油为目标添加标记，天雷可据此叠加伤害' },
      { kind: 'li', text: '韬光：武将隐匿，敌方无法将其选为目标' },
      { kind: 'li', text: '神算：所携法术伤害额外增加 1 点' },
      { kind: 'h', text: '推荐节奏' },
      { kind: 'li', text: '第 1-5 回合：抽牌就位，确保锚点武将上场' },
      { kind: 'li', text: '第 6 回合起：谋略联动爆发，一气压制对手' },
    ],
  },
]

export function TutorialScreen() {
  const navigateWithLoading = useUIStore((s) => s.navigateWithLoading)
  const engine = useGameStore((s) => s.engine)
  const [pageIdx, setPageIdx] = useState(0)

  // 教程屏有两条入口：
  //   - 主菜单「更多」按钮 → engine 为 null，离开时回主菜单
  //   - FactionSelect 确认 → engine 已存在，离开时进战斗
  const cameFromGame = engine !== null
  const returnTarget: Screen = cameFromGame ? 'battle' : 'mainmenu'
  const skipLabel = cameFromGame ? '跳过' : '关闭'
  const lastPageBtnLabel = cameFromGame ? '开始对战' : '返回主菜单'

  const frameUrl = getUiAssetUrl('tutorial_frame_23.png')
  const btnLongOn = getUiAssetUrl('tutorial_btn_long_on.png')
  const btnLongOff = getUiAssetUrl('tutorial_btn_long_off.png')
  const btnShortOn = getUiAssetUrl('tutorial_btn_short_on.png')

  const page = PAGES[pageIdx]
  const isFirst = pageIdx === 0
  const isLast = pageIdx === PAGES.length - 1

  // 键盘 ← → 翻页 + ESC 跳过
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && !isFirst) {
        setPageIdx((i) => i - 1)
      } else if (e.key === 'ArrowRight' && !isLast) {
        setPageIdx((i) => i + 1)
      } else if (e.key === 'Escape') {
        handleSkip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirst, isLast])

  function markSeen() {
    tutorialSeenInSession = true
  }

  /** 跳过 / 末页主按钮：按入口动态决定返回目标 */
  function handleSkip() {
    markSeen()
    navigateWithLoading(returnTarget)
  }

  function handleStart() {
    markSeen()
    navigateWithLoading(returnTarget)
  }

  return (
    <div className={styles.container}>
      <div className={styles.vignette} />

      {/* 跳过按钮 · 右上 */}
      <button
        type="button"
        className={styles.skipBtn}
        onClick={handleSkip}
        aria-label="跳过教程"
      >
        {btnShortOn && (
          <img src={btnShortOn} alt="" aria-hidden className={styles.skipBg} />
        )}
        <span className={styles.skipText}>{skipLabel}</span>
      </button>

      {/* 主弹窗 · 2:3 frame */}
      <div className={styles.modalWrap}>
        {frameUrl && (
          <img
            src={frameUrl}
            alt=""
            aria-hidden
            className={styles.modalFrame}
          />
        )}

        <div className={styles.modalContent}>
          <h1 className={styles.title}>{page.title}</h1>

          <div className={styles.body}>
            {page.body.map((b, i) => {
              if (b.kind === 'h') {
                return (
                  <h2 key={i} className={styles.h}>
                    {b.text}
                  </h2>
                )
              }
              if (b.kind === 'li') {
                return (
                  <p key={i} className={styles.li}>
                    <span className={styles.bullet}>·</span>
                    {b.text}
                  </p>
                )
              }
              return (
                <p key={i} className={styles.p}>
                  {b.text}
                </p>
              )
            })}
          </div>
        </div>
      </div>

      {/* 页码指示 */}
      <div className={styles.dots}>
        {PAGES.map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i === pageIdx ? styles.dotActive : ''}`}
          />
        ))}
      </div>

      {/* 底部按钮组 */}
      <div className={styles.bottomBar}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          data-disabled={isFirst}
          aria-label="上一页"
        >
          {(isFirst ? btnLongOff : btnLongOn) && (
            <img
              src={isFirst ? btnLongOff! : btnLongOn!}
              alt=""
              aria-hidden
              className={styles.navBg}
            />
          )}
          <span className={styles.navText}>上一页</span>
        </button>

        {!isLast ? (
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setPageIdx((i) => Math.min(PAGES.length - 1, i + 1))}
            aria-label="下一页"
          >
            {btnLongOn && (
              <img src={btnLongOn} alt="" aria-hidden className={styles.navBg} />
            )}
            <span className={styles.navText}>下一页</span>
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navStart}`}
            onClick={handleStart}
            aria-label={lastPageBtnLabel}
          >
            {btnLongOn && (
              <img src={btnLongOn} alt="" aria-hidden className={styles.navBg} />
            )}
            <span className={styles.navText}>{lastPageBtnLabel}</span>
          </button>
        )}
      </div>
    </div>
  )
}

/** 检查本会话是否已看过教程 · FactionSelect 确认时调用 · 刷新页面后会重置 */
export function hasSeenTutorial(): boolean {
  return tutorialSeenInSession
}

/** 手动重置 · 立即让下次触发再次弹教程（不需要刷新）*/
export function clearTutorialSeen() {
  tutorialSeenInSession = false
}
