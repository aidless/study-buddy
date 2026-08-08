// tutorAdvice.js —— 私人"名师"诊断（2026-08-08）
// 纯规则引擎，只基于用户自己记录的真实数据（真题自测 / 错题档案 / 趋势）生成个性化建议。
// 不联网、不评判，措辞像陪读老师：指出最大提分点、薄弱知识点、趋势与下一步行动。
import { subjectWeight } from './curriculum'

const SUB408 = ['数据结构', '计算机组成', '操作系统', '计算机网络']

export function buildTutorAdvice({ summary, wrongStats = [], weekly = null, focusThisSec = null }) {
  const subjects = summary?.subjects || []
  const real = summary?.overallRealAcc
  const tips = []
  const actions = []

  // 1) 总评
  let verdict
  if (real == null) {
    verdict = '还没有真题自测记录——去做一套真题，我才能帮你定位该补哪儿。'
    actions.push('去「自测」做一套随机真题卷，交卷后我会自动给你分析')
  } else if (real >= 0.75) {
    verdict = `整体真题正确率 ${Math.round(real * 100)}%，底子很扎实。提分的关键是把反复出错的细节题型抠到满分。`
  } else if (real >= 0.55) {
    verdict = `整体真题正确率 ${Math.round(real * 100)}%，基础已经通了。要提分，先集中补最亏分的那一门，比平均用力高效得多。`
  } else {
    verdict = `整体真题正确率 ${Math.round(real * 100)}%，先别贪多——每天吃透 10 道错题，比刷新题更划算。`
  }
  tips.push({ kind: 'verdict', text: verdict })

  // 2) 最大提分点（408 按分值权重 × 失分率；没测过的科目不算 0 分）
  const rows = SUB408
    .map((s) => {
      const hit = subjects.find((x) => x.subject === s)
      const acc = hit && hit.realAcc != null ? hit.realAcc : null
      return { subject: s, weight: subjectWeight(s), acc }
    })
    .filter((r) => r.acc != null)
  let topGap = null
  if (rows.length) {
    const sorted = [...rows].sort((a, b) => b.weight * (1 - b.acc) - a.weight * (1 - a.acc))
    topGap = sorted[0]
    if (topGap && topGap.weight * (1 - topGap.acc) >= 0.5) {
      tips.push({
        kind: 'gap',
        text: `优先补「${topGap.subject}」：真题正确率 ${Math.round(topGap.acc * 100)}%，按分值折算这里还能再捞 ${(topGap.weight * (1 - topGap.acc)).toFixed(0)} 分，性价比最高。`
      })
    }
  }

  // 3) 薄弱知识点（错题档案按错题数排序）
  const weak = [...wrongStats].sort((a, b) => b.wrongQ - a.wrongQ).slice(0, 3)
  if (weak.length) {
    tips.push({
      kind: 'weak',
      text: '知识点薄弱点：' + weak.map((w) => `${w.subject}·${w.topic}（错 ${w.wrongQ} 道）`).join('、')
    })
  }

  // 4) 趋势与状态
  if (weekly && weekly.accThis != null) {
    const cur = Math.round(weekly.accThis * 100)
    if (weekly.accLast == null) {
      tips.push({ kind: 'trend', text: `本周真题正确率 ${cur}%。保持记录频率，连续几周后趋势才有判断价值。` })
    } else if (weekly.accThis >= weekly.accLast) {
      tips.push({ kind: 'trend', text: `本周正确率 ${cur}%，比上周高 ${Math.round((weekly.accThis - weekly.accLast) * 100)}%——方法是对的，稳住节奏。` })
    } else {
      tips.push({ kind: 'trend', text: `本周正确率 ${cur}%，比上周低了一点。先看错的是不是同一类题——是的话，问题在知识点，不在状态。` })
    }
  }
  if (focusThisSec != null && focusThisSec >= 0 && focusThisSec < 20 * 60) {
    tips.push({ kind: 'focus', text: '今天专注还不到 20 分钟。状态再差，先保证开一个番茄钟——启动永远比时长重要。' })
  }

  // 5) 行动建议
  if (real != null) {
    if (rows.length && rows.some((r) => r.acc != null && r.acc < 0.6)) {
      actions.push(`本周专攻「${topGap.subject}」真题，每天 10–15 道，错题自动进错题本`)
    }
    actions.push('把最近 3 次自测的错题集中重做一遍，重做对的标记「掌握」')
    if (weak.length) actions.push(`优先复盘：${weak[0].subject}·${weak[0].topic}`)
  }

  return { verdict, tips, actions, hasData: real != null }
}
