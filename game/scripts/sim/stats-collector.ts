/**
 * §22 · 模拟结果统计聚合
 */

import type { SimResult, Faction } from './simulator.js'

export interface FactionWinrate {
  playerFaction: Faction
  aiFaction: Faction
  games: number
  playerWins: number
  aiWins: number
  draws: number
  winrate: number // player side win %
}

export interface CardImpact {
  cardName: string
  appearances: number
  winnerAppearances: number
  loserAppearances: number
  winrate: number // 出现在赢家牌区的概率
  netImpact: number // (winrate - 50)
}

export interface SimStats {
  totalGames: number
  playerWins: number
  aiWins: number
  draws: number
  playerWinrate: number
  avgTurns: number
  medianTurns: number
  fatigueRate: number // 疲劳致死局数 %
  // 阵营平衡
  shuWinrate: number
  wuWinrate: number
  factionMatchups: FactionWinrate[]
  // 单卡影响
  cardImpacts: CardImpact[]
  // 节奏
  avgEndHp: { winner: number; loser: number }
  turnDistribution: Map<number, number> // turn → game count
  // 早期游戏特征
  shortGames: number // <= 7 turns
  longGames: number // >= 13 turns
  // §22-iter1 · 体验指标
  experience: {
    endReasons: Record<string, number> // hp0/fatigue/turnCap/draw → count
    openingStuckRate: number // 任一方起手卡死 %
    avgIdleTurns: { winner: number; loser: number }
    avgEndHandSize: { winner: number; loser: number }
    avgEndDeckSize: { winner: number; loser: number }
    avgCardsPerTurn: { winner: number; loser: number }
    handDepletedRate: number // 终局手牌为 0 的局数 %
  }
}

