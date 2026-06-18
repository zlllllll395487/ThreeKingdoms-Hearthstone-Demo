/**
 * 数值平衡「6 轮收敛曲线」图
 *
 * 把蜀 / 吴胜率随迭代收敛的过程画成折线图，用于复盘 / README 里数值平衡一段配图。
 * 用 SVG 画图 + sharp 栅格化（项目已装 sharp）。
 *
 * 运行（game/ 目录下）：node scripts/generate-balance-chart.mjs
 * 输出：作品展示包/设计文档/数据图/数值平衡-收敛曲线.png（+ .jpg）
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const ROOT = path.resolve(process.cwd(), '..')
const OUT = path.join(ROOT, '作品展示包/设计文档/数据图')

const labels = ['baseline', 'iter2', 'iter3', 'iter4', 'iter5', 'iter6.1']
const shu = [99.3, 99.2, 90.3, 85.1, 62.1, 69.5]
const wu = [34.0, 34.1, 43.1, 48.3, 71.2, 63.9]
const gap = [65.3, 65.1, 47.2, 36.8, 9.1, 5.6]

const W = 1280
const H = 720
const padL = 96
const padR = 60
const padT = 110
const padB = 84
const plotW = W - padL - padR
const plotH = H - padT - padB

const COL_SHU = '#2e8b57' // 蜀 · 绿
const COL_WU = '#c0392b' // 吴 · 红
const INK = '#2a1c10'
const GRID = '#d8d0c0'

const x = (i) => padL + (i * plotW) / (labels.length - 1)
const y = (v) => padT + (1 - v / 100) * plotH

function poly(arr) {
  return arr.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
}

function pts(arr, color) {
  return arr
    .map(
      (v, i) =>
        `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="6" fill="${color}" stroke="#fff" stroke-width="2"/>` +
        `<text x="${x(i).toFixed(1)}" y="${(y(v) - 14).toFixed(1)}" font-size="20" fill="${color}" text-anchor="middle" font-weight="bold">${v}%</text>`,
    )
    .join('')
}

function build() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`
  s += `<rect width="${W}" height="${H}" fill="#faf8f2"/>`
  // 标题
  s += `<text x="${padL}" y="56" font-size="38" fill="${INK}" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="bold">数值平衡 · 阵营胜率 6 轮迭代收敛</text>`
  s += `<text x="${padL}" y="86" font-size="22" fill="#7a6a52" font-family="Microsoft YaHei, sans-serif">每轮 1000 局 AI 模拟 · 目标是把蜀、吴胜率拉到 50% 附近（阵营差 ≤ 10%）</text>`

  // 横向网格 + Y 轴刻度
  for (let v = 0; v <= 100; v += 25) {
    s += `<line x1="${padL}" y1="${y(v)}" x2="${padL + plotW}" y2="${y(v)}" stroke="${GRID}" stroke-width="1"/>`
    s += `<text x="${padL - 16}" y="${(y(v) + 7).toFixed(1)}" font-size="20" fill="#9a8a72" text-anchor="end">${v}%</text>`
  }
  // 50% 平衡参考线
  s += `<line x1="${padL}" y1="${y(50)}" x2="${padL + plotW}" y2="${y(50)}" stroke="#b8a98c" stroke-width="2" stroke-dasharray="8 6"/>`
  s += `<text x="${padL + plotW}" y="${(y(50) - 10).toFixed(1)}" font-size="19" fill="#9a8a72" text-anchor="end">50% 平衡线</text>`

  // X 轴标签
  for (let i = 0; i < labels.length; i++) {
    s += `<text x="${x(i).toFixed(1)}" y="${padT + plotH + 34}" font-size="21" fill="${INK}" text-anchor="middle">${labels[i]}</text>`
    s += `<text x="${x(i).toFixed(1)}" y="${padT + plotH + 60}" font-size="18" fill="#b0392b" text-anchor="middle">差 ${gap[i]}%</text>`
  }

  // 折线
  s += `<polyline points="${poly(shu)}" fill="none" stroke="${COL_SHU}" stroke-width="4"/>`
  s += `<polyline points="${poly(wu)}" fill="none" stroke="${COL_WU}" stroke-width="4"/>`
  s += pts(shu, COL_SHU)
  s += pts(wu, COL_WU)

  // 图例
  s += `<rect x="${padL + plotW - 250}" y="${padT + 6}" width="240" height="78" fill="#ffffff" stroke="${GRID}" rx="6"/>`
  s += `<line x1="${padL + plotW - 234}" y1="${padT + 30}" x2="${padL + plotW - 196}" y2="${padT + 30}" stroke="${COL_SHU}" stroke-width="4"/><text x="${padL + plotW - 186}" y="${padT + 37}" font-size="22" fill="${INK}">蜀 胜率</text>`
  s += `<line x1="${padL + plotW - 234}" y1="${padT + 60}" x2="${padL + plotW - 196}" y2="${padT + 60}" stroke="${COL_WU}" stroke-width="4"/><text x="${padL + plotW - 186}" y="${padT + 67}" font-size="22" fill="${INK}">吴 胜率</text>`

  // 起止阵营差标注
  s += `<text x="${x(0).toFixed(1)}" y="${y(66).toFixed(1)}" font-size="20" fill="#b0392b" text-anchor="start" font-weight="bold">▲ 阵营差 65.3%</text>`
  s += `<text x="${x(5).toFixed(1)}" y="${(y(50) - 40).toFixed(1)}" font-size="20" fill="#2e7d32" text-anchor="end" font-weight="bold">阵营差 5.6% ✓</text>`

  s += `</svg>`
  return s
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })
  const svg = build()
  const png = path.join(OUT, '数值平衡-收敛曲线.png')
  await sharp(Buffer.from(svg)).png().toFile(png)
  const jpg = png.replace('.png', '.jpg')
  await sharp(png).flatten({ background: '#faf8f2' }).jpeg({ quality: 92 }).toFile(jpg)
  const { statSync } = await import('fs')
  console.log(`✓ 收敛曲线 ${W}×${H}`)
  console.log(`  PNG ${(statSync(png).size / 1024).toFixed(0)} KB · JPG ${(statSync(jpg).size / 1024).toFixed(0)} KB`)
  console.log(`→ ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
