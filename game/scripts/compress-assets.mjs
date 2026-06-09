/**
 * PNG 批量压缩脚本
 *
 * 用法：
 *   node scripts/compress-assets.mjs              # 批量压缩 src/assets/**\/*.png
 *   node scripts/compress-assets.mjs --sample     # 只处理 3 张样品到 _compress_samples/
 *   node scripts/compress-assets.mjs --dry        # 模拟运行不写文件
 *
 * 策略：sharp + palette 量化（pngquant 同款算法），quality 90
 * 原始：game/_assets_original/  保留不动
 * 目标：game/src/assets/        覆盖压缩
 */

import { promises as fs } from 'node:fs'
import { join, relative, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GAME_ROOT = join(__dirname, '..')
const SRC = join(GAME_ROOT, '_assets_original')
const DST = join(GAME_ROOT, 'src', 'assets')
const SAMPLE_DST = join(GAME_ROOT, '_compress_samples')

const args = process.argv.slice(2)
const SAMPLE = args.includes('--sample')
const DRY = args.includes('--dry')

// 样品文件（人工挑选最具代表性的 3 张）
const SAMPLE_FILES = [
  'portraits/guanyu.png',           // 主公立绘 · 复杂场景 + 角色
  'ui/frame_legendary.png',          // 4 MB 边框 · 透明通道 + 描金
  'ui/splash_bg.png',                // 2 MB 大背景 · 复杂细节
]

async function walk(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) await walk(full, results)
    else if (e.isFile() && e.name.toLowerCase().endsWith('.png')) results.push(full)
  }
  return results
}

async function compressOne(srcPath, dstPath) {
  await fs.mkdir(dirname(dstPath), { recursive: true })
  // sharp PNG palette 模式：色板量化（≈ pngquant）
  // quality 90 = 视觉无损 / compressionLevel 9 = 最高 deflate
  // effort 10 = 最优压缩搜索
  await sharp(srcPath)
    .png({
      palette: true,
      quality: 90,
      compressionLevel: 9,
      effort: 10,
    })
    .toFile(dstPath + '.tmp')
  await fs.rename(dstPath + '.tmp', dstPath)
}

function fmtMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

async function main() {
  const files = SAMPLE
    ? SAMPLE_FILES.map((rel) => join(SRC, rel))
    : await walk(SRC)

  console.log(`[compress] ${files.length} files from ${SRC}`)
  console.log(`[compress] dst = ${SAMPLE ? SAMPLE_DST : DST}`)
  if (DRY) console.log('[compress] DRY RUN, no files written')

  let totalBefore = 0
  let totalAfter = 0
  let count = 0

  for (const srcPath of files) {
    const rel = relative(SRC, srcPath)
    const dstPath = SAMPLE
      ? join(SAMPLE_DST, rel)
      : join(DST, rel)

    const srcStat = await fs.stat(srcPath)
    totalBefore += srcStat.size

    if (!DRY) {
      try {
        await compressOne(srcPath, dstPath)
        const dstStat = await fs.stat(dstPath)
        totalAfter += dstStat.size
        const saved = (1 - dstStat.size / srcStat.size) * 100
        if (SAMPLE || saved > 50) {
          console.log(
            `  ${rel.padEnd(50)} ${fmtMB(srcStat.size).padStart(10)} → ${fmtMB(dstStat.size).padStart(10)}  (-${saved.toFixed(0)}%)`,
          )
        }
      } catch (err) {
        console.error(`  [SKIP] ${rel}: ${err.message}`)
        // 失败时复制原文件保底
        if (!SAMPLE) await fs.copyFile(srcPath, dstPath)
      }
    } else {
      totalAfter += srcStat.size
    }
    count++
    if (count % 20 === 0 && !SAMPLE) {
      process.stdout.write(`  ... ${count}/${files.length} done\r`)
    }
  }

  console.log('\n[compress] done')
  console.log(`  total before:  ${fmtMB(totalBefore)}`)
  console.log(`  total after :  ${fmtMB(totalAfter)}`)
  console.log(
    `  saved       :  ${fmtMB(totalBefore - totalAfter)} (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
