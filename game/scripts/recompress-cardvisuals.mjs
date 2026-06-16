/**
 * cardvisual 重压 · 从 PNG 备份重新生成 800×1104 WebP q=88
 *
 * 背景：
 *   首轮转 WebP q=92 保留原 1133×1563 分辨率，总和 20.6 MB。
 *   实际显示尺寸：codex grid ~190 px，zoom modal ~600 px。
 *   1133→190 px 6× down-scale 反而模糊（浏览器平均像素过多）。
 *   降到 800 宽 → down-scale 4.2×，更接近原生采样，显示更锐利。
 *
 * 流程：
 *   1. 从 d:/三国炉石/backup-original-png/cardvisuals/ 读取 71 张原 PNG
 *   2. sharp resize 800×1104 (fit: inside, 保比例) + WebP q=88
 *   3. 输出覆盖 game/src/assets/ui/cardvisual_*.webp
 *   4. 打印体积对比表
 *
 * 回滚：
 *   原 45 MB PNG 仍在 backup-original-png/cardvisuals/，任何时候可
 *   rerun convert-cardvisuals-to-webp.mjs 还原 q=92 全分辨率版。
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const WEBP_QUALITY = 88
const WEBP_EFFORT = 6
const TARGET_WIDTH = 800
const TARGET_HEIGHT = 1104

const ROOT = path.resolve(process.cwd(), '..')
const BACKUP_DIR = path.join(ROOT, 'backup-original-png/cardvisuals')
const UI_DIR = path.resolve('src/assets/ui')

async function fileBytes(p) {
  try {
    return (await fs.stat(p)).size
  } catch {
    return 0
  }
}

async function main() {
  console.log(
    `[recompress] target=${TARGET_WIDTH}x${TARGET_HEIGHT} quality=${WEBP_QUALITY} effort=${WEBP_EFFORT}`,
  )

  const files = (await fs.readdir(BACKUP_DIR)).filter((f) =>
    /^cardvisual_.*\.png$/i.test(f),
  )
  let totalBefore = 0
  let totalAfter = 0
  let converted = 0

  for (const f of files) {
    const src = path.join(BACKUP_DIR, f)
    const base = path.basename(f, path.extname(f))
    const dest = path.join(UI_DIR, `${base}.webp`)

    const beforeWebp = await fileBytes(dest)
    await sharp(src)
      .resize({
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
      .toFile(dest)
    const afterWebp = await fileBytes(dest)

    totalBefore += beforeWebp
    totalAfter += afterWebp
    converted += 1
  }

  console.log(
    `[recompress] 处理 ${converted} 张 · ` +
      `q=92 全尺寸 ${(totalBefore / 1024 / 1024).toFixed(1)} MB → ` +
      `q=88 800x ${(totalAfter / 1024 / 1024).toFixed(1)} MB · ` +
      `节省 ${totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0}%`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
