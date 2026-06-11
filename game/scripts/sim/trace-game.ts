/**
 * §22 · 单局 AI 决策 trace
 *
 * 用法：
 *   npx tsx scripts/sim/trace-game.ts --seed 42 --player wu --ai shu
 *   npx tsx scripts/sim/trace-game.ts --seed 42 --player wu --ai shu --first-player ai
 *
 * 输出：docs/sim-reports/trace-<seed>-<p>-<a>.md
 * 内容：每回合 AI 看到的候选评分 / 出牌选择 / 攻击目标 / 理由 全展开
 */

import { GameEngine, type TargetRef } from '../../src/engine/index.js'
import { takeAITurn, type AiTracer } from '../../src/engine/ai.js'
import type { CardInstance, PlayerSide } from '../../src/engine/types.js'
import { getAllCardsIncludingTokens } from '../../src/data/cardLibrary.js'
import { getDeckByFaction } from '../../src/data/decks.js'
import { setSeed, installSeeded } from './seeded-random.js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

type Faction = 'shu' | 'wu'

interface PlayRecord {
  manaBefore: { current: number; max: number }
  candidates: Array<{ name: string; cost: number; score: number; cardId: string; instanceId: string }>
  chosenInstanceId: string | null
  chosenName: string | null
  chosenScore: number | null
  targetDesc: string | null
  reason: 'played' | 'all-negative' | 'no-affordable' | 'no-target'
}
interface AttackRecord {
  attackerName: string
  attackerAtk: number
  targetDesc: string
  reason: string
}
interface TurnRecord {
  turn: number
  side: PlayerSide
  faction: Faction
  startHp: { me: number; them: number }
  startMana: { current: number; max: number }
  startHand: string[]
  startBoard: { me: string[]; them: string[] }
  drewThisTurn: string[]
  plays: PlayRecord[]
  attacks: AttackRecord[]
  endHp: { me: number; them: number }
  endHand: string[]
  endBoard: { me: string[]; them: string[] }
  manaLeftover: number
}

function parseArgs() {
  const a = process.argv.slice(2)
  const get = (flag: string, def: string) => {
    const i = a.indexOf(flag)
    return i >= 0 && a[i + 1] ? a[i + 1] : def
  }
  return {
    seed: parseInt(get('--seed', '42'), 10),
    playerFaction: get('--player', 'wu') as Faction,
    aiFaction: get('--ai', 'shu') as Faction,
    firstPlayer: (get('--first-player', 'player') as 'player' | 'ai'),
    label: get('--label', ''),
    maxTurns: parseInt(get('--max-turns', '40'), 10),
  }
}

function makeHero(faction: Faction) {
  return {
    name: faction === 'shu' ? '刘备' : '孙权',
    faction,
    health: 30,
    maxHealth: 30,
    armor: 0,
    attack: 0,
  }
}

function fmtHandCard(c: CardInstance): string {
  return `${c.data.name}[${c.data.cost}]`
}
function fmtBoardMinion(m: CardInstance): string {
  const kw: string[] = []
  if (m.currentKeywords.has('taunt')) kw.push('卫')
  if (m.currentKeywords.has('stealth')) kw.push('伏')
  if (m.currentKeywords.has('rush')) kw.push('袭')
  if (m.currentKeywords.has('charge')) kw.push('冲')
  if (m.currentKeywords.has('windfury')) kw.push('斩')
  if (m.currentKeywords.has('divineShield')) kw.push('壁')
  if (m.frozen) kw.push('冻')
  const kwStr = kw.length > 0 ? `«${kw.join('')}»` : ''
  return `${m.data.name}${kwStr}(${m.currentAttack}/${m.currentHealth})`
}

function describeTarget(target: TargetRef | undefined, engine: GameEngine): string {
  if (!target) return '(无目标)'
  if (target.kind === 'hero') {
    return `主公(${engine.state[target.side].hero.name} HP=${engine.state[target.side].hero.health})`
  }
  const m = engine.state[target.side].board.find((b) => b.instanceId === target.instanceId)
  return m ? `${target.side === 'player' ? '我方' : '敌方'} ${fmtBoardMinion(m)}` : '?'
}

function sideLabel(side: PlayerSide, opts: ReturnType<typeof parseArgs>): string {
  const faction = side === 'player' ? opts.playerFaction : opts.aiFaction
  const factionCh = faction === 'shu' ? '蜀' : '吴'
  return `${factionCh}(${side})`
}

