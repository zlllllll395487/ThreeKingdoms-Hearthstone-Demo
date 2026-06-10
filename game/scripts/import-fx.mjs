/**
 * §19.6 Phase C · 批量导入 7 套特效 sprite 序列帧
 *
 * 来源：asset/新增ui组件0605/{冰冻,召唤光柱,抽牌发光,武器斩击,治疗光柱,火焰aoe爆炸,火球飞行}
 * 命名乱：`1780648336600-yhln7-removebg-preview 1.png`
 * 目标：game/src/assets/fx/fx_<name>_<frame>.png（02 位补零）
 * 压缩：q=90（与其他资源一致）
 */

import { promises as fs } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const SRC_ROOT = join(REPO_ROOT, 'asset', '新增ui组件0605')
const DST = join(REPO_ROOT, 'game', 'src', 'assets', 'fx')

// 映射：中文文件夹 → fx 命名前缀（按 plan §13.4 / §19.6.3）
const FX_MAP = [
  ['冰冻', 'freeze'],
  ['召唤光柱', 'summon'],
  ['抽牌发光', 'draw_glow'],
  ['武器斩击', 'weapon_slash'],
  ['治疗光柱', 'heal_pillar'],
  ['火焰aoe爆炸', 'fire_aoe'],
  ['火球飞行', 'fire_projectile'],
]

function fmtMB(b) {
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

async function main() {
  await fs.mkdir(DST, { recursive: true })
  let totalBefore = 0
  let totalAfter = 0
  let totalFiles = 0

  for (const [folder, name] of FX_MAP) {
    const srcDir = join(SRC_ROOT, folder)
    let entries
    try {
      entries = await fs.readdir(srcDir)
    } catch (e) {
      console.log(`  ❌ 跳过 ${folder}：${e.message}`)
      continue
    }
    // 文件名形如 `1780648336600-yhln7-removebg-preview 1.png` / 末尾 1/2/3...
    const pngs = entries.filter((e) => e.toLowerCase().endsWith('.png'))
    // 按文件名末尾的帧序号排序
    pngs.sort((a, b) => {
      const ma = a.match(/(\d+)\.png$/i)
      const mb = b.match(/(\d+)\.png$/i)
      const na = ma ? parseInt(ma[1], 10) : 0
      const nb = mb ? parseInt(mb[1], 10) : 0
      return na - nb
    })

    let frame = 1
    for (const file of pngs) {
      const srcPath = join(srcDir, file)
      const dstFile = `fx_${name}_${String(frame).padStart(2, '0')}.png`
      const dstPath = join(DST, dstFile)
      const st = await fs.stat(srcPath)
      try {
        await sharp(srcPath)
          .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 })
          .toFile(dstPath + '.tmp')
        await fs.rename(dstPath + '.tmp', dstPath)
        const ds = (await fs.stat(dstPath)).size
        totalBefore += st.size
        totalAfter += ds
        totalFiles++
        const saved = (1 - ds / st.size) * 100
        console.log(
          `  ✓ ${folder}/${file.padEnd(60)} → ${dstFile.padEnd(28)} (-${saved.toFixed(0)}%)`,
        )
      } catch (err) {
        console.log(`  ❌ ${folder}/${file}: ${err.message}`)
      }
      frame++
    }
    console.log(`  ${folder} = ${frame - 1} 帧`)
  }

  console.log(
    `\n[import-fx] ${totalFiles} 帧 · ${fmtMB(totalBefore)} → ${fmtMB(totalAfter)} (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
