/**
 * §22 · MD 报告生成器（中等深度 · ~300 行）
 */

import type { SimStats } from './stats-collector.js'
import type { SimResult } from './simulator.js'

interface RenderOpts {
  label: string
  elapsed: number
  earlyExit: { reason: string } | null
}

export function renderReport(
  stats: SimStats,
  results: SimResult[],
  opts: RenderOpts,
): string {
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const lines: string[] = []

  // ========== 头部 ==========
  lines.push(`# 三国炉石 · 模拟对局报告 (${opts.label})`)
  lines.push('')
  lines.push(`- **生成时间**: ${date}`)
  lines.push(`- **总局数**: ${stats.totalGames}`)
  lines.push(`- **耗时**: ${(opts.elapsed / 1000).toFixed(1)}s`)
  lines.push(`- **AI 版本**: 启发式 v22 (audit P0+P1 修复)`)
  if (opts.earlyExit) {
    lines.push(`- ⚠️ **早期警报**: ${opts.earlyExit.reason}`)
  }
  lines.push('')
  lines.push('### ⚠ Caveats')
  lines.push('- AI 决策为启发式打分（非搜索/MCTS），可能 underplay 复杂机制')
  lines.push(`- 置信区间约 ±${(100 / Math.sqrt(stats.totalGames)).toFixed(1)}% (二项分布)`)
  lines.push('- 不能反映真人对真人微操，仅作平衡参考')
  lines.push('- RNG 卡（庞统随机加手牌等）需更大样本收敛')
  lines.push('')
  lines.push('---')
  lines.push('')

  // ========== § 1 总体平衡 ==========
  lines.push('## § 1 · 总体平衡')
  lines.push('')
  lines.push('### 1.1 先手 (player side) 总胜率')
  lines.push('')
  lines.push(`先手胜率 **${stats.playerWinrate.toFixed(1)}%** (${stats.playerWins}/${stats.totalGames})`)
  lines.push('')
  lines.push(asciiBar('先手', stats.playerWinrate))
  lines.push(asciiBar('后手', 100 - stats.playerWinrate))
  lines.push('')
  if (Math.abs(stats.playerWinrate - 50) > 5) {
    lines.push(`> 🔴 **失衡**: 先手优势 ${(stats.playerWinrate - 50).toFixed(1)}% 偏离平衡。理想 50% ±3%`)
    lines.push('')
  }

  lines.push('### 1.2 阵营胜率（不分先后手）')
  lines.push('')
  lines.push('| 阵营 | 总胜率 |')
  lines.push('|:-:|:-:|')
  lines.push(`| 蜀 | ${stats.shuWinrate.toFixed(1)}% |`)
  lines.push(`| 吴 | ${stats.wuWinrate.toFixed(1)}% |`)
  lines.push('')
  const factionGap = Math.abs(stats.shuWinrate - stats.wuWinrate)
  if (factionGap > 10) {
    lines.push(`> 🔴 **失衡**: 阵营胜率差 ${factionGap.toFixed(1)}% > 10%`)
    lines.push('')
  } else if (factionGap > 5) {
    lines.push(`> 🟡 偏差 ${factionGap.toFixed(1)}%，可接受但建议关注`)
    lines.push('')
  }

  lines.push('### 1.3 对位矩阵')
  lines.push('')
  lines.push('| 玩家阵营 | AI 阵营 | 局数 | 玩家胜率 |')
  lines.push('|:-:|:-:|:-:|:-:|')
  for (const m of stats.factionMatchups) {
    lines.push(
      `| ${m.playerFaction} | ${m.aiFaction} | ${m.games} | ${m.winrate.toFixed(1)}% |`,
    )
  }
  lines.push('')

  // ========== § 2 单卡影响 Top / Bottom ==========
  lines.push('## § 2 · 单卡影响（按净胜率影响排序）')
  lines.push('')
  lines.push('> **netImpact** = 该卡出现在赢家牌区 % − 50%。+ 表示带运，− 表示弱效。')
  lines.push('')

  const topCards = stats.cardImpacts.slice(0, 12)
  const bottomCards = stats.cardImpacts.slice(-10).reverse()

  lines.push('### 2.1 Top 12 强势卡')
  lines.push('')
  lines.push('| 卡名 | 出现 | 赢家中 | 胜率 | netImpact |')
  lines.push('|:--|:-:|:-:|:-:|:-:|')
  for (const c of topCards) {
    const mark = c.netImpact > 10 ? '🔴' : c.netImpact > 5 ? '🟡' : ''
    lines.push(
      `| ${c.cardName} | ${c.appearances} | ${c.winnerAppearances} | ${c.winrate.toFixed(1)}% | ${c.netImpact >= 0 ? '+' : ''}${c.netImpact.toFixed(1)}% ${mark} |`,
    )
  }
  lines.push('')

  lines.push('### 2.2 Bottom 10 弱势卡')
  lines.push('')
  lines.push('| 卡名 | 出现 | 赢家中 | 胜率 | netImpact |')
  lines.push('|:--|:-:|:-:|:-:|:-:|')
  for (const c of bottomCards) {
    const mark = c.netImpact < -10 ? '🔴' : c.netImpact < -5 ? '🟡' : ''
    lines.push(
      `| ${c.cardName} | ${c.appearances} | ${c.winnerAppearances} | ${c.winrate.toFixed(1)}% | ${c.netImpact.toFixed(1)}% ${mark} |`,
    )
  }
  lines.push('')

  // ========== § 3 节奏诊断 ==========
  lines.push('## § 3 · 节奏诊断')
  lines.push('')
  lines.push('| 指标 | 数值 |')
  lines.push('|:--|:-:|')
  lines.push(`| 平均回合数 | ${stats.avgTurns.toFixed(1)} |`)
  lines.push(`| 中位回合数 | ${stats.medianTurns} |`)
  lines.push(`| ≤7 回合短局 | ${stats.shortGames} (${(stats.shortGames * 100 / stats.totalGames).toFixed(1)}%) |`)
  lines.push(`| ≥13 回合长局 | ${stats.longGames} (${(stats.longGames * 100 / stats.totalGames).toFixed(1)}%) |`)
  lines.push(`| 疲劳致死率 | ${stats.fatigueRate.toFixed(1)}% |`)
  lines.push(`| 赢家平均剩余 HP | ${stats.avgEndHp.winner.toFixed(1)} |`)
  lines.push(`| 输家平均剩余 HP | ${stats.avgEndHp.loser.toFixed(1)} |`)
  lines.push('')

  lines.push('### 回合数分布')
  lines.push('')
  const sortedTurns = [...stats.turnDistribution.entries()].sort((a, b) => a[0] - b[0])
  const maxCount = Math.max(...sortedTurns.map(([, c]) => c))
  for (const [turn, count] of sortedTurns) {
    if (count === 0) continue
    const barLen = Math.round((count / maxCount) * 30)
    const bar = '█'.repeat(barLen).padEnd(30, '░')
    lines.push(`T${String(turn).padStart(2)} | ${bar} ${count}`)
  }
  lines.push('')

  if (stats.fatigueRate > 20) {
    lines.push('> 🔴 **疲劳致死率过高 (>20%)**：抽牌不足，玩家被迫消耗牌库自残。建议方案：')
    lines.push('> - §19.4 自适应抽牌（手牌 ≤2 → 抽 2）')
    lines.push('> - 减小牌组到 25 张，缩短游戏长度')
    lines.push('')
  } else if (stats.fatigueRate > 10) {
    lines.push('> 🟡 疲劳率 10-20% 偏高，建议关注牌组消耗速度')
    lines.push('')
  }

  if (stats.avgTurns < 7) {
    lines.push('> 🟡 平均回合 < 7，游戏过短，可能 OP 卡过强造成滚雪球')
    lines.push('')
  } else if (stats.avgTurns > 14) {
    lines.push('> 🟡 平均回合 > 14，游戏拖沓，可能缺少结束推进')
    lines.push('')
  }

  // ========== § 4 体验指标（user 关注的对局体验）==========
  lines.push('## § 4 · 对局体验指标')
  lines.push('')
  lines.push('### 4.1 终局原因分布')
  lines.push('')
  lines.push('| 终局方式 | 局数 | 占比 |')
  lines.push('|:--|:-:|:-:|')
  const labelMap: Record<string, string> = {
    hp0: 'HP 归零',
    fatigue: '疲劳致死',
    turnCap: '回合上限（卡死）',
    draw: '平局',
  }
  for (const [reason, count] of Object.entries(stats.experience.endReasons)) {
    const pct = (count * 100 / stats.totalGames).toFixed(1)
    lines.push(`| ${labelMap[reason] ?? reason} | ${count} | ${pct}% |`)
  }
  lines.push('')
  if ((stats.experience.endReasons.turnCap ?? 0) / stats.totalGames > 0.1) {
    lines.push('> 🔴 **超过 10% 局数撞回合上限**：对局陷入循环，无人能终结 → 建议加强进攻 stat 或减牌库尺寸')
    lines.push('')
  }

  lines.push('### 4.2 起手 & 卡死指标')
  lines.push('')
  lines.push('| 指标 | 数值 |')
  lines.push('|:--|:-:|')
  lines.push(`| 起手 T1 任一方无牌可打 | ${stats.experience.openingStuckRate.toFixed(1)}% |`)
  lines.push(`| 终局任一方手牌为 0 | ${stats.experience.handDepletedRate.toFixed(1)}% |`)
  lines.push('')
  if (stats.experience.openingStuckRate > 5) {
    lines.push('> 🟡 起手卡死率 > 5%：考虑扩展 ensureSmoothOpener 保证 T1 必有 1 费可出')
    lines.push('')
  }

  lines.push('### 4.3 出牌节奏（赢家 vs 输家）')
  lines.push('')
  lines.push('| 指标 | 赢家 | 输家 |')
  lines.push('|:--|:-:|:-:|')
  lines.push(`| 平均每回合出牌数 | ${stats.experience.avgCardsPerTurn.winner.toFixed(2)} | ${stats.experience.avgCardsPerTurn.loser.toFixed(2)} |`)
  lines.push(`| 空过回合数（0 出牌）| ${stats.experience.avgIdleTurns.winner.toFixed(2)} | ${stats.experience.avgIdleTurns.loser.toFixed(2)} |`)
  lines.push(`| 终局手牌剩余 | ${stats.experience.avgEndHandSize.winner.toFixed(1)} | ${stats.experience.avgEndHandSize.loser.toFixed(1)} |`)
  lines.push(`| 终局牌库剩余 | ${stats.experience.avgEndDeckSize.winner.toFixed(1)} | ${stats.experience.avgEndDeckSize.loser.toFixed(1)} |`)
  lines.push('')
  if (stats.experience.avgIdleTurns.loser > stats.experience.avgIdleTurns.winner + 1) {
    lines.push('> 🟡 输家空过明显多于赢家 → 验证用户感受：法力/抽牌曲线对输家不友好')
    lines.push('')
  }

  // ========== § 5 诊断总结 + 改动建议 ==========
  lines.push('## § 5 · 诊断总结 + 改动建议')
  lines.push('')
  const issues = diagnoseIssues(stats)
  if (issues.length === 0) {
    lines.push('✅ 未发现明显的设计缺陷，可进入下一轮细调')
  } else {
    issues.forEach((issue, i) => {
      lines.push(`### 问题 ${i + 1}: ${issue.title}`)
      lines.push('')
      lines.push(`**严重性**: ${issue.severity}`)
      lines.push('')
      lines.push(`**数据**: ${issue.evidence}`)
      lines.push('')
      lines.push(`**建议方案**:`)
      issue.suggestions.forEach((s) => lines.push(`- ${s}`))
      lines.push('')
    })
  }

  void results // results 供未来扩展用，当前 stats 已包含所有信息
  return lines.join('\n')
}

