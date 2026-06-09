import { useState, useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { getUiAssetUrl } from '@/data/assetLoader'

/**
 * 战后结算界面 · 读取 gameStore.state.winner 显示真实胜负
 */
export function ResultScreen() {
  const navigate = useUIStore((s) => s.navigate)
  const state = useGameStore((s) => s.state)
  const startGame = useGameStore((s) => s.startGame)
  const endGame = useGameStore((s) => s.endGame)

  // 优先读真实战斗结果；没结果则随机（如直接跳转测试）
  const winner = state?.winner
  const [isVictory] = useState(() => {
    if (winner === 'player') return true
    if (winner === 'ai') return false
    return Math.random() > 0.5
  })

  // 战绩信息（如有真实战斗）
  const stats = useMemo(() => {
    if (!state) return null
    return {
      turn: state.turn,
      playerHp: Math.max(0, state.player.hero.health),
      aiHp: Math.max(0, state.ai.hero.health),
    }
  }, [state])

  const bgUrl = getUiAssetUrl(
    isVictory ? 'win_background.png' : 'defeat_background.png'
  )
  const resultTextUrl = getUiAssetUrl(
    isVictory ? 'text_victory.png' : 'text_defeat.png'
  )
  const btnBackMenuUrl = getUiAssetUrl('btn_back_menu.png')
  const btnBattleAgainUrl = getUiAssetUrl('btn_battle_again.png')

  const handleAgain = () => {
    endGame()
    startGame()
    navigate('battle')
  }

  const handleQuit = () => {
    endGame()
    navigate('mainmenu')
  }

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
        gap: '32px',
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
          backgroundColor: isVictory ? '#3a2d18' : '#1a1820',
          zIndex: 0,
          animation: 'resultBgBreathe 12s ease-in-out infinite',
        }}
      />

      {/* 暗角 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isVictory
            ? 'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.85) 100%)'
            : 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.9) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* L2 动效：胜利金粉 / 失败落雨 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: isVictory ? 24 : 30 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 37) % 100}%`,
              top: '-10%',
              width: isVictory ? '4px' : '2px',
              height: isVictory ? '4px' : '12px',
              background: isVictory
                ? 'rgba(255, 200, 80, 0.9)'
                : 'rgba(180, 200, 220, 0.5)',
              borderRadius: isVictory ? '50%' : '0',
              boxShadow: isVictory
                ? '0 0 8px rgba(255, 180, 50, 0.8)'
                : 'none',
              animation: `${isVictory ? 'goldFall' : 'rainFall'} ${
                isVictory ? 6 + (i % 5) : 1.2 + (i % 8) * 0.15
              }s linear infinite`,
              animationDelay: `${(i % 12) * 0.3}s`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* 大字胜/负（图片版） */}
      {resultTextUrl ? (
        <img
          src={resultTextUrl}
          alt={isVictory ? '胜' : '负'}
          style={{
            position: 'relative',
            zIndex: 3,
            width: '320px',
            height: 'auto',
            filter: isVictory
              ? 'drop-shadow(0 0 60px rgba(212, 160, 23, 0.9)) drop-shadow(0 0 120px rgba(212, 160, 23, 0.5))'
              : 'drop-shadow(0 0 40px rgba(0, 0, 0, 0.95))',
            animation: 'resultPop 0.7s cubic-bezier(.34,1.56,.64,1) both',
          }}
        />
      ) : (
        <h1
          style={{
            position: 'relative',
            zIndex: 3,
            fontFamily: 'var(--font-kai)',
            fontSize: '180px',
            color: isVictory ? 'var(--color-gold)' : '#9a9a9a',
            letterSpacing: '40px',
            margin: 0,
            textShadow: isVictory
              ? '0 0 60px rgba(212, 160, 23, 0.95), 0 0 120px rgba(212, 160, 23, 0.6), 0 8px 16px rgba(0, 0, 0, 0.9)'
              : '0 0 40px rgba(0, 0, 0, 0.9), 0 8px 16px rgba(0, 0, 0, 0.95)',
            animation: 'resultPop 0.7s cubic-bezier(.34,1.56,.64,1) both',
          }}
        >
          {isVictory ? '胜' : '负'}
        </h1>
      )}

      {/* 副标题 */}
      <p
        style={{
          position: 'relative',
          zIndex: 3,
          fontFamily: 'var(--font-kai)',
          fontSize: '28px',
          letterSpacing: '14px',
          color: isVictory ? 'var(--color-paper)' : '#a0a0a0',
          opacity: 0.9,
          margin: 0,
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.95)',
          animation: 'resultFadeIn 1s ease-out 0.5s both',
        }}
      >
        {isVictory ? '凯 旋 而 归' : '兵 败 如 山 倒'}
      </p>

      <p
        style={{
          position: 'relative',
          zIndex: 3,
          opacity: 0.55,
          letterSpacing: '4px',
          fontSize: '12px',
          maxWidth: '520px',
          textAlign: 'center',
          lineHeight: 1.8,
          marginTop: '8px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)',
          animation: 'resultFadeIn 1s ease-out 1s both',
        }}
      >
        {stats
          ? `历经 ${stats.turn} 回合 · 你 ${stats.playerHp} HP · 对手 ${stats.aiHp} HP`
          : '战绩、经验、奖励等详细信息将在 W4 实装'}
      </p>

      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          gap: '24px',
          marginTop: '24px',
          animation: 'resultFadeIn 1s ease-out 1.5s both',
        }}
      >
        <ResultButton
          iconUrl={btnBackMenuUrl}
          altText="返回主菜单"
          onClick={handleQuit}
        />
        <ResultButton
          iconUrl={btnBattleAgainUrl}
          altText="再战一场"
          onClick={handleAgain}
          highlight
        />
      </div>

      <style>{`
        @keyframes resultPop {
          0% { transform: scale(0.3); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes resultFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes resultBgBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes goldFall {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(20px); opacity: 0; }
        }
        @keyframes rainFall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ============================================
// 通用图片按钮 · hover 上浮 + 金光晕
// ============================================

interface ResultButtonProps {
  iconUrl: string | null
  altText: string
  onClick: () => void
  highlight?: boolean
}

function ResultButton({ iconUrl, altText, onClick, highlight }: ResultButtonProps) {
  if (!iconUrl) {
    return (
      <button
        onClick={onClick}
        style={{
          padding: '14px 40px',
          background: highlight
            ? 'linear-gradient(180deg, var(--color-gold), var(--color-gold-deep))'
            : 'rgba(0, 0, 0, 0.5)',
          border: '2px solid var(--color-gold)',
          color: highlight ? 'var(--color-ink)' : 'var(--color-paper)',
          fontFamily: 'var(--font-serif)',
          fontSize: '15px',
          letterSpacing: '6px',
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
          ? 'drop-shadow(0 6px 14px rgba(212, 160, 23, 0.65))'
          : 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.7))',
        transition: 'transform 0.18s ease, filter 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)'
        e.currentTarget.style.filter =
          'drop-shadow(0 12px 22px rgba(212, 160, 23, 0.9))'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.filter = highlight
          ? 'drop-shadow(0 6px 14px rgba(212, 160, 23, 0.65))'
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