export function collectStats(results: SimResult[]): SimStats {
  const totalGames = results.length
  const playerWins = results.filter((r) => r.winner === 'player').length
  const aiWins = results.filter((r) => r.winner === 'ai').length
  const draws = totalGames - playerWins - aiWins

  const avgTurns = totalGames > 0
    ? results.reduce((s, r) => s + r.turnCount, 0) / totalGames
    : 0

  const sortedTurns = [...results.map((r) => r.turnCount)].sort((a, b) => a - b)
  const medianTurns = sortedTurns.length > 0
    ? sortedTurns[Math.floor(sortedTurns.length / 2)]
    : 0

  const fatigueCount = results.filter((r) => r.fatigueDeath).length
  const fatigueRate = totalGames > 0 ? (fatigueCount / totalGames) * 100 : 0

  // 阵营胜率
  const shuGames = results.filter(
    (r) => r.playerFaction === 'shu' || r.aiFaction === 'shu',
  )
  const wuGames = results.filter(
    (r) => r.playerFaction === 'wu' || r.aiFaction === 'wu',
  )

  const shuWins = countFactionWins(results, 'shu')
  const wuWins = countFactionWins(results, 'wu')
  const shuWinrate = shuGames.length > 0 ? (shuWins / shuGames.length) * 100 : 0
  const wuWinrate = wuGames.length > 0 ? (wuWins / wuGames.length) * 100 : 0

  // 4 种对位
  const factionMatchups: FactionWinrate[] = []
  for (const p of ['shu', 'wu'] as Faction[]) {
    for (const a of ['shu', 'wu'] as Faction[]) {
      const matchupGames = results.filter(
        (r) => r.playerFaction === p && r.aiFaction === a,
      )
      if (matchupGames.length === 0) continue
      const pw = matchupGames.filter((r) => r.winner === 'player').length
      const aw = matchupGames.filter((r) => r.winner === 'ai').length
      const dr = matchupGames.length - pw - aw
      factionMatchups.push({
        playerFaction: p,
        aiFaction: a,
        games: matchupGames.length,
        playerWins: pw,
        aiWins: aw,
        draws: dr,
        winrate: matchupGames.length > 0 ? (pw / matchupGames.length) * 100 : 0,
      })
    }
  }

  // 单卡影响
  const cardImpactMap = new Map<string, { wins: number; total: number }>()
  for (const r of results) {
    const winnerCards = new Set(
      r.winner === 'player' ? r.playedCards.player
      : r.winner === 'ai' ? r.playedCards.ai
      : []
    )
    const loserCards = new Set(
      r.winner === 'player' ? r.playedCards.ai
      : r.winner === 'ai' ? r.playedCards.player
      : []
    )
    for (const name of winnerCards) {
      const cur = cardImpactMap.get(name) ?? { wins: 0, total: 0 }
      cur.wins++
      cur.total++
      cardImpactMap.set(name, cur)
    }
    for (const name of loserCards) {
      const cur = cardImpactMap.get(name) ?? { wins: 0, total: 0 }
      cur.total++
      cardImpactMap.set(name, cur)
    }
  }
  const cardImpacts: CardImpact[] = []
  for (const [name, data] of cardImpactMap.entries()) {
    if (data.total < 3) continue // 样本太少跳过
    const wr = (data.wins / data.total) * 100
    cardImpacts.push({
      cardName: name,
      appearances: data.total,
      winnerAppearances: data.wins,
      loserAppearances: data.total - data.wins,
      winrate: wr,
      netImpact: wr - 50,
    })
  }
  cardImpacts.sort((a, b) => b.netImpact - a.netImpact)

  // 节奏
  const winnerHps = results.map((r) => (r.winner === 'player' ? r.endHp.player : r.endHp.ai))
  const loserHps = results.map((r) => (r.winner === 'player' ? r.endHp.ai : r.endHp.player))
  const avgWinnerHp = avg(winnerHps)
  const avgLoserHp = avg(loserHps)

  const turnDistribution = new Map<number, number>()
  for (const r of results) {
    turnDistribution.set(r.turnCount, (turnDistribution.get(r.turnCount) ?? 0) + 1)
  }

  const shortGames = results.filter((r) => r.turnCount <= 7).length
  const longGames = results.filter((r) => r.turnCount >= 13).length

  // §22-iter1 · 体验指标聚合
  const endReasons: Record<string, number> = {}
  for (const r of results) {
    const k = r.experience.endReason
    endReasons[k] = (endReasons[k] ?? 0) + 1
  }
  const openingStuckCount = results.filter(
    (r) => r.experience.openingStuck.player || r.experience.openingStuck.ai,
  ).length
  const openingStuckRate = totalGames > 0 ? (openingStuckCount / totalGames) * 100 : 0

  const idleWinner: number[] = []
  const idleLoser: number[] = []
  const endHandWinner: number[] = []
  const endHandLoser: number[] = []
  const endDeckWinner: number[] = []
  const endDeckLoser: number[] = []
  const cardsPerTurnWinner: number[] = []
  const cardsPerTurnLoser: number[] = []
  for (const r of results) {
    if (r.winner === 'draw') continue
    const winSide = r.winner
    const loseSide = winSide === 'player' ? 'ai' : 'player'
    idleWinner.push(r.experience.idleTurns[winSide])
    idleLoser.push(r.experience.idleTurns[loseSide])
    endHandWinner.push(r.experience.endHandSize[winSide])
    endHandLoser.push(r.experience.endHandSize[loseSide])
    endDeckWinner.push(r.experience.endDeckSize[winSide])
    endDeckLoser.push(r.experience.endDeckSize[loseSide])
    cardsPerTurnWinner.push(r.experience.avgCardsPerTurn[winSide])
    cardsPerTurnLoser.push(r.experience.avgCardsPerTurn[loseSide])
  }
  const handDepletedCount = results.filter(
    (r) =>
      r.experience.endHandSize.player === 0 || r.experience.endHandSize.ai === 0,
  ).length
  const handDepletedRate = totalGames > 0 ? (handDepletedCount / totalGames) * 100 : 0

  return {
    totalGames,
    playerWins,
    aiWins,
    draws,
    playerWinrate: totalGames > 0 ? (playerWins / totalGames) * 100 : 0,
    avgTurns,
    medianTurns,
    fatigueRate,
    shuWinrate,
    wuWinrate,
    factionMatchups,
    cardImpacts,
    avgEndHp: { winner: avgWinnerHp, loser: avgLoserHp },
    turnDistribution,
    shortGames,
    longGames,
    experience: {
      endReasons,
      openingStuckRate,
      avgIdleTurns: { winner: avg(idleWinner), loser: avg(idleLoser) },
      avgEndHandSize: { winner: avg(endHandWinner), loser: avg(endHandLoser) },
      avgEndDeckSize: { winner: avg(endDeckWinner), loser: avg(endDeckLoser) },
      avgCardsPerTurn: {
        winner: avg(cardsPerTurnWinner),
        loser: avg(cardsPerTurnLoser),
      },
      handDepletedRate,
    },
  }
}

function countFactionWins(results: SimResult[], faction: Faction): number {
  let wins = 0
  for (const r of results) {
    if (r.winner === 'player' && r.playerFaction === faction) wins++
    if (r.winner === 'ai' && r.aiFaction === faction) wins++
  }
  return wins
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, n) => s + n, 0) / arr.length
}
