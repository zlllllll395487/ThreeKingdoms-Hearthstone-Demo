import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl } from '@/data/assetLoader'

/**
 * 开发中弹窗 · 用 modal_developing.png 当整个面板背景，
 * 动态消息（"账号设置"/"邮件"等）叠在 PNG 中央上层。
 */
export function DevelopingModal() {
  const message = useUIStore((s) => s.modalMessage)
  const closeModal = useUIStore((s) => s.closeModal)
  const panelUrl = getUiAssetUrl('modal_developing.png')

  if (!message) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(6px)',
        animation: 'modalFadeIn 0.2s ease-out',
      }}
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '520px',
          height: 'auto',
          animation: 'modalScaleIn 0.3s ease-out',
          cursor: 'pointer',
          filter: 'drop-shadow(0 16px 48px rgba(0, 0, 0, 0.7))',
        }}
        onClickCapture={closeModal}
      >
        {panelUrl ? (
          <img
            src={panelUrl}
            alt="开发中"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            style={{
              padding: '64px 32px',
              background:
                'linear-gradient(145deg, rgba(248, 244, 233, 0.98), rgba(237, 224, 192, 0.95))',
              border: '3px solid var(--color-gold)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ color: 'var(--color-cinnabar)' }}>开发中</h2>
          </div>
        )}

        {/* 动态消息文字 · 叠在面板中部 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-title)',
            color: '#1a0e08',
            textAlign: 'center',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              fontSize: '44px',
              letterSpacing: '8px',
              fontWeight: 400,
              fontFamily: 'var(--font-title)',
              textShadow:
                '0 2px 4px rgba(255, 240, 200, 0.5), 0 1px 0 rgba(140, 100, 50, 0.4)',
            }}
          >
            {message}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '20px',
              letterSpacing: '5px',
              color: '#5c3a1e',
              textShadow: '0 1px 2px rgba(255, 240, 210, 0.4)',
            }}
          >
            功能开发中 · 敬请期待
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
