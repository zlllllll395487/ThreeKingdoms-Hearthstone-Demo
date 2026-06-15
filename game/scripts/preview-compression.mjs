/**
 * 压缩样本生成 · 用于用户视觉对比
 *
 * 输出位置：d:/三国炉石/compression-preview/
 *   ├─ loading_bg/      原图 + 3 档压缩
 *   └─ portraits/       选 6 张代表性立绘 + 2 档压缩
 *
 * 三种压缩档：
 *   - JPEG q=92  (近无损)
 *   - JPEG q=88  (推荐档)
 *   - JPEG q=82  (激进档，最小体积)
 *
 * 立绘保留 PNG 因为带 alpha：
 *   - PNG palette q=90 (近无损)
 *   - PNG palette q=80 (推荐档)
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const ROOT = path.resolve(process.cwd(), '..')
const SRC_UI = path.join(ROOT, 'game/src/assets/ui')
const SRC_PORTRAITS = path.join(ROOT, 'game/src/assets/portraits')
const OUT = path.join(ROOT, 'compression-preview')

const PORTRAIT_SAMPLES = [
  'guanyu.png',
  'zhouyu.png',
  'lvmeng.png',
  'huangzhong.png',
  'zhouyu.png',
  'daxiao.png',
]

async function fileSizeKB(p) {
  const st = await fs.stat(p)
  return (st.size / 1024).toFixed(0)
}

async function copyOriginal(src, destDir) {
  const base = path.basename(src)
  const dest = path.join(destDir, `_original_${base}`)
  await fs.copyFile(src, dest)
  return dest
}

async function compressBgJpeg(src, destDir, quality) {
  const base = path.basename(src, path.extname(src))
  const dest = path.join(destDir, `${base}__q${quality}.jpg`)
  await sharp(src)
    .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toFile(dest)
  return dest
}

async function compressPortraitPng(src, destDir, quality) {
  const base = path.basename(src, path.extname(src))
  const dest = path.join(destDir, `${base}__pngq${quality}.png`)
  await sharp(src)
    .png({ quality, palette: true, compressionLevel: 9, effort: 10 })
    .toFile(dest)
  return dest
}

async function compressPortraitJpeg(src, destDir, quality) {
  const base = path.basename(src, path.extname(src))
  const dest = path.join(destDir, `${base}__jpgq${quality}.jpg`)
  await sharp(src)
    .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(dest)
  return dest
}

async function compressPortraitWebp(src, destDir, quality) {
  const base = path.basename(src, path.extname(src))
  const dest = path.join(destDir, `${base}__webpq${quality}.webp`)
  await sharp(src)
    .webp({ quality, effort: 6 })
    .toFile(dest)
  return dest
}

async function processLoadingBgs() {
  const files = await fs.readdir(SRC_UI)
  const bgs = files.filter((f) => /^loading_bg/.test(f) && /\.png$/i.test(f)).sort()
  const outDir = path.join(OUT, 'loading_bg')
  const rows = []
  for (const f of bgs) {
    const src = path.join(SRC_UI, f)
    const orig = await copyOriginal(src, outDir)
    const q92 = await compressBgJpeg(src, outDir, 92)
    const q88 = await compressBgJpeg(src, outDir, 88)
    const q82 = await compressBgJpeg(src, outDir, 82)
    rows.push({
      file: f,
      original: await fileSizeKB(orig),
      q92: await fileSizeKB(q92),
      q88: await fileSizeKB(q88),
      q82: await fileSizeKB(q82),
    })
  }
  return rows
}

async function processPortraits() {
  const allFiles = await fs.readdir(SRC_PORTRAITS)
  const samples = []
  for (const want of PORTRAIT_SAMPLES) {
    if (allFiles.includes(want)) samples.push(want)
  }
  // 不够 6 张就补几张体积大的
  if (samples.length < 6) {
    const sizes = await Promise.all(
      allFiles
        .filter((f) => /\.png$/i.test(f))
        .map(async (f) => ({ f, size: (await fs.stat(path.join(SRC_PORTRAITS, f))).size })),
    )
    sizes.sort((a, b) => b.size - a.size)
    for (const { f } of sizes) {
      if (!samples.includes(f)) samples.push(f)
      if (samples.length >= 6) break
    }
  }
  const outDir = path.join(OUT, 'portraits')
  const rows = []
  for (const f of samples) {
    const src = path.join(SRC_PORTRAITS, f)
    const orig = await copyOriginal(src, outDir)
    const q90 = await compressPortraitPng(src, outDir, 90)
    const q80 = await compressPortraitPng(src, outDir, 80)
    const jpg92 = await compressPortraitJpeg(src, outDir, 92)
    const jpg88 = await compressPortraitJpeg(src, outDir, 88)
    const wp88 = await compressPortraitWebp(src, outDir, 88)
    rows.push({
      file: f,
      original: await fileSizeKB(orig),
      pngq90: await fileSizeKB(q90),
      pngq80: await fileSizeKB(q80),
      jpgq92: await fileSizeKB(jpg92),
      jpgq88: await fileSizeKB(jpg88),
      webpq88: await fileSizeKB(wp88),
    })
  }
  return rows
}

async function writeReadme(bgRows, portraitRows) {
  const sumKB = (arr, key) => arr.reduce((s, r) => s + Number(r[key]), 0).toFixed(0)
  const lines = []
  lines.push('# 压缩对比样本')
  lines.push('')
  lines.push('文件命名：`_original_*` 为原图，其它为压缩档。直接打开看图对比。')
  lines.push('')
  lines.push('## Loading 背景（4 张满屏摄影图）')
  lines.push('')
  lines.push('| 文件 | 原图 KB | JPEG q92 | JPEG q88（推荐） | JPEG q82 |')
  lines.push('|:--|:-:|:-:|:-:|:-:|')
  for (const r of bgRows) {
    lines.push(`| ${r.file} | ${r.original} | ${r.q92} | **${r.q88}** | ${r.q82} |`)
  }
  lines.push(`| **总计** | **${sumKB(bgRows, 'original')}** | ${sumKB(bgRows, 'q92')} | **${sumKB(bgRows, 'q88')}** | ${sumKB(bgRows, 'q82')} |`)
  lines.push('')
  lines.push('## Portraits（6 张样本立绘）· 89 张全部无 alpha 通道')
  lines.push('')
  lines.push('| 文件 | 原图 KB | PNG q90 | PNG q80 | JPEG q92 | JPEG q88（推荐） | WebP q88 |')
  lines.push('|:--|:-:|:-:|:-:|:-:|:-:|:-:|')
  for (const r of portraitRows) {
    lines.push(`| ${r.file} | ${r.original} | ${r.pngq90} | ${r.pngq80} | ${r.jpgq92} | **${r.jpgq88}** | ${r.webpq88} |`)
  }
  lines.push(`| **总计** | **${sumKB(portraitRows, 'original')}** | ${sumKB(portraitRows, 'pngq90')} | ${sumKB(portraitRows, 'pngq80')} | ${sumKB(portraitRows, 'jpgq92')} | **${sumKB(portraitRows, 'jpgq88')}** | ${sumKB(portraitRows, 'webpq88')} |`)
  lines.push('')
  await fs.writeFile(path.join(OUT, 'README.md'), lines.join('\n'), 'utf8')
}

async function main() {
  console.log('[preview] processing loading backgrounds...')
  const bgRows = await processLoadingBgs()
  console.log('[preview] processing portraits...')
  const portraitRows = await processPortraits()
  await writeReadme(bgRows, portraitRows)
  console.log('[preview] done')
  console.log('Loading 背景：')
  console.table(bgRows)
  console.log('Portraits：')
  console.table(portraitRows)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
