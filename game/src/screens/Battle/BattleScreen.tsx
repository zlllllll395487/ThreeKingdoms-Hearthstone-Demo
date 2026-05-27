import { useUIStore } from '@/store/uiStore'
import { getUiAssetUrl } from '@/data/assetLoader'

/**
 * 对战界面 · 占位版（W1）
 *
 * 真正功能在 W2-W4 实装：
 *   - 战场布局（双方各 7 格）
 *   - 手牌区
 *   - 攻击 / 出牌 / 英雄技能
 *   - 回合切换
 *   - 死亡结算
 */
export function BattleScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const bgUrl = getUiAssetUrl('battle-background.png')
  const iconWeaponsUrl = getUiAssetUrl('icon_weapons.png')
  const textBattleTitleUrl = getUiAssetUrl('text_battle_title.png')
  const btnBackMenuUrl = getUiAssetUrl('btn_back_menu.png')
  const btnSimulateResultUrl = getUiAssetUrl('btn_simulate_result.png')

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-serif)',
        color: 'var(--color-paper)',
      }}
    >
      {/* 背景层 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#1a1410',
          animation: 'battleBgBreathe 14s ease-in-out infinite',
          zIndex: 0,
        }}
      />

      {/* 暗角 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.85) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 中央占位提示 */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          textAlign: 'center',
          padding: '40px',
        }}
      >
        {/* 兵戈交叉图标 */}
        {iconWeaponsUrl ? (
          <img
            src={iconWeaponsUrl}
            alt=""
            style={{
              width: '180px',
              height: 'auto',
              filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.85))',
            }}
          />
        ) : (
          <div style={{ fontSize: '96px', opacity: 0.4 }}>⚔</div>
        )}

        {/* 两军对垒 标题 */}
        {textBattleTitleUrl ? (
          <img
            src={textBattleTitleUrl}
            alt="两军对垒"
            style={{
              width: '380px',
              height: 'auto',
              filter:
                'drop-shadow(0 0 24px rgba(212, 160, 23, 0.5)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.95))',
            }}
          />
        ) : (
          <h1
            style={{
              fontFamily: 'var(--font-kai)',
              fontSize: '52px',
              color: 'var(--color-gold)',
              letterSpacing: '20px',
              margin: 0,
            }}
          >
            两 军 对 垒
          </h1>
        )}

        <p
          style={{
            opacity: 0.75,
            letterSpacing: '4px',
            fontSize: '14px',
            maxWidth: '520px',
            lineHeight: 1.8,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)',
            margin: 0,
          }}
        >
          战场逻辑将在 W2-W4 实装<br />
          含：双方 7 格战场 · 手牌拖拽 · 攻击结算 · 关键词机制 · AI 对手
        </p>

        <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
          <ImgButton
            iconUrl={btnBackMenuUrl}
            altText="返回主菜单"
            onClick={() => navigate('mainmenu')}
          />
          <ImgButton
            iconUrl={btnSimulateResultUrl}
            altText="模拟结算"
            onClick={() => navigate('result')}
            highlight
          />
        </div>
      </div>

      <style>{`
        @keyframes battleBgBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// 通用图片按钮（hover 上浮 + 金光晕）
// ============================================

interface ImgButtonProps {
  iconUrl: string | null
  altText: string
  onClick: () => void
  highlight?: boolean
}

function ImgButton({ iconUrl, altText, onClick, highlight }: ImgButtonProps) {
  if (!iconUrl) {
    return (
      <button
        onClick={onClick}
        style={{
          padding: '14px 36px',
          background: highlight
            ? 'linear-gradient(180deg, var(--color-gold), var(--color-gold-deep))'
            : 'rgba(0, 0, 0, 0.5)',
          border: '2px solid var(--color-gold)',
          color: highlight ? 'var(--color-ink)' : 'var(--color-paper)',
          fontFamily: 'var(--font-serif)',
          fontSize: '14px',
          letterSpacing: '4px',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
      >
        {altText}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        filter: highlight
          ? 'drop-shadow(0 6px 14px rgba(212, 160, 23, 0.6))'
          : 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.7))',
        transition: 'transform 0.18s ease, filter 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)'
        e.currentTarget.style.filter =
          'drop-shadow(0 12px 22px rgba(212, 160, 23, 0.85))'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.filter = highlight
          ? 'drop-shadow(0 6px 14px rgba(212, 160, 23, 0.6))'
          : 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.7))'
      }}
    >
      <img
        src={iconUrl}
        alt={altText}
        style={{
          height: '76px',
          width: 'auto',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </button>
  )
}
