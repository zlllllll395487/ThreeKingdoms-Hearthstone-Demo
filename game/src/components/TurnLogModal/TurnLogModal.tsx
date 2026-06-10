/**
 * §19.7-2 回合记录弹窗
 *
 * 把 gameStore.log 按回合分组展示，让玩家回放每回合发生了什么
 * 触发：BattleScreen 右下角「回合记录」按钮
 */

import { createPortal } from 'react-dom'
import type { LogEntry } from '@/engine/events'
import styles from './TurnLogModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  log: LogEntry[]
}

interface TurnGroup {
  turn: number
  side: 'player' | 'ai' | null
  header: string
  entries: LogEntry[]
}

function groupByTurn(log: LogEntry[]): TurnGroup[] {
  const groups: TurnGroup[] = []
  let turnCounter = 0
  for (const entry of log) {
    if (entry.kind === 'turn') {
      turnCounter += 1
      groups.push({
        turn: turnCounter,
        side: entry.side ?? null,
        header: entry.text,
        entries: [],
      })
      continue
    }
    // 非 turn 事件：归到最后一组（如无组则建「准备阶段」）
    if (groups.length === 0) {
      groups.push({
        turn: 0,
        side: null,
        header: '准备阶段',
        entries: [],
      })
    }
    groups[groups.length - 1].entries.push(entry)
  }
  return groups
}

const KIND_LABEL: Record<LogEntry['kind'], string> = {
  turn: '回合',
  play: '出牌',
  attack: '攻击',
  damage: '伤害',
  heal: '治疗',
  death: '阵亡',
  effect: '效果',
  draw: '抽牌',
  fatigue: '疲劳',
  win: '胜负',
}

const KIND_CLASS: Record<LogEntry['kind'], string> = {
  turn: 'kindTurn',
  play: 'kindPlay',
  attack: 'kindAttack',
  damage: 'kindDamage',
  heal: 'kindHeal',
  death: 'kindDeath',
  effect: 'kindEffect',
  draw: 'kindDraw',
  fatigue: 'kindFatigue',
  win: 'kindWin',
}

export function TurnLogModal({ open, onClose, log }: Props) {
  if (!open) return null
  const groups = groupByTurn(log).reverse() // 最新在最上面

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* §19.7.20 · 删除右上 ✕（与底部"关闭"按钮重复）· 标题居中 */}
        <header className={styles.header}>
          <h2 className={styles.title}>回 合 记 录</h2>
        </header>

        <div className={styles.body}>
          {groups.length === 0 && (
            <p className={styles.empty}>暂无记录</p>
          )}
          {groups.map((g, gi) => (
            <section
              key={`${g.turn}-${gi}`}
              className={styles.turnSection}
              data-side={g.side ?? ''}
            >
              <h3 className={styles.turnHeader}>
                {g.header}
              </h3>
              {g.entries.length === 0 ? (
                <p className={styles.empty}>—— 无操作 ——</p>
              ) : (
                <ul className={styles.entryList}>
                  {g.entries.map((e, ei) => (
                    <li
                      key={ei}
                      className={`${styles.entry} ${styles[KIND_CLASS[e.kind]]}`}
                    >
                      <span className={styles.entryKind}>
                        [{KIND_LABEL[e.kind]}]
                      </span>
                      <span className={styles.entryText}>{e.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className={styles.footer}>
          <button className={styles.actionBtn} onClick={onClose}>
            关 闭
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
