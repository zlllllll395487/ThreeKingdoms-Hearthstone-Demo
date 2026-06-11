import { simulateGame } from './simulator.js'
import { installSeeded } from './seeded-random.js'

async function main() {
  installSeeded()
  try {
    const r = await simulateGame({
      seed: 1015,
      playerFaction: 'wu',
      aiFaction: 'wu',
      firstPlayer: 'player',
      maxTurns: 40,
    })
    console.log('OK', r.winner)
  } catch (e: unknown) {
    const err = e as Error
    console.error('CRASH:', err.message)
    console.error(err.stack)
  }
}

main()
