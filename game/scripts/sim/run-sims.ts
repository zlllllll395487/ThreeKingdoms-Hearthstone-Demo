/**
 * §22 · CLI 入口
 *
 * 用法：
 *   npx tsx scripts/sim/run-sims.ts --games 100
 *   npx tsx scripts/sim/run-sims.ts --games 1000 --seed 42
 */

import { simulateGame, type Faction, type SimResult, type SimDifficulty } from './simulator.js'
import { installSeeded } from './seeded-random.js'
import { collectStats } from './stats-collector.js'
import { renderReport } from './reporter.js'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string, def: string): string => {
    const i = args.indexOf(flag)
    return i >= 0 && args[i + 1] ? args[i + 1] : def
  }
  const asDifficulty = (s: string): SimDifficulty => {
    if (s === 'novice' || s === 'standard' || s === 'grandmaster') return s
    return 'standard'
  }
  return {
    games: parseInt(get('--games', '1000'), 10),
    seed: parseInt(get('--seed', '1'), 10),
    label: get('--label', 'baseline'),
    checkInterval: parseInt(get('--check', '100'), 10),
    // §23 两边 AI 难度 · 默认都 standard（向后兼容）
    playerDifficulty: asDifficulty(get('--player-difficulty', 'standard')),
    aiDifficulty: asDifficulty(get('--ai-difficulty', 'standard')),
  }
}

async function main() {
  const opts = parseArgs()
  installSeeded()
  console.log(
    `[sim] starting ${opts.games} games · seed ${opts.seed} · label "${opts.label}"`,
  )
  console.log(
    `[sim] difficulty · player=${opts.playerDifficulty} / ai=${opts.aiDifficulty}`,
  )

  const results: SimResult[] = []
  const matchups: Array<{ p: Faction; a: Faction; firstP: 'player' | 'ai' }> = [
    { p: 'shu', a: 'wu', firstP: 'player' },
    { p: 'wu', a: 'shu', firstP: 'player' },
    { p: 'shu', a: 'shu', firstP: 'player' },
    { p: 'wu', a: 'wu', firstP: 'player' },
  ]

  const t0 = Date.now()
  let earlyExit: { reason: string } | null = null

  for (let i = 0; i < opts.games; i++) {
    const matchup = matchups[i % matchups.length]
    const seed = opts.seed * 1000 + i
    try {
      const r = await simulateGame({
        seed,
        playerFaction: matchup.p,
        aiFaction: matchup.a,
        firstPlayer: matchup.firstP,
        maxTurns: 40,
        playerDifficulty: opts.playerDifficulty,
        aiDifficulty: opts.aiDifficulty,
      })
      results.push(r)
    } catch (e) {
      console.error(`[sim] game ${i} (seed ${seed}) crash:`, (e as Error).message)
    }

    if ((i + 1) % opts.checkInterval === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
      const playerWins = results.filter((r) => r.winner === 'player').length
      const pct = ((playerWins / results.length) * 100).toFixed(1)
      console.log(
        `[sim] ${i + 1}/${opts.games}  elapsed=${elapsed}s  player-side-wr=${pct}%`,
      )

      // §22.5 · Early-exit triggers · 任一命中即报警继续，但不直接停（让用户看完整数据）
      const quick = collectStats(results)
      const factionImbalance = Math.abs(quick.shuWinrate - quick.wuWinrate)
      if (factionImbalance > 15 && !earlyExit) {
        console.log(
          `[sim] ⚠ EARLY WARNING · 阵营失衡 ${factionImbalance.toFixed(1)}% > 15%`,
        )
        earlyExit = { reason: `阵营胜率失衡 ${factionImbalance.toFixed(1)}%` }
      }
    }
  }

  const t1 = Date.now()
  console.log(`[sim] done · ${results.length} games · ${((t1 - t0) / 1000).toFixed(1)}s`)

  const stats = collectStats(results)
  const reportMd = renderReport(stats, results, {
    label: opts.label,
    earlyExit,
    elapsed: t1 - t0,
  })

  const date = new Date().toISOString().slice(0, 10)
  const outPath = join(__dirname, '..', '..', '..', 'docs', 'sim-reports', `sim-${date}-${opts.label}.md`)
  writeFileSync(outPath, reportMd, 'utf8')
  console.log(`[sim] report written → ${outPath}`)
}

main().catch((e) => {
  console.error('[sim] fatal:', e)
  process.exit(1)
})
