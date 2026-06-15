import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
const dir = path.resolve('src/assets/portraits')
const files = (await fs.readdir(dir)).filter(f => /\.png$/i.test(f))
let withAlpha = 0
let withoutAlpha = 0
const alphaSamples = []
const noAlphaSamples = []
for (const f of files) {
  try {
    const m = await sharp(path.join(dir, f)).metadata()
    if (m.hasAlpha) {
      withAlpha++
      if (alphaSamples.length < 5) alphaSamples.push(f)
    } else {
      withoutAlpha++
      if (noAlphaSamples.length < 5) noAlphaSamples.push(f)
    }
  } catch {}
}
console.log(`总数：${files.length}, 带 alpha: ${withAlpha}, 无 alpha: ${withoutAlpha}`)
console.log('带 alpha 样本:', alphaSamples)
console.log('无 alpha 样本:', noAlphaSamples)
