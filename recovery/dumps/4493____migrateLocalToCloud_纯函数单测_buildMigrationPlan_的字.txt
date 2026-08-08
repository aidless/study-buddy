// migrateLocalToCloud 纯函数单测：buildMigrationPlan 的字段映射与过滤
import { buildMigrationPlan } from '../src/lib/migrateLocalToCloud.js'
import assert from 'node:assert'

let pass = 0, fail = 0
function t(name, fn) {
  try { fn(); pass++; console.log('  PASS', name) } catch (e) { fail++; console.log('  FAIL', name, '->', e.message) }
}

const localUser = { id: 'local-u', coupleId: 'local-c', role: 'student', name: '旧学员' }
const cloudUser = { id: 'cloud-u', coupleId: 'cloud-c', role: 'student', name: '新学员' }
const local = {
  tasks: [
    { id: 't1', coupleId: 'local-c', owner_id: 'local-u', title: '英语阅读2篇', date: '2026-08-06', time: '20:00', done: true, act: 'squat', target: 10, minDurMs: null },
    { id: 't2', coupleId: 'other-c', owner_id: 'local-u', title: '别人的任务', date: '2026-08-06', done: false },
    { id: 't3', coupleId: 'local-c', owner_id: 'other-u', title: '别人的任务2', date: '2026-08-06', done: false }
  ],
  focus: [
    { id: 'f1', coupleId: 'local-c', userId: 'local-u', durationSec: 1500, taskId: 't1', startedAt: '2026-08-06T12:00:00Z', status: 'done', endAt: '2026-08-06T12:25:00Z' },
    { id: 'f2', coupleId: 'local-c', userId: 'local-u', durationSec: 0, taskId: null, startedAt: '2026-08-06T13:00:00Z', status: 'running' },
    { id: 'f3', coupleId: 'local-c', userId: 'other-u', durationSec: 999, taskId: null, startedAt: '2026-08-06T14:00:00Z', status: 'done' }
  ],
  checkins: [
    { id: 'c1', coupleId: 'local-c', userId: 'local-u', date: '2026-08-06', note: '加油', at: '2026-08-06T10:00:00Z' },
    { id: 'c2', coupleId: 'local-c', userId: 'local-u', date: '2026-08-06', note: '重复同一天', at: '2026-08-06T11:00:00Z' },
    { id: 'c3', coupleId: 'local-c', userId: 'other-u', date: '2026-08-06', note: '别人的', at: '2026-08-06T12:00:00Z' }
  ],
  selftests: [
    { id: 's1', coupleId: 'local-c', owner_id: 'local-u', subject: '数据结构', kind: '章节练习', name: '图', total: 10, correct: 8, sec: null, at: '2026-08-06T15:00:00Z', topic: '图', wrongReason: 'know', mode: 'manual', practice: 2, practiceCorrect: 2 },
    { id: 's2', coupleId: 'local-c', owner_id: 'other-u', subject: '政治', total: 5, correct: 5, at: '2026-08-06T16:00:00Z' }
  ],
  goals: [
    { id: 'g1', coupleId: 'local-c', owner_id: 'local-u', title: '高数一轮', dueDate: '2026-09-01', done: false },
    { id: 'g2', coupleId: 'local-c', owner_id: 'other-u', title: '别人的目标', done: true }
  ],
  countdown: { coupleId: 'local-c', targetDate: '2026-12-19', label: '考研初试' },
  words: {
    '2026-08-06': { she: '今天数学卡住了，但没放弃', he: '慢慢来' },
    '2026-08-05': { she: '   ', he: '加油' }
  }
}

const plan = buildMigrationPlan(local, localUser, cloudUser)

t('任务：只搬本人 + 字段映射（act/target/min_dur_ms）', () => {
  assert.equal(plan.tasks.length, 1)
  const r = plan.tasks[0]
  assert.equal(r.couple_id, 'cloud-c')
  assert.equal(r.owner_id, 'cloud-u')
  assert.equal(r.title, '英语阅读2篇')
  assert.equal(r.done, true)
  assert.equal(r.act, 'squat')
  assert.equal(r.target, 10)
})

t('专注：只搬本人 + running 收成 done + task_id 映射到新任务 id', () => {
  assert.equal(plan.focus.length, 2)
  const done = plan.focus.find((f) => f.started_at === '2026-08-06T12:00:00Z')
  const running = plan.focus.find((f) => f.started_at === '2026-08-06T13:00:00Z')
  assert.equal(done.task_id, plan.tasks[0].id)
  assert.equal(running.status, 'done')
  assert.equal(running.end_at, running.started_at)
})

t('打卡：同一天只搬一条 + 只搬本人', () => {
  assert.equal(plan.checkins.length, 1)
  assert.equal(plan.checkins[0].user_id, 'cloud-u')
  assert.equal(plan.checkins[0].date, '2026-08-06')
})

t('自测：字段映射（wrong_reason/practice/practice_correct）+ 只搬本人', () => {
  assert.equal(plan.selftests.length, 1)
  const r = plan.selftests[0]
  assert.equal(r.wrong_reason, 'know')
  assert.equal(r.practice, 2)
  assert.equal(r.practice_correct, 2)
  assert.equal(r.owner_id, 'cloud-u')
})

t('阶段目标：只搬本人', () => {
  assert.equal(plan.goals.length, 1)
  assert.equal(plan.goals[0].title, '高数一轮')
  assert.equal(plan.goals[0].due_date, '2026-09-01')
})

t('倒计时：搬本人 couple 的考试日期', () => {
  assert.ok(plan.countdown)
  assert.equal(plan.countdown.target_date, '2026-12-19')
  assert.equal(plan.countdown.couple_id, 'cloud-c')
})

t('今日一句话：学生只搬 she，空内容跳过', () => {
  assert.equal(plan.words.length, 1)
  assert.equal(plan.words[0].message, '今天数学卡住了，但没放弃')
  assert.equal(plan.words[0].kind, 'word')
  assert.equal(plan.words[0].from_id, 'cloud-u')
  assert.equal(plan.words[0].at, '2026-08-06T08:00:00')
})

console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
process.exit(fail ? 1 : 0)
