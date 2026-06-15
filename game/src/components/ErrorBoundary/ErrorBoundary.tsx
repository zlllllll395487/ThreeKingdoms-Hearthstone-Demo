/**
 * ErrorBoundary · React 异常兜底
 *
 * 仅捕获 React 渲染期间抛出的异常（render / lifecycle / constructor）。
 * 不捕获事件处理器内异常（onClick 等），需在调用处自行 try/catch。
 *
 * 异常时显示「游戏异常，返回主菜单」按钮，点击重置 store 并导航回 mainmenu。
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { useUIStore } from '@/store/uiStore'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReset = (): void => {
    useUIStore.getState().navigate('mainmenu')
    this.setState({ hasError: false, errorMessage: undefined })
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20, 14, 8, 0.96)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e9d9a9',
          fontFamily: 'var(--font-serif, serif)',
          zIndex: 99999,
          padding: 48,
          textAlign: 'center',
        }}
        role="alert"
      >
        <div style={{ fontSize: 36, marginBottom: 16, letterSpacing: 2 }}>游戏遇到异常</div>
        <div style={{ fontSize: 16, opacity: 0.7, marginBottom: 36, maxWidth: 520 }}>
          {this.state.errorMessage ?? '未知错误，请返回主菜单后重试。'}
        </div>
        <button
          onClick={this.handleReset}
          style={{
            padding: '12px 36px',
            fontSize: 18,
            background: 'linear-gradient(180deg, #8a6a3a 0%, #5a4422 100%)',
            color: '#f5e7c1',
            border: '1px solid #c9a35d',
            borderRadius: 4,
            cursor: 'pointer',
            letterSpacing: 2,
          }}
        >
          返回主菜单
        </button>
      </div>
    )
  }
}
