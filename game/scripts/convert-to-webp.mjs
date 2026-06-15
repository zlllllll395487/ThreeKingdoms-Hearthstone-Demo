/**
 * PNG → WebP 批量转换 · 仅处理立绘与 Loading 背景
 *
 * 处理范围：
 *   - game/src/assets/portraits/*.png       89 张
 *   - game/src/assets/ui/loading_bg*.png    4 张
 *
 * 不处理：
 *   - ui/cardvisual_*.png（图鉴主视觉，保留 PNG）
 *   - ui/ 下其它资源（frame / kw / emblem / sphere / btn 等，保留 PNG）
 *
 * 行为：
 *   1. 已有 .webp 同名文件时跳过该项（idempotent，可重复执行）
 *   2. 转换成功后删除原 PNG
 *   3. 退出时打印体积对比表
 *
 * 回滚：原 PNG 备份在 d:/三国炉石/backup-original-png/ 下
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const WEBP_QUALITY = 88
const WEBP_EFFORT = 6

const PORTRAIT_DIR = path.resolve('src/assets/portraits')
const UI_DIR = path.resolve('src/assets/ui')

async function convertOne(srcPath, destPath) {
  await sharp(srcPath).webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT }).toFile(destPath)
}

async function fileBytes(p) {
  return (await fs.stat(p)).size
}

async function processFiles(dir, filterFn, label) {
  const files = (await fs.readdir(dir)).filter(filterFn)
  let totalBefore = 0
  let totalAfter = 0
  let converted = 0
  let skipped = 0
  for (const f of files) {
    const src = path.join(dir, f)
    const base = path.basename(f, path.extname(f))
    const dest = path.join(dir, `${base}.webp`)
    try {
      await fs.access(dest)
      skipped += 1
      continue
    } catch {
      // 不存在 → 转换
    }
    const before = await fileBytes(src)
    await convertOne(src, dest)
    const after = await fileBytes(dest)
    await fs.unlink(src)
    totalBefore += before
    totalAfter += after
    converted += 1
  }
  console.log(
    `[${label}] 转换 ${converted} 张, 跳过 ${skipped} 张 · ` +
      `${(totalBefore / 1024).toFixed(0)} KB → ${(totalAfter / 1024).toFixed(0)} KB · ` +
      `节省 ${totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0}%`,
  )
}

async function main() {
  console.log(`[convert] quality=${WEBP_QUALITY}, effort=${WEBP_EFFORT}`)
  await processFiles(PORTRAIT_DIR, (f) => /\.png$/i.test(f), 'portraits')
  await processFiles(
    UI_DIR,
    (f) => /^loading_bg.*\.png$/i.test(f),
    'ui/loading_bg',
  )
  console.log('[convert] done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
