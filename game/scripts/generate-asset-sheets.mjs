/**
 * 美术资源「分类总览拼图」生成器
 *
 * 把 game/src/assets 下的资产按类拼成几张大图（contact sheet），用于作品集 / 复盘展示。
 * 复用项目已装的 sharp（见 preview-compression.mjs 同款写法）。
 *
 * 运行（在 game/ 目录下）：
 *   node scripts/generate-asset-sheets.mjs
 *
 * 输出：作品展示包/设计文档/美术总览/  下若干 PNG + 一份 README。
 *
 * 分类（不重叠口径）：
 *   1. 武将立绘      portraits/                （约 89）
 *   2. 卡牌主视觉    ui/cardvisual_*           （约 71）
 *   3. UI 元素       ui/ 非 cardvisual 的小图   （图标 / 按钮 / 印章 / 数值球 / 边框…）
 *   4. 界面背景      ui/ 非 cardvisual 的大图   （主菜单 / 战斗 / 子页 / 弹窗 / 加载…）
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const ROOT = path.resolve(process.cwd(), '..')
const SRC_UI = path.join(ROOT, 'game/src/assets/ui')
const SRC_PORTRAITS = path.join(ROOT, 'game/src/assets/portraits')
const OUT = path.join(ROOT, '作品展示包/设计文档/美术总览')

const IMG_RE = /\.(png|webp|jpg|jpeg)$/i
/** 区分「大图背景」与「小元素」的尺寸阈值（像素，按最长边） */
const BG_THRESHOLD = 500

/** 读目录、筛图、按 basename 去重（同名优先 webp，避免 png/webp 双份重复） */
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

/** 渲染一个标题条（SVG 文本）；若系统字体渲染失败则返回 null，不影响主流程 */
async function renderTitle(text, width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text x="24" y="${Math.floor(height * 0.66)}" font-size="${Math.floor(height * 0.5)}"
      fill="#e8c84a" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="bold">${text}</text>
  </svg>`
  try {
    return await sharp(Buffer.from(svg)).png().toBuffer()
  } catch {
    return null
  }
}

/**
 * 生成一张分类拼图
 * @param {string[]} absPaths 资产绝对路径数组
 * @param {object} opts { title, outName, cellW, cellH, cols }
 */
async function makeSheet(absPaths, opts) {
  const { title, outName, cellW, cellH, cols } = opts
  const pad = 18
  const titleH = 76
  const n = absPaths.length
  if (n === 0) return null
  const rows = Math.ceil(n / cols)
  const W = cols * cellW + pad * (cols + 1)
  const H = titleH + rows * cellH + pad * (rows + 1)

  const composites = []

  // 标题
  const titleBuf = await renderTitle(`${title}  ·  ${n} 张`, W, titleH)
  if (titleBuf) composites.push({ input: titleBuf, left: 0, top: 0 })

  // 缩略并居中放入网格
  for (let i = 0; i < n; i++) {
    let buf
    try {
      buf = await sharp(absPaths[i])
        .resize(cellW, cellH, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    } catch (e) {
      console.warn(`  跳过（读取失败）：${path.basename(absPaths[i])} — ${e.message}`)
      continue
    }
    const meta = await sharp(buf).metadata()
    const col = i % cols
    const row = Math.floor(i / cols)
    const cellX = pad + col * (cellW + pad)
    const cellY = titleH + pad + row * (cellH + pad)
    const left = cellX + Math.max(0, Math.floor((cellW - meta.width) / 2))
    const top = cellY + Math.max(0, Math.floor((cellH - meta.height) / 2))
    composites.push({ input: buf, left, top })
  }

  await fs.mkdir(OUT, { recursive: true })
  const outPath = path.join(OUT, outName)
  await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 26, g: 22, b: 16, alpha: 1 } },
  })
    .composite(composites)
    .png()
    .toFile(outPath)

  const kb = ((await fs.stat(outPath)).size / 1024).toFixed(0)
  console.log(`  ✓ ${outName}  (${n} 张, ${W}×${H}, ${kb} KB)`)
  return { outName, n, W, H }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })
  console.log('[sheets] 分类收集资产…')

  // 1. 立绘
  const portraits = (await listImages(SRC_PORTRAITS)).map((f) => path.join(SRC_PORTRAITS, f))

  // 2. 卡牌主视觉
  const cardvisuals = (await listImages(SRC_UI, (f) => /^cardvisual_/i.test(f))).map((f) =>
    path.join(SRC_UI, f),
  )

  // 3/4. 其它 UI：按尺寸拆「小元素」与「大背景」
  const otherUi = await listImages(SRC_UI, (f) => !/^cardvisual_/i.test(f))
  const elements = []
  const backgrounds = []
  for (const f of otherUi) {
    const abs = path.join(SRC_UI, f)
    let meta
    try {
      meta = await sharp(abs).metadata()
    } catch {
      continue
    }
    const longSide = Math.max(meta.width || 0, meta.height || 0)
    ;(longSide >= BG_THRESHOLD ? backgrounds : elements).push(abs)
  }

  console.log(
    `[sheets] 立绘 ${portraits.length} / 卡面 ${cardvisuals.length} / UI元素 ${elements.length} / 背景 ${backgrounds.length}`,
  )
  console.log('[sheets] 生成拼图…')

  const results = []
  results.push(
    await makeSheet(portraits, {
      title: '武将立绘',
      outName: '01-武将立绘墙.png',
      cellW: 180,
      cellH: 240,
      cols: 8,
    }),
  )
  results.push(
    await makeSheet(cardvisuals, {
      title: '卡牌主视觉',
      outName: '02-卡牌主视觉墙.png',
      cellW: 180,
      cellH: 248,
      cols: 8,
    }),
  )
  results.push(
    await makeSheet(elements, {
      title: 'UI 元素（图标 / 按钮 / 印章 / 数值球 / 边框）',
      outName: '03-UI元素总览.png',
      cellW: 116,
      cellH: 116,
      cols: 12,
    }),
  )
  results.push(
    await makeSheet(backgrounds, {
      title: '界面背景（主菜单 / 战斗 / 子页 / 弹窗 / 加载）',
      outName: '04-界面背景总览.png',
      cellW: 300,
      cellH: 170,
      cols: 5,
    }),
  )

  // 索引 README
  const ok = results.filter(Boolean)
  const lines = ['# 美术总览拼图', '', '由 `game/scripts/generate-asset-sheets.mjs` 自动生成。', '']
  lines.push('| 拼图 | 张数 |')
  lines.push('|:--|:-:|')
  for (const r of ok) lines.push(`| ${r.outName} | ${r.n} |`)
  lines.push(`| **合计** | **${ok.reduce((s, r) => s + r.n, 0)}** |`)
  lines.push('')
  await fs.writeFile(path.join(OUT, 'README.md'), lines.join('\n'), 'utf8')

  console.log(`[sheets] 完成 → ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
