/**
 * UI 状态管理 · 屏幕切换控制中枢
 *
 * 整个 demo 不引入 react-router，所有屏幕切换通过这个 store 控制。
 * 用法：
 *   const navigate = useUIStore((s) => s.navigate)
 *   navigate('mainmenu')
 */

import { create } from 'zustand'

// ============================================
// 类型定义
// ============================================

export type Screen =
  | 'splash'      // 启动加载页
  | 'intro'       // 开场视频/动画
  | 'loading'     // 进入主菜单前的进度条加载页
  | 'mainmenu'    // 主菜单 Hub
  | 'codex'       // 卡牌图鉴
  | 'storymode'   // 剧情模式（子页面）
  | 'quest'       // 任务（子页面）
  | 'shop'        // 商城（子页面）
  | 'event'       // 限定活动 · 桃园结义（子页面）
  | 'recruit'     // 招募（子页面）
  | 'decks'       // 卡组编组（子页面）
  | 'serverselect' // 服务器选择（splash 入口子页面）
  | 'account'     // 账号信息（splash 账号设置入口）
  | 'accountdetails' // 账号详情（主菜单玩家块入口）
  | 'mail'        // 邮件（主菜单侧栏入口）
  | 'signin'      // 每日签到（主菜单侧栏入口）
  | 'friends'     // 好友（主菜单侧栏入口）
  | 'news'        // 游戏动态（splash 工具按钮入口）
  | 'factionselect' // v5.5 阵营选择
  | 'tutorial'    // v5.5 教程弹窗（独立屏 / 或弹窗）
  | 'battle'      // 对战
  | 'result'      // 战后结算

interface UIStore {
  // 当前屏幕
  currentScreen: Screen

  // 上一个屏幕（用于子页面返回）
  previousScreen: Screen | null

  /**
   * 待加载的目标屏 · 配合 Loading 屏使用
   * navigateWithLoading 写入 → LoadingScreen 读出 → 资源就绪后 navigate 到此屏并清空
   */
  pendingScreen: Screen | null

  // 弹窗内容（null = 无弹窗）
  modalMessage: string | null

  // 屏幕切换
  navigate: (to: Screen) => void

  /**
   * 带加载页过场的屏幕切换
   *
   * 流程：currentScreen → 'loading' →（预加载 target 屏全部资源）→ target
   * 期间显示 LoadingScreen，包含随机背景图与随机 Tip。
   * 已加载过的资源会跳过，重复进入同一屏几乎瞬时完成。
   */
  navigateWithLoading: (to: Screen) => void

  // 弹窗操作
  showModal: (message: string) => void
  closeModal: () => void

  // 开场视频已看过标记（持久化到 localStorage）
  introSeen: boolean
  markIntroSeen: () => void
  resetIntro: () => void
}

// ============================================
// LocalStorage 持久化辅助
// ============================================

const STORAGE_KEY_INTRO_SEEN = 'sgls_intro_seen'

function loadIntroSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_INTRO_SEEN) === 'true'
  } catch {
    return false
  }
}

function saveIntroSeen(value: boolean) {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY_INTRO_SEEN, 'true')
    } else {
      localStorage.removeItem(STORAGE_KEY_INTRO_SEEN)
    }
  } catch {
    // ignore SSR / privacy mode
  }
}

// ============================================
// Store 主体
// ============================================

export const useUIStore = create<UIStore>((set, get) => {
  const introSeen = loadIntroSeen()
  return {
    // 暂时跳过 intro 开屏动画，所有启动直接进 splash「进入游戏」
    // 如需恢复 intro：currentScreen: introSeen ? 'splash' : 'intro'
    currentScreen: 'splash',
    previousScreen: null,
    pendingScreen: null,
    modalMessage: null,
    introSeen,

    navigate: (to) => {
      const cur = get().currentScreen
      set({
        previousScreen: cur,
        currentScreen: to,
        modalMessage: null, // 切屏时关闭所有弹窗
      })
    },

    navigateWithLoading: (to) => {
      const cur = get().currentScreen
      set({
        previousScreen: cur,
        currentScreen: 'loading',
        pendingScreen: to,
        modalMessage: null,
      })
    },

    showModal: (message) => set({ modalMessage: message }),
    closeModal: () => set({ modalMessage: null }),

    markIntroSeen: () => {
      saveIntroSeen(true)
      set({ introSeen: true })
    },

    resetIntro: () => {
      saveIntroSeen(false)
      set({ introSeen: false })
    },
  }
})
