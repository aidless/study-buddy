import { describe, it, expect } from 'vitest'
import { buildMigrationPlan } from '../../src/lib/migrateLocalToCloud.js'

// Locks the function that is in the tree. It filters by coupleId, keeps
// camelCase fields, and does not drop another owner's rows inside that couple.
// An older node script expected snake_case columns and owner filtering; that
// script is not part of npm test.

const localUser = { id: 'local-u', coupleId: 'local-c', role: 'student', name: '旧学员' }
const cloudUser = { id: 'cloud-u', coupleId: 'cloud-c', role: 'student', name: '新学员' }

function sample() {
  return {
    tasks: [
      { id: 't1', coupleId: 'local-c', owner_id: 'local-u', title: '英语阅读2篇', date: '2026-08-06', time: '20:00', done: true, act: 'squat', target: 10 },
      { id: 't2', coupleId: 'other-c', owner_id: 'local-u', title: '别人的任务', date: '2026-08-06', done: false },
      { id: 't3', coupleId: 'local-c', owner_id: 'other-u', title: '别人的任务2', date: '2026-08-06', done: false }
    ],
    focus: [
      { id: 'f1', coupleId: 'local-c', userId: 'local-u', durationSec: 1500, taskId: 't1', startedAt: '2026-08-06T12:00:00Z', status: 'done' },
      { id: 'f2', coupleId: 'local-c', userId: 'local-u', durationSec: 0, taskId: null, startedAt: '2026-08-06T13:00:00Z', status: 'running' },
      { id: 'f3', coupleId: 'other-c', userId: 'local-u', durationSec: 999, taskId: null, startedAt: '2026-08-06T14:00:00Z', status: 'done' }
    ],
    checkins: [
      { id: 'c1', coupleId: 'local-c', userId: 'local-u', date: '2026-08-06', note: '加油' },
      { id: 'c2', coupleId: 'local-c', userId: 'local-u', date: '2026-08-06', note: '重复同一天' },
      { id: 'c3', coupleId: 'other-c', userId: 'local-u', date: '2026-08-07', note: '别人的' }
    ],
    selftests: [
      { id: 's1', coupleId: 'local-c', owner_id: 'local-u', subject: '数据结构', kind: '章节练习', name: '图', total: 10, correct: 8, sec: null, at: '2026-08-06T15:00:00Z', topic: '图', wrongReason: 'know', mode: 'manual', practice: 2, practiceCorrect: 2 },
      { id: 's2', coupleId: 'other-c', owner_id: 'local-u', subject: '政治', total: 5, correct: 5, at: '2026-08-06T16:00:00Z' }
    ],
    goals: [
      { id: 'g1', coupleId: 'local-c', owner_id: 'local-u', title: '高数一轮', dueDate: '2026-09-01', done: false },
      { id: 'g2', coupleId: 'other-c', owner_id: 'local-u', title: '别人的目标', done: true }
    ],
    countdown: { coupleId: 'local-c', targetDate: '2026-12-19', label: '考研初试' },
    words: {
      '2026-08-06': { she: '今天数学卡住了，但没放弃', he: '慢慢来' },
      '2026-08-05': { she: '   ', he: '加油' }
    }
  }
}

describe('buildMigrationPlan', () => {
  it('returns an empty plan without both users', () => {
    const empty = buildMigrationPlan(sample(), null, cloudUser)
    expect(empty.tasks).toEqual([])
    expect(empty.countdown).toBe(null)
  })

  it('keeps this couple’s tasks, including another owner, and drops pose fields', () => {
    const plan = buildMigrationPlan(sample(), localUser, cloudUser)
    expect(plan.tasks.map((t) => t.title)).toEqual(['英语阅读2篇', '别人的任务2'])
    expect(plan.tasks[0].done).toBe(true)
    expect(plan.tasks[0].time).toBe('20:00')
    expect(plan.tasks[0].act).toBeUndefined()
    expect(plan.tasks[0].couple_id).toBeUndefined()
    expect(plan.tasks[0].id).not.toBe('t1')
  })

  it('maps focus onto the new task id and leaves a running session running', () => {
    const plan = buildMigrationPlan(sample(), localUser, cloudUser)
    expect(plan.focus).toHaveLength(2)
    const done = plan.focus.find((f) => f.startedAt === '2026-08-06T12:00:00Z')
    const running = plan.focus.find((f) => f.startedAt === '2026-08-06T13:00:00Z')
    expect(done.taskId).toBe(plan.tasks[0].id)
    expect(done.durationSec).toBe(1500)
    expect(running.status).toBe('running')
  })

  it('dedupes check-ins by date and skips another couple', () => {
    const plan = buildMigrationPlan(sample(), localUser, cloudUser)
    expect(plan.checkins).toEqual([{ date: '2026-08-06', note: '加油' }])
  })

  it('copies self-tests and goals for this couple in camelCase', () => {
    const plan = buildMigrationPlan(sample(), localUser, cloudUser)
    expect(plan.selftests).toHaveLength(1)
    expect(plan.selftests[0].wrongReason).toBe('know')
    expect(plan.selftests[0].practiceCorrect).toBe(2)
    expect(plan.selftests[0].wrong_reason).toBeUndefined()
    expect(plan.goals).toEqual([{ title: '高数一轮', dueDate: '2026-09-01', done: false }])
  })

  it('copies the countdown and both sides of a daily note, including whitespace', () => {
    const plan = buildMigrationPlan(sample(), localUser, cloudUser)
    expect(plan.countdown).toEqual({ targetDate: '2026-12-19', label: '考研初试' })
    expect(plan.words).toEqual([
      { date: '2026-08-06', role: 'she', text: '今天数学卡住了，但没放弃' },
      { date: '2026-08-06', role: 'he', text: '慢慢来' },
      { date: '2026-08-05', role: 'she', text: '   ' },
      { date: '2026-08-05', role: 'he', text: '加油' }
    ])
  })
})
