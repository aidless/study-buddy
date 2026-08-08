// planRecommender.js —— 今日推荐（基于真实数据，来源标注）
export function buildRecommendations(ctx) {
  const recs = []
  const { streak, checkinToday, planTotal, planDone, nowHour, radarItems, scoreEst, scoreTarget, syncDays, weekFocusSec } = ctx
  if (!checkinToday && nowHour >= 9) {
    recs.push({ icon: 'check', text: '今天还没打卡——先花 5 秒打个卡，把今天定下来。', source: '今日状态' })
  }
  if (streak > 0 && streak % 7 === 0) {
    recs.push({ icon: 'medal', text: `连续 ${streak} 天，今天也稳稳接上。`, source: '连续记录' })
  }
  if (planTotal > 0 && planDone < planTotal) {
    recs.push({ icon: 'plan', text: `今日建议还有 ${planTotal - planDone} 件没勾——先从最难的开始。`, source: '开箱计划' })
  }
  const weak = (radarItems || []).filter((d) => d.acc != null).sort((a, b) => a.acc - b.acc)[0]
  if (weak && weak.acc < 0.6) {
    recs.push({ icon: 'bulb', text: `${weak.label} 正确率 ${Math.round(weak.acc * 100)}% 最低——今天去「自测」刷 10 道，错题自动进档案。`, source: '真题自测' })
  }
  if (scoreEst != null && scoreTarget != null && scoreEst < scoreTarget) {
    recs.push({ icon: 'target', text: `离目标分还差 ${scoreTarget - scoreEst} 分——按分值权重，先补最亏分那门最划算。`, source: '离岸线估分' })
  }
  if (syncDays > 0) {
    recs.push({ icon: 'heart', text: `你们已同步专注 ${syncDays} 天——今天也保持同步。`, source: '同步记录' })
  }
  if (weekFocusSec < 60 * 60) {
    recs.push({ icon: 'focus', text: '本周专注还不到 1 小时——开一个番茄钟，先动起来。', source: '专注统计' })
  }
  return recs.slice(0, 3)
}