function asciiBar(label: string, pct: number): string {
  const filled = Math.round(pct / 2.5)
  return `${label.padEnd(4)} | ${'█'.repeat(filled).padEnd(40, '░')} ${pct.toFixed(1)}%`
}

interface Issue {
  title: string
  severity: '🔴 高' | '🟡 中' | '🟢 低'
  evidence: string
  suggestions: string[]
}

function diagnoseIssues(stats: SimStats): Issue[] {
  const issues: Issue[] = []

  // 阵营失衡
  const factionGap = Math.abs(stats.shuWinrate - stats.wuWinrate)
  if (factionGap > 10) {
    const stronger = stats.shuWinrate > stats.wuWinrate ? '蜀' : '吴'
    const weaker = stronger === '蜀' ? '吴' : '蜀'
    issues.push({
      title: `阵营失衡：${stronger} 胜率显著高于 ${weaker}`,
      severity: '🔴 高',
      evidence: `蜀 ${stats.shuWinrate.toFixed(1)}% vs 吴 ${stats.wuWinrate.toFixed(1)}% (差 ${factionGap.toFixed(1)}%)`,
      suggestions: [
        `检查 ${stronger} top 强势卡，考虑下调数值/cost`,
        `检查 ${weaker} bottom 弱势卡，考虑上调或替换`,
        `audit AI 是否对 ${weaker} 的机制识别不足`,
      ],
    })
  }

  // 先手过强
  if (Math.abs(stats.playerWinrate - 50) > 8) {
    const ahead = stats.playerWinrate > 50 ? '先手' : '后手'
    issues.push({
      title: `${ahead}优势明显`,
      severity: '🟡 中',
      evidence: `先手胜率 ${stats.playerWinrate.toFixed(1)}%（偏离 50% 共 ${Math.abs(stats.playerWinrate - 50).toFixed(1)}%）`,
      suggestions: [
        '加 The Coin 类后手补偿（多 1 张起手 + 1 次 0 费 +1 mana）',
        '后手起手 +1 张（4 → 5）',
      ],
    })
  }

  // OP 卡
  const opCards = stats.cardImpacts.filter((c) => c.netImpact > 12 && c.appearances > 20)
  if (opCards.length > 0) {
    issues.push({
      title: `OP 卡集中：${opCards.length} 张卡 netImpact > +12%`,
      severity: opCards.length > 3 ? '🔴 高' : '🟡 中',
      evidence: opCards.slice(0, 5).map((c) => `${c.cardName} (+${c.netImpact.toFixed(1)}%)`).join(' / '),
      suggestions: [
        '逐张审视 OP 卡：能否上调 cost / 下调 stat / 限制次数',
        '检查是否因为联动 / combo 触发太轻松导致 OP',
      ],
    })
  }

  // 弱卡
  const weakCards = stats.cardImpacts.filter((c) => c.netImpact < -10 && c.appearances > 15)
  if (weakCards.length >= 3) {
    issues.push({
      title: `弱卡过多：${weakCards.length} 张卡 netImpact < -10%`,
      severity: '🟡 中',
      evidence: weakCards.slice(0, 5).map((c) => `${c.cardName} (${c.netImpact.toFixed(1)}%)`).join(' / '),
      suggestions: [
        '弱卡升 stat 或降 cost',
        '检查是否 AI 不会用这些卡（机制识别问题）',
      ],
    })
  }

  // 疲劳
  if (stats.fatigueRate > 20) {
    issues.push({
      title: '疲劳致死率过高',
      severity: '🔴 高',
      evidence: `${stats.fatigueRate.toFixed(1)}% 局以 fatigue 收场`,
      suggestions: [
        '加自适应抽牌（手牌 ≤2 → 抽 2 张）',
        '减小牌组到 25 张',
        '加更多过牌卡到牌组',
      ],
    })
  }

  // 游戏太短
  if (stats.avgTurns < 6) {
    issues.push({
      title: '游戏过短 (avg < 6)',
      severity: '🟡 中',
      evidence: `平均 ${stats.avgTurns.toFixed(1)} 回合结束`,
      suggestions: [
        '低费高伤卡过多，提高早期解牌成本',
        '加更多 taunt 类防御卡到中立池',
      ],
    })
  }

  return issues
}
