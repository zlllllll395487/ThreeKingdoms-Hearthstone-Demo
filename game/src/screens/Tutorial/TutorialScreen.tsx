import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
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

const LS_TUTORIAL_SEEN_KEY = 'sgls.tutorialSeen'

interface PageContent {
  title: string
  body: Array<{ kind: 'h' | 'p' | 'li'; text: string }>
}

/** 内容拆成 8 页 · 每页 ≤6 行短句 · 防止 2:3 框出界 */
const PAGES: PageContent[] = [
  {
    title: '欢迎',
    body: [
      { kind: 'p', text: '回合制对战卡牌游戏。' },
      { kind: 'p', text: '将敌方主公 HP 降至 0 即获胜。' },
      { kind: 'h', text: '回合基本流程' },
      { kind: 'li', text: '法力上限 +1 · 抽 1 张牌' },
      { kind: 'li', text: '出牌：召唤武将 / 装备 / 计策' },
      { kind: 'li', text: '攻击：友方武将打敌方目标' },
    ],
  },
  {
    title: '战场布局',
    body: [
      { kind: 'h', text: '从上到下' },
      { kind: 'li', text: '对手主公 + 对手手牌' },
      { kind: 'li', text: '对手场上武将' },
      { kind: 'li', text: '我方场上武将' },
      { kind: 'li', text: '我方主公 + 我方手牌' },
    ],
  },
  {
    title: '右侧按钮',
    body: [
      { kind: 'h', text: '托管' },
      { kind: 'li', text: '开启后 AI 接管玩家回合' },
      { kind: 'li', text: '可随时取消恢复手动' },
      { kind: 'h', text: '结束回合' },
      { kind: 'li', text: '完成本回合操作后点击' },
      { kind: 'li', text: '法力不足或卡死时也用它' },
    ],
  },
  {
    title: '左侧按钮',
    body: [
      { kind: 'h', text: '记录' },
      { kind: 'li', text: '查看本局所有出牌历史' },
      { kind: 'h', text: '退出' },
      { kind: 'li', text: '放弃本局返回主菜单' },
    ],
  },
  {
    title: '出牌操作',
    body: [
      { kind: 'h', text: '出牌步骤' },
      { kind: 'li', text: '点击手牌 → 卡牌发光选中' },
      { kind: 'li', text: '点出牌区 → 武将上场' },
      { kind: 'li', text: '点主公 → 装备兵器' },
      { kind: 'li', text: '双击手牌 → 查看详细描述' },
    ],
  },
  {
    title: '施法与攻击',
    body: [
      { kind: 'h', text: '施法目标' },
      { kind: 'li', text: '计策需选目标时显示提示' },
      { kind: 'li', text: '高亮单位为合法目标' },
      { kind: 'h', text: '攻击规则' },
      { kind: 'li', text: '点我方武将 → 点敌方目标' },
      { kind: 'li', text: '敌有「卫戍」必须先打卫戍单位' },
    ],
  },
  {
    title: '法力与发牌',
    body: [
      { kind: 'h', text: '法力' },
      { kind: 'li', text: '每回合法力上限 +1（最高 10）' },
      { kind: 'li', text: '不足时手牌变灰不可出' },
      { kind: 'h', text: '发牌' },
      { kind: 'li', text: 'T1-T5 每回合抽 1 张' },
      { kind: 'li', text: 'T6 起每回合抽 2 张' },
    ],
  },
  {
    title: '蜀阵营 · 人海速攻',
    body: [
      { kind: 'p', text: '正面强攻 · 人海铺场滚雪球。' },
      { kind: 'h', text: '核心机制' },
      { kind: 'li', text: '低费武将多 · 快速铺场' },
      { kind: 'li', text: '助势：友方互相 +1/+1' },
      { kind: 'li', text: '突袭 / 冲锋 · 召唤即攻击' },
      { kind: 'li', text: '兵器：主公亲自挥砍' },
      { kind: 'h', text: '推荐节奏' },
      { kind: 'li', text: 'T1-4 铺场 · T5-7 集中爆发' },
    ],
  },
  {
    title: '吴阵营 · 谋略联动',
    body: [
      { kind: 'p', text: '运营智斗 · 计策联动一波带走。' },
      { kind: 'h', text: '核心机制' },
      { kind: 'li', text: '谋略丰富 · 抽牌 / 治疗 / 控场' },
      { kind: 'li', text: '锚点联动：周瑜 / 鲁肃 / 大乔在场触发额外效果' },
      { kind: 'li', text: '连击：火油 → 天雷' },
      { kind: 'li', text: '韬光：武将隐匿无法被选中' },
      { kind: 'h', text: '推荐节奏' },
      { kind: 'li', text: '前期生存抽牌 · 中后期联动爆发' },
    ],
  },
]

export function TutorialScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const [pageIdx, setPageIdx] = useState(0)

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
    try {
      localStorage.setItem(LS_TUTORIAL_SEEN_KEY, '1')
    } catch {
      // localStorage 不可用 · 静默
    }
  }

  /** 跳过 / 末页开始对战 都直接进战斗（游戏已在 FactionSelect 确认时启动）*/
  function handleSkip() {
    markSeen()
    navigate('battle')
  }

  function handleStart() {
    markSeen()
    navigate('battle')
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
        <span className={styles.skipText}>跳过</span>
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
            aria-label="开始对战"
          >
            {btnLongOn && (
              <img src={btnLongOn} alt="" aria-hidden className={styles.navBg} />
            )}
            <span className={styles.navText}>开始对战</span>
          </button>
        )}
      </div>
    </div>
  )
}

/** 检查是否已看过教程 · FactionSelect 确认时调用 */
export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(LS_TUTORIAL_SEEN_KEY) === '1'
  } catch {
    return true // localStorage 不可用 · 不弹
  }
}

/** 调试用 · 清除教程已看标记 */
export function clearTutorialSeen() {
  try {
    localStorage.removeItem(LS_TUTORIAL_SEEN_KEY)
  } catch {
    // ignore
  }
}
