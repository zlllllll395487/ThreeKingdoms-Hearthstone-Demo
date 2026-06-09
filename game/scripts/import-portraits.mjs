/**
 * 把用户切好的原始立绘（无边框版）导入项目
 *
 * 流程：
 *   asset/新增ui组件0605/{武将,技能,武器}/<中文名>.png
 *      ↓ 按 portrait 字段重命名
 *      ↓ 同时压缩 q=90
 *   game/src/assets/portraits/<portrait_filename>.png
 *
 * 用途：Codex 卡牌点击放大时展示纯立绘（无边框）
 */

import { promises as fs } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')
const SRC_ROOT = join(REPO_ROOT, 'asset', '新增ui组件0605')
const DST_DIR = join(REPO_ROOT, 'game', 'src', 'assets', 'portraits')
const DST_BACKUP = join(REPO_ROOT, 'game', '_assets_original', 'portraits')

// [子文件夹, 中文文件名, 目标 portrait filename]
const MAPPING = [
  // 蜀阵营 武将
  ['武将', '蜀汉民兵', '蜀汉民兵.png'],
  ['武将', '蜀汉弓兵', '蜀汉弓兵.png'],
  ['武将', '蜀汉御林军', '蜀汉御林军.png'],
  ['武将', '突骑兵', '突骑兵.png'],
  ['武将', '偏将军', '偏将军.png'],
  ['武将', '破虏校尉', '破虏校尉.png'],
  ['武将', '严颜', '严颜.png'],
  ['武将', '黄月英', '黄月英.png'],
  ['武将', '马超', '马超.png'],
  ['武将', '赵云', '赵云.png'],
  // 蜀阵营 技能
  ['技能', '屯田', '屯田.png'],
  ['技能', '魏延', '魏延.png'],
  ['技能', '武勇', '武勇.png'],
  ['技能', '万军取首', '万军取首.png'],
  // 蜀阵营 武器
  ['武器', '雌雄双股剑', 'cixiongshuanggujian.png'],
  ['武器', '丈八蛇矛', 'shemao.png'],
  ['武器', '百锐刀', 'bairuidao.png'],
  // 吴阵营 武将
  ['武将', '周瑜', '周瑜.png'],
  ['武将', '鲁肃', '鲁肃.png'],
  ['武将', '大乔', '大乔.png'],
  ['武将', '孙策', '孙策.png'],
  ['武将', '甘宁', '甘宁.png'],
  ['武将', '吕蒙', '吕蒙.png'],
  ['武将', '周泰', '周泰.png'],
  ['武将', '吴国水军', '吴国水军.png'],
  ['武将', '程普', '程普.png'],
  // 吴阵营 技能
  ['技能', '火烧赤壁', '火烧赤壁.png'],
  ['技能', '行舟借势', '行舟借势.png'],
  ['技能', '周郎顾曲', '周郎顾曲.png'],
  ['技能', '草船借箭', '草船借箭.png'],
  ['技能', '苦肉计', '苦肉计.png'],
  ['技能', '运筹帷幄', '运筹帷幄.png'],
  ['技能', '固守待援', '固守待援.png'],
  ['技能', '借东风', '借东风.png'],
  ['技能', '火油', '火油.png'],
  ['技能', '赤焰焚营', '赤焰焚营.png'],
  ['技能', '反间计', '反间计.png'],
  ['技能', '美人计', '美人计.png'],
  ['技能', '春风化雨', '春风化雨.png'],
  ['技能', '连环计', '连环计.png'],
  ['技能', '画地为牢', '画地为牢.png'],
  // 吴阵营 武器
  ['武器', '古锭刀', 'gudingdao.png'],
  // 中立 技能
  ['技能', '流民', 'liumin.png'],
  ['技能', '金疮药', 'jinchuangyao.png'],
  // Token portraits
  ['武将', '巫祝', 'token_wuzhu.png'],
  ['技能', '木牛流马', 'token_yijiang.png'],
]

function fmtMB(b) {
  return (b / 1024 / 1024).toFixed(2) + ' MB'
}

async function main() {
  console.log(`[import-portraits] ${MAPPING.length} files`)
  let totalBefore = 0, totalAfter = 0
  const errors = []

  for (const [folder, zh, target] of MAPPING) {
    const srcPath = join(SRC_ROOT, folder, `${zh}.png`)
    const dstPath = join(DST_DIR, target)
    const backupPath = join(DST_BACKUP, target)

    try {
      const srcStat = await fs.stat(srcPath)
      await fs.mkdir(dirname(backupPath), { recursive: true })
      await fs.copyFile(srcPath, backupPath)
      await fs.mkdir(dirname(dstPath), { recursive: true })
      await sharp(srcPath)
        .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 })
        .toFile(dstPath + '.tmp')
      await fs.rename(dstPath + '.tmp', dstPath)
      const dstStat = await fs.stat(dstPath)
      totalBefore += srcStat.size
      totalAfter += dstStat.size
      const saved = (1 - dstStat.size / srcStat.size) * 100
      console.log(`  ✓ ${folder}/${zh.padEnd(8)} → ${target.padEnd(35)} ${fmtMB(srcStat.size).padStart(9)} → ${fmtMB(dstStat.size).padStart(9)} (-${saved.toFixed(0)}%)`)
    } catch (err) {
      errors.push({ folder, zh, msg: err.message })
      console.log(`  ❌ ${folder}/${zh}: ${err.message}`)
    }
  }

  console.log(`\n[import-portraits] total ${fmtMB(totalBefore)} → ${fmtMB(totalAfter)} (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`)
  if (errors.length) process.exit(1)
}

main().catch((err) => { console.error(err); process.exit(1) })
