import { useEffect, useRef, useState } from 'react'
import { getUiAssetUrl } from '@/data/assetLoader'
import styles from './CustomCursor.module.css'

/**
 * §27 自定义鼠标光标
 *
 * - 默认：替换系统光标为矛形 PNG
 * - hover 可点击元素：金光呼吸效果
 * - 点击：点击位置弹出金色波纹（CSS keyframe）
 *
 * 实现方式：
 * - 隐藏系统光标 (html, body { cursor: none })
 * - 全局监听 mousemove 让自定义光标跟随
 * - 全局监听 mouseover 检测当前是否悬停在 button/a/[role=button]
 * - 全局监听 click 在点击位置 append ripple div, 600ms 后自动移除
 *
 * 触屏设备 (无 mousemove) 自动隐藏 · 不影响触摸输入
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const ripplesRef = useRef<HTMLDivElement>(null)
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)

  const cursorUrl = getUiAssetUrl('cursor_spear.png')

  useEffect(() => {
    if (!cursorUrl) return

    const onMove = (e: MouseEvent) => {
      if (!cursorRef.current) return
      // 矛尖在 PNG 左上角(约 4px,6px) · translate 略偏移让点击点对齐矛尖
      cursorRef.current.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 6}px, 0)`
      if (!visible) setVisible(true)
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const interactive = target.closest(
        'button:not([disabled]), a[href], [role="button"]:not([disabled]), [data-clickable]',
      )
      setHovering(!!interactive)
    }

    const onClick = (e: MouseEvent) => {
      if (!ripplesRef.current) return
      const ripple = document.createElement('div')
      ripple.className = styles.ripple
      ripple.style.left = `${e.clientX}px`
      ripple.style.top = `${e.clientY}px`
      ripplesRef.current.appendChild(ripple)
      // 600ms 后自动移除 · 与 CSS animation duration 一致
      window.setTimeout(() => ripple.remove(), 700)
    }

    const onLeave = () => setVisible(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, true)
    window.addEventListener('mousedown', onClick, true)
    window.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver, true)
      window.removeEventListener('mousedown', onClick, true)
      window.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [cursorUrl, visible])

  if (!cursorUrl) return null

  return (
    <>
      <div
        ref={cursorRef}
        className={`${styles.cursor} ${hovering ? styles.hovering : ''} ${
          visible ? styles.visible : ''
        }`}
        aria-hidden
      >
        <img src={cursorUrl} alt="" draggable={false} />
      </div>
      <div ref={ripplesRef} className={styles.ripplesContainer} aria-hidden />
    </>
  )
}
