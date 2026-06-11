import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './TutorialScreen.module.css'

/**
 * 教程屏 · 竖屏 1080×1920
 *
 * 5 页纯文字教程：
 *   1. 欢迎 · 玩法概述
 *   2. 界面 · 主要 UI 元素
 *   3. 操作 · 出牌 / 施法 / 攻击 / 费用
 *   4. 蜀阵营 · 人海速攻
 *   5. 吴阵营 · 谋略联动
 *
 * 触发：
 *   - 首次进入主菜单 (localStorage `sgls.tutorialSeen` 标记)
 *   - 主菜单 / 其它入口手动调起
 *
 * 资源：
 *   - tutorial_frame.png (弹窗主框 · 3:4 比例)
 *   - tutorial_btn_long_off/on.png (主要按钮 · 上一页 / 下一页 / 开始)
 *   - tutorial_btn_short_off/on.png (次要按钮 · 跳过)
 */

const LS_TUTORIAL_SEEN_KEY = 'sgls.tutorialSeen'

interface PageContent {
  title: string
  body: Array<{ kind: 'h' | 'p' | 'li'; text: string }>
}

const PAGES: PageContent[] = [
  {
    title: '欢迎来到三国炉石',
    body: [
      { kind: 'p', text: '一款回合制对战卡牌游戏。' },
      { kind: 'p', text: '选择阵营，组建你的武将与计策，将敌方主公 HP 降至 0 即获胜。' },
      { kind: 'h', text: '基本流程' },
      { kind: 'li', text: '每回合开始 · 法力上限 +1 · 抽 1 张牌' },
      { kind: 'li', text: '使用手牌召唤武将 / 装备兵器 / 释放计策' },
      { kind: 'li', text: '友方武将可攻击敌方武将或主公' },
      { kind: 'li', text: '主公 HP 归零者败北' },
    ],
  },
  {
    title: '界面元素',
    body: [
      { kind: 'h', text: '战场布局' },
      { kind: 'li', text: '上方：对手主公 + 对手手牌 + 对手场上武将' },
      { kind: 'li', text: '中间：双方武将对战区域' },
      { kind: 'li', text: '下方：我方武将 + 我方主公 + 我方手牌' },
      { kind: 'h', text: '右侧按钮' },
      { kind: 'li', text: '托管：开启后 AI 接管玩家回合，可随时取消' },
      { kind: 'li', text: '结束回合：完成本回合所有操作后点击' },
      { kind: 'h', text: '左侧按钮' },
      { kind: 'li', text: '记录：查看本局所有出牌与行动历史' },
      { kind: 'li', text: '退出：返回主菜单' },
    ],
  },
  {
    title: '操作规则',
    body: [
      { kind: 'h', text: '出牌' },
      { kind: 'li', text: '点击手牌选中 · 卡牌发光表示可出' },
      { kind: 'li', text: '点出牌区放下武将；点主公装备兵器' },
      { kind: 'li', text: '双击手牌可查看详细描述' },
      { kind: 'h', text: '施法目标' },
      { kind: 'li', text: '部分计策需要选择目标 · 提示「请选择目标 / 友方武将」' },
      { kind: 'li', text: '高亮单位即为合法目标' },
      { kind: 'h', text: '攻击' },
      { kind: 'li', text: '点选我方武将（边框发光）→ 点击敌方目标' },
      { kind: 'li', text: '敌方有「卫戍」单位时，必须先攻击带卫戍的武将' },
      { kind: 'h', text: '法力与发牌' },
      { kind: 'li', text: '每回合法力上限 +1（最高 10）' },
      { kind: 'li', text: '法力不足时手牌变灰，无法出牌' },
      { kind: 'li', text: '前 5 回合每回合抽 1 张，第 6 回合起每回合抽 2 张' },
    ],
  },
  {
    title: '蜀阵营 · 人海速攻',
    body: [
      { kind: 'p', text: '正面强攻流派 · 以「人海战术 + 滚雪球 + 强力随从」压制对手。' },
      { kind: 'h', text: '核心特色' },
      { kind: 'li', text: '低费武将充足 · 快速铺场建立场面优势' },
      { kind: 'li', text: '滚雪球机制 · 友方武将互相增益（如张飞每个友方 +1/+1）' },
      { kind: 'li', text: '突袭 + 冲锋关键词 · 召唤当回合即可攻击' },
      { kind: 'li', text: '兵器体系 · 主公亲自挥砍输出' },
      { kind: 'h', text: '代表武将' },
      { kind: 'li', text: '关羽 · 张飞 · 赵云 · 马超 · 魏延 · 黄忠' },
      { kind: 'h', text: '推荐节奏' },
      { kind: 'li', text: '前 4 回合铺场，T5-T7 集中爆发打死对手' },
    ],
  },
  {
    title: '吴阵营 · 谋略联动',
    body: [
      { kind: 'p', text: '运营智斗流派 · 以「谋略 + 长线运营 + 计策联动」压垮对手。' },
      { kind: 'h', text: '核心特色' },
      { kind: 'li', text: '计策体系丰富 · 抽牌 / 治疗 / 控场齐备' },
      { kind: 'li', text: '锚点联动 · 周瑜 / 鲁肃 / 大乔在场时强化对应计策' },
      { kind: 'li', text: '连击体系 · 火油 → 天雷 / 反间计 → 美人计' },
      { kind: 'li', text: '韬光关键词 · 武将隐匿无法被攻击' },
      { kind: 'h', text: '代表武将' },
      { kind: 'li', text: '周瑜 · 鲁肃 · 大乔 · 孙策 · 周泰 · 吕蒙' },
      { kind: 'h', text: '推荐节奏' },
      { kind: 'li', text: '前期生存 + 抽牌找件，中后期联动 combo 一波带走' },
    ],
  },
]

export function TutorialScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const previousScreen = useUIStore((s) => s.previousScreen)
  const [pageIdx, setPageIdx] = useState(0)

  const frameUrl = getUiAssetUrl('tutorial_frame.png')
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
        handleClose()
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

  function handleClose() {
    markSeen()
    // 回上一屏；若没记录则回主菜单
    navigate(previousScreen ?? 'mainmenu')
  }

  function handleStart() {
    markSeen()
    navigate('factionselect')
  }

  return (
    <div className={styles.container}>
      <div className={styles.vignette} />

      {/* 跳过按钮 · 右上 */}
      <button
        type="button"
        className={styles.skipBtn}
        onClick={handleClose}
        aria-label="跳过教程"
      >
        {btnShortOn && (
          <img src={btnShortOn} alt="" aria-hidden className={styles.skipBg} />
        )}
        <span className={styles.skipText}>跳过</span>
      </button>

      {/* 主弹窗 */}
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

/** 检查是否已看过教程 · 主菜单加载时调用 */
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
