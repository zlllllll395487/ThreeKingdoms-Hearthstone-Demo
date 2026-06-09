/**
 * 把用户切好的「边框+立绘」47 张 cardvisual 导入项目
 *
 * 流程：
 *   asset/新增ui组件0605/边框+立绘/<中文名>.png
 *      ↓ 按 portrait 映射重命名
 *      ↓ 同时压缩 q=90
 *   game/src/assets/ui/cardvisual_<portrait_base>.png
 *
 * 原始备份：
 *   game/_assets_original/ui/cardvisual_<portrait_base>.png
 */

import { promises as fs } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const SRC_DIR = join(REPO_ROOT, 'asset', '新增ui组件0605', '边框+立绘')
const DST_UI = join(REPO_ROOT, 'game', 'src', 'assets', 'ui')
const DST_BACKUP = join(REPO_ROOT, 'game', '_assets_original', 'ui')

// 中文文件名 → cardvisual_<portrait_base>.png
// portrait_base = card data 里 portrait 字段去掉 .png
const MAPPING = {
  // 蜀阵营
  '蜀汉民兵': '蜀汉民兵',
  '蜀汉弓兵': '蜀汉弓兵',
  '御林军': '蜀汉御林军',           // 文件名 → portrait 实名
  '突骑兵': '突骑兵',
  '偏将军': '偏将军',
  '破虏校尉': '破虏校尉',
  '屯田': '屯田',
  '魏延': '魏延',
  '严颜': '严颜',
  '黄月英': '黄月英',
  '马超': '马超',
  '赵云': '赵云',
  '武勇': '武勇',
  '万军取首': '万军取首',
  '雌雄双股剑': 'cixiongshuanggujian',
  '丈八蛇矛': 'shemao',
  '百锐刀': 'bairuidao',
  // 吴阵营
  '周瑜': '周瑜',
  '鲁肃': '鲁肃',
  '大乔': '大乔',
  '孙策': '孙策',
  '甘宁': '甘宁',
  '吕蒙': '吕蒙',
  '周泰': '周泰',
  '吴国水军': '吴国水军',
  '火烧赤壁': '火烧赤壁',
  '行舟借势': '行舟借势',
  '周郎顾曲': '周郎顾曲',
  '草船借箭': '草船借箭',
  '苦肉计': '苦肉计',
  '运筹帷幄': '运筹帷幄',
  '固守待援': '固守待援',
  '借东风': '借东风',
  '火油': '火油',
  '赤焰焚营': '赤焰焚营',
  '反间计': '反间计',
  '美人计': '美人计',
  '春风化雨': '春风化雨',
  '连环计': '连环计',
  '古锭刀': 'gudingdao',
  '程普': '程普',
  '画地为牢': '画地为牢',
  // 中立
  '流民': 'liumin',
  '金疮药': 'jinchuangyao',
  // Token Codex 展示版
  '蜀国士兵': 'soldierofshu',
  '巫祝': 'token_wuzhu',
  '木牛流马': 'token_yijiang',
}

function fmtMB(b) {
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

async function processOne(zhName, portraitBase) {
  const srcPath = join(SRC_DIR, `${zhName}.png`)
  const targetName = `cardvisual_${portraitBase}.png`
  const dstPath = join(DST_UI, targetName)
  const backupPath = join(DST_BACKUP, targetName)

  let srcStat
  try {
    srcStat = await fs.stat(srcPath)
  } catch {
    return { zhName, error: '源文件不存在' }
  }

  // 1. 原始备份（不压缩）
  await fs.mkdir(dirname(backupPath), { recursive: true })
  await fs.copyFile(srcPath, backupPath)

  // 2. 压缩到 src/assets/ui
  await fs.mkdir(dirname(dstPath), { recursive: true })
  await sharp(srcPath)
    .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 })
    .toFile(dstPath + '.tmp')
  await fs.rename(dstPath + '.tmp', dstPath)
  const dstStat = await fs.stat(dstPath)

  return {
    zhName,
    targetName,
    srcSize: srcStat.size,
    dstSize: dstStat.size,
  }
}

async function main() {
  const entries = Object.entries(MAPPING)
  console.log(`[import] ${entries.length} cardvisuals`)

  let totalBefore = 0
  let totalAfter = 0
  const errors = []

  for (const [zh, base] of entries) {
    const r = await processOne(zh, base)
    if (r.error) {
      errors.push(r)
      console.log(`  ❌ ${zh}: ${r.error}`)
      continue
    }
    totalBefore += r.srcSize
    totalAfter += r.dstSize
    const saved = (1 - r.dstSize / r.srcSize) * 100
    console.log(
      `  ✓ ${zh.padEnd(8)} → ${r.targetName.padEnd(40)} ${fmtMB(r.srcSize).padStart(9)} → ${fmtMB(r.dstSize).padStart(9)} (-${saved.toFixed(0)}%)`,
    )
  }

  console.log(
    `\n[import] done — total ${fmtMB(totalBefore)} → ${fmtMB(totalAfter)} (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`,
  )
  if (errors.length) {
    console.log(`\n[import] ${errors.length} errors:`)
    errors.forEach((e) => console.log(`  - ${e.zhName}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
