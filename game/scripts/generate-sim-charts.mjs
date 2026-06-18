/**
 * 模拟报告可视化（iter6.1）
 *   ① 回合数分布柱状图
 *   ② 单卡净胜率影响（netImpact）发散条形图
 * 数据取自 docs/sim-reports/sim-2026-06-11-iter6.1-target-fallback.md
 *
 * 运行（game/ 目录下）：node scripts/generate-sim-charts.mjs
 * 输出：作品展示包/设计文档/数据图/
 */

import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const ROOT = path.resolve(process.cwd(), '..')
const OUT = path.join(ROOT, '作品展示包/设计文档/数据图')
const FONT = 'Microsoft YaHei, SimHei, sans-serif'
const BG = '#faf8f2'
const INK = '#2a1c10'
const GRID = '#ddd5c4'

async function rasterize(svg, name) {
  await fs.mkdir(OUT, { recursive: true })
  const png = path.join(OUT, name + '.png')
  await sharp(Buffer.from(svg)).png().toFile(png)
  const jpg = png.replace('.png', '.jpg')
  await sharp(png).flatten({ background: BG }).jpeg({ quality: 92 }).toFile(jpg)
  const { statSync } = await import('fs')
  console.log(`  ✓ ${name}  PNG ${(statSync(png).size / 1024).toFixed(0)}KB / JPG ${(statSync(jpg).size / 1024).toFixed(0)}KB`)
}

// ① 回合数分布
function turnDist() {
  const labels = ['T6','T7','T8','T9','T10','T11','T12','T13','T14','T15','T16','T17','T18']
  const vals = [3,22,39,71,77,73,70,78,94,139,224,106,4]
  const W=1280,H=700,padL=70,padR=40,padT=120,padB=66
  const plotW=W-padL-padR, plotH=H-padT-padB
  const n=labels.length, maxV=240
  const slot=plotW/n, barW=slot*0.66
  const yOf=v=> padT+(1-v/maxV)*plotH
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${BG}"/>`
  s+=`<text x="${padL}" y="56" font-size="38" font-weight="bold" fill="${INK}" font-family="${FONT}">回合数分布 · 1000 局</text>`
  s+=`<text x="${padL}" y="88" font-size="22" fill="#7a6a52" font-family="${FONT}">平均 13.4 回合（中位 14）· 短局(≤7) 2.5% · 长局(≥13) 64.5% · 疲劳致死 0%</text>`
  for(let v=0;v<=240;v+=60){s+=`<line x1="${padL}" y1="${yOf(v)}" x2="${padL+plotW}" y2="${yOf(v)}" stroke="${GRID}"/><text x="${padL-12}" y="${yOf(v)+6}" font-size="18" fill="#9a8a72" text-anchor="end" font-family="${FONT}">${v}</text>`}
  for(let i=0;i<n;i++){
    const v=vals[i], x=padL+i*slot+(slot-barW)/2, h=(v/maxV)*plotH
    const fill = v===Math.max(...vals)? '#c0392b':'#5a8f6b'
    s+=`<rect x="${x.toFixed(1)}" y="${(padT+plotH-h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${fill}"/>`
    s+=`<text x="${(x+barW/2).toFixed(1)}" y="${(padT+plotH-h-10).toFixed(1)}" font-size="18" fill="${INK}" text-anchor="middle" font-weight="bold" font-family="${FONT}">${v}</text>`
    s+=`<text x="${(x+barW/2).toFixed(1)}" y="${padT+plotH+28}" font-size="19" fill="${INK}" text-anchor="middle" font-family="${FONT}">${labels[i]}</text>`
  }
  s+=`</svg>`
  return s
}

// ② 单卡 netImpact 发散条形
function cardImpact() {
  const rows = [
    ['雌雄双股剑',16.3],['百锐刀',10.6],['万军取首',10.2],['严颜',7.0],
    ['赵云',6.7],['魏延',5.9],['关羽',5.8],['邢道荣',5.8],
    ['天雷',-2.4],['赤焰焚营',-2.5],['冷箭',-2.7],['周郎顾曲',-5.8],
    ['画地为牢',-9.4],['行舟借势',-10.7],['连环计',-14.3],['义兵',-16.7],
  ]
  const W=1280,H=820,padT=120,padB=48,nameW=210
  const plotL=nameW+30, plotR=W-60, center=(plotL+plotR)/2
  const half=plotR-center, maxAbs=18, sc=half/maxAbs
  const rowH=(H-padT-padB)/rows.length
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${BG}"/>`
  s+=`<text x="40" y="56" font-size="38" font-weight="bold" fill="${INK}" font-family="${FONT}">单卡净胜率影响（netImpact）</text>`
  s+=`<text x="40" y="88" font-size="22" fill="#7a6a52" font-family="${FONT}">netImpact = 出现该卡的对局获胜率 − 50% · 上为偏强、下为偏弱 · 据此微调少数卡</text>`
  // 0 轴
  s+=`<line x1="${center}" y1="${padT-6}" x2="${center}" y2="${H-padB}" stroke="#b8a98c" stroke-width="2"/>`
  s+=`<text x="${center}" y="${padT-12}" font-size="18" fill="#9a8a72" text-anchor="middle" font-family="${FONT}">0（平衡）</text>`
  for(let i=0;i<rows.length;i++){
    const [name,net]=rows[i]
    const cy=padT+i*rowH+rowH/2
    const len=Math.abs(net)*sc
    const x = net>=0? center : center-len
    const w = len
    const fill = net>=0? '#c0392b':'#2980b9'
    s+=`<rect x="${x.toFixed(1)}" y="${(cy-rowH*0.32).toFixed(1)}" width="${w.toFixed(1)}" height="${(rowH*0.64).toFixed(1)}" rx="3" fill="${fill}"/>`
    s+=`<text x="${nameW}" y="${(cy+6).toFixed(1)}" font-size="20" fill="${INK}" text-anchor="end" font-family="${FONT}">${name}</text>`
    // 正值标签放条形右侧外（红字）；负值标签放进条形内部（白字），避免与卡名挤在一起
    const neg = net < 0
    const vx = neg ? (center - len + 10) : (center + len + 8)
    const vfill = neg ? '#ffffff' : fill
    s+=`<text x="${vx.toFixed(1)}" y="${(cy+6).toFixed(1)}" font-size="19" fill="${vfill}" text-anchor="start" font-weight="bold" font-family="${FONT}">${net>0?'+':''}${net}%</text>`
  }
  s+=`</svg>`
  return s
}

async function main(){
  console.log('[sim-charts] 生成…')
  await rasterize(turnDist(), '回合数分布')
  await rasterize(cardImpact(), '单卡净胜率影响')
  console.log(`→ ${OUT}`)
}
main().catch(e=>{console.error(e);process.exit(1)})