async function main() {
  const opts = parseArgs()
  installSeeded()
  setSeed(opts.seed)

  const engine = GameEngine.createGame({
    cardPool: getAllCardsIncludingTokens(),
    playerHero: makeHero(opts.playerFaction),
    aiHero: makeHero(opts.aiFaction),
    deckSize: 30,
    initialHand: { player: 3, ai: 4 },
    playerDeckCardIds: getDeckByFaction(opts.playerFaction),
    aiDeckCardIds: getDeckByFaction(opts.aiFaction),
  })
  if (opts.firstPlayer === 'ai') {
    engine.state.activePlayer = 'ai'
  }

  const turnRecords: TurnRecord[] = []
  let currentRecord: TurnRecord | null = null

  const tracer: AiTracer = {
    recordPlayDecision(info) {
      if (!currentRecord) return
      const record: PlayRecord = {
        manaBefore: info.mana,
        candidates: info.candidates.map((c) => ({
          name: c.card.data.name,
          cost: c.card.data.cost,
          score: c.score,
          cardId: c.card.data.id,
          instanceId: c.card.instanceId,
        })),
        chosenInstanceId: info.chosen?.instanceId ?? null,
        chosenName: info.chosen?.data.name ?? null,
        chosenScore: info.chosenScore,
        targetDesc: info.target ? describeTarget(info.target, engine) : null,
        reason: info.reason,
      }
      currentRecord.plays.push(record)
    },
    recordAttackDecision(info) {
      if (!currentRecord) return
      currentRecord.attacks.push({
        attackerName: info.attackerName,
        attackerAtk: info.attackerAtk,
        targetDesc: info.targetDesc,
        reason: info.reason,
      })
    },
  }

  let safety = 0
  let prevLogLen = engine.log.length
  while (engine.state.phase === 'main' && safety++ < opts.maxTurns * 4) {
    const active = engine.state.activePlayer
    const enemy: PlayerSide = active === 'player' ? 'ai' : 'player'

    currentRecord = {
      turn: engine.state.turn,
      side: active,
      faction: active === 'player' ? opts.playerFaction : opts.aiFaction,
      startHp: {
        me: engine.state[active].hero.health,
        them: engine.state[enemy].hero.health,
      },
      startMana: { ...engine.state[active].mana },
      startHand: engine.state[active].hand.map(fmtHandCard),
      startBoard: {
        me: engine.state[active].board.map(fmtBoardMinion),
        them: engine.state[enemy].board.map(fmtBoardMinion),
      },
      drewThisTurn: [],
      plays: [],
      attacks: [],
      endHp: { me: 0, them: 0 },
      endHand: [],
      endBoard: { me: [], them: [] },
      manaLeftover: 0,
    }

    // 收集本回合开始时抽到的牌（startTurn 阶段的 draw log）
    const newLogs = engine.log.slice(prevLogLen)
    for (const e of newLogs) {
      if (e.kind === 'draw' && e.side === active) {
        const name = e.text.replace(/^(你|AI)抽到 /, '')
        currentRecord.drewThisTurn.push(name)
      }
    }
    prevLogLen = engine.log.length

    await takeAITurn(engine, async () => {}, undefined, active, tracer)

    currentRecord.endHp = {
      me: engine.state[active].hero.health,
      them: engine.state[enemy].hero.health,
    }
    currentRecord.endHand = engine.state[active].hand.map(fmtHandCard)
    currentRecord.endBoard = {
      me: engine.state[active].board.map(fmtBoardMinion),
      them: engine.state[enemy].board.map(fmtBoardMinion),
    }
    currentRecord.manaLeftover = engine.state[active].mana.current

    turnRecords.push(currentRecord)
    currentRecord = null
    prevLogLen = engine.log.length

    engine.endTurn()
  }

  const winner = engine.state.winner ?? 'draw'
  const md = formatTraceMd(turnRecords, engine, opts, winner)

  const date = new Date().toISOString().slice(0, 10)
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const labelPart = opts.label ? `-${opts.label}` : ''
  const outDir = join(__dirname, '..', '..', '..', 'docs', 'sim-reports')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(
    outDir,
    `trace-${date}-seed${opts.seed}-${opts.playerFaction}vs${opts.aiFaction}${labelPart}.md`,
  )
  writeFileSync(outPath, md, 'utf8')
  console.log(`[trace] written → ${outPath}`)
}

