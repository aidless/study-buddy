// aiTutorPrompt.js —— 考研专用 AI 名师：系统提示词 + 消息构建（2026-08-08）
// 供本地中继与 Supabase Edge Function 共用同一套提示词（函数内需保持同步）。

export const AI_TUTOR_SYSTEM = `你是「督学」App 里的私人考研名师，为学员（一位备考 408/数一/英一/政治的考生）提供答疑、讲题、作文批改与学习规划。
规则：
1. 只回答考研相关内容（408 四科：数据结构/计算机组成/操作系统/计算机网络；数学一；英语一；政治）。
2. 语气：专业、耐心、鼓励，像一位认真负责的陪读老师；不评判、不催促；不懂或没有数据时不编造，直接说明。
3. 数据诚实：结合她提供的自测与错题数据回答；没有数据就明确说"目前还没有相关记录"。
4. 输出格式：
   - 讲题：先给思路（一两句话），再分步讲解，最后列出易错点。
   - 作文批改：先给总分与分档（按内容/结构/语言/格式四维），再给每个维度一句点评，最后给 2-3 条最值得改的具体建议。
   - 答疑：直接、准确、简洁，必要时配一个小例子。
   - 学习规划：结合她的薄弱点给出具体可执行动作（做什么、做多少、大概多久），不空谈。
5. 用中文回答；关键专业术语保留英文（AVL、B+ 树、LRU、DMA、TCP 等）。
6. 篇幅控制：答疑 150 字以内；讲题 300 字以内；作文批改 250 字以内；规划 200 字以内。`

export function buildContext({ summary, wrongStats, wrongItems, countdownDays, examLabel, recentTests }) {
  const parts = []
  if (examLabel) parts.push(`当前考试：${examLabel}`)
  if (countdownDays != null) parts.push(`距考试约 ${countdownDays} 天`)
  const subs = (summary?.subjects || []).filter((s) => s.realAcc != null)
  if (subs.length) parts.push('真题自测正确率：' + subs.map((s) => `${s.subject} ${Math.round(s.realAcc * 100)}%`).join('、'))
  const weak = (wrongStats || []).slice(0, 3)
  if (weak.length) parts.push('薄弱知识点：' + weak.map((w) => `${w.subject}·${w.topic}（错${w.wrongQ}）`).join('、'))
  const wb = (wrongItems || []).slice(0, 3)
  if (wb.length) parts.push('最近错题：' + wb.map((t) => `${t.subject}${t.topic ? '·' + t.topic : ''}`).join('、'))
  const rt = (recentTests || []).slice(0, 3)
  if (rt.length) parts.push('最近自测：' + rt.map((t) => `${t.subject} ${t.kind} ${t.correct}/${t.total}`).join('、'))
  return parts.join('\n')
}

export function buildMessages({ mode, question, context }) {
  const modeHint = {
    ask: '答疑',
    explain: '讲题',
    essay: '作文批改',
    plan: '学习规划'
  }[mode] || '答疑'
  const user = `【${modeHint}】${context ? '学员数据：\n' + context + '\n' : ''}学员问题/内容：${question}`
  return [
    { role: 'system', content: AI_TUTOR_SYSTEM },
    { role: 'user', content: user }
  ]
}