/**
 * 美术资源「横屏总览」大图
 *
 * 把四类资产（立绘 / 卡面 / UI 元素 / 界面背景）按横向分栏排进一张宽图，
 * 用于复盘 / 作品集里横屏展示，避免三张高矮不一的竖图并排难看。
 *
 * 运行（game/ 目录下）：node scripts/generate-overview.mjs
 * 输出：作品展示包/设计文档/美术总览/00-美术资源总览-横屏.png（+ .jpg）
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const ROOT = path.resolve(process.cwd(), '..')
const SRC_UI = path.join(ROOT, 'game/src/assets/ui')
const SRC_PORTRAITS = path.join(ROOT, 'game/src/assets/portraits')
const OUT = path.join(ROOT, '作品展示包/设计文档/美术总览')
const IMG_RE = /\.(png|webp|jpg|jpeg)$/i

const CANVAS_W = 2400
const MARGIN_X = 36
const GAP = 8
const BAND_GAP = 28
const BG = { r: 26, g: 22, b: 16, alpha: 1 }
const GOLD = '#e8c84a'

async function listImages(dir, filterFn) {
  const files = (await fs.readdir(dir)).filter((f) => IMG_RE.test(f) && (!filterFn || filterFn(f)))
  const byBase = new Map()
  for (const f of files) {
    const base = f.replace(IMG_RE, '')
    const ext = path.extname(f).toLowerCase()
    const cur = byBase.get(base)
    if (!cur || (ext === '.webp' && !cur.endsWith('.webp'))) byBase.set(base, f)
  }
  return [...byBase.values()].sort()
}

/** 在数组里等距取样 n 个，保证有代表性 */
function sample(arr, n) {
  if (arr.length <= n) return arr.slice()
  const out = []
  for (let i = 0; i < n; i++) out.push(arr[Math.floor((i * arr.length) / n)])
  return out
}

async function svgText(text, fontSize, w, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${MARGIN_X}" y="${Math.floor(h * 0.74)}" font-size="${fontSize}" fill="${GOLD}" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="bold">${text}</text></svg>`
  try {
    return await sharp(Buffer.from(svg)).png().toBuffer()
  } catch {
    return null
  }
}

/** 渲染一个横向分栏，返回 { composites, height } */
async function buildBand(absPaths, { title, cellW, cellH, cols, yStart }) {
  const composites = []
  const labelH = 46
  const t = await svgText(title, 30, CANVAS_W, labelH)
  if (t) composites.push({ input: t, left: 0, top: yStart })
  const gridY = yStart + labelH
  for (let i = 0; i < absPaths.length; i++) {
    let buf
    try {
      buf = await sharp(absPaths[i])
        .resize(cellW, cellH, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    } catch {
      continue
    }
    const meta = await sharp(buf).metadata()
    const col = i % cols
    const row = Math.floor(i / cols)
    const cellX = MARGIN_X + col * (cellW + GAP)
    const cellY = gridY + row * (cellH + GAP)
    const left = cellX + Math.max(0, Math.floor((cellW - meta.width) / 2))
    const top = cellY + Math.max(0, Math.floor((cellH - meta.height) / 2))
    composites.push({ input: buf, left, top })
  }
  const rows = Math.ceil(absPaths.length / cols)
  const height = labelH + rows * cellH + (rows - 1) * GAP
  return { composites, height }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })

  const portraits = await listImages(SRC_PORTRAITS)
  const cardvisuals = await listImages(SRC_UI, (f) => /^cardvisual_/i.test(f))
  const otherUi = await listImages(SRC_UI, (f) => !/^cardvisual_/i.test(f))
  // 按尺寸分「小元素」与「大背景」
  const elements = []
  const backgrounds = []
  for (const f of otherUi) {
    const abs = path.join(SRC_UI, f)
    let m
    try {
      m = await sharp(abs).metadata()
    } catch {
      continue
    }
    ;(Math.max(m.width || 0, m.height || 0) >= 500 ? backgrounds : elements).push(abs)
  }

  // 各栏取样（保持横屏比例：立绘/卡面 2 行、UI 全部、背景 2 行）
  const bands = [
    {
      title: `武将立绘 · 共 ${portraits.length} 张`,
      files: sample(portraits.map((f) => path.join(SRC_PORTRAITS, f)), 34),
      cellW: 130,
      cellH: 174,
      cols: 17,
    },
    {
      title: `卡牌主视觉 · 共 ${cardvisuals.length} 张`,
      files: sample(cardvisuals.map((f) => path.join(SRC_UI, f)), 34),
      cellW: 130,
      cellH: 180,
      cols: 17,
    },
    {
      title: `UI 元素 · 共 ${elements.length} 个`,
      files: elements,
      cellW: 86,
      cellH: 86,
      cols: 25,
    },
    {
      title: `界面背景 · 共 ${backgrounds.length} 张`,
      files: sample(backgrounds, 20),
      cellW: 220,
      cellH: 126,
      cols: 10,
    },
  ]

  const titleH = 84
  const composites = []
  // 顶部主标题
  const head = await svgText('三国炉石 · 美术资源总览', 46, CANVAS_W, titleH)
  if (head) composites.push({ input: head, left: 0, top: 18 })

  let y = titleH + 10
  for (const b of bands) {
    const { composites: bc, height } = await buildBand(b.files, {
      title: b.title,
      cellW: b.cellW,
      cellH: b.cellH,
      cols: b.cols,
      yStart: y,
    })
    composites.push(...bc)
    y += height + BAND_GAP
  }
  const H = y + 16

  const outPng = path.join(OUT, '00-美术资源总览-横屏.png')
  await sharp({ create: { width: CANVAS_W, height: H, channels: 4, background: BG } })
    .composite(composites)
    .png()
    .toFile(outPng)

  // 顺手出一份 JPG（更小，方便贴飞书）
  const outJpg = outPng.replace('.png', '.jpg')
  await sharp(outPng).flatten({ background: '#1a1610' }).jpeg({ quality: 88, mozjpeg: true }).toFile(outJpg)

  const kb = (p) => (require('fs').statSync(p).size / 1024).toFixed(0)
  const { statSync } = await import('fs')
  console.log(`✓ 横屏总览 ${CANVAS_W}×${H}`)
  console.log(`  PNG ${(statSync(outPng).size / 1024).toFixed(0)} KB`)
  console.log(`  JPG ${(statSync(outJpg).size / 1024).toFixed(0)} KB`)
  console.log(`→ ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