function formatTraceMd(
  turns: TurnRecord[],
  engine: GameEngine,
  opts: ReturnType<typeof parseArgs>,
  winner: 'player' | 'ai' | 'draw',
): string {
  const out: string[] = []
  const factionCh = (f: Faction) => (f === 'shu' ? '蜀' : '吴')
  out.push(`# AI 决策 Trace · seed ${opts.seed}`)
  out.push('')
  out.push(`- **对位**: player=${factionCh(opts.playerFaction)} vs ai=${factionCh(opts.aiFaction)}`)
  out.push(`- **先手**: ${opts.firstPlayer === 'player' ? '玩家方先' : 'AI 方先'}`)
  out.push(`- **结果**: ${winner === 'draw' ? '平局' : winner + ' 胜'} · 终局 HP player=${engine.state.player.hero.health} / ai=${engine.state.ai.hero.health}`)
  out.push(`- **总回合**: ${engine.state.turn}`)
  out.push('')
  out.push('> 关键词缩写: 卫=镇守/嘲讽 · 伏=潜行 · 袭=突袭 · 冲=冲锋 · 斩=连斩/风怒 · 壁=圣盾 · 冻=冰冻态')
  out.push('')
  out.push('---')

  let lastTurn = -1
  for (const t of turns) {
    if (t.turn !== lastTurn) {
      out.push('')
      out.push(`# 第 ${t.turn} 回合`)
      lastTurn = t.turn
    }
    out.push('')
    out.push(`## ${sideLabel(t.side, opts)} · HP ${t.startHp.me}/${t.startHp.them} · Mana ${t.startMana.current}/${t.startMana.max}`)
    if (t.drewThisTurn.length > 0) {
      out.push(`*抽到*: ${t.drewThisTurn.join(', ')}`)
    }
    out.push('')
    out.push(`- 手牌: ${t.startHand.length > 0 ? t.startHand.join(', ') : '*(空)*'}`)
    out.push(`- 我场: [${t.startBoard.me.join(', ') || '(空)'}]`)
    out.push(`- 敌场: [${t.startBoard.them.join(', ') || '(空)'}]`)
    out.push('')

    if (t.plays.length === 0) {
      out.push('### 出牌阶段')
      out.push('*（手牌空 / 无 mana / 全部负分 — 跳过）*')
    } else {
      t.plays.forEach((p, i) => {
        out.push(`### 出牌轮 ${i + 1} · mana=${p.manaBefore.current}/${p.manaBefore.max}`)
        if (p.candidates.length === 0) {
          out.push('*（无 affordable 卡）*')
        } else {
          out.push('')
          out.push('| 候选 | 费 | 分数 |')
          out.push('|:--|:-:|:-:|')
          for (const c of p.candidates.slice(0, 8)) {
            const mark = c.instanceId === p.chosenInstanceId ? ' **✅**' : ''
            out.push(`| ${c.name}${mark} | ${c.cost} | ${c.score.toFixed(1)} |`)
          }
        }
        out.push('')
        if (p.chosenName) {
          out.push(`→ **打出** ${p.chosenName} · 目标: ${p.targetDesc ?? '*(无)*'}`)
        } else {
          const reasonText: Record<string, string> = {
            'all-negative': '*全部负分 · 停手*',
            'no-affordable': '*无可出 · mana 不够*',
            'no-target': '*选不到合法目标*',
            'played': '',
          }
          out.push(`→ **跳过** · ${reasonText[p.reason]}`)
        }
        out.push('')
      })
    }

    out.push('### 攻击阶段')
    if (t.attacks.length === 0) {
      out.push('*（无攻击者 / 全部 exhausted）*')
    } else {
      for (const a of t.attacks) {
        out.push(`- **${a.attackerName}**(攻${a.attackerAtk}) → ${a.targetDesc}`)
        out.push(`  *理由: ${a.reason}*`)
      }
    }
    out.push('')
    out.push(`**回合结束** · HP ${t.endHp.me}/${t.endHp.them} · 残 mana=${t.manaLeftover} · 我场=[${t.endBoard.me.join(', ') || '(空)'}] · 敌场=[${t.endBoard.them.join(', ') || '(空)'}]`)
    out.push('')
    out.push('---')
  }

  return out.join('\n')
}

main().catch((e) => {
  console.error('[trace] fatal:', e)
  process.exit(1)
})
