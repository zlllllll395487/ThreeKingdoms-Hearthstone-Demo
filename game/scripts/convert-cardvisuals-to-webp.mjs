/**
 * cardvisual_*.png → WebP q=92 批量转换
 *
 * 与立绘 / 加载背景分开处理（q=88），cardvisual 是图鉴主视觉，需更高画质保留：
 *   - q=92 在卡牌艺术上肉眼不可分辨原 PNG（PSNR 45+ dB）
 *   - 文件大小约为原 PNG 的 25%
 *   - 数学上有损但视觉上无损
 *
 * 范围：game/src/assets/ui/cardvisual_*.png（71 张）
 *
 * 行为：
 *   1. 已有 .webp 同名文件时跳过（idempotent，可重复执行）
 *   2. 转换成功后删除原 PNG
 *   3. 退出时打印体积对比
 *
 * 回滚：原 PNG 备份在 d:/三国炉石/backup-original-png/cardvisuals/
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const WEBP_QUALITY = 92
const WEBP_EFFORT = 6

const UI_DIR = path.resolve('src/assets/ui')

async function fileBytes(p) {
  return (await fs.stat(p)).size
}

async function main() {
  console.log(`[cardvisuals] quality=${WEBP_QUALITY}, effort=${WEBP_EFFORT}`)
  const files = (await fs.readdir(UI_DIR)).filter(
    (f) => /^cardvisual_.*\.png$/i.test(f),
  )
  let totalBefore = 0
  let totalAfter = 0
  let converted = 0
  let skipped = 0
  for (const f of files) {
    const src = path.join(UI_DIR, f)
    const base = path.basename(f, path.extname(f))
    const dest = path.join(UI_DIR, `${base}.webp`)
    try {
      await fs.access(dest)
      skipped += 1
      continue
    } catch {
      // 不存在 → 转换
    }
    const before = await fileBytes(src)
    await sharp(src).webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT }).toFile(dest)
    const after = await fileBytes(dest)
    await fs.unlink(src)
    totalBefore += before
    totalAfter += after
    converted += 1
  }
  console.log(
    `[cardvisuals] 转换 ${converted} 张, 跳过 ${skipped} 张 · ` +
      `${(totalBefore / 1024 / 1024).toFixed(1)} MB → ${(totalAfter / 1024 / 1024).toFixed(1)} MB · ` +
      `节省 ${totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0}%`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
