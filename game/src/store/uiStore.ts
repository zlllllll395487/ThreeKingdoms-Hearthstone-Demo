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
  | 'battle'      // 对战（W2-W4 实装）
  | 'result'      // 战后结算（W2-W4 实装）

interface UIStore {
  // 当前屏幕
  currentScreen: Screen

  // 弹窗内容（null = 无弹窗）
  modalMessage: string | null

  // 屏幕切换
  navigate: (to: Screen) => void

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

export const useUIStore = create<UIStore>((set) => {
  const introSeen = loadIntroSeen()
  return {
    // 首次启动：先放 intro 视频；看过/跳过之后或刷新页面：直接进 splash「进入游戏」
    currentScreen: introSeen ? 'splash' : 'intro',
    modalMessage: null,
    introSeen,

    navigate: (to) =>
      set({
        currentScreen: to,
        modalMessage: null, // 切屏时关闭所有弹窗
      }),

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
