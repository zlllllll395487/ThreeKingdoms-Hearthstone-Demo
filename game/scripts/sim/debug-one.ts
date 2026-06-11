import { simulateGame } from './simulator.js'
import { installSeeded } from './seeded-random.js'

async function main() {
  installSeeded()
  const r = await simulateGame({
    seed: 1,
    playerFaction: 'shu',
    aiFaction: 'shu',
    firstPlayer: 'player',
    maxTurns: 40,
  })
  console.log('Winner:', r.winner)
  console.log('Turns:', r.turnCount)
  console.log('endHp:', r.endHp)
  console.log('Player played count:', r.playedCards.player.length)
  console.log('AI played count:', r.playedCards.ai.length)
  console.log('Player played first 10:', r.playedCards.player.slice(0, 10))
  console.log('AI played first 10:', r.playedCards.ai.slice(0, 10))
  console.log('Log length:', r.log.length)
  console.log('Last 5 log:', r.log.slice(-5).map((l) => `[${l.kind}] ${l.text}`))
  console.log('Fatigue:', r.fatigueDeath)
}

main().catch((e) => {
  console.error('CRASH:', e.message)
  console.error(e.stack)
  process.exit(1)
})
