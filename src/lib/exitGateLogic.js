// exitGateLogic.js —— 退出关卡任务池（纯函数）
export const STRICT_TASKS = [
  { type: 'pose', act: 'squat', label: '做 10 个深蹲', target: 10 },
  { type: 'pose', act: 'high_knee', label: '原地高抬腿 30 秒', target: 30 },
  { type: 'voice', label: '大声说 5 遍「我能考上」', target: 5, minDurMs: 800 },
  { type: 'voice', label: '大声朗读一句话（10 秒）', target: 1, minDurMs: 3000 }
]
export const EASY_TASKS = [
  { type: 'simple', label: '喝口水，伸个懒腰', target: 1 },
  { type: 'simple', label: '做 5 个深呼吸', target: 1 }
]
export const HOLD_STRICT_MS = 5000
export const HOLD_EASY_MS = 2000
export const maxRerollOf = (strict) => (strict ? 1 : 2)
export function pickTask(pool, exclude) {
  const arr = pool.filter((t) => !exclude || t.label !== exclude.label)
  return arr[Math.floor(Math.random() * arr.length)]
}
export function canReroll(rerolls, strict) {
  return rerolls < maxRerollOf(strict)
